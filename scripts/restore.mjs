// Restore a CogniPace backup into an EMPTY database (29 Oct 2026, fix day).
//   DATABASE_URL=postgres://... node scripts/restore.mjs cognipace-backup-2026-10-29.json
//   ... --force    load into a database that already has rows (rows whose key already exists are skipped, never overwritten)
// What it does:
//   1. Refuses if any table in the target database already has rows (unless --force).
//   2. Creates every table exactly as the app does (lib/db.js, the same CREATE/ALTER statements).
//   3. Loads every table from the file in ONE transaction - a failure leaves the database as it was.
//   4. Moves the id counters past the restored ids, so new rows do not collide.
//   5. Prints the row count per table, file vs database. Any difference = exit code 1.
// Reads both formats: version 2 ({format:"cognipace-backup", version:2, tables:{...}}, from 29 Oct 2026) and the older
// version-1 file (tables as top-level arrays, "school-backup-*.json"). Never point it at the live database unless the
// live database is the one that was lost - restore into a new Neon branch first (docs/RUNBOOK.md, "Restore test").
// Nothing here is printed from the rows themselves (her chats stay on screen only as counts).
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const force = args.includes("--force");
const file = args.find((a) => !a.startsWith("--"));
const url = process.env.DATABASE_URL || "";
if (!file || !url) {
  console.log("Usage: DATABASE_URL=postgres://... node scripts/restore.mjs <backup.json> [--force]");
  process.exit(2);
}

// --- read the file ---
let raw;
try { raw = JSON.parse(readFileSync(file, "utf8")); } catch (e) { console.log(`Could not read ${file} as JSON: ${e.message}`); process.exit(2); }
let tables;            // { name: rows[] }
let expected = {};     // { name: count from the file }
if (raw && raw.format === "cognipace-backup" && raw.tables && typeof raw.tables === "object") {
  if (Number(raw.version) > 2) { console.log(`This file is format version ${raw.version}; this script knows up to 2. Update the script first.`); process.exit(2); }
  tables = {};
  for (const [name, t] of Object.entries(raw.tables)) { tables[name] = Array.isArray(t?.rows) ? t.rows : []; expected[name] = Number(t?.count ?? tables[name].length); }
  console.log(`Backup format ${raw.version}, exported ${raw.exported_at}.`);
} else if (raw && typeof raw === "object") {
  tables = {};
  for (const [name, v] of Object.entries(raw)) if (Array.isArray(v)) { tables[name] = v; expected[name] = v.length; }
  console.log(`Old backup format (version 1), exported ${raw.exported_at || "?"}. It never held settings, errors, calls, meet, wonders_read, badges or arena.`);
} else { console.log("This is not a CogniPace backup."); process.exit(2); }

const clean = url.replace(/([?&])sslmode=[^&]*&?/i, "$1").replace(/[?&]$/, "");
const local = clean.includes("localhost") || clean.includes("127.0.0.1") || clean.includes("/var/run/") || clean.includes("host=/");
const pool = new pg.Pool({ connectionString: clean, ssl: local ? false : { rejectUnauthorized: true }, max: 2, connectionTimeoutMillis: 20000 });

const ident = (n) => { if (!/^[a-z_][a-z0-9_]*$/.test(n)) throw new Error(`odd table or column name: ${n}`); return `"${n}"`; };

async function publicTables(c) {
  return (await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map((r) => r.tablename);
}

try {
  const c = await pool.connect();
  try {
    // 1. Empty?
    const before = await publicTables(c);
    const busy = [];
    for (const t of before) { if (!/^[a-z_][a-z0-9_]*$/.test(t)) continue; const n = (await c.query(`SELECT count(*)::int AS n FROM ${ident(t)}`)).rows[0].n; if (n) busy.push(`${t} (${n})`); }
    if (busy.length && !force) {
      console.log(`The target database is not empty: ${busy.join(", ")}.\nNothing was changed. Restore into a new, empty database (a fresh Neon branch), or add --force to add the missing rows only.`);
      process.exit(1);
    }
    if (busy.length) console.log(`--force: the database already has rows (${busy.join(", ")}). Rows whose key already exists are skipped.`);

    // 2. The app's own schema: the SCHEMA text in lib/db.js (the CREATE/ALTER statements the app runs on first use),
    // read from the file so restore and app can never disagree. (lib/db.js itself cannot be imported by plain Node.)
    const src = readFileSync(new URL("../lib/db.js", import.meta.url), "utf8");
    const m = src.match(/const SCHEMA = `([\s\S]*?)`;/);
    if (!m || m[1].includes("${")) throw new Error("could not read the SCHEMA statements from lib/db.js");
    await c.query(m[1]);

    const now = await publicTables(c);
    const skipped = Object.keys(tables).filter((t) => !now.includes(t));
    if (skipped.length) console.log(`Not in this version of the app, skipped: ${skipped.join(", ")}.`);

    // 3. Load, one transaction.
    await c.query("BEGIN");
    const loaded = {};
    for (const [t, rows] of Object.entries(tables)) {
      if (!now.includes(t)) continue;
      const cols = (await c.query(`SELECT column_name AS name, data_type AS type FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t])).rows;
      const types = Object.fromEntries(cols.map((x) => [x.name, x.type]));
      const use = cols.map((x) => x.name).filter((n) => rows.some((r) => r && Object.prototype.hasOwnProperty.call(r, n)));
      const extra = [...new Set(rows.flatMap((r) => Object.keys(r || {})))].filter((k) => !types[k]);
      if (extra.length) console.log(`  ${t}: columns not in this schema, left out: ${extra.join(", ")}`);
      let n = 0;
      if (rows.length && use.length) {
        const per = Math.max(1, Math.floor(30000 / use.length));
        for (let i = 0; i < rows.length; i += per) {
          const chunk = rows.slice(i, i + per);
          const params = [];
          const values = chunk.map((r) => `(${use.map((col) => {
            let v = r[col];
            if (v === undefined) v = null;
            // JSON columns get JSON text (pg would turn a JS array into a Postgres array otherwise).
            if (v !== null && (types[col] === "jsonb" || types[col] === "json")) v = JSON.stringify(v);
            params.push(v);
            return `$${params.length}`;
          }).join(",")})`).join(",");
          const res = await c.query(`INSERT INTO ${ident(t)} (${use.map(ident).join(",")}) VALUES ${values} ON CONFLICT DO NOTHING`, params);
          n += res.rowCount;
        }
      }
      loaded[t] = n;
      // 4. Move serial counters (id BIGSERIAL) past the restored ids.
      for (const col of cols) {
        const seq = (await c.query("SELECT pg_get_serial_sequence($1, $2) AS s", [`public.${t}`, col.name])).rows[0].s;
        if (seq) await c.query(`SELECT setval($1, GREATEST((SELECT COALESCE(MAX(${ident(col.name)}), 0) FROM ${ident(t)}), 1), (SELECT COUNT(*) > 0 FROM ${ident(t)}))`, [seq]);
      }
    }
    await c.query("COMMIT");

    // 5. Compare.
    let diff = 0;
    console.log("\ntable            in file   in database");
    for (const t of Object.keys(tables)) {
      if (!now.includes(t)) continue;
      const inDb = (await c.query(`SELECT count(*)::int AS n FROM ${ident(t)}`)).rows[0].n;
      const want = expected[t];
      const ok = force ? loaded[t] <= want : inDb === want;
      if (!ok) diff++;
      console.log(`${ok ? " " : "!"} ${t.padEnd(16)} ${String(want).padStart(7)}   ${String(inDb).padStart(7)}${force ? `   (${loaded[t]} added)` : ""}`);
    }
    console.log(diff ? `\n${diff} table(s) differ - look before trusting this copy.` : "\nRestore complete: every table matches the file.");
    process.exitCode = diff ? 1 : 0;
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch {}
    throw e;
  } finally { c.release(); }
} catch (e) {
  console.log(`Restore failed, nothing was loaded: ${e.code || ""} ${String(e.message || e).slice(0, 300)}`);
  process.exitCode = 1;
}
await pool.end();
process.exit(process.exitCode ?? 0);
