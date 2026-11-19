/* The practice spine (9 Nov 2026, PLAN-2026-11-09 §7 - Abid: "the same things she learns today must be practised ahead,
   so she becomes experienced, expert and capable of using those skills").

   Every skill she passes gets a row in `skills` with a due date. The ladder is 1 day -> 7 -> 30 -> 90 (then every 90);
   a miss drops it back to 1 day. Each warm-up pulls the two most urgent due items (ten on a Saturday, plus a five-question
   re-check of one old module on the first Saturday of the month). Questions come from the sets she already met in the
   module (every practice/check question and its variants, kept in `qsets`), from the hand-written banks in
   curriculum/modules.json, and from `review_bank` (fresh questions the generator wrote for a skill that had none left).
   Graded on the server with the same answerMatches() as everything else. Nothing here ever gates a lesson by itself
   beyond the warm-up's three-honest-tries rule. Server only. */
import modules from "../curriculum/modules.json";
import { q } from "./db";
import { answerMatches } from "./guard";
import { dhakaDate } from "./calendar";

export const STAGE_DAYS = [1, 7, 30, 90];     // stage 0..3; stage 3 repeats every 90 days
export const DAILY_ITEMS = 2;
export const SATURDAY_ITEMS = 10;
export const RECHECK_ITEMS = 5;
export const RECHECK_EVERY_DAYS = 30;          // one old module, once a month
export const TRIES_PER_ITEM = 2;               // second miss shows the answer and the reason, then the next item

const byId = Object.fromEntries(modules.map((m) => [m.id, m]));
const order = modules.map((m) => m.id);
const addDays = (ymd, n) => { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay(); // 0 Sun .. 6 Sat
export const isSaturday = (ymd) => dow(ymd) === 6;
const pick = (arr, n, rnd = Math.random) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const clean = (s) => String(s ?? "").trim().slice(0, 400);

/** The skills a module teaches with a name: every `skills` list on its practice/check steps and every `skill` on a
    hand-written question. Lowercase slugs as written in modules.json. */
export function moduleSkills(m) {
  const out = new Set();
  for (const s of m.steps || []) {
    if (s.kind === "diagnostic") continue; // a diagnostic measures what she has NOT learned yet - never a review item
    for (const k of s.skills || []) if (k) out.add(String(k));
    // a hand-written bank question without a skill name belongs to its step (LX1, LX2, CS1B, GK1 checks are written this way)
    for (const x of s.questions || []) if (x?.q) out.add(String(x.skill || s.id));
  }
  return [...out];
}

/** Record that a skill was learned or practised inside its own module. A new skill starts at stage 0, due tomorrow.
    A known skill is left where it is (a right answer inside the module is not a spaced review); a wrong one drops to
    stage 0, due tomorrow. */
export async function learned(skills, moduleId, { ok = true, today = dhakaDate() } = {}) {
  const list = [...new Set((skills || []).map((k) => String(k || "").trim().slice(0, 60)).filter(Boolean))];
  if (!list.length || !moduleId) return;
  const tomorrow = addDays(today, 1);
  for (const skill of list) {
    if (ok) {
      await q(`INSERT INTO skills (skill, module_id, learned_at, stage, due) VALUES ($1,$2,now(),0,$3)
               ON CONFLICT (skill) DO NOTHING`, [skill, moduleId, tomorrow]);
    } else {
      await q(`INSERT INTO skills (skill, module_id, learned_at, stage, due, misses) VALUES ($1,$2,now(),0,$3,1)
               ON CONFLICT (skill) DO UPDATE SET stage=0, due=$3, misses=skills.misses+1, last_at=now(), last_ok=false`, [skill, moduleId, tomorrow]);
    }
  }
}

/** One spaced-review outcome: right -> one stage up (due in 7, 30, 90, 90... days); wrong -> stage 0, due tomorrow. */
export async function reviewed(skill, ok, { today = dhakaDate() } = {}) {
  const rows = await q("SELECT stage FROM skills WHERE skill=$1", [skill]);
  if (!rows.length) return null;
  const stage = ok ? Math.min(STAGE_DAYS.length - 1, Number(rows[0].stage) + 1) : 0;
  const due = addDays(today, STAGE_DAYS[stage]);
  await q(`UPDATE skills SET stage=$2, due=$3, last_at=now(), last_ok=$4, hits=hits+$5, misses=misses+$6 WHERE skill=$1`,
    [skill, stage, due, ok, ok ? 1 : 0, ok ? 0 : 1]);
  return { stage, due };
}

/** First run only: give every skill of every module she has already passed a row, so the spine starts from what she
    knows, not from zero. Older skills start higher on the ladder; the weakest (by her own wrong answers) come first;
    everything is due within two weeks so the first fortnight is not one giant backlog. Idempotent. */
export async function seedLedger({ today = dhakaDate() } = {}) {
  const [[{ n }], prog, wrongRows] = await Promise.all([
    q("SELECT COUNT(*)::int AS n FROM skills"),
    q("SELECT module_id, passed_at FROM progress WHERE status='passed'"),
    q("SELECT skill, COUNT(*)::int AS n FROM answers WHERE NOT ok AND skill IS NOT NULL GROUP BY skill").catch(() => []),
  ]);
  if (n > 0 || !prog.length) return 0;
  const wrong = Object.fromEntries(wrongRows.map((r) => [r.skill, r.n]));
  const items = [];
  for (const p of prog) {
    const m = byId[p.module_id]; if (!m) continue;
    const at = p.passed_at ? new Date(p.passed_at) : new Date();
    const ageDays = Math.max(0, Math.floor((Date.now() - at.getTime()) / 86400000));
    const stage = ageDays >= 90 ? 3 : ageDays >= 30 ? 2 : ageDays >= 7 ? 1 : 0;
    for (const skill of moduleSkills(m)) items.push({ skill, moduleId: m.id, at, stage, wrong: wrong[skill] || 0, pos: order.indexOf(m.id) });
  }
  // weakest first, then the oldest module; spread over 14 days
  items.sort((a, b) => (b.wrong - a.wrong) || (a.pos - b.pos));
  let i = 0;
  for (const it of items) {
    await q(`INSERT INTO skills (skill, module_id, learned_at, stage, due, misses) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (skill) DO NOTHING`,
      [it.skill, it.moduleId, it.at.toISOString(), it.stage, addDays(today, i % 14), it.wrong]);
    i++;
  }
  return items.length;
}

/* ---------- Questions for a skill ---------- */

/** Every question she has met for this skill (sets and their variants, hand-written banks), minus the ones she answered
    right in the last 30 days and the ones in `avoid`. Each: {q, a, explain, hint, from}. */
async function candidates(skill, moduleId, avoid = new Set()) {
  const [sets, recent, bank] = await Promise.all([
    q("SELECT module_id, step_id, questions FROM qsets WHERE module_id=$1 AND kind IN ('practice','check') ORDER BY started_at DESC LIMIT 40", [moduleId]),
    q("SELECT DISTINCT question FROM answers WHERE ok AND skill=$1 AND at > now() - interval '30 days'", [skill]).catch(() => []),
    q("SELECT q, a, explain FROM review_bank WHERE skill=$1 ORDER BY id DESC LIMIT 40", [skill]).catch(() => []),
  ]);
  const seenRight = new Set(recent.map((r) => r.question));
  const out = []; const seenQ = new Set();
  const add = (x, from) => {
    if (!x || typeof x.q !== "string" || !Array.isArray(x.a) || !x.a.length) return;
    const qq = clean(x.q); if (!qq || seenQ.has(qq) || avoid.has(qq) || seenRight.has(qq)) return;
    seenQ.add(qq); out.push({ q: qq, a: x.a.map((v) => String(v).slice(0, 60)), explain: clean(x.explain || x.hint || ""), hint: clean(x.hint || ""), from });
  };
  for (const r of sets) for (const x of r.questions || []) {
    if (String(x.skill || r.step_id) !== skill) continue;
    add(x, "set");
    for (const v of x.variants || []) add({ ...v, skill }, "variant");
  }
  const m = byId[moduleId];
  for (const s of m?.steps || []) if (s.kind !== "diagnostic") for (const x of s.questions || []) if (String(x.skill || s.id) === skill) add(x, "bank");
  for (const r of bank) add({ q: r.q, a: Array.isArray(r.a) ? r.a : [], explain: r.explain }, "review_bank");
  return out;
}

/** Skills that need a fresh question written (none left she has not just got right). */
export async function skillsNeedingQuestions(limit = 4) {
  const rows = await q("SELECT skill, module_id FROM skills WHERE due <= (now() AT TIME ZONE 'Asia/Dhaka')::date ORDER BY due, stage LIMIT 30");
  const out = [];
  for (const r of rows) { if ((await candidates(r.skill, r.module_id)).length === 0) out.push({ skill: r.skill, moduleId: r.module_id }); if (out.length >= limit) break; }
  return out;
}

export async function addToBank(skill, moduleId, question) {
  if (!question || typeof question.q !== "string" || !Array.isArray(question.a) || !question.a.length) return false;
  await q("INSERT INTO review_bank (skill, module_id, q, a, explain, source) VALUES ($1,$2,$3,$4,$5,'generated')",
    [skill, moduleId, clean(question.q), JSON.stringify(question.a.map((v) => String(v).slice(0, 60))), clean(question.explain || "")]);
  return true;
}

/* ---------- The day's set ---------- */

/** Which old module gets its monthly re-check today, if any: Saturday, passed >= 30 days ago, not re-checked in the
    last 30 days, oldest re-check (or never) first. */
export async function recheckModuleFor(today) {
  if (!isSaturday(today)) return null;
  const rows = await q(`SELECT p.module_id, p.passed_at, (SELECT MAX(day) FROM rechecks r WHERE r.module_id = p.module_id) AS last
                        FROM progress p WHERE p.status='passed' AND p.passed_at < now() - interval '${RECHECK_EVERY_DAYS} days'`);
  const due = rows.filter((r) => !r.last || (Date.now() - new Date(r.last).getTime()) / 86400000 >= RECHECK_EVERY_DAYS)
    .filter((r) => moduleSkills(byId[r.module_id] || { steps: [] }).length > 0)
    .sort((a, b) => (a.last ? new Date(a.last).getTime() : 0) - (b.last ? new Date(b.last).getTime() : 0) || order.indexOf(a.module_id) - order.indexOf(b.module_id));
  return due[0]?.module_id || null;
}

/** Build (once per Dhaka day) and return today's review: {day, items:[{i, skill, moduleId, q, kind}], results, done}.
    Answers never leave the server; the client gets q only. */
export async function reviewToday({ today = dhakaDate() } = {}) {
  const have = await q("SELECT * FROM reviews WHERE day=$1", [today]);
  if (have.length) return pub(have[0]);
  await seedLedger({ today });
  const n = isSaturday(today) ? SATURDAY_ITEMS : DAILY_ITEMS;
  // most urgent first: overdue misses, then overdue by how long, then the lowest stage
  const due = await q(`SELECT skill, module_id, stage, due FROM skills WHERE due <= $1
                       ORDER BY (last_ok IS FALSE) DESC, due ASC, stage ASC, learned_at ASC LIMIT 40`, [today]);
  let rows = due;
  if (rows.length < n) { // nothing (or little) due: the least recently reviewed skills, so there is always practice
    const more = await q(`SELECT skill, module_id, stage, due FROM skills WHERE due > $1 ORDER BY COALESCE(last_at, learned_at) ASC LIMIT $2`, [today, n * 2]);
    rows = [...rows, ...more.filter((r) => !rows.some((x) => x.skill === r.skill))];
  }
  const items = []; const avoid = new Set();
  for (const r of rows) {
    if (items.length >= n) break;
    const cs = await candidates(r.skill, r.module_id, avoid);
    if (!cs.length) continue; // no question left for it today; the generator fills the bank in the background
    const c = pick(cs, 1)[0]; avoid.add(c.q);
    items.push({ i: items.length, kind: "review", skill: r.skill, moduleId: r.module_id, stage: Number(r.stage), q: c.q, a: c.a, explain: c.explain });
  }
  // Monthly re-check of one old module (first Saturday it is due): five of its questions, scored separately, never gating.
  const recheck = await recheckModuleFor(today);
  if (recheck) {
    const sk = pick(moduleSkills(byId[recheck]), RECHECK_ITEMS);
    for (const skill of sk) {
      const cs = await candidates(skill, recheck, avoid); if (!cs.length) continue;
      const c = pick(cs, 1)[0]; avoid.add(c.q);
      items.push({ i: items.length, kind: "recheck", skill, moduleId: recheck, stage: null, q: c.q, a: c.a, explain: c.explain });
    }
  }
  const row = { day: today, items, results: [], done: items.length === 0, kind: isSaturday(today) ? "saturday" : "daily", recheck_module: recheck };
  await q(`INSERT INTO reviews (day, items, results, done, kind, recheck_module) VALUES ($1,$2,'[]',$3,$4,$5) ON CONFLICT (day) DO NOTHING`,
    [today, JSON.stringify(items), row.done, row.kind, recheck]);
  const saved = await q("SELECT * FROM reviews WHERE day=$1", [today]);
  return pub(saved[0]);
}

function pub(row) {
  const results = Array.isArray(row.results) ? row.results : [];
  const items = (row.items || []).map((it) => {
    const r = results.filter((x) => x.i === it.i);
    const last = r[r.length - 1];
    return { i: it.i, kind: it.kind, skill: it.skill, moduleId: it.moduleId, module: byId[it.moduleId]?.title || it.moduleId, q: it.q,
      tries: r.length, ok: r.some((x) => x.ok), closed: r.some((x) => x.ok) || r.length >= TRIES_PER_ITEM,
      explain: r.length >= TRIES_PER_ITEM && !r.some((x) => x.ok) ? (last?.explain || it.explain || "") : null, answer: r.length >= TRIES_PER_ITEM && !r.some((x) => x.ok) ? (it.a?.[0] || null) : null };
  });
  const next = items.find((x) => !x.closed) || null;
  return { day: typeof row.day === "string" ? row.day : new Date(row.day).toISOString().slice(0, 10), kind: row.kind, recheckModule: row.recheck_module, recheckTitle: row.recheck_module ? (byId[row.recheck_module]?.title || row.recheck_module) : null,
    items, next, done: !!row.done || !next, count: items.length, right: items.filter((x) => x.ok).length };
}

/** Grade one answer to item i of today's review. Returns the public view plus {ok, hint, reveal}. */
export async function answerReview(i, value, { today = dhakaDate() } = {}) {
  const rows = await q("SELECT * FROM reviews WHERE day=$1", [today]);
  if (!rows.length) return { error: "no review today" };
  const row = rows[0];
  const it = (row.items || []).find((x) => x.i === Number(i));
  if (!it) return { error: "no such question" };
  const results = Array.isArray(row.results) ? row.results : [];
  const mine = results.filter((x) => x.i === it.i);
  if (mine.some((x) => x.ok) || mine.length >= TRIES_PER_ITEM) return { error: "already answered", ...pub(row) };
  const ok = answerMatches(it.a, value);
  const given = String(value ?? "").slice(0, 100);
  results.push({ i: it.i, ok, given, at: new Date().toISOString(), explain: it.explain || "" });
  const closedNow = ok || mine.length + 1 >= TRIES_PER_ITEM;
  // one row per item in the ledger: the first try decides the stage move (a second-try right answer still counts as a miss for spacing)
  if (closedNow && it.kind === "review") await reviewed(it.skill, ok && mine.length === 0, { today });
  if (closedNow && it.kind === "recheck" && !ok) await learned([it.skill], it.moduleId, { ok: false, today });
  await q("INSERT INTO answers (module_id, step_id, qset_id, skill, question, given, ok) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [it.moduleId, it.kind === "recheck" ? "review:recheck" : "review", `review:${today}`, String(it.skill).slice(0, 60), it.q.slice(0, 400), given, ok]);
  const all = (row.items || []).every((x) => { const r = results.filter((y) => y.i === x.i); return r.some((y) => y.ok) || r.length >= TRIES_PER_ITEM; });
  await q("UPDATE reviews SET results=$2, done=$3, finished_at=CASE WHEN $3 THEN now() ELSE finished_at END WHERE day=$1", [today, JSON.stringify(results), all]);
  if (all && row.recheck_module) {
    const rc = (row.items || []).filter((x) => x.kind === "recheck");
    if (rc.length) {
      const right = rc.filter((x) => results.some((y) => y.i === x.i && y.ok)).length;
      await q("INSERT INTO rechecks (module_id, day, score, total) VALUES ($1,$2,$3,$4) ON CONFLICT (module_id, day) DO UPDATE SET score=$3, total=$4", [row.recheck_module, today, right / rc.length, rc.length]);
    }
  }
  const fresh = await q("SELECT * FROM reviews WHERE day=$1", [today]);
  return { ok, reveal: !ok && mine.length + 1 >= TRIES_PER_ITEM, hint: ok ? null : (mine.length === 0 ? "Not yet - one more try. Read the question again slowly." : null), ...pub(fresh[0]) };
}

/* ---------- For the guardian page ---------- */
export async function retention() {
  const [stages, recent, perModule, rechecks, nextDue] = await Promise.all([
    q("SELECT stage, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE due <= (now() AT TIME ZONE 'Asia/Dhaka')::date)::int AS due FROM skills GROUP BY stage ORDER BY stage"),
    q("SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE ok)::int AS right FROM answers WHERE step_id LIKE 'review%' AND at > now() - interval '30 days'"),
    q(`SELECT module_id, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE ok)::int AS right FROM answers WHERE step_id LIKE 'review%' AND at > now() - interval '30 days' GROUP BY module_id ORDER BY module_id`),
    q("SELECT module_id, to_char(day,'YYYY-MM-DD') AS day, score, total FROM rechecks ORDER BY day DESC LIMIT 12"),
    q("SELECT skill, module_id, stage, to_char(due,'YYYY-MM-DD') AS due, misses FROM skills ORDER BY due ASC, misses DESC LIMIT 12"),
  ]);
  const weak = await q("SELECT skill, module_id, misses, hits, stage FROM skills WHERE misses > 0 ORDER BY misses DESC, hits ASC LIMIT 10");
  return { stages, recent: recent[0], perModule: perModule.map((r) => ({ ...r, title: byId[r.module_id]?.title || r.module_id })), rechecks: rechecks.map((r) => ({ ...r, title: byId[r.module_id]?.title || r.module_id })), nextDue, weak,
    total: stages.reduce((s, r) => s + r.n, 0), dueNow: stages.reduce((s, r) => s + r.due, 0) };
}
