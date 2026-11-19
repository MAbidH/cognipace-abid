/* Today's goal (Abid, 5 Oct 2026): every time she sits down she is told the least she should finish today, so the
   path keeps flowing and the rewards arrive sooner than the forecast predicted. Computed from the steps ahead of her,
   weighted by how long each kind takes, against a daily budget a little above her recent pace. Server only. */
import modules from "../curriculum/modules.json";
import { q } from "./db";
import { todayPlan } from "./calendar";

const WEIGHT = { lesson: 1, practice: 1.2, code: 1.5, check: 1.5, teach: 1, diagnostic: 1, typing: 0.5 };
// Budget: about two ordinary steps on a school day; on a vacation day (curriculum/calendar.json) about nine.

/* Time estimates (Abid, 5 Oct 2026): when she finishes something she is told how long the NEXT thing will need, so she
   sits down with that much time. Her own history first - the median total minutes she spent on finished steps of each
   kind - and these defaults until she has done three of a kind. Rounded up to 5 minutes; never below 5. */
const DEFAULT_MIN = { lesson: 25, practice: 20, code: 30, check: 20, teach: 10, diagnostic: 15, typing: 5 };

async function minutesByKind() {
  // Total active time per finished step (completions is the server's own record of a step being done), then the
  // median per kind. Partial heartbeat rows are part of the total: they are real minutes on that step.
  const rows = await q(`SELECT t.kind, percentile_cont(0.5) WITHIN GROUP (ORDER BY t.ms) AS ms, COUNT(*)::int AS n
    FROM (SELECT step_id, kind, SUM(active_ms) AS ms FROM events GROUP BY step_id, kind) t
    JOIN completions c ON c.key = t.step_id
    WHERE t.ms > 60000 GROUP BY t.kind`).catch(() => []);
  const out = { ...DEFAULT_MIN };
  for (const r of rows) if (r.n >= 3 && r.ms) out[r.kind] = Math.min(60, Number(r.ms) / 60000);
  return out;
}
const round5 = (min) => Math.max(5, Math.ceil(min / 5) * 5);

export async function todaysGoal(cur, rewards) {
  if (!cur) return null;
  const m = cur.module;
  const steps = m.steps;
  const idx = cur.row.step_index;
  const plan = todayPlan();
  const BUDGET = plan.goalBudget;
  // Exam period (Abid, 12 Oct 2026): the day's goal is the ten-minute ritual only - no step is asked for; the room's
  // goal strip hides (empty steps) and the map says so. If she does a step anyway, it counts like any other day.
  if (plan.exam) {
    const nextStep = steps[idx] || null;
    const perKindX = await minutesByKind();
    const estX = (s) => round5(perKindX[s.kind] ?? DEFAULT_MIN[s.kind] ?? 20);
    return { steps: [], remaining: 0, remainingMinutes: 0, next: nextStep ? { id: nextStep.id, title: nextStep.title, kind: nextStep.kind, minutes: estX(nextStep), inGoal: false } : null, allDone: false, sooner: null, module: m.id, exam: true, examMinutes: plan.examMinutes };
  }
  const perKind = await minutesByKind();
  const est = (s) => round5(perKind[s.kind] ?? DEFAULT_MIN[s.kind] ?? 20);
  // Steps she finished today (Dhaka), to show progress against the goal and to keep the goal stable through the day.
  const doneRows = await q(`SELECT key FROM completions WHERE key NOT LIKE '%:%' AND (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date`);
  const doneToday = doneRows.map((r) => r.key).filter((k) => steps.some((s) => s.id === k));
  // The goal is anchored at the first step she had not finished when the day started.
  let start = idx;
  while (start > 0 && doneToday.includes(steps[start - 1]?.id) && !doneToday.includes(steps[start]?.id)) { /* idx already past done steps */ break; }
  const firstOfDay = Math.max(0, idx - doneToday.length);
  const picked = [];
  let spent = 0;
  for (let i = firstOfDay; i < steps.length; i++) {
    const s = steps[i];
    const w = WEIGHT[s.kind] ?? 1;
    if (picked.length && spent + w > BUDGET) break;
    picked.push({ id: s.id, title: s.title, kind: s.kind, done: doneToday.includes(s.id) || i < idx, minutes: est(s) });
    spent += w;
  }
  const remaining = picked.filter((p) => !p.done).length;
  const remainingMinutes = picked.filter((p) => !p.done).reduce((a, p) => a + p.minutes, 0);
  // The very next thing she will sit down to, with the time it will need - inside today's goal, or the first step after it.
  const nextStep = steps[idx] || null;
  const next = nextStep ? { id: nextStep.id, title: nextStep.title, kind: nextStep.kind, minutes: est(nextStep), inGoal: picked.some((p) => p.id === nextStep.id && !p.done) } : null;
  // What this pace buys her: the next unreached module reward comes sooner than the forecast.
  let sooner = null;
  const f = rewards?.forecast?.find((x) => !x.reached && !x.claimed && x.kind === "module" && x.etaDays != null);
  if (f && rewards?.pace?.daysPerStep) {
    const stepsAhead = Math.max(1, Math.round(f.etaDays / rewards.pace.daysPerStep));
    const atGoal = Math.ceil(stepsAhead / Math.max(1, picked.length));
    if (atGoal < f.etaDays) sooner = { reward: f.reward, was: f.etaDays, now: atGoal };
  }
  return { steps: picked, remaining, remainingMinutes, next, allDone: remaining === 0, sooner, module: m.id };
}
