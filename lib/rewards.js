import modules from "../curriculum/modules.json";
import unlocksFile from "../curriculum/rewards.json";
import { localYmd } from "./time";
import { q } from "./db";
import { workedByDay, clockByDay } from "./presence";
import calendar from "../curriculum/calendar.json";
import { streaks as streakCount } from "./streak";
import { countingOfflineDays } from "./offline";
import { wpmTarget } from "./mathdrill";

/* ---------- Rewards (Abid, Oct 2026): XP, levels, badges and streaks, all computed from what she actually did.
   Nothing here is awarded by the browser; every number comes from the server's own records. ---------- */

export const LEVELS = [
  // Calibrated 2 Oct 2026 after her first month counted retroactively (she opened at Level 4, 1535 XP).
  // At a good pace she earns roughly 400-500 XP a week, so each level is about two to six weeks of work.
  { n: 1, name: "Newcomer", xp: 0 },
  { n: 2, name: "Keyboard Apprentice", xp: 300 },
  { n: 3, name: "Builder", xp: 800 },
  { n: 4, name: "Debugger", xp: 1500 },
  { n: 5, name: "Shell Walker", xp: 3000 },
  { n: 6, name: "Systems Thinker", xp: 5000 },
  { n: 7, name: "Defender", xp: 8000 },
  { n: 8, name: "Architect", xp: 12000 },
  { n: 9, name: "Engineer", xp: 17000 },
  { n: 10, name: "Master Builder", xp: 23000 },
];

export const XP = { warmup: 10, warmupSharp: 5, step: 15, code: 25, check: 50, checkFirstTry: 25, teach: 30, module: 100, session: 20, streak7: 50, streak30: 200, arena: 10, wonder: 5, math: 10, mathTarget: 10, speedTarget: 10, move: 3, deskDay: 5 };

const STEP_KIND = Object.fromEntries(modules.flatMap((m) => m.steps.map((s) => [s.id, s.kind])));

export const BADGES = [
  { id: "first-light", name: "First Light", how: "Finish your very first step.", test: (d) => d.completions.length >= 1 },
  { id: "hello-world", name: "Hello, World", how: "Run your first program (Computing 1).", test: (d) => d.completions.includes("CS1-CODE") },
  { id: "home-row", name: "Home Row", how: "Do a keybr warm-up.", test: (d) => d.typing.some((t) => t.done) }, // 29 Oct 2026: no self-reported accuracy any more
  { id: "all-the-keys", name: "All the Keys", how: "Type the daily code line with zero mistakes.", test: (d) => d.typing.some((t) => Number(t.drill_accuracy) === 100) },
  { id: "seven-days", name: "Seven Days", how: "A seven-day streak of complete sessions.", test: (d) => d.maxStreak >= 7 },
  { id: "thirty-days", name: "Thirty Days", how: "A thirty-day streak. Fridays and one missed day a week don't count against you.", test: (d) => d.maxStreak >= 30 },
  { id: "boss-first-try", name: "Boss, First Try", how: "Beat a checkpoint on the first attempt.", test: (d) => d.firstTry > 0 },
  { id: "debugger", name: "Debugger", how: "Miss a checkpoint, fix the bugs, then beat it.", test: (d) => d.debugged > 0 },
  { id: "teacher", name: "Teacher", how: "A teach-it-back scored 90% or more for clarity.", test: (d) => d.bestTeach >= 0.9 },
  { id: "builder", name: "Builder", how: "Ship five programs.", test: (d) => d.codeCount >= 5 },
  { id: "no-mouse", name: "No Mouse", how: "Finish both 'move without the mouse' lessons.", test: (d) => d.completions.includes("CS1B-K1") && d.completions.includes("CS1B-K2") },
  { id: "machine-owner", name: "Machine Owner", how: "Pass Computing 1.5 - the laptop you built yourself.", test: (d) => d.passed.includes("CS1B") },
  { id: "foundations", name: "Foundations", how: "Pass the first four maths modules.", test: (d) => ["M1", "M2", "M3", "M4"].every((m) => d.passed.includes(m)) },
  { id: "binary-reader", name: "Binary Reader", how: "Pass Computing 1.", test: (d) => d.passed.includes("CS1") },
  { id: "logkeeper", name: "Logkeeper", how: "Write five entries in your logbook.", test: (d) => d.notes >= 5 },
  { id: "vault-keeper", name: "Vault Keeper", how: "Unlock Bitwarden from memory on thirty different days.", test: (d) => d.vaultDays >= 30 },
  { id: "marathon", name: "Marathon", how: "Ten hours of real work, all counted.", test: (d) => d.hours >= 10 },
  { id: "shortcut", name: "Shortcut", how: "Find a faster way than the one you were shown, and explain why it works.", test: (d) => d.shortcuts >= 1 },
  { id: "lazy-programmer", name: "Lazy Programmer", how: "Pass Leverage 1: make the machine do the repeating.", test: (d) => d.passed.includes("LV1") },
  { id: "ai-checker", name: "AI Checker", how: "Pass Leverage 2: get code from an AI and find its bug.", test: (d) => d.passed.includes("LV2") },
  { id: "arena-10", name: "Arena 10", how: "Play ten game days in the Arena.", test: (d) => d.arenaDays >= 10 },
  { id: "lamp-master", name: "Lamp Master", how: "A perfect Lamp race: every binary number right.", test: (d) => d.lampMaster },
  { id: "memory", name: "Memory", how: "A perfect Lightning quiz - nothing forgotten.", test: (d) => d.quizPerfect },
  { id: "quick-maths", name: "Quick Maths", how: "Hit the maths drill target: 18 of 20 or better, inside the time.", test: (d) => d.typing.some((t) => t.math_hit) },
  { id: "perfect-twenty", name: "Perfect Twenty", how: "All 20 maths drill questions right.", test: (d) => d.typing.some((t) => Number(t.math_score) >= 20) },
  { id: "speed-20", name: "Twenty a Minute", how: "Type the drill line at 20 words a minute or faster.", test: (d) => d.typing.some((t) => Number(t.drill_wpm) >= 20) },
  { id: "speed-30", name: "Thirty a Minute", how: "Type the drill line at 30 words a minute or faster.", test: (d) => d.typing.some((t) => Number(t.drill_wpm) >= 30) },
  { id: "on-target-7", name: "On Target", how: "Hit your typing speed target on seven days.", test: (d) => d.typing.filter((t) => t.drill_done && Number(t.drill_wpm) >= wpmTarget(t.ymd, d.typing)).length >= 7 },
  { id: "wonderer", name: "Wonderer", how: "Read ten Wonders.", test: (d) => d.wonders >= 10 },
];

/** Dhaka calendar day as YYYY-MM-DD for a timestamp. */
const dhakaDay = (t) => localYmd(new Date(t).getTime());
const isFriday = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay() === 5;
// Her birthday is a free day too (Abid, 9 Oct 2026): curriculum/calendar.json birthday {month, day}.
const isBirthday = (ymd) => { const b = calendar.birthday; return !!b && Number(ymd.slice(5, 7)) === b.month && Number(ymd.slice(8, 10)) === b.day; };
const isExam = (ymd) => (calendar.exams || []).some((x) => x.enabled && x.from <= ymd && ymd <= x.to);
// Days Abid gave back (calendar.json freeDays, 8 Nov 2026: 2 Nov - the warm-up was not yet counted as work time).
const isGivenFreeDay = (ymd) => (calendar.freeDays || []).some((x) => x.day === ymd);
const isFree = (ymd) => isFriday(ymd) || isBirthday(ymd) || isExam(ymd) || isGivenFreeDay(ymd); // exam days (Abid, 12 Oct 2026): ten minutes asked, the streak is safe
const addDays = (ymd, n) => new Date(new Date(ymd + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);

/** Streaks over the session days (lib/streak.js, pure and tested): free days never break a streak, and since
    29 Oct 2026 one missed ordinary day per Mon-Sun week does not either (a weekly rhythm, not a chain). */
const streaks = (days, today) => streakCount(days, today, isFree);

export async function computeRewards() {
  const [comps, prog, typing, checks, teach, time, notes, shortcutRows, arenaRows, wonderRows, sessionDays, todayRows, dayRows, newsRows] = await Promise.all([
    q("SELECT key, at FROM completions"),
    q("SELECT module_id, status, passed_at, step_index FROM progress"),
    q("SELECT day, to_char(day, 'YYYY-MM-DD') AS ymd, done, accuracy, drill_done, drill_accuracy, drill_wpm, vault_done, shortcut_done, code_done, code_waived, math_done, math_score, math_seconds, math_hit FROM typing ORDER BY day"),
    q("SELECT step_id, passed, started_at FROM events WHERE kind='check' ORDER BY id"),
    q("SELECT MAX(score) AS s FROM events WHERE kind='teach' AND passed"),
    Promise.all([q("SELECT COALESCE(SUM(active_ms),0)::bigint AS ms FROM events"), workedByDay(120), clockByDay(120)])
      .then(([all, w, c]) => [{ ms: Number(all[0].ms) + Object.keys(w).reduce((a, d) => a + Math.max(0, (w[d] || 0) - (c[d] || 0)), 0) }]),
    q("SELECT COUNT(*)::int AS n FROM journal WHERE kind='note'"),
    q("SELECT COUNT(*)::int AS n FROM journal WHERE kind='shortcut'"),
    // 29 Oct 2026 (review 01 H3): game DAYS, not game rows - a second finished game on one day adds nothing.
    q("SELECT COUNT(DISTINCT day)::int AS days, COALESCE(BOOL_OR((results->'lamps'->>'points')::int >= (results->'lamps'->>'max')::int AND (results->'lamps'->>'max')::int > 0), false) AS lamp, COALESCE(BOOL_OR((results->'quiz'->>'points')::int >= (results->'quiz'->>'max')::int AND (results->'quiz'->>'max')::int > 0), false) AS quiz FROM arena WHERE done"),
    q("SELECT COUNT(*)::int AS n FROM wonders_read"),
    // A session day: at least 25 minutes of real work (clock or presence, the larger - lib/presence.js) and one
    // finished step that day - OR 50+ minutes of real work even if the step did not land (Abid, 16 Oct 2026: on
    // 15 Oct she worked 52 minutes on a step that was too big and lost a 4-day streak; a long honest day counts).
    // Presence covers the 120 days the streak and badges can look back on.
    // 2 Nov 2026: an OFFLINE day (her worksheet pack, no internet) with 25+ active minutes counts too (lib/offline.js).
    Promise.all([workedByDay(120), q(`SELECT DISTINCT to_char((at AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS d FROM completions`),
      q("SELECT to_char(day, 'YYYY-MM-DD') AS day, minutes FROM offline_days WHERE day > now() - interval '120 days'").catch(() => [])])
      .then(([worked, cd, off]) => { const done = new Set(cd.map((r) => r.d)); const offline = countingOfflineDays(off); return [...new Set([...done, ...Object.keys(worked), ...offline])].filter((d) => offline.includes(d) || (worked[d] || 0) >= (done.has(d) ? 25 : 50) * 60 * 1000).sort().map((d) => ({ d: d + "T00:00:00+06:00" })); }),
    q(`SELECT (now() AT TIME ZONE 'Asia/Dhaka')::date AS today`),
    // The school day (3 Nov 2026): movement breaks (at most 8 a day count) and desk-check days.
    q("SELECT LEAST(moves, 8)::int AS moves, desk FROM school_day").catch(() => []),
    q("SELECT COUNT(*)::int AS n FROM news_read").catch(() => [{ n: 0 }]),
  ]);
  const completions = comps.map((r) => r.key).filter((k) => !k.includes(":"));
  const passed = prog.filter((p) => p.status === "passed").map((p) => p.module_id);
  const today = dhakaDay(todayRows[0].today);
  const days = sessionDays.map((r) => dhakaDay(r.d));
  const st = streaks(days, today);

  // Checkpoints: first-try passes vs passes that came after a miss.
  const byStep = {};
  for (const c of checks) (byStep[c.step_id] ||= []).push(c.passed);
  let firstTry = 0, debugged = 0;
  for (const list of Object.values(byStep)) { if (list[0]) firstTry++; else if (list.some(Boolean)) debugged++; }

  // Programs = code steps shipped + Python lines passed in the warm-up (12 Oct 2026) - every one is hers.
  const codeLines = typing.filter((t) => t.code_done && !t.code_waived).length;
  const codeCount = completions.filter((k) => STEP_KIND[k] === "code").length + codeLines;
  const hours = Number(time[0].ms) / 3600000;
  const vaultDays = typing.filter((t) => t.vault_done).length;
  const data = { completions, passed, typing, maxStreak: st.max, firstTry, debugged, bestTeach: Number(teach[0]?.s || 0), codeCount, notes: Number(notes[0].n), hours, codeLines, vaultDays, shortcuts: Number(shortcutRows[0].n), arenaDays: Number(arenaRows[0].days), lampMaster: !!arenaRows[0].lamp, quizPerfect: !!arenaRows[0].quiz, wonders: Number(wonderRows[0].n) };

  // XP, from the records.
  let xp = 0;
  for (const k of completions) xp += STEP_KIND[k] === "code" ? XP.code : STEP_KIND[k] === "check" ? XP.check : STEP_KIND[k] === "teach" ? XP.teach : XP.step;
  xp += firstTry * XP.checkFirstTry + passed.length * XP.module + days.length * XP.session;
  for (const t of typing) { if (t.done) xp += XP.warmup; /* 8 Nov 2026: the drill line is an extra now - keybr is the warm-up */ if (t.done) xp += XP.warmupSharp; /* keybr done (was: self-reported 95%+, 29 Oct 2026) */ if (Number(t.drill_accuracy) === 100) xp += XP.warmupSharp; if (t.vault_done) xp += XP.warmupSharp; if (t.shortcut_done) xp += XP.warmupSharp; if (t.code_done && !t.code_waived) xp += XP.warmupSharp; }
  // 3 Nov 2026: the maths drill, and the speed targets (typing wpm on the drill line; maths score + time).
  for (const t of typing) {
    if (t.math_done) xp += XP.math;
    if (t.math_hit) xp += XP.mathTarget;
    if (t.drill_done && Number(t.drill_wpm) >= wpmTarget(t.ymd, typing)) xp += XP.speedTarget;
  }
  xp += Number(newsRows[0]?.n || 0) * XP.wonder; // a cyber news story read = a Wonder
  for (const d of dayRows) { xp += Number(d.moves || 0) * XP.move; if (d.desk) xp += XP.deskDay; }
  if (st.max >= 7) xp += XP.streak7; if (st.max >= 30) xp += XP.streak30;
  xp += Number(arenaRows[0].days) * XP.arena + Number(wonderRows[0].n) * XP.wonder;

  const level = [...LEVELS].reverse().find((l) => xp >= l.xp) || LEVELS[0];
  const next = LEVELS.find((l) => l.xp > xp) || null;

  // Badges: evaluate, and record the first time each one is earned (so "new" can be shown once and the date kept).
  const earnedRows = await q("SELECT id, at FROM badges");
  const earnedAt = Object.fromEntries(earnedRows.map((r) => [r.id, r.at]));
  const newBadges = [];
  for (const b of BADGES) {
    if (!earnedAt[b.id] && b.test(data)) {
      // Only the request that really inserted the badge writes its journal line (two parallel snapshots used to write two).
      const fresh = await q("INSERT INTO badges (id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id", [b.id]);
      earnedAt[b.id] = new Date().toISOString();
      if (fresh.length) { newBadges.push({ id: b.id, name: b.name }); await q("INSERT INTO journal (kind, title) VALUES ('badge', $1)", [`Badge: ${b.name}`]).catch(() => {}); }
    }
  }
  const badges = BADGES.map((b) => ({ id: b.id, name: b.name, how: b.how, at: earnedAt[b.id] || null }));

  // Abid's real rewards: reached or not, and whether she has already claimed them.
  const claimed = new Set((await q("SELECT title FROM journal WHERE kind='claim'")).map((r) => r.title));
  const current = prog.find((p) => p.status === "current")?.module_id;
  const order = modules.map((m) => m.id);
  const unlocks = (unlocksFile.unlocks || []).map((u) => {
    // 9 Nov 2026 (PLAN-2026-11-09): kind "start" = a tool handed over the day its module opens - reached when that module is current or passed.
    const curIdx0 = order.indexOf(current);
    const reached = u.kind === "level" ? level.n >= u.value : u.kind === "streak" ? st.max >= u.value : u.kind === "module" ? passed.includes(u.value) : u.kind === "badge" ? !!earnedAt[u.value] : u.kind === "start" ? (order.indexOf(u.value) >= 0 && (passed.includes(u.value) || (curIdx0 >= 0 && order.indexOf(u.value) <= curIdx0))) : false;
    let hint = "";
    if (!reached) {
      if (u.kind === "level") { const target = LEVELS.find((l) => l.n === u.value); hint = target ? `${target.xp - xp} XP to go` : ""; }
      else if (u.kind === "streak") hint = `${Math.max(0, u.value - st.current)} more days in a row`;
      else if (u.kind === "module") { const i = order.indexOf(u.value), c = order.indexOf(current); hint = i < 0 ? "later on the path" : i === c ? "this is your current module" : i > c ? `${i - c} module${i - c === 1 ? "" : "s"} away` : ""; }
      else if (u.kind === "badge") { const b = BADGES.find((x) => x.id === u.value); hint = b ? `earn the badge: ${b.how}` : ""; }
      else if (u.kind === "start") { const i = order.indexOf(u.value), c = order.indexOf(current); hint = i < 0 ? "later on the path" : i > c ? `the day ${u.value} opens - ${i - c} module${i - c === 1 ? "" : "s"} away` : ""; }
    }
    // cost and note are Abid's; they never leave the server.
    const { cost, note, ...pub } = u;
    // delivered is the date string from rewards.json (or null) - a boolean here once printed "Delivered 1 Jan 1970".
    const delivered = u.delivered ? String(u.delivered) : null;
    return { ...pub, reached: reached || !!delivered, claimed: claimed.has(u.id) || !!delivered, delivered, hint: delivered ? "" : hint };
  });

  // ---- Forecast for Abid: her pace over the last 14 days, turned into an estimated date for each reward.
  const cutoff = Date.now() - 14 * 86400000;
  const recentKeys = comps.filter((r) => !r.key.includes(":") && new Date(r.at).getTime() >= cutoff).map((r) => r.key);
  let xp14 = 0;
  for (const k of recentKeys) xp14 += STEP_KIND[k] === "code" ? XP.code : STEP_KIND[k] === "check" ? XP.check : STEP_KIND[k] === "teach" ? XP.teach : XP.step;
  xp14 += prog.filter((p) => p.passed_at && new Date(p.passed_at).getTime() >= cutoff).length * XP.module;
  xp14 += days.filter((d) => new Date(d + "T00:00:00Z").getTime() >= cutoff).length * XP.session;
  for (const t of typing) if (new Date(dhakaDay(t.day) + "T00:00:00Z").getTime() >= cutoff) { if (t.done && t.drill_done) xp14 += XP.warmup; if (t.done) xp14 += XP.warmupSharp; if (Number(t.drill_accuracy) === 100) xp14 += XP.warmupSharp; if (t.vault_done) xp14 += XP.warmupSharp; }
  const xpPerDay = Math.max(15, xp14 / 14); // never assume slower than one small step a day, or every ETA becomes "never"
  // Pace in steps: how many steps she finishes per day lately. A module ETA counts the steps still ahead of her.
  const daysPerStep = Math.max(0.5, Math.min(5, recentKeys.length ? 14 / recentKeys.length : 2));
  const curIdx = order.indexOf(current);
  const curRow = prog.find((p) => p.status === "current");
  const stepsAhead = (targetIdx) => {
    let n = 0;
    for (let i = curIdx; i <= targetIdx; i++) { const m = modules[i]; if (!m) continue; n += m.steps.length - (i === curIdx ? (curRow?.step_index || 0) : 0); }
    return n;
  };
  const etaOf = (u) => {
    if (u.reached) return 0;
    if (u.kind === "level") { const t = LEVELS.find((l) => l.n === u.value); return t ? Math.ceil((t.xp - xp) / xpPerDay) : null; }
    if (u.kind === "streak") return Math.max(1, u.value - st.current);
    if (u.kind === "module") { const i = order.indexOf(u.value); return i < 0 || i < curIdx ? null : Math.ceil(stepsAhead(i) * daysPerStep); }
    if (u.kind === "badge") return null;
    if (u.kind === "start") { const i = order.indexOf(u.value); return i < 0 || i <= curIdx ? null : Math.ceil(stepsAhead(i - 1) * daysPerStep); }
    return null;
  };
  const forecast = unlocks.map((u) => {
    const d = etaOf(u);
    const raw = (unlocksFile.unlocks || []).find((x) => x.id === u.id) || {};
    return { id: u.id, title: u.title, reward: u.reward, kind: u.kind, value: u.value, reached: u.reached, claimed: u.claimed, delivered: u.delivered || null, hint: u.hint,
      etaDays: d, etaDate: d != null ? addDays(today, d) : null, arrangeNow: !u.claimed && (u.reached || (d != null && d <= 14)), cost: raw.cost || "", note: raw.note || "" };
  });
  const pace = { xpPerDay: Math.round(xpPerDay), xp14: Math.round(xp14), daysPerStep: Math.round(daysPerStep * 10) / 10, steps14: recentKeys.length };

  const session = { today, done: days.includes(today), streak: st.current, maxStreak: st.max, total: days.length };
  return { xp, level, next, badges, newBadges, unlocks, session, sessionDays: days, hours: Math.round(hours * 10) / 10, forecast, pace };
}

/** Marks today's session complete the first time its conditions are met. Returns true only on that first time. */
export async function markSessionIfComplete() {
  const r = await q(`SELECT (SELECT COALESCE(SUM(active_ms),0) FROM events WHERE (started_at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date)::bigint AS ms,
    (SELECT COUNT(*) FROM completions WHERE (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date)::int AS steps,
    (SELECT COUNT(*) FROM journal WHERE kind='session' AND (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date)::int AS marked`);
  const { ms, steps, marked } = r[0];
  if (Number(marked) > 0 || Number(steps) < 1) return false;
  // 5 Nov 2026: the room clock misses the warm-up and everything outside the tab; the session day (computeRewards)
  // already uses clock OR presence, so the cheer must too - otherwise 15 min warm-up + a 12-min step never cheers.
  // 8 Nov 2026 (audit N6): workedByDay(1) holds two days in no fixed order - read today's Dhaka date, not the first key.
  const todayKey = localYmd();
  const today = (await workedByDay(1))[todayKey] || 0;
  if (Math.max(Number(ms), today) < 25 * 60 * 1000) return false;
  const ins = await q(`INSERT INTO journal (kind, title) SELECT 'session', 'Session complete'
    WHERE NOT EXISTS (SELECT 1 FROM journal WHERE kind='session' AND (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date) RETURNING id`);
  return ins.length > 0;
}
