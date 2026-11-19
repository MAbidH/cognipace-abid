import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { sameOrigin, safeError } from "../../../lib/guard";
import { dayToday, startDay, moveDone, endDay, daySummary } from "../../../lib/day";
import { computeRewards } from "../../../lib/rewards";

export const runtime = "nodejs";

/* The school day (3 Nov 2026, lib/day.js). GET -> today's day + summary. POST { start: { desk } } | { move: true } |
   { end: true }. Every answer carries the rewards, so the room can celebrate new XP and badges at once. */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    return NextResponse.json({ day: await dayToday(), summary: await daySummary() });
  } catch (e) { return NextResponse.json(safeError(e, "day"), { status: 500 }); }
}

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    let day;
    if (b.start) day = await startDay(b.start.desk === true);
    else if (b.move) day = await moveDone();
    else if (b.end) day = await endDay();
    else return NextResponse.json({ error: "bad request" }, { status: 400 });
    const [summary, rewards] = await Promise.all([daySummary(), computeRewards().catch(() => null)]);
    return NextResponse.json({ ok: true, day, summary, rewards });
  } catch (e) { return NextResponse.json(safeError(e, "day"), { status: 500 }); }
}
