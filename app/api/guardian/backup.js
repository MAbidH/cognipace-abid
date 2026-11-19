/* The full backup (29 Oct 2026, fix day). Not a route - Next only routes route.js - so scripts can import it too.
   Every table in the database's public schema goes into the file, found at export time, so a table added later
   (settings, errors, calls, meet, wonders_read, badges, arena, voice, ...) can never be left out again.
   Format "cognipace-backup" version 2:
     { format, version, exported_at, tables: { <name>: { columns: [{name, type}], count, rows: [ {...}, ... ] } } }
   Rows come from row_to_json, so dates stay "2026-10-29", timestamps keep their offset and JSONB stays JSON.
   scripts/restore.mjs loads this file (and the older version-1 files) into an EMPTY database. */

export const BACKUP_FORMAT = "cognipace-backup";
export const BACKUP_VERSION = 2;

// Restore order: none of the tables has a foreign key today, but keep parents first in case one is ever added.
const ORDER = ["settings", "progress", "completions", "events", "qsets", "answers", "chats", "notes", "typing", "journal",
  "arena", "meet", "wonders_read", "badges", "unverified", "voice", "calls", "errors", "audit"];

/** Table names in the public schema, known ones first. `q(text, params)` returns rows (lib/db.js q, or a test double). */
export async function backupTables(q) {
  const rows = await q("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  const names = rows.map((r) => r.tablename).filter((n) => /^[a-z_][a-z0-9_]*$/.test(n));
  return [...ORDER.filter((n) => names.includes(n)), ...names.filter((n) => !ORDER.includes(n))];
}

async function tableDump(q, name) {
  const columns = (await q(`SELECT column_name AS name, data_type AS type FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [name]));
  // ORDER BY 1 = the first column (id, key, day or module_id in every table): a stable, readable order.
  const rows = (await q(`SELECT row_to_json(t) AS r FROM (SELECT * FROM "${name}" ORDER BY 1) t`)).map((x) => x.r);
  return { columns, count: rows.length, rows };
}

/** The whole backup as one object (tests, small databases). */
export async function exportAll(q) {
  const out = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exported_at: new Date().toISOString(), tables: {} };
  for (const name of await backupTables(q)) out.tables[name] = await tableDump(q, name);
  return out;
}

/** The same JSON, written table by table into a stream. Vercel caps a normal function response at 4.5 MB and her
    chats alone will pass that; a streamed response has no such cap (Vercel KB "bypass body size limit"). */
export function exportStream(q) {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(ctl) {
      try {
        ctl.enqueue(enc.encode(`{"format":"${BACKUP_FORMAT}","version":${BACKUP_VERSION},"exported_at":"${new Date().toISOString()}","tables":{`));
        const names = await backupTables(q);
        for (let i = 0; i < names.length; i++) {
          const d = await tableDump(q, names[i]);
          ctl.enqueue(enc.encode(`${i ? "," : ""}\n${JSON.stringify(names[i])}:{"columns":${JSON.stringify(d.columns)},"count":${d.count},"rows":[`));
          d.rows.forEach((r, j) => ctl.enqueue(enc.encode(`${j ? "," : ""}\n${JSON.stringify(r)}`)));
          ctl.enqueue(enc.encode("]}"));
        }
        ctl.enqueue(enc.encode("\n}}\n"));
        ctl.close();
      } catch (e) {
        // A half-written file must not look like a good backup: the stream errors, so the download fails visibly.
        console.error("[backup]", e?.code || "", String(e?.message || e).slice(0, 160));
        ctl.error(new Error("backup failed"));
      }
    },
  });
}
