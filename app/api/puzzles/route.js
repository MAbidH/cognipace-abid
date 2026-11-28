import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { safeError } from "../../../lib/guard";
import { todayPlan, dhakaDate } from "../../../lib/calendar";
import { isSaturday } from "../../../lib/review";
import { STUDENT } from "../../../lib/student";
import { pickSet, publicItems, levelFrom } from "../../../lib/puzzles";
import { PUZZLE_ITEMS } from "../../../lib/puzzleBank";

export const runtime = "nodejs";

/* The Saturday puzzle set (25 Nov 2026, lib/puzzles.js). GET -> { show, day, level, items, done, score, total, results }.
   The set for a Saturday is made once (deterministic from the day, her level and what she has seen) and kept.
   Her answers go through /api/tutor mode "puzzles" (the four reasons are graded by the model, one call). */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const today = dhakaDate();
    const plan = todayPlan();
    const show = STUDENT.mode === "child" && !plan.exam && isSaturday(today);
    if (!show) return NextResponse.json({ show: false });
    let [row] = await q("SELECT day, level, items, results, score, total, done FROM puzzles WHERE day=$1", [today]);
    if (!row) {
      const hist = await q("SELECT to_char(day,'YYYY-MM-DD') AS day, score, total, items FROM puzzles WHERE done ORDER BY day ASC");
      const used = hist.flatMap((h) => (Array.isArray(h.items) ? h.items : []));
      const passed = new Set((await q("SELECT module_id FROM progress WHERE status='passed'")).map((r) => r.module_id));
      const level = levelFrom(hist);
      const items = pickSet(PUZZLE_ITEMS, today, { used, passed, level });
      if (!items.length) return NextResponse.json({ show: false });
      await q("INSERT INTO puzzles (day, level, items) VALUES ($1,$2,$3) ON CONFLICT (day) DO NOTHING", [today, level, JSON.stringify(items)]);
      [row] = await q("SELECT day, level, items, results, score, total, done FROM puzzles WHERE day=$1", [today]);
    }
    return NextResponse.json({ show: true, day: today, level: row.level, items: publicItems(PUZZLE_ITEMS, row.items), done: !!row.done, score: row.score, total: row.total, results: row.done ? row.results : null });
  } catch (e) { return NextResponse.json(safeError(e, "puzzles"), { status: 500 }); }
}
