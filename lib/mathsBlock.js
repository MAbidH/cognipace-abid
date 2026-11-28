/* THE MATHS BLOCK on /guardian (25 Nov 2026, MATHS-PLAN section 6): the five numbers that say whether the maths plan
   is working - fluency (the daily drill), retention of maths skills (the practice spine), the class-above stretch
   problems, maths on paper (photo checks) and the Saturday puzzle set - each with this week against last. Pure; the
   page runs the queries. Tested in scripts/test-server.mjs. */
import { paperSummary } from "./paper.js";
import { puzzleSummary } from "./puzzles.js";

const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);

/** typingRows: [{ day 'YYYY-MM-DD', math_done, math_score, math_seconds, math_hit }] newest first, last 14 days. */
export function fluency(typingRows, today) {
  const rows = (typingRows || []).filter((r) => r.math_done);
  const cut = new Date(today + "T00:00:00Z").getTime();
  const wk = (r) => (cut - new Date(String(r.day).slice(0, 10) + "T00:00:00Z").getTime()) / 86400000;
  const thisWeek = rows.filter((r) => wk(r) < 7), lastWeek = rows.filter((r) => wk(r) >= 7 && wk(r) < 14);
  const best = (xs) => xs.reduce((b, r) => { const s = Number(r.math_score || 0), t = Number(r.math_seconds || 0); return !b || s > b.score || (s === b.score && t < b.seconds) ? { score: s, seconds: t, day: String(r.day).slice(0, 10) } : b; }, null);
  return { daysThisWeek: thisWeek.length, daysLastWeek: lastWeek.length, hitsThisWeek: thisWeek.filter((r) => r.math_hit).length, best: best(thisWeek), bestLast: best(lastWeek), latest: rows[0] ? { day: String(rows[0].day).slice(0, 10), score: Number(rows[0].math_score || 0), seconds: Number(rows[0].math_seconds || 0) } : null };
}

/** skillRows: [{ skill, module_id, hits, misses, stage }] for maths modules; answerRows: [{ ok, at }] review answers on
    maths skills in the last 30 days. */
export function mathsRetention(skillRows, answerRows) {
  const skills = skillRows || [];
  const a = answerRows || [];
  const weak = skills.filter((s) => Number(s.misses) > 0).sort((x, y) => Number(y.misses) - Number(x.misses) || Number(x.hits) - Number(y.hits)).slice(0, 3);
  return { skills: skills.length, answers: a.length, pct: pct(a.filter((x) => x.ok).length, a.length), weak: weak.map((s) => ({ skill: s.skill, misses: Number(s.misses), hits: Number(s.hits) })) };
}

/** eventRows: events on stretch steps (step_id ending -S1), kind lesson: [{ step_id, started_at, active_ms, attempts }];
    unverified: step ids closed without her own words. */
export function stretch(eventRows, unverified) {
  const u = new Set(unverified || []);
  // one line per step: a step worked on over several sessions has several events - their minutes are added (28 Nov 2026)
  const by = new Map();
  for (const r of eventRows || []) { const d = by.get(r.step_id) || { step: r.step_id, minutes: 0, onEvidence: !u.has(r.step_id), at: r.started_at }; d.minutes += Number(r.active_ms || 0) / 60000; by.set(r.step_id, d); }
  const done = [...by.values()].map((d) => ({ ...d, minutes: Math.round(d.minutes) }));
  return { done: done.length, onEvidence: done.filter((d) => d.onEvidence).length, list: done.slice(0, 6) };
}

export function mathsBlock({ today, typingRows, skillRows, answerRows, stretchRows, unverified, paperRows, puzzleRows }) {
  return { fluency: fluency(typingRows, today), retention: mathsRetention(skillRows, answerRows), stretch: stretch(stretchRows, unverified), paper: paperSummary(paperRows), puzzles: puzzleSummary(puzzleRows) };
}
