import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { allModules } from "../../../lib/curriculum";
import { WONDERS } from "../../../lib/wonders";
import { packSteps, fallbackSheet, renderPack, parseWork, IMPORT_MAX_BYTES, PACK_STEPS } from "../../../lib/offline";

export const runtime = "nodejs";

/* THE OFFLINE PACK (2 Nov 2026; lib/offline.js has the whole story).
   GET  /api/offline            -> { ready, steps, downloadedAt, lastImport } for her home card
   GET  /api/offline?pack=1     -> the pack: one HTML file (attachment) with her next worksheets
   POST /api/offline  (JSON)    -> her saved work file; stored per step and per day */

async function position() {
  const [pos] = await q("SELECT module_id, step_index FROM progress WHERE status='current' LIMIT 1");
  return pos || null;
}

export async function GET(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const pos = await position();
    const modules = allModules();
    const want = pos ? packSteps(modules, pos, PACK_STEPS) : [];
    const ids = want.map((x) => x.s.id);
    const sheets = ids.length ? await q("SELECT step_id, sheet FROM offline_sheets WHERE step_id = ANY($1)", [ids]) : [];
    const byId = Object.fromEntries(sheets.map((r) => [r.step_id, typeof r.sheet === "string" ? JSON.parse(r.sheet) : r.sheet]));
    const url = new URL(req.url);
    if (url.searchParams.get("pack") !== "1") {
      const [dl] = await q("SELECT value FROM settings WHERE key='offline_downloaded_at'");
      const [imp] = await q("SELECT MAX(imported_at) AS at FROM offline_work");
      return NextResponse.json({ ready: want.filter((x) => byId[x.s.id]).length, steps: want.length, downloadedAt: dl?.value || null, lastImport: imp?.at || null });
    }
    const read = new Set((await q("SELECT wonder_id FROM wonders_read")).map((r) => r.wonder_id));
    const wonders = WONDERS.filter((w) => !read.has(w.id)).slice(0, 5).map((w) => ({ title: w.title, story: w.story, think: w.think }));
    const made = new Date().toISOString();
    const html = renderPack({
      id: made.slice(0, 16).replace(/[^0-9]/g, ""), made,
      steps: want.map((x) => ({ moduleId: x.m.id, moduleTitle: x.m.title, stepId: x.s.id, title: x.s.title, kind: x.s.kind, sheet: byId[x.s.id] || fallbackSheet(x.s) })),
      wonders,
    });
    await q("INSERT INTO settings (key, value) VALUES ('offline_downloaded_at', $1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=now()", [made]);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="cognipace-offline-${made.slice(0, 10)}.html"` } });
  } catch (e) { return NextResponse.json(safeError(e, "offline"), { status: 500 }); }
}

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const raw = await req.text();
    if (raw.length > IMPORT_MAX_BYTES) return NextResponse.json({ error: "That file is too big. Choose the cognipace-work file from your Downloads." }, { status: 400 });
    const modules = allModules();
    const known = new Set(modules.flatMap((m) => (m.steps || []).map((s) => s.id)));
    const modOf = Object.fromEntries(modules.flatMap((m) => (m.steps || []).map((s) => [s.id, m.id])));
    const [{ d: today }] = await q("SELECT ((now() AT TIME ZONE 'Asia/Dhaka')::date)::text AS d");
    const w = parseWork(raw, known, today);
    if (w.error) return NextResponse.json({ error: w.error }, { status: 400 });
    // A step she has already finished online keeps its record; the offline answers are still saved for Abid.
    for (const s of w.steps) {
      await q(`INSERT INTO offline_work (step_id, module_id, work, done, imported_at) VALUES ($1,$2,$3,$4,now())
        ON CONFLICT (step_id) DO UPDATE SET work=$3, done=$4, imported_at=now()`, [s.stepId, modOf[s.stepId] || null, JSON.stringify({ tasks: s.tasks, own: s.own, question: s.question }), s.done]);
    }
    // Days: the larger number wins (the same file brought back twice adds nothing). Only with real work in the file.
    const days = w.steps.length ? w.days : [];
    for (const d of days) await q(`INSERT INTO offline_days (day, minutes) VALUES ($1::date, $2) ON CONFLICT (day) DO UPDATE SET minutes=GREATEST(offline_days.minutes, $2), imported_at=now()`, [d.day, d.minutes]);
    await q("INSERT INTO journal (kind, title, body) VALUES ('offline', 'Offline work brought back', $1)",
      [`${w.steps.length} worksheet(s): ${w.steps.map((s) => s.stepId).join(", ") || "none"}; days: ${days.map((d) => `${d.day} ${d.minutes} min`).join(", ") || "none"}`]).catch(() => {});
    return NextResponse.json({ ok: true, steps: w.steps.length, days: days.filter((d) => d.minutes > 0).length });
  } catch (e) { return NextResponse.json(safeError(e, "offline"), { status: 500 }); }
}
