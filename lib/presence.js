/* How long she actually worked, per Dhaka day (Abid, 10 Oct 2026: "why only 20 minutes? she spent almost 2 hours").

   Two honest measures, and a day counts the LARGER one:
   1. The room's clock (events.active_ms): time with the School tab visible AND a key or click in it within 3 minutes.
      It is blind to everything she does OUTSIDE the tab - practising in Notepad and Chrome (K1/K2/K2B are mostly that),
      reading a long reply without touching anything, keybr in another tab.
   2. Presence, from the server's own records: every message she sends, every warm-up part, answer, step, Wonder, Arena
      round and logbook line is a timestamp. Consecutive timestamps no more than 10 minutes apart are counted as time
      at the desk; a longer gap counts as nothing (she may have left). Conservative: nothing is credited before her
      first action of a sitting or after her last.
   Server only. */
import { q } from "./db";

const GAP = "10 minutes";

/** { 'YYYY-MM-DD': ms } of presence for the last `days` Dhaka days. */
export async function presenceByDay(days = 14) {
  const rows = await q(
    `WITH acts AS (
        SELECT at AS t FROM chats
        UNION ALL SELECT ended_at FROM events WHERE ended_at IS NOT NULL
        UNION ALL SELECT at FROM completions
        UNION ALL SELECT at FROM typing
        UNION ALL SELECT at FROM answers
        UNION ALL SELECT at FROM wonders_read
        UNION ALL SELECT at FROM journal
        UNION ALL SELECT started_at FROM arena
        UNION ALL SELECT finished_at FROM arena WHERE finished_at IS NOT NULL
        -- 4 Nov 2026: the school day, the warm-up parts (beats) and the cyber news also count as being at the desk.
        UNION ALL SELECT at FROM beats
        UNION ALL SELECT started_at FROM school_day WHERE started_at IS NOT NULL
        UNION ALL SELECT last_move_at FROM school_day WHERE last_move_at IS NOT NULL
        UNION ALL SELECT ended_at FROM school_day WHERE ended_at IS NOT NULL
        UNION ALL SELECT at FROM news_read
     ), seq AS (
        SELECT t, LAG(t) OVER (ORDER BY t) AS prev FROM acts WHERE t > now() - ($1 || ' days')::interval
     )
     SELECT to_char((t AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS day,
            COALESCE(SUM(CASE WHEN prev IS NOT NULL AND t - prev <= interval '${GAP}'
                               AND (prev AT TIME ZONE 'Asia/Dhaka')::date = (t AT TIME ZONE 'Asia/Dhaka')::date
                          THEN EXTRACT(EPOCH FROM (t - prev)) * 1000 ELSE 0 END), 0)::bigint AS ms
     FROM seq GROUP BY 1`,
    [String(days + 1)]
  ).catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.day, Number(r.ms)]));
}

/** { 'YYYY-MM-DD': ms } from the room's clock (events.active_ms). */
export async function clockByDay(days = 14) {
  const rows = await q(
    `SELECT to_char((started_at AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(active_ms),0)::bigint AS ms
     FROM events WHERE started_at > now() - ($1 || ' days')::interval GROUP BY 1`,
    [String(days + 1)]
  );
  return Object.fromEntries(rows.map((r) => [r.day, Number(r.ms)]));
}

/** Worked ms per day = max(clock, presence). */
export async function workedByDay(days = 14) {
  const [clock, pres] = await Promise.all([clockByDay(days), presenceByDay(days)]);
  const out = {};
  for (const d of new Set([...Object.keys(clock), ...Object.keys(pres)])) out[d] = Math.max(clock[d] || 0, pres[d] || 0);
  return out;
}

export async function todayDhaka() {
  const [{ today }] = await q(`SELECT to_char((now() AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS today`);
  return today;
}

/** Minutes she has spent on one step, all days together (Abid, 12 Oct 2026: R1 took 139 minutes and nothing stopped it).
    Presence from the step's own conversation (consecutive messages ≤10 min apart, same Dhaka day) or the room's clock
    for that step, whichever is larger. Used by the tutor's 40-minute time box and the guardian page. */
export async function stepMinutes(stepId, { today = false } = {}) {
  // 8 Nov 2026: { today: true } counts only today's Dhaka date (the time box is per day: a paused step starts fresh).
  const day = today ? " AND (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date" : "";
  const dayEv = today ? " AND (started_at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date" : "";
  const [p] = await q(
    `WITH s AS (SELECT at, LAG(at) OVER (ORDER BY at) AS prev FROM chats WHERE step_id = $1 AND ctx = 'lesson'${day})
     SELECT COALESCE(SUM(CASE WHEN prev IS NOT NULL AND at - prev <= interval '${GAP}'
                          AND (prev AT TIME ZONE 'Asia/Dhaka')::date = (at AT TIME ZONE 'Asia/Dhaka')::date
                     THEN EXTRACT(EPOCH FROM (at - prev)) * 1000 ELSE 0 END), 0)::bigint AS ms FROM s`,
    [String(stepId)]
  ).catch(() => [{ ms: 0 }]);
  const [c] = await q(`SELECT COALESCE(SUM(active_ms),0)::bigint AS ms FROM events WHERE step_id = $1${dayEv}`, [String(stepId)]).catch(() => [{ ms: 0 }]);
  return Math.round(Math.max(Number(p?.ms || 0), Number(c?.ms || 0)) / 60000);
}

/** Baseline for lib/timing.js clampActive (29 Oct 2026): the end of the last timing event of this step; if it has none
    yet, the last thing the server saw of it (or the last step change). null when there is no trace at all. */
export async function lastTraceAt(stepId) {
  const [r] = await q(`SELECT (SELECT MAX(ended_at) FROM events WHERE step_id = $1) AS ev, GREATEST(
      (SELECT MAX(at) FROM chats WHERE step_id = $1),
      (SELECT MAX(started_at) FROM qsets WHERE step_id = $1),
      (SELECT MAX(at) FROM answers WHERE step_id = $1),
      (SELECT MAX(at) FROM journal WHERE kind = 'step'),
      (SELECT MAX(at) FROM completions)) AS other`, [String(stepId)]).catch(() => [{}]);
  return r?.ev || r?.other || null;
}
