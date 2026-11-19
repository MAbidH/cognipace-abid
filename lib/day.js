/* THE SCHOOL DAY (3 Nov 2026, Abid: "a punch in punch out system ... practice sitting down long hours with activities to
   keep her healthy - drinking water, stretching or movements"). She starts the day with "Start school" (the plan for
   today, and the desk check: desk, chair, both hands, water), takes a one-minute movement break every 25 minutes of
   lesson time (stand, water, stretch, look far away), and ends with "End school" (today's numbers, celebrated).
   Recess stays hers (Alt+R). Server helpers; the shapes are shown on /guardian. */
import { q } from "./db";

export const MOVE_EVERY_MIN = 25;   // a movement card after this many minutes of active lesson time
export const MOVE_SECONDS = 60;     // how long the card asks for
export const MOVE_MAX_XP = 8;       // at most 8 breaks a day earn XP

const TODAY = "(now() AT TIME ZONE 'Asia/Dhaka')::date";

export async function dayToday() {
  const [r] = await q(`SELECT started_at, ended_at, desk, moves, last_move_at FROM school_day WHERE day = ${TODAY}`);
  return { started: !!r?.started_at, startedAt: r?.started_at || null, ended: !!r?.ended_at, endedAt: r?.ended_at || null, desk: !!r?.desk, moves: Number(r?.moves || 0), moveEvery: MOVE_EVERY_MIN, moveSeconds: MOVE_SECONDS };
}

/** Start (or restart after an End): the desk check is her honest tick; Mom's spot checks are the other half. */
export async function startDay(desk) {
  await q(`INSERT INTO school_day (day, started_at, desk) VALUES (${TODAY}, now(), $1)
    ON CONFLICT (day) DO UPDATE SET started_at = COALESCE(school_day.started_at, now()), ended_at = NULL, desk = school_day.desk OR $1`, [!!desk]);
  return dayToday();
}

/** One movement break done. At most one per 10 minutes counts (a double press adds nothing). */
export async function moveDone() {
  await q(`INSERT INTO school_day (day, started_at, moves, last_move_at) VALUES (${TODAY}, now(), 1, now())
    ON CONFLICT (day) DO UPDATE SET moves = school_day.moves + CASE WHEN school_day.last_move_at IS NULL OR school_day.last_move_at < now() - interval '10 minutes' THEN 1 ELSE 0 END,
      last_move_at = CASE WHEN school_day.last_move_at IS NULL OR school_day.last_move_at < now() - interval '10 minutes' THEN now() ELSE school_day.last_move_at END`);
  return dayToday();
}

export async function endDay() {
  await q(`UPDATE school_day SET ended_at = now() WHERE day = ${TODAY}`);
  return dayToday();
}

/** Today's numbers for the End-school screen. */
export async function daySummary() {
  const [steps, typing, d] = await Promise.all([
    q(`SELECT COUNT(*)::int AS n FROM completions WHERE (at AT TIME ZONE 'Asia/Dhaka')::date = ${TODAY} AND key NOT LIKE '%:%'`),
    q(`SELECT drill_wpm, math_score, math_seconds, code_done FROM typing WHERE day = ${TODAY}`),
    dayToday(),
  ]);
  const t = typing[0] || {};
  return { steps: steps[0]?.n || 0, wpm: t.drill_wpm ?? null, mathScore: t.math_score ?? null, mathSeconds: t.math_seconds ?? null, code: !!t.code_done, moves: d.moves, startedAt: d.startedAt };
}
