/* The school calendar (Abid, 6 Oct 2026): vacation days run long - 5-7 hours with recess - so the cap, the goal and
   the tutor's pace all change together. Dhaka dates. Safe to import on the server and in client components. */
import data from "../curriculum/calendar.json";
import { localYmd, localMinutes } from "./time";

// Abid, 23 Oct 2026: a normal school day allows up to 200 minutes (calendar.json normalCapMinutes); the Vercel env
// DAILY_CAP_MINUTES is only the fallback if the calendar has no number.
export const DEFAULT_CAP = Number(data.normalCapMinutes) || Number(process.env.DAILY_CAP_MINUTES || 60);

export function dhakaDate(now = Date.now()) {
  return localYmd(now);
}

/** The tutor's model today (Abid, 28 Oct 2026): a dated entry in calendar.json tutorModel overrides the Vercel env
    ANTHROPIC_MODEL, so a planned switch (Fable 5.1 while the October credit lasts, Opus 5.5 from November) happens by
    itself at Dhaka midnight with nothing to remember. Outside every entry: the env, then Sonnet 5.5. */
export function tutorModel(now = Date.now()) {
  const d = dhakaDate(now);
  const hit = (data.tutorModel || []).find((e) => e.id && (!e.from || e.from <= d) && (!e.to || d <= e.to));
  return hit?.id || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
}

/** Today's plan: { vacation, title, cap, blockMinutes, recessMinutes, lunchAfterBlocks, lunchMinutes, goalBudget, callsCeiling }. */
export function todayPlan(now = Date.now()) {
  const d = dhakaDate(now);
  const v = (data.vacations || []).find((x) => x.enabled && x.from <= d && d <= x.to);
  // Exam period (Abid, 12 Oct 2026): ten minutes a day - warm-up, the Python line, the Wonder - and the streak is safe.
  const ex = !v && (data.exams || []).find((x) => x.enabled && x.from <= d && d <= x.to);
  if (ex) return { vacation: false, exam: true, title: ex.title, cap: DEFAULT_CAP, blockMinutes: 50, recessMinutes: 10, lunchAfterBlocks: 0, lunchMinutes: 0, goalBudget: Number(ex.goalBudget) || 0.5, callsCeiling: null, examMinutes: Number(ex.minutes) || 10 };
  if (!v) return { vacation: false, exam: false, title: null, cap: DEFAULT_CAP, blockMinutes: 50, recessMinutes: 10, lunchAfterBlocks: 0, lunchMinutes: 0, goalBudget: 2.4, callsCeiling: null };
  // 3 Nov 2026: goal 5 h, cap 7. 8 Nov 2026 (Abid, after the audit): goal 4 h, cap 6 h (calendar.json winter-2026).
  return { vacation: true, exam: false, title: v.title, cap: Number(v.capMinutes) || 420, targetMinutes: Number(v.targetMinutes) || 300, blockMinutes: Number(v.blockMinutes) || 50, recessMinutes: Number(v.recessMinutes) || 10,
    lunchAfterBlocks: Number(v.lunchAfterBlocks) || 0, lunchMinutes: Number(v.lunchMinutes) || 0, goalBudget: Number(v.goalBudget) || 9, callsCeiling: Number(v.callsCeiling) || null };
}

export const dailyCap = (now = Date.now()) => todayPlan(now).cap;

/** Her birthday (curriculum/calendar.json): { today: true/false, age, daysAway } in Dhaka time. */
export function birthday(now = Date.now()) {
  const b = data.birthday;
  if (!b) return { today: false, age: null, daysAway: null };
  const d = dhakaDate(now);
  const [y, mo, da] = d.split("-").map(Number);
  const thisYear = new Date(Date.UTC(y, b.month - 1, b.day));
  const todayUtc = new Date(Date.UTC(y, mo - 1, da));
  let next = thisYear;
  if (todayUtc > thisYear) next = new Date(Date.UTC(y + 1, b.month - 1, b.day));
  const daysAway = Math.round((next - todayUtc) / 86400000);
  const age = b.turns != null && b.year != null ? b.turns + (next.getUTCFullYear() - b.year) : null;
  return { today: daysAway === 0, age, daysAway };
}

/** Days Abid gave back to the streak (calendar.json freeDays, 8 Nov 2026). */
export function isGivenFreeDay(ymd) {
  return (data.freeDays || []).some((x) => x.day === ymd);
}

/** Night hours in Dhaka (Abid, 8 Nov 2026): "ok", "late" (after the soft stop - the tutor asks her once whether to finish
    the step or stop) or "closed" (after the hard stop until morning - no lessons). */
export function nightStatus(now = Date.now()) {
  const n = data.nightHours || {};
  const toMin = (s, dflt) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "")); return m ? Number(m[1]) * 60 + Number(m[2]) : dflt; };
  const soft = toMin(n.softStop, 21 * 60 + 30), hard = toMin(n.hardStop, 23 * 60 + 30), morning = toMin(n.morning, 5 * 60);
  if (n.enabled === false) return "ok"; // 19 Nov 2026: the adult instance has no night rule (calendar.json nightHours.enabled)
  const t = localMinutes(now);
  if (t >= hard || t < morning) return "closed";
  if (t >= soft) return "late";
  return "ok";
}

/** Is this Dhaka date inside an enabled exam period? (the streak never breaks on such a day) */
export function isExamDay(ymd) {
  return (data.exams || []).some((x) => x.enabled && x.from <= ymd && ymd <= x.to);
}
