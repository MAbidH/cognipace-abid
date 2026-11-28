import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { safeError } from "../../../lib/guard";
import { todayPlan } from "../../../lib/calendar";
import { STUDENT } from "../../../lib/student";

export const runtime = "nodejs";

/* School maths on paper (25 Nov 2026, lib/paper.js). GET -> today's state for the map card:
   { show, vacation, minutes, today: { id, pages, right, wrong, question, answered, praise } | null, week: n }.
   The hand-in itself goes through /api/tutor mode "paper" (it is a model call, metered like the others). */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const plan = todayPlan();
    const show = STUDENT.mode === "child" && !plan.exam;
    const [t] = await q("SELECT id, pages, right_n, wrong_n, question, answer, praise, checked, verdict FROM paper WHERE day=(now() AT TIME ZONE 'Asia/Dhaka')::date ORDER BY id DESC LIMIT 1").catch(() => []);
    const [w] = await q("SELECT COUNT(DISTINCT day)::int AS n FROM paper WHERE day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 7").catch(() => [{ n: 0 }]);
    return NextResponse.json({ show, vacation: !!plan.vacation, minutes: plan.vacation ? 25 : 20,
      today: t ? { id: t.id, pages: t.pages, right: t.right_n, wrong: t.wrong_n, question: t.question, answered: t.answer != null, praise: t.praise, checked: Array.isArray(t.checked) ? t.checked : [], verdict: t.verdict } : null, week: w?.n || 0 });
  } catch (e) { return NextResponse.json(safeError(e, "paper"), { status: 500 }); }
}
