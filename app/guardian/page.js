import { isGuardian } from "../../lib/auth";
import { q } from "../../lib/db";
import { localYmd, localWeekday } from "../../lib/time";
import { logError } from "../../lib/guard";
import { getProgress, allModules } from "../../lib/curriculum";
import { workedByDay, clockByDay, stepMinutes } from "../../lib/presence";
import { computeRewards } from "../../lib/rewards";
import { fmtDateTime } from "../../lib/time";
import { activeMeeting } from "../../lib/meet";
import { tutorModel } from "../../lib/calendar";
import { callCost, projectMonth, SPEND_LIMIT } from "../../lib/cost";
import { moodCounts } from "../../lib/signals";
import { checkSummary } from "../../lib/checks";
import { VOICE_FIELDS } from "../../lib/voice";
import { renderNotes, preparedSummary, parseProfile, AHEAD_LIMIT } from "../../lib/knowledge";
import { packSteps, PACK_STEPS } from "../../lib/offline";
import { wpmTarget, mathTarget } from "../../lib/mathdrill";
import { AGREEMENT_VERSION } from "../../lib/agreement";
import { retention } from "../../lib/review";
import { mathsBlock } from "../../lib/mathsBlock";
import { MinuteBars, StreakCalendar } from "../../components/Viz";

export const dynamic = "force-dynamic";

const mins = (ms) => `${Math.round(Number(ms || 0) / 60000)} min`;

/** 14 Oct 2026: the dashboard degrades, it never dies. One bug in a section used to throw the whole page into
 *  app/error.js (a digest and nothing else) - for a whole morning. Now the real error is logged with its message
 *  (errors table, where_='guardian:render', not "seen by her") and Abid gets a reduced page that still says what broke. */
export default async function Guardian() {
  try {
    return await GuardianInner();
  } catch (e) {
    await logError("guardian:render", e, false);
    const msg = `${e?.name || "Error"}: ${String(e?.message || e).slice(0, 300)}`;
    return (
      <main className="wrap dash">
        <h1>Guardian</h1>
        <div className="card amber" style={{ marginTop: 12 }}>
          <div className="eyebrow" style={{ color: "var(--amber)" }}>the dashboard hit a bug - the school itself is not affected</div>
          <p style={{ margin: "8px 0" }}>Faiza's pages and the tutor run on separate code; this is only the guardian view. The error is recorded for Claude:</p>
          <pre className="mono small" style={{ whiteSpace: "pre-wrap", margin: "8px 0" }}>{msg}</pre>
          <p className="small soft" style={{ margin: 0 }}>Paste that line to Claude. Reload to try again; the export and sign-out below still work.</p>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <form method="post" action="/api/guardian"><input type="hidden" name="action" value="export" /><button className="btn quiet">Download backup</button></form>
          <form method="post" action="/api/guardian"><input type="hidden" name="action" value="logout" /><button className="btn quiet">Sign out</button></form>
        </div>
      </main>
    );
  }
}

async function GuardianInner() {
  if (!(await isGuardian())) {
    const totp = !!process.env.GUARDIAN_TOTP_SECRET;
    return (
      <main className="wrap dash">
        <h1>Guardian</h1>
        <form method="post" action="/api/guardian" autoComplete="off">
          <input type="hidden" name="action" value="login" />
          <input className="big-input" type="password" name="password" placeholder="Password" autoFocus autoComplete="current-password" />
          {totp && <input className="big-input" style={{ marginTop: 10 }} inputMode="numeric" pattern="[0-9]*" maxLength={6} name="code" placeholder="6-digit code from your authenticator" autoComplete="one-time-code" />}
          <div style={{ marginTop: 12 }}><button className="btn">Open</button></div>
        </form>
        {!totp && <p className="small soft" style={{ marginTop: 16 }}>Two-factor is off. Set GUARDIAN_TOTP_SECRET in Vercel to require a code here.</p>}
      </main>
    );
  }

  const [progress, week, byStep, teach, flags, notes, today, calls, auditRows, chats, answers, typing, journal] = await Promise.all([
    getProgress(),
    q(`SELECT (started_at AT TIME ZONE 'Asia/Dhaka')::date AS d, SUM(active_ms) AS ms, COUNT(*) AS n
       FROM events WHERE started_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1 DESC`),
    q(`SELECT module_id, step_id, kind, SUM(LEAST(active_ms, 3600000)) AS ms, SUM(CASE WHEN kind='practice' THEN attempts WHEN payload->>'partial' = 'true' THEN 0 ELSE 1 END) AS attempts, MAX(score) AS score, BOOL_OR(passed) AS passed, MIN(started_at) AS first, MAX(started_at) AS started_at
       FROM events GROUP BY 1,2,3 ORDER BY MIN(started_at) DESC LIMIT 40`),
    q(`SELECT module_id, step_id, payload->>'text' AS text, score, started_at FROM events WHERE kind='teach' ORDER BY id DESC LIMIT 10`),
    q(`SELECT * FROM notes WHERE flagged ORDER BY id DESC`),
    q(`SELECT * FROM notes WHERE created_at > now() - interval '8 days' OR id IN (SELECT id FROM notes ORDER BY id DESC LIMIT 8) ORDER BY id DESC LIMIT 80`), // 29 Oct 2026: parks and their RESOLVED notes need a week of notes, not the last 8
    q(`SELECT payload->'wrong' AS wrong, step_id, score FROM events WHERE kind IN ('check','diagnostic') ORDER BY id DESC LIMIT 6`),
    q(`SELECT COUNT(*) FILTER (WHERE at > now() - interval '24 hours')::int AS day, COUNT(*) FILTER (WHERE at > now() - interval '30 days')::int AS month,
              COALESCE(SUM(input_tokens) FILTER (WHERE at > now() - interval '30 days'),0)::bigint AS tin, COALESCE(SUM(output_tokens) FILTER (WHERE at > now() - interval '30 days'),0)::bigint AS tout FROM calls`),
    q(`SELECT actor, action, detail, ip, at FROM audit ORDER BY id DESC LIMIT 25`),
    q(`SELECT module_id, step_id, ctx, role, content, at FROM chats WHERE at > now() - interval '7 days' ORDER BY id DESC LIMIT 120`),
    q(`SELECT step_id, skill, question, given, ok, at FROM answers WHERE at > now() - interval '7 days' ORDER BY id DESC LIMIT 150`),
    q(`SELECT day, done, accuracy, site, drill_done, drill_accuracy, drill_wpm, shortcut_done, shortcut_id, at FROM typing ORDER BY day DESC LIMIT 30`),
    q(`SELECT module_id, step_id, kind, title, body, at FROM journal ORDER BY id DESC LIMIT 60`),
  ]);
  const [recentChecks, recentDone, dhaka] = await Promise.all([
    q(`SELECT step_id, score, passed, started_at FROM events WHERE kind='check' AND started_at > now() - interval '7 days' ORDER BY id DESC`),
    q(`SELECT key, at FROM completions WHERE at > now() - interval '7 days' AND key NOT LIKE '%:%' ORDER BY at DESC`),
    q(`SELECT to_char((now() AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS today, to_char(now() AT TIME ZONE 'Asia/Dhaka', 'HH24:MI') AS clock`),
  ]);
  const rw = await computeRewards().catch(() => null);
  // ---- Fix day, 29 Oct 2026: money in dollars, unverified closes, her own voice, how she is, first-try scores.
  const [costDays, unverRows, voiceRows, herLines, checkRows, ungradedRows] = await Promise.all([
    q(`SELECT to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS d, COALESCE(SUM(usd),0)::float AS usd, COUNT(*) FILTER (WHERE ok = false)::int AS failed,
              COALESCE(SUM(input_tokens) FILTER (WHERE usd IS NULL),0)::bigint AS tin, COALESCE(SUM(output_tokens) FILTER (WHERE usd IS NULL),0)::bigint AS tout
       FROM calls WHERE at > date_trunc('month', now()) - interval '8 days' GROUP BY 1`).catch(() => []),
    q(`SELECT step_id, module_id, title, why, at, asked_at, answer, answered_at FROM unverified ORDER BY at DESC LIMIT 20`).catch(() => []),
    q(`SELECT at, ${VOICE_FIELDS.join(", ")} FROM voice ORDER BY id DESC LIMIT 6`).catch(() => []),
    q(`SELECT content, at FROM chats WHERE role='student' AND ctx IN ('lesson','fix','help') AND at > now() - interval '14 days'`).catch(() => []),
    q(`SELECT step_id, score, passed FROM events WHERE kind='check' ORDER BY id`).catch(() => []),
    q(`SELECT step_id, payload->>'text' AS text, started_at FROM events e WHERE kind='teach_ungraded' AND started_at > now() - interval '14 days'
       AND NOT EXISTS (SELECT 1 FROM completions c WHERE c.key = e.step_id) ORDER BY id DESC LIMIT 5`).catch(() => []),
  ]);
  // Dollars: rows priced at insert (usd); older rows (before 29 Oct) estimated from their tokens with the model of that day.
  const usdBy = {};
  for (const r of costDays) usdBy[r.d] = Number(r.usd) + (Number(r.tin) || Number(r.tout) ? callCost(tutorModel(new Date(r.d + "T06:00:00Z").getTime()), { input_tokens: Number(r.tin), output_tokens: Number(r.tout) }) : 0);
  const utcToday = new Date().toISOString().slice(0, 10);
  const money = projectMonth(usdBy, utcToday, SPEND_LIMIT);
  const failedCalls = costDays.filter((r) => r.d.slice(0, 7) === utcToday.slice(0, 7)).reduce((a, r) => a + Number(r.failed || 0), 0);
  const nowMs = Date.now();
  const weekLines = herLines.filter((r) => nowMs - new Date(r.at).getTime() <= 7 * 86400000).map((r) => r.content);
  const lastWeekLines = herLines.filter((r) => nowMs - new Date(r.at).getTime() > 7 * 86400000).map((r) => r.content);
  const moodNow = moodCounts(weekLines), moodBefore = moodCounts(lastWeekLines);
  const checksSum = checkSummary(checkRows);
  const latestVoice = voiceRows[0] || null;
  const doneWeek = recentDone; // completions in the last 7 days (steps only)
  const cans = await q("SELECT title, at FROM journal WHERE kind='can' AND at > now() - interval '7 days' ORDER BY id DESC LIMIT 6").catch(() => []);
  const errRows = await q(`SELECT at, where_, message, seen_by_her FROM errors WHERE at > now() - interval '7 days' ORDER BY id DESC LIMIT 40`).catch(() => []);
  const passedKeys = new Set(recentDone.map((r) => r.key));
  const meetState = await activeMeeting(rw).catch(() => null);
  const c = calls[0] || {};
  const cap = Number(process.env.MAX_TUTOR_CALLS_PER_DAY || 300);
  const cur = progress.find((p) => p.status === "current");
  const curMod = cur ? allModules().find((m) => m.id === cur.id) : null;
  const weekday = localWeekday(); // student zone: 0 Sun .. 6 Sat
  const callDay = weekday === 4 || weekday === 5 || weekday === 6;

  /* ---------- The brief (Abid, 4 Oct 2026): what happened, where she is, what he must do, what is wrong. ---------- */
  const todayYmd = dhaka[0]?.today, clock = dhaka[0]?.clock;
  const ymd = (d) => localYmd(new Date(d).getTime());
  // 14 Oct 2026: this line MUST sit below ymd/todayYmd. It used to sit above them; .filter() only runs its callback when
  // the errors table has rows, so the page worked until the first logged error of the week, then threw a ReferenceError
  // (temporal dead zone) on every render - the guardian page was down the whole morning the API spend cap was hit.
  const errToday = errRows.filter((e) => ymd(e.at) === todayYmd);
  // Minutes = max(room clock, server presence) per day (lib/presence.js, 10 Oct 2026); the table below shows both.
  const [worked14, clock14] = await Promise.all([workedByDay(14).catch(() => ({})), clockByDay(14).catch(() => ({}))]);
  const minsBy = Object.fromEntries(Object.entries(worked14).map(([d, ms]) => [d, Math.round(ms / 60000)]));
  for (const r of week) { const k = ymd(r.d); if (minsBy[k] == null) minsBy[k] = Math.round(Number(r.ms) / 60000); }
  const dayList = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(new Date(todayYmd + "T00:00:00Z").getTime() - i * 86400000).toISOString().slice(0, 10); dayList.push({ day: d, minutes: minsBy[d] || 0 }); }
  const todayMin = minsBy[todayYmd] || 0;
  const lastActive = [...dayList].reverse().find((d) => d.minutes > 0);
  const daysSince = lastActive ? Math.round((new Date(todayYmd + "T00:00:00Z") - new Date(lastActive.day + "T00:00:00Z")) / 86400000) : null;
  const doneToday = recentDone.filter((r) => ymd(r.at) === todayYmd);
  const doneLast = lastActive ? recentDone.filter((r) => ymd(r.at) === lastActive.day) : [];
  const typingToday = typing.find((t) => ymd(t.day) === todayYmd);
  const fmtDay = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const stepTitle = (key) => { for (const m of allModules()) { const st = m.steps.find((x) => x.id === key); if (st) return `${st.title} (${st.kind})`; } return key; };

  // To-do: everything that needs Abid's hands, most urgent first.
  const todo = [];
  if (rw) {
    for (const u of rw.unlocks.filter((u) => u.claimed && !u.delivered)) todo.push({ lvl: "now", text: `She claimed "${u.reward}" - deliver it, then mark it delivered in rewards.json.` });
    for (const u of rw.unlocks.filter((u) => u.reached && !u.claimed)) todo.push({ lvl: "now", text: `"${u.reward}" is unlocked but she has not pressed Claim - mention it on the call${u.id === "u-level2" ? ", and pick a time for the teaching call" : ""}.` });
    for (const f of rw.forecast.filter((f) => f.arrangeNow && !f.reached && !f.claimed)) todo.push({ lvl: "soon", text: `Arrange "${f.reward}" - estimated ${f.etaDate ? fmtDay(f.etaDate) : "soon"}${f.cost ? ` · ${f.cost}` : ""}${f.note ? ` · ${f.note}` : ""}.` });
  }
  if (meetState) {
    if (meetState.stage === "ready") todo.push({ lvl: "now", text: `Faiza is prepared for the call with ${meetState.meeting.callName}: introduction and three questions are in her logbook. Book the call (video, 20 min, you on it too), and send ${meetState.meeting.callName} the short brief about her level.` });
    else if (meetState.stage !== "done") todo.push({ lvl: "soon", text: `Level 5 is reached: she is preparing for ${meetState.meeting.callName} (part: ${meetState.stage}). Do not book the call until the map shows "ready".` });
  }
  if ((cur?.id === "LX2" && cur.step_index >= 6) || (cur?.id === "CS1C" && cur.step_index <= 1)) todo.push({ lvl: "now", text: "CS1C-A1 (her own e-mail, Proton) and A2 (Bitwarden) are next: both services are 13+ and she turned 13 on 22 Oct, so they are open to her now; M5 comes first, then CS1C. Proton may ask for a verification e-mail or phone - be reachable; your e-mail is her recovery address." });
  if (cur?.id === "CS1C" && cur.step_index <= 7) todo.push({ lvl: "soon", text: "CS1C-A3 (master password protocol): a parent needs to receive and keep her sealed envelope (master password, e-mail passphrase, Bitwarden recovery code, the disk and login passphrases from LX1 - all on one card)." });
  if ((cur?.id === "CS1B" && cur.step_index >= 9) || ["CS2A", "LX1"].includes(cur?.id)) todo.push({ lvl: "now", text: "The Linux install (LX1) starts the moment CS2A is passed (Abid, 15 Oct 2026: finish the Python module first; at vacation pace that is about 17-18 Oct). The SSD is delivered. On the day: the School open on her iPad while the laptop is the patient (LX1-L1 does the move), and you reachable by phone for LX1-L5 (boot menu) and LX1-L6 (the erase-and-encrypt moment) - about 45 minutes of your time, not the whole day." });
  // 29 Oct 2026 (D): CS3-L6 (OverTheWire Bandit, her first outside practice site) parks until Abid says yes.
  if (cur?.id === "CS3" && cur.step_index >= 8) todo.push({ lvl: "soon", text: "CS3-L6 is close: OverTheWire Bandit (her first outside practice site, sanctioned) - tell her yes or not yet; the step parks until you do." });
  if (cur?.id === "CS1D" && cur.step_index <= 5) todo.push({ lvl: "soon", text: "CS1D-L5 proves her laptop's firewall from the iPad: the iPad must be on the same home Wi-Fi as the laptop that day (not mobile data, not a guest network)." });
  // Hardening ritual (Abid, 16 Oct 2026; 29 Oct: once CS1D is passed she owns check.sh); the first Friday of each month, ask for the green check.
  if (progress.some((p) => p.id === "CS1D" && p.status === "passed") && Number(localYmd().slice(8, 10)) <= 7) todo.push({ lvl: "soon", text: `First week of the month: ask her for the green "./check.sh" report (~/school/tools/check.sh) from her laptop${progress.some((p) => p.id === "DEF1" && p.status === "passed") ? " AND the Pi (--profile server)" : ""} - a red line is a lesson, not a failure. (CS1D-L7 / DEF1-S4.)` });
  for (const n of notes.filter((x) => String(x.body).startsWith("BUDGET PAUSED")).filter((x) => new Date(x.created_at) > new Date(Date.now() - 86400000)).slice(0, 1)) todo.push({ lvl: "now", text: `THE TUTOR IS PAUSED - she cannot get an answer. ${String(n.body).replace(/^BUDGET PAUSED: /, "")}` });
  if (flags.length) todo.push({ lvl: "now", text: `Read the ${flags.length} flag${flags.length > 1 ? "s" : ""} below and talk to her today.` });
  for (const n of notes.filter((x) => x.author === "tutor" && String(x.body).startsWith("CURIOUS:")).slice(0, 3)) todo.push({ lvl: "soon", text: `${String(n.body).replace(/^CURIOUS: /, "She asked about ")} (${new Date(n.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })})` });

  // 23 Oct 2026: a park whose step has since been finished is resolved - it stays in the notes, not in the to-do list.
  // 28 Oct 2026: BUT a step closed ON the park (the time box ends the step within minutes of the [PARKED] line - the
  // Proton sign-in on CS1C-A1/A1B) is not resolved at all; that hid the one to-do that blocked her next step. A park is
  // resolved only when the step was finished more than 20 minutes AFTER the park (she came back and got it working).
  const doneAt = {}; for (const r of recentDone) doneAt[r.key] = Math.max(doneAt[r.key] || 0, new Date(r.at).getTime());
  const parkedStep = (body) => (String(body).match(/^PARKED on \S+ (\S+)/) || [])[1];
  // 29 Oct 2026: or the tutor saw it working and wrote [RESOLVED: step] (a note "RESOLVED <step> ...") after the park.
  // 10 Nov 2026: Abid can close a park himself ("Mark fixed" below) - a guardian RESOLVED note counts like the tutor's.
  const resolvedNote = (n) => notes.some((x) => (x.author === "tutor" || x.author === "guardian") && String(x.body).startsWith(`RESOLVED ${parkedStep(n.body)} `) && new Date(x.created_at) > new Date(n.created_at));
  const resolved = (n) => { const t = doneAt[parkedStep(n.body)]; return resolvedNote(n) || (!!t && t - new Date(n.created_at).getTime() > 20 * 60000); };
  const parks = notes.filter((x) => x.author === "tutor" && String(x.body).startsWith("PARKED")).filter((x) => new Date(x.created_at) > new Date(Date.now() - 7 * 86400000)).filter((x) => !resolved(x)).slice(0, 3);
  if (latestVoice && nowMs - new Date(latestVoice.at).getTime() < 7 * 86400000) todo.push({ lvl: "now", text: `She wrote new answers on the What do you want? page (${new Date(latestVoice.at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}) - read "In her words" below; any change to her path is yours to make.` });
  for (const u of ungradedRows) todo.push({ lvl: "now", text: `A teach-back on ${u.step_id} could not be marked by the grader (twice) - read it below under "Teach-it-back" and decide; it did not pass and did not count as a try.` });
  const unverOpen = unverRows.filter((u) => !u.answer);
  if (unverOpen.length) todo.push({ lvl: "soon", text: `${unverOpen.length} step${unverOpen.length > 1 ? "s were" : " was"} closed by the clock or the message count, not by her own words (${unverOpen.slice(0, 4).map((u) => u.step_id).join(", ")}). The tutor asks one recall question about each at her next session; see "Closed without her own words" below.` });
  for (const n of parks) todo.push({ lvl: "now", text: `PARKED, still open - the tutor could not get this working and the next steps may depend on it: ${String(n.body).replace(/^PARKED on /, "")} - fix it with her on a call, or tell me (${new Date(n.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}).` });

  // OUTPUTS (Abid, 12 Oct 2026, curriculum/MILESTONES.md): what she has produced, this week and in all. Minutes are inputs.
  const [outAll] = await q(`SELECT
      (SELECT COUNT(DISTINCT c.key) FROM completions c JOIN events e ON e.step_id = c.key AND e.kind = 'code')::int AS code_steps,
      (SELECT COUNT(*) FROM typing WHERE code_done AND NOT code_waived)::int AS code_lines,
      (SELECT COUNT(*) FROM completions WHERE module_id IN ('LX1','LX2','CS1C','CS1D','CS3','CS4') AND key NOT LIKE '%:%')::int AS linux_steps,
      (SELECT COUNT(*) FROM journal WHERE kind = 'can')::int AS cans,
      (SELECT COUNT(*) FROM journal WHERE kind = 'flag')::int AS flags`).catch(() => [{}]);
  const [outWeek] = await q(`SELECT
      (SELECT COUNT(DISTINCT c.key) FROM completions c JOIN events e ON e.step_id = c.key AND e.kind = 'code' WHERE c.at > now() - interval '7 days')::int AS code_steps,
      (SELECT COUNT(*) FROM typing WHERE code_done AND NOT code_waived AND day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 7)::int AS code_lines,
      (SELECT COUNT(*) FROM completions WHERE module_id IN ('LX1','LX2','CS1C','CS1D','CS3','CS4') AND key NOT LIKE '%:%' AND at > now() - interval '7 days')::int AS linux_steps,
      (SELECT COUNT(*) FROM journal WHERE kind = 'can' AND at > now() - interval '7 days')::int AS cans,
      (SELECT COUNT(*) FROM journal WHERE kind = 'flag' AND at > now() - interval '7 days')::int AS flags`).catch(() => [{}]);
  const outputs = [
    ["programs written", (outWeek?.code_steps || 0) + (outWeek?.code_lines || 0), (outAll?.code_steps || 0) + (outAll?.code_lines || 0)],
    ["Linux / terminal steps", outWeek?.linux_steps || 0, outAll?.linux_steps || 0],
    ["flags captured", outWeek?.flags || 0, outAll?.flags || 0],
    ["\"I can now\" lines", outWeek?.cans || 0, outAll?.cans || 0],
  ];

  // Issues: things going wrong, computed from the records.
  const issues = [];
  if (cur && ["CS2A", "M5", "CS2B", "LV1", "LV2"].includes(cur.id) && (outWeek?.code_steps || 0) + (outWeek?.code_lines || 0) === 0 && todayMin > 0) issues.push({ lvl: "amber", text: "No program written this week while she is in a coding module - minutes without output. Look at what the time went to." });
  // The step she is on right now, live (12 Oct 2026): the tutor's time box starts at 40 minutes.
  const curStepId = curMod?.steps[cur?.step_index]?.id;
  const curStepMin = curStepId ? await stepMinutes(curStepId).catch(() => 0) : 0;
  if (curStepMin >= 40) issues.push({ lvl: "amber", text: `She has been on ${curStepId} for ${curStepMin} minutes (the limit is 40). The tutor is now told to land it and park whatever on the screen is not working.` });
  for (const f of flags) issues.push({ lvl: "red", text: `Flag raised by the tutor: ${String(f.body).slice(0, 160)}` });
  // 28 Oct 2026: an unresolved park is an issue, not only a to-do - "Nothing wrong" was shown while her next step was blocked.
  for (const n of parks) issues.push({ lvl: "red", text: `Open park: ${String(n.body).replace(/^PARKED on /, "").slice(0, 200)}` });
  if (daysSince != null && daysSince >= 3) issues.push({ lvl: "amber", text: `No work for ${daysSince} days (last: ${fmtDay(lastActive.day)}).` });
  if (rw && rw.session.streak === 0 && rw.session.maxStreak >= 3) issues.push({ lvl: "amber", text: `Streak is at 0 (best ${rw.session.maxStreak}). A session = 25 worked minutes + one finished step (or 50 minutes); one missed day a week is free.` });
  const failed = recentChecks.filter((c) => !c.passed && !passedKeys.has(c.step_id)); // once passed, the earlier misses are history, not an issue
  if (failed.length) issues.push({ lvl: "amber", text: `${failed.length} checkpoint attempt${failed.length > 1 ? "s" : ""} under 80% this week (${[...new Set(failed.map((c) => c.step_id))].join(", ")}) - see what she got wrong below.` });
  // 29 Oct 2026: the warm-up is optional - not doing it is not an issue any more.
  if (money.over) issues.push({ lvl: "red", text: `API spend: $${money.mtd.toFixed(2)} so far this month, heading for about $${money.projected.toFixed(0)} - over your $${SPEND_LIMIT} console limit${money.hitDate ? `, which it would reach around ${fmtDay(money.hitDate)}` : ""}. When it is reached the tutor stops until the 1st. Options: raise the limit, a dated Sonnet entry in calendar.json, or shorter days.` });
  if (moodNow.caps + moodNow.confused >= 6 && moodNow.caps + moodNow.confused > moodBefore.caps + moodBefore.confused) issues.push({ lvl: "amber", text: `How she is: more frustrated or confused lines this week (${moodNow.caps} all-caps, ${moodNow.confused} confused, ${moodNow.idk} "I don't know") than last week. Answer it with a call, not a new rule.` });
  const slow = byStep.filter((r) => Number(r.ms) > 45 * 60000 && r.kind !== "practice" && r.started_at && new Date(r.started_at) > new Date(Date.now() - 7 * 86400000));
  if (slow.length) issues.push({ lvl: "info", text: `Steps this week that took over 45 minutes: ${slow.slice(0, 4).map((r) => `${r.step_id} (${mins(r.ms)})`).join(", ")} - a step should fit in 25.` });
  if (errToday.length) issues.push({ lvl: errToday.some((e) => e.seen_by_her) ? "red" : "amber", text: `${errToday.length} error${errToday.length > 1 ? "s" : ""} today on the school's side${errToday.some((e) => e.seen_by_her) ? " that she saw" : ""} (${[...new Set(errToday.map((e) => e.where_))].join(", ")}) - details below. Not her fault; tell her so if she mentions it.` });
  if (Number(c.day) > cap * 0.7) issues.push({ lvl: "amber", text: `Tutor calls today: ${c.day} of the ${cap} ceiling.` });
  if (Number(c.month) > 0 && Number(c.tout) / Math.max(1, Number(c.month)) > 1200) issues.push({ lvl: "info", text: "Tutor replies are long on average this month (drawings are tokens) - watch the cost line." });

  // THE TUTOR'S KNOWLEDGE BASE (30 Oct 2026, lib/knowledge.js). Below every helper it uses (fmtDay, stepTitle, cur).
  const [kbRows, kbProfileRows, kbLog] = await Promise.all([
    q("SELECT step_id, module_id, notes, model, created_at, chars FROM teacher_notes ORDER BY created_at DESC").catch(() => []),
    q("SELECT value FROM settings WHERE key='learner_profile'").catch(() => []),
    q("SELECT action, detail, at FROM audit WHERE action IN ('prepare','prepare_redo','profile') ORDER BY id DESC LIMIT 3").catch(() => []),
  ]);
  const kbPrepared = new Set(kbRows.map((r) => r.step_id));
  const kbSum = cur ? preparedSummary(allModules(), { module_id: cur.id, step_index: cur.step_index }, kbPrepared) : null;
  const kbProfile = kbProfileRows[0] ? parseProfile(kbProfileRows[0].value) : null;
  const kbProfileDays = kbProfile?.updated_at ? Math.floor((nowMs - new Date(kbProfile.updated_at).getTime()) / 86400000) : null;
  const kbOrder = Object.fromEntries(allModules().flatMap((m) => m.steps.map((st) => st.id)).map((id, i) => [id, i]));
  const kbList = [...kbRows].sort((a, b) => (kbOrder[a.step_id] ?? 1e9) - (kbOrder[b.step_id] ?? 1e9));
  // THE OFFLINE PACK (2 Nov 2026, lib/offline.js): worksheets ready ahead of her, and what she brought back.
  const [offSheets, offWork, offDays, offDl, offLog] = await Promise.all([
    q("SELECT step_id FROM offline_sheets").catch(() => []),
    q("SELECT step_id, work, done, imported_at, reviewed_at FROM offline_work ORDER BY imported_at DESC LIMIT 20").catch(() => []),
    q("SELECT to_char(day, 'YYYY-MM-DD') AS day, minutes FROM offline_days ORDER BY day DESC LIMIT 14").catch(() => []),
    q("SELECT value FROM settings WHERE key='offline_downloaded_at'").catch(() => []),
    q("SELECT detail, at FROM audit WHERE action='offline_prepare' ORDER BY id DESC LIMIT 2").catch(() => []),
  ]);
  const offHave = new Set(offSheets.map((r) => r.step_id));
  const offWant = cur ? packSteps(allModules(), { module_id: cur.id, step_index: cur.step_index }, PACK_STEPS) : [];
  const offReady = offWant.filter((x) => offHave.has(x.s.id)).length;
  // THE SCHOOL DAY (3 Nov 2026, lib/day.js + lib/mathdrill.js): start/end, desk check, movement breaks, speed targets.
  const [sdRows, agreeRows, vidVotes, ret] = await Promise.all([
    q(`SELECT to_char(x.day, 'YYYY-MM-DD') AS day, d.started_at, d.ended_at, d.desk, d.moves, t.drill_wpm, t.math_score, t.math_seconds
       FROM (SELECT day FROM school_day UNION SELECT day FROM typing WHERE math_done OR drill_done) x
       LEFT JOIN school_day d ON d.day = x.day LEFT JOIN typing t ON t.day = x.day
       WHERE x.day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 14 ORDER BY x.day DESC`).catch(() => []),
    q("SELECT version, her_words, at FROM agreement ORDER BY id DESC LIMIT 1").catch(() => []),
    q("SELECT step_id, url, vote, at FROM video_votes ORDER BY at DESC LIMIT 60").catch(() => []),
    retention().catch(() => null), // the practice spine (9 Nov 2026)
  ]);
  // THE MATHS BLOCK (25 Nov 2026, lib/mathsBlock.js): fluency, retention of maths skills, stretch problems, paper, puzzles.
  const mathsToday = (await q("SELECT ((now() AT TIME ZONE 'Asia/Dhaka')::date)::text AS d").catch(() => [{ d: localYmd() }]))[0].d;
  const [mTyping, mSkills, mAnswers, mStretch, mUnver, mPaper, mPuzzles] = await Promise.all([
    q("SELECT to_char(day,'YYYY-MM-DD') AS day, math_done, math_score, math_seconds, math_hit FROM typing WHERE day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 14 ORDER BY day DESC").catch(() => []),
    q("SELECT skill, module_id, hits, misses, stage FROM skills WHERE module_id ~ '^M[0-9]' AND module_id NOT IN ('M1','M2')").catch(() => []),
    q("SELECT ok, at FROM answers WHERE step_id LIKE 'review%' AND module_id ~ '^M[0-9]' AND module_id NOT IN ('M1','M2') AND at > now() - interval '30 days'").catch(() => []),
    q("SELECT step_id, started_at, active_ms, attempts FROM events WHERE kind='lesson' AND step_id ~ '^M[0-9]+[A-Z]?-S1$' ORDER BY started_at DESC LIMIT 40").catch(() => []),
    q("SELECT step_id FROM unverified WHERE step_id ~ '^M[0-9]+[A-Z]?-S1$'").then((r) => r.map((x) => x.step_id)).catch(() => []),
    q("SELECT to_char(day,'YYYY-MM-DD') AS day, pages, right_n, wrong_n, answer, method_ok, question, verdict FROM paper WHERE day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 14 ORDER BY id DESC").catch(() => []),
    q("SELECT to_char(day,'YYYY-MM-DD') AS day, level, score, total, reason_ok, results, done FROM puzzles WHERE done ORDER BY day DESC LIMIT 12").catch(() => []),
  ]);
  const maths = mathsBlock({ today: mathsToday, typingRows: mTyping, skillRows: mSkills, answerRows: mAnswers, stretchRows: mStretch, unverified: mUnver, paperRows: mPaper, puzzleRows: mPuzzles });
  // Her verdict on step videos (5 Nov 2026): "long" or "off" twice is a cut; the title comes from the curriculum.
  const vidTitle = (stepId, url) => { const st = allModules().flatMap((m) => m.steps).find((x) => x.id === stepId); return (st?.media || []).find((md) => md.url === url)?.title || url.replace(/^.*\//, "video "); };
  const vidBad = vidVotes.filter((v) => v.vote !== "useful");
  if (vidBad.length) todo.push({ lvl: "info", text: `Faiza marked ${vidBad.length} video${vidBad.length === 1 ? "" : "s"} as too long or not about the lesson - see STEP VIDEOS below and tell Claude which to remove.` });
  const sdHist = sdRows.map((r) => ({ ymd: r.day, drill_wpm: r.drill_wpm, math_score: r.math_score, math_seconds: r.math_seconds }));
  const offParse = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v || {}; } catch { return {}; } };
  if (kbSum && kbSum.next && kbSum.run < 3) todo.push({ lvl: "soon", text: `The tutor has notes for only ${kbSum.run} of her next lesson/code steps - press "Prepare the next 4 steps" under THE TUTOR'S KNOWLEDGE BASE.` });

  const pill = (lvl) => ({ now: "var(--rose)", soon: "var(--amber)", red: "var(--rose)", amber: "var(--amber)", info: "var(--cyan)" }[lvl]);
  const Row = ({ lvl, text }) => <li style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 10, alignItems: "start", margin: "6px 0" }}><span style={{ width: 10, height: 10, borderRadius: 5, background: pill(lvl), marginTop: 7, display: "block" }} /><span>{text}</span></li>;

  return (
    <main className="wrap dash">
      <header style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Guardian</h1>
        <span className="small mute">{todayYmd ? `${fmtDay(todayYmd)} · ${clock} in Dhaka` : ""}</span>
        <span style={{ marginLeft: "auto" }} />
        <form method="post" action="/api/guardian" style={{ display: "inline-block" }}><input type="hidden" name="action" value="export" /><button className="btn quiet">Download backup</button></form>
        <form method="post" action="/api/guardian" style={{ display: "inline-block" }}><input type="hidden" name="action" value="logout" /><button className="btn quiet">Sign out</button></form>
      </header>

      {/* ---- 1. What happened ---- */}
      <section className="grid three">
        <div className="card">
          <div className="eyebrow">today</div>
          {todayMin > 0 ? <>
            <div style={{ fontSize: 28, fontFamily: "var(--display)", fontWeight: 700 }}>{todayMin} min</div>
            <div className="small soft">{doneToday.length} step{doneToday.length === 1 ? "" : "s"} finished{rw?.session?.done ? " · session complete ✓" : todayMin < 25 ? " · under the 25-min session bar" : " · no finished step yet"}</div>
            <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{doneToday.slice(0, 6).map((r) => <li key={r.key}>{r.key} · {stepTitle(r.key)}</li>)}</ul>
            <div className="small soft" style={{ marginTop: 6 }}>Warm-up (optional): {typingToday ? `keybr ${typingToday.done ? "done" : "—"} · line ${typingToday.drill_done ? Number(typingToday.drill_accuracy) + "%" : "not yet"}` : "not done"}</div>
          </> : <>
            <div style={{ fontSize: 28, fontFamily: "var(--display)", fontWeight: 700 }}>Not on yet</div>
            <div className="small soft">{lastActive ? `Last worked ${fmtDay(lastActive.day)}: ${lastActive.minutes} min, ${doneLast.length} step${doneLast.length === 1 ? "" : "s"}.` : "No work recorded yet."}</div>
            {doneLast.length > 0 && <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{doneLast.slice(0, 5).map((r) => <li key={r.key}>{r.key} · {stepTitle(r.key)}</li>)}</ul>}
          </>}
        </div>
        <div className="card">
          <div className="eyebrow">where she is</div>
          {cur ? <>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{cur.id} · {cur.title}</div>
            <div className="steps">{allModules().find((m) => m.id === cur.id)?.steps.map((st, i) => <i key={st.id} className={i < cur.step_index ? "done" : i === cur.step_index ? "now" : ""} title={st.title} />)}</div>
            <div className="small soft">Step {cur.step_index + 1} of {allModules().find((m) => m.id === cur.id)?.steps.length}: <b style={{ color: "var(--ink)" }}>{allModules().find((m) => m.id === cur.id)?.steps[cur.step_index]?.title}</b>{cur.remediation ? ` · fixing: ${cur.remediation.join(", ")}` : ""}</div>
            {rw && <div className="small soft" style={{ marginTop: 8 }}>Level {rw.level.n} {rw.level.name} · {rw.xp} XP · streak {rw.session.streak} (best {rw.session.maxStreak}) · {rw.session.total} sessions · {rw.badges.filter((b) => b.at).length}/{rw.badges.length} badges</div>}
          </> : <div className="soft">No current module.</div>}
        </div>
        <div className="card">
          <div className="eyebrow" style={{ color: "var(--violet)" }}>outputs · this week / in all</div>
          <div className="small soft" style={{ marginBottom: 6 }}>The things that must grow (curriculum/MILESTONES.md). Minutes and streaks are inputs; these are what the three years are for.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {outputs.map(([k, w, a]) => <div key={k}><div style={{ fontSize: 22, fontWeight: 700 }}>{w} <span className="small soft">/ {a}</span></div><div className="small soft">{k}</div></div>)}
          </div>
        </div>
        <div className="card" style={{ borderColor: todo.length ? "rgba(251, 191, 36, 0.5)" : undefined }}>
          <div className="eyebrow" style={{ color: "var(--amber)" }}>your next steps</div>
          {parks.length > 0 && <div className="small" style={{ margin: "4px 0 8px" }}>{[...new Set(parks.map((n) => parkedStep(n.body)).filter(Boolean))].map((sid) => <form key={sid} method="post" action="/api/guardian" style={{ display: "inline-block", marginRight: 8 }}><input type="hidden" name="action" value="resolve_park" /><input type="hidden" name="step_id" value={sid} /><button className="btn quiet">Mark {sid} fixed</button></form>)}</div>}
          {todo.length === 0 ? <div className="small soft">Nothing needed from you right now.</div> : <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="small">{todo.map((t, i) => <Row key={i} {...t} />)}</ul>}
        </div>
      </section>

      {meetState && meetState.stage === "ready" && (
        <section className="card" style={{ marginTop: 14, borderColor: "rgba(163, 230, 53, 0.6)" }}>
          <div className="eyebrow" style={{ color: "var(--lime)" }}>she is ready - send this to {meetState.meeting.callName}, then book the call</div>
          <textarea className="editor" readOnly style={{ fontFamily: "inherit", minHeight: 260, marginTop: 8, fontSize: 14 }} defaultValue={`Thank you again for giving Faiza twenty minutes. A little about her so the time lands well: she is 12, in Dhaka, and for the past weeks she has been doing a structured programme I run for her remotely - maths fundamentals, how a computer actually works (binary, CPU/memory/disk, processes), a little Python, Linux, and using her own laptop entirely from the keyboard. Her English is good but simple, so plain words and concrete examples work best.

She has prepared, and she will lead. The shape we practised (about 20 minutes):
- She greets you and introduces herself (1-2 min).
- She asks you these three questions, one at a time, and will try a follow-up after each:
${(meetState.questions || []).map((q, i) => `  ${i + 1}. ${q}`).join("\n")}
- For the last 5-6 minutes, please just talk to her from the heart: what you wish you had known at 12, one real story from your work, any advice you would give her. This is the part she will remember.
- She will thank you and tell you one thing she will do because of the call.

If she goes quiet, ask her what she is building - she has answers. If you can show her anything from your work on camera, even a photo, she will keep it for years. I will be on the call too.`} />
          <p className="small soft" style={{ marginTop: 6 }}>Her introduction and questions are also in her logbook. After the call she writes one page; when it is in, this meeting is done.</p>
        </section>
      )}

      {callDay && (
        <section className="card" style={{ marginTop: 14, borderColor: "rgba(34, 211, 238, 0.5)" }}>
          <div className="eyebrow">the Friday call · what to ask her</div>
          <div className="grid two" style={{ marginTop: 6 }}>
            <div className="small">
              <div><b>This week:</b> {doneWeek.length} step{doneWeek.length === 1 ? "" : "s"} finished · {dayList.slice(-7).filter((d) => d.minutes > 0).length} working days · {dayList.slice(-7).reduce((a, d) => a + d.minutes, 0)} min</div>
              {cans.length > 0 && <div style={{ marginTop: 6 }}><b>In her words, she can now:</b><ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{cans.slice(0, 4).map((c, i) => <li key={i}>{c.title}</li>)}</ul></div>}
              {teach[0] && <div style={{ marginTop: 6 }}><b>Her latest teach-back</b> ({teach[0].step_id}): "{String(teach[0].text || "").slice(0, 160)}{String(teach[0].text || "").length > 160 ? "…" : ""}"</div>}
              {curMod?.gift && <div style={{ marginTop: 6 }}><b>The thing she is making this module</b> (for {curMod.gift.for}): {curMod.gift.what}</div>}
            </div>
            <div className="small">
              <b>First, how it felt (before any work question):</b>
              <ol style={{ margin: "4px 0 6px", paddingLeft: 18 }}>
                <li>"What felt good this week?"</li>
                <li>"What felt annoying or too much?" (Listen; do not fix it on the call. If it is the system, tell Claude.)</li>
              </ol>
              <div className="small soft" style={{ marginBottom: 6 }}>This week in her lines: {moodNow.caps} all-caps · {moodNow.idk} "I don't know" · {moodNow.confused} confused (last week {moodBefore.caps} · {moodBefore.idk} · {moodBefore.confused}).</div>
              <b>Then three questions that work better than "how is school":</b>
              <ol style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                <li>"Show me one thing you made this week - run it, or do it on the screen." (Let her drive. Don't fix anything.)</li>
                <li>"What was the most annoying moment, and what did you do about it?" (Debugging is the skill; praise the doing, not the result.)</li>
                <li>"What do you want to understand next?" (Write her answer in the note to the tutor below - it becomes a Wonder or a detour.)</li>
              </ol>
              <div style={{ marginTop: 6 }}><b>Rewards to mention:</b> {rw ? (rw.unlocks.filter((u) => u.reached && !u.claimed).map((u) => u.reward).join("; ") || "none unclaimed") : "-"}{rw?.forecast?.find((f) => f.arrangeNow && !f.reached) ? ` · coming: ${rw.forecast.find((f) => f.arrangeNow && !f.reached).reward}` : ""}</div>
              <div style={{ marginTop: 6, color: "var(--ink-mute)" }}>Never "super genius". Say: "you understand how this really works."</div>
            </div>
          </div>
        </section>
      )}

      <section className="grid two" style={{ marginTop: 14 }}>
        <div className="card" style={{ borderColor: issues.some((i) => i.lvl === "red") ? "rgba(251, 113, 133, 0.6)" : undefined }}>
          <div className="eyebrow" style={{ color: issues.length ? "var(--rose)" : "var(--lime)" }}>issues</div>
          {issues.length === 0 ? <div className="small soft">Nothing wrong. Cost is fine (${money.mtd.toFixed(2)} this month, heading for ${money.projected.toFixed(0)} of your ${SPEND_LIMIT}).</div> : <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="small">{issues.map((t, i) => <Row key={i} {...t} />)}</ul>}
          {flags.length > 0 && <form method="post" action="/api/guardian" style={{ marginTop: 8 }}><input type="hidden" name="action" value="clearflags" /><button className="btn quiet">Clear flags</button></form>}
        </div>
        <div className="card">
          <div className="eyebrow">minutes · last 14 days</div>
          <div style={{ marginTop: 8 }}><MinuteBars minutesByDay={dayList} today={todayYmd} cap={60} /></div>
          {rw && <div style={{ marginTop: 10 }}><StreakCalendar sessionDays={rw.sessionDays} minutesByDay={dayList} today={todayYmd} /></div>}
        </div>
      </section>

      <section className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="eyebrow" style={{ color: "var(--amber)" }}>in her words · the What do you want? page</div>
          {!latestVoice ? <div className="small soft">She has not written anything yet. The page asks again every 30 days.</div> : <>
            <div className="small soft" style={{ marginBottom: 6 }}>Latest: {new Date(latestVoice.at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}. The tutor sees the first four (never the last) and is told never to promise a change - you decide.</div>
            {[["want_to_be", "What she wants to be"], ["want_to_learn", "What she wants to learn"], ["enjoys", "What she enjoys"], ["finds_hard", "What she finds hard"], ["wish_for_abid", "What she wishes you knew"]].map(([k, label]) => latestVoice[k] ? <div key={k} className="small" style={{ margin: "4px 0" }}><b>{label}:</b> {latestVoice[k]}</div> : null)}
            {voiceRows.length > 1 && <details style={{ marginTop: 6 }}><summary className="small">Earlier answers ({voiceRows.length - 1})</summary>{voiceRows.slice(1).map((v, i) => <div key={i} className="small soft" style={{ margin: "6px 0" }}>{new Date(v.at).toLocaleDateString("en-GB")} · {VOICE_FIELDS.filter((k) => v[k]).map((k) => `${k.replace(/_/g, " ")}: ${v[k]}`).join(" · ")}</div>)}</details>}
          </>}
        </div>
        <div className="card">
          <div className="eyebrow">closed without her own words · unverified</div>
          <div className="small soft" style={{ marginBottom: 6 }}>Steps closed by the message count or the time box, not by her own evidence. The tutor asks one recall question at her next session; her answer is shown here.</div>
          {unverRows.length === 0 ? <div className="small" style={{ color: "var(--lime)" }}>None.</div> : <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{unverRows.slice(0, 8).map((u) => <li key={u.step_id} style={{ margin: "4px 0" }}><b>{u.step_id}</b> {u.title} · {u.why} · {new Date(u.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{u.answer ? <> · recall: "<i>{String(u.answer).slice(0, 160)}</i>"</> : u.asked_at ? " · asked, no answer yet" : " · recall question still to come"}</li>)}</ul>}
          {checksSum.length > 0 && <>
            <div className="eyebrow" style={{ marginTop: 12 }}>checkpoints · first try → final</div>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{checksSum.slice(-8).reverse().map((c) => <li key={c.step_id}>{c.step_id}: first try <b>{Math.round(c.first * 100)}%</b> → final {Math.round(c.final * 100)}%{c.passed ? "" : " (not passed yet)"} · {c.tries} tr{c.tries === 1 ? "y" : "ies"}</li>)}</ul>
          </>}
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ color: "var(--cyan)" }}>the tutor's knowledge base</div>
        <p className="small soft" style={{ margin: "6px 0" }}>Notes written ahead of her for each lesson/code step (at most {AHEAD_LIMIT} steps ahead), and what we know about how she learns. The tutor reads both on every reply, whichever model is running it. Each prepared step costs about $0.10-0.20; a profile about $0.25 (at Fable 5.1 prices). Refused if the month would pass your ${SPEND_LIMIT} limit.</p>
        <div className="grid two" style={{ marginTop: 6 }}>
          <div className="small">
            {kbSum ? <>
              <div><b>{kbSum.prepared}</b> of the {kbSum.inWindow} lesson/code steps ahead of her are prepared · the next <b>{kbSum.run}</b> in a row are covered.</div>
              <div style={{ marginTop: 4 }}>{kbSum.next ? <>Next unprepared: <b>{kbSum.next.s.id}</b> · {kbSum.next.s.title} ({kbSum.next.ahead === 0 ? "the step she is on" : `${kbSum.next.ahead} step${kbSum.next.ahead === 1 ? "" : "s"} ahead`})</> : "Every lesson/code step in the window is prepared."}</div>
            </> : <div className="soft">No current module.</div>}
            <form method="post" action="/api/guardian" style={{ marginTop: 8 }}><input type="hidden" name="action" value="prepare" /><input type="hidden" name="count" value="4" /><button className="btn quiet">Prepare the next 4 steps</button> <span className="small soft">(up to ~3 minutes - wait for the page to come back)</span></form>
            {kbLog.map((a, i) => <div key={i} className="small soft" style={{ marginTop: 4 }}>{fmtDateTime(a.at)} · {a.action} · {a.detail}</div>)}
          </div>
          <div className="small">
            <b>Her learner profile</b>{kbProfile ? <span className="soft"> · {new Date(kbProfile.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ({kbProfileDays === 0 ? "today" : `${kbProfileDays} day${kbProfileDays === 1 ? "" : "s"} old`}) · from her last {kbProfile.from_days} days · refresh weekly</span> : <span className="soft"> · none yet - press the button once she has a few days of chats</span>}
            {kbProfile && <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: kbProfileDays > 7 ? "var(--ink-soft)" : undefined }}>{kbProfile.text}</div>}
            {kbProfileDays != null && kbProfileDays > 7 && <div style={{ marginTop: 4, color: "var(--amber)" }}>Older than a week - refresh it.</div>}
            <form method="post" action="/api/guardian" style={{ marginTop: 8 }}><input type="hidden" name="action" value="profile" /><button className="btn quiet">Refresh her profile</button></form>
          </div>
        </div>
        <details style={{ marginTop: 10 }}><summary className="small">Prepared notes ({kbList.length}) - what the tutor sees</summary>
          {kbList.length === 0 ? <p className="small soft">None yet.</p> : kbList.map((r) => (
            <div key={r.step_id} className="small" style={{ margin: "8px 0", padding: "6px 10px", borderLeft: r.step_id === curStepId ? "3px solid var(--amber)" : "3px solid var(--line-2)" }}>
              <div><b>{r.step_id}</b> · {stepTitle(r.step_id)} <span className="soft">· {r.model || "?"} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {r.chars} chars</span>
                <form method="post" action="/api/guardian" style={{ display: "inline-block", marginLeft: 8 }}><input type="hidden" name="action" value="prepare_redo" /><input type="hidden" name="step_id" value={r.step_id} /><button className="btn quiet" style={{ padding: "2px 10px" }}>redo</button></form></div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{renderNotes(r.notes)}</div>
            </div>
          ))}
        </details>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ color: "var(--cyan)" }}>the offline pack</div>
        <p className="small soft" style={{ margin: "6px 0" }}>For days without internet: worksheets for her next {PACK_STEPS} lesson/code/practice steps, in one file she downloads from her home page. One new worksheet is written after each step she finishes (only while the month is under 75% of your ${SPEND_LIMIT} limit); this button fills the gaps (about $0.03-0.10 each). Steps without a worksheet get a plain one built from the step.</p>
        <div className="small"><b>{offReady}</b> of her next {offWant.length} pack steps have a worksheet{offWant.length ? <span className="soft"> ({offWant.map((x) => `${x.s.id}${offHave.has(x.s.id) ? " ✓" : ""}`).join(", ")})</span> : null}. Last download: {offDl[0]?.value ? fmtDateTime(offDl[0].value) : <span style={{ color: "var(--amber)" }}>never - ask her to press "Download offline pack" on her home page</span>}.</div>
        <form method="post" action="/api/guardian" style={{ marginTop: 8 }}><input type="hidden" name="action" value="offline_prepare" /><button className="btn quiet">Write the missing worksheets</button> <span className="small soft">(up to ~3 minutes)</span></form>
        {offLog.map((a, i) => <div key={i} className="small soft" style={{ marginTop: 4 }}>{fmtDateTime(a.at)} · {a.detail}</div>)}
        {offDays.length > 0 && <div className="small" style={{ marginTop: 8 }}>Offline days brought back: {offDays.map((d) => `${d.day} (${d.minutes} min${d.minutes >= 25 ? ", counts" : ""})`).join(" · ")}</div>}
        {offWork.length > 0 && <details style={{ marginTop: 8 }}><summary className="small">Her offline worksheets ({offWork.length})</summary>
          {offWork.map((r) => { const w = offParse(r.work); return (
            <div key={r.step_id} className="small" style={{ margin: "8px 0", padding: "6px 10px", borderLeft: "3px solid var(--line-2)" }}>
              <div><b>{r.step_id}</b> · {stepTitle(r.step_id)} <span className="soft">· brought back {fmtDateTime(r.imported_at)}{r.done ? " · she marked it finished" : ""} · {r.reviewed_at ? "reviewed with the tutor" : "not reviewed yet"}</span></div>
              {(w.tasks || []).map((t, i) => t ? <div key={i} style={{ whiteSpace: "pre-wrap" }}>Task {i + 1}: {t}</div> : null)}
              {w.own && <div style={{ whiteSpace: "pre-wrap" }}>Own words: {w.own}</div>}
              {w.question && <div style={{ whiteSpace: "pre-wrap" }}>Her question: {w.question}</div>}
            </div>); })}
        </details>}
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ color: "var(--cyan)" }}>the school day · last 14 days</div>
        <p className="small soft" style={{ margin: "6px 0" }}>Start school (with the desk check: desk, both hands, water, phone away), a one-minute movement break every 25 minutes of active lesson time, End school. Targets follow her own last week (8 Nov 2026): typing {wpmTarget(new Date().toISOString().slice(0, 10), sdHist)} wpm on the drill line; quick maths {mathTarget(new Date().toISOString().slice(0, 10), sdHist).score}/20 inside {Math.round(mathTarget(new Date().toISOString().slice(0, 10), sdHist).seconds / 6) / 10} min. The drill line, maths and the key move are extras; keybr and the Python line are the warm-up. The desk tick is her word - Mom's spot checks are the other half.</p>
        {sdRows.length === 0 ? <p className="small soft">Nothing yet - it starts the first time she presses Start school.</p> : (
          <table className="small"><thead><tr><th>Day</th><th>Start</th><th>End</th><th>Desk</th><th>Moves</th><th>Typing</th><th>Maths</th></tr></thead>
            <tbody>{sdRows.map((r) => { const wt = wpmTarget(r.day, sdHist), mt = mathTarget(r.day, sdHist); return (
              <tr key={r.day}><td className="mono">{r.day}</td><td>{r.started_at ? fmtDateTime(r.started_at).split(", ").pop() : "-"}</td><td>{r.ended_at ? fmtDateTime(r.ended_at).split(", ").pop() : "-"}</td>
                <td>{r.started_at ? (r.desk ? "✓" : <span style={{ color: "var(--amber)" }}>no</span>) : "-"}</td><td>{r.moves ?? 0}</td>
                <td>{r.drill_wpm != null ? <span style={{ color: r.drill_wpm >= wt ? "var(--lime)" : undefined }}>{r.drill_wpm} / {wt} wpm</span> : "-"}</td>
                <td>{r.math_score != null ? <span style={{ color: r.math_score >= mt.score && r.math_seconds <= mt.seconds ? "var(--lime)" : undefined }}>{r.math_score}/20 · {Math.floor(r.math_seconds / 60)}:{String(r.math_seconds % 60).padStart(2, "0")}</span> : "-"}</td></tr>); })}</tbody></table>
        )}
        <div className="small" style={{ marginTop: 10 }}><b>Step videos - her verdict</b> ({vidVotes.length} voted): {vidVotes.length === 0 ? <span className="soft">nothing yet. Under every video she can tap Useful / Too long / Not about this; what she marks shows here.</span> : null}</div>
        {vidVotes.length > 0 && <table className="small" style={{ marginTop: 4 }}><thead><tr><th>step</th><th>video</th><th>verdict</th><th>when</th></tr></thead><tbody>
          {vidVotes.map((v) => <tr key={v.step_id + v.url}><td className="mono">{v.step_id}</td><td>{vidTitle(v.step_id, v.url)}</td><td style={{ color: v.vote === "useful" ? "var(--lime)" : "var(--amber)" }}>{v.vote === "useful" ? "useful" : v.vote === "long" ? "too long" : "not about this"}</td><td>{fmtDateTime(v.at)}</td></tr>)}
        </tbody></table>}
        <div className="small" style={{ marginTop: 10 }}><b>Winter school agreement</b> ({AGREEMENT_VERSION}): {agreeRows[0] && agreeRows[0].version === AGREEMENT_VERSION ? <>signed {fmtDateTime(agreeRows[0].at)} - <span style={{ whiteSpace: "pre-wrap" }}>"{agreeRows[0].her_words}"</span></> : <span style={{ color: "var(--amber)" }}>not signed yet - it is on her home page (/agree); talk it through with her on a call first.</span>}</div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ color: "var(--violet)" }}>retention · the practice spine (9 Nov 2026)</div>
        <p className="small soft" style={{ margin: "6px 0" }}>Every skill she passes comes back in the warm-up on a 1 / 7 / 30 / 90-day ladder (two questions a day, ten on Saturdays, plus five from one old module once a month). A miss drops the skill back to tomorrow. This is the number that says whether what she learned is still hers.</p>
        {!ret || !ret.total ? <p className="small soft">Nothing on the ladder yet - it fills itself from her passed modules at the next warm-up.</p> : <>
          <div className="small"><b>{ret.total} skills</b> on the ladder · {ret.dueNow} due now · last 30 days: <b>{ret.recent?.n ? Math.round(100 * ret.recent.right / ret.recent.n) : 0}% right</b> of {ret.recent?.n || 0} review answers</div>
          <div className="small" style={{ marginTop: 4 }}>By stage: {ret.stages.map((r) => `${["1 day", "7 days", "30 days", "90 days"][r.stage] || r.stage}: ${r.n}`).join(" · ")}</div>
          {ret.perModule.length > 0 && <div className="small" style={{ marginTop: 6 }}><b>Per module (30 days):</b> {ret.perModule.map((r) => <span key={r.module_id} style={{ marginRight: 10, color: r.n && r.right / r.n < 0.6 ? "var(--amber)" : undefined }}>{r.module_id} {Math.round(100 * r.right / Math.max(1, r.n))}% ({r.n})</span>)}</div>}
          {ret.weak.length > 0 && <div className="small" style={{ marginTop: 6 }}><b>Weakest:</b> {ret.weak.map((w) => <span key={w.skill} className="mono" style={{ marginRight: 10 }}>{w.skill} <span className="soft">({w.misses} miss{w.misses === 1 ? "" : "es"}, {w.hits} right)</span></span>)}</div>}
          {ret.rechecks.length > 0 && <div className="small" style={{ marginTop: 6 }}><b>Monthly re-checks:</b> {ret.rechecks.map((r) => <span key={r.module_id + r.day} style={{ marginRight: 10 }}>{r.module_id} {Math.round(100 * Number(r.score))}% <span className="soft">({r.day})</span></span>)}</div>}
        </>}
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow" style={{ color: "var(--lime)" }}>maths · the plan of 25 Nov 2026 (MATHS-PLAN)</div>
        <p className="small soft" style={{ margin: "6px 0" }}>Five numbers, this week against last. Targets for mid-January: the drill at 18/20 inside 4 minutes on most days; maths skills 70%+ right in review; the stretch problems solved with a plan said first; paper pages 70%+ right; the Saturday set started.</p>
        <div className="small"><b>Fluency (quick maths, required since 25 Nov):</b> {maths.fluency.daysThisWeek} day{maths.fluency.daysThisWeek === 1 ? "" : "s"} this week (last week {maths.fluency.daysLastWeek}), target hit {maths.fluency.hitsThisWeek}x
          {maths.fluency.best ? <> · best this week <b>{maths.fluency.best.score}/20 in {Math.floor(maths.fluency.best.seconds / 60)}:{String(Math.round(maths.fluency.best.seconds % 60)).padStart(2, "0")}</b></> : <> · <span className="soft">not done this week</span></>}
          {maths.fluency.bestLast ? <span className="soft"> (last week {maths.fluency.bestLast.score}/20 in {Math.floor(maths.fluency.bestLast.seconds / 60)}:{String(Math.round(maths.fluency.bestLast.seconds % 60)).padStart(2, "0")})</span> : null}</div>
        <div className="small" style={{ marginTop: 4 }}><b>Retention (maths skills, 30 days):</b> {maths.retention.skills} maths skills on the ladder · {maths.retention.answers ? <><b style={{ color: maths.retention.pct < 70 ? "var(--amber)" : "var(--lime)" }}>{maths.retention.pct}% right</b> of {maths.retention.answers} review answers</> : <span className="soft">no review answers yet</span>}
          {maths.retention.weak.length > 0 && <> · weakest: {maths.retention.weak.map((w) => <span key={w.skill} className="mono" style={{ marginLeft: 6 }}>{w.skill} <span className="soft">({w.misses}/{w.hits})</span></span>)}</>}</div>
        <div className="small" style={{ marginTop: 4 }}><b>Stretch problems (one class above, before each maths check):</b> {maths.stretch.done ? <>{maths.stretch.done} done, {maths.stretch.onEvidence} closed on her evidence{maths.stretch.list.length > 0 && <> · {maths.stretch.list.map((d) => <span key={d.step} className="mono" style={{ marginLeft: 6 }}>{d.step} <span className="soft">{d.minutes} min{d.onEvidence ? "" : ", unverified"}</span></span>)}</>}</> : <span className="soft">none reached yet (M6-S1 is the first)</span>}</div>
        <div className="small" style={{ marginTop: 4 }}><b>Maths on paper (14 days):</b> {maths.paper.handIns ? <>{maths.paper.days} day{maths.paper.days === 1 ? "" : "s"}, {maths.paper.pages} page{maths.paper.pages === 1 ? "" : "s"} · <b style={{ color: maths.paper.pct != null && maths.paper.pct < 70 ? "var(--amber)" : "var(--lime)" }}>{maths.paper.pct}% right</b> of {maths.paper.right + maths.paper.wrong} answers checked · her steps explained {maths.paper.explained}x ({maths.paper.methodOk} clear)
          {maths.paper.last?.answer && <div className="soft" style={{ marginTop: 2 }}>Last ({maths.paper.last.day}): <i>{maths.paper.last.question}</i> - she wrote: "{String(maths.paper.last.answer).slice(0, 240)}"{maths.paper.last.verdict ? <> - tutor: {String(maths.paper.last.verdict).slice(0, 200)}</> : null}</div>}</> : <span className="soft">no page handed in yet (the card is on her home page every school day)</span>}</div>
        <div className="small" style={{ marginTop: 4 }}><b>Saturday puzzles:</b> {maths.puzzles.sets ? <>{maths.puzzles.sets} set{maths.puzzles.sets === 1 ? "" : "s"} · answers <b>{maths.puzzles.pct}%</b> · reasons clear {maths.puzzles.reasonsPct == null ? "-" : `${maths.puzzles.reasonsPct}%`} · level {maths.puzzles.level}
          {maths.puzzles.last && <div className="soft" style={{ marginTop: 2 }}>Last ({maths.puzzles.last.day}): {maths.puzzles.last.score}/{maths.puzzles.last.total}{maths.puzzles.last.results.filter((r) => r.reason).length ? <> · her reasons: {maths.puzzles.last.results.map((r, i) => <span key={i} style={{ marginLeft: 6 }}>{i + 1}. "{String(r.reason || "").slice(0, 120)}" {r.reason_ok === true ? "✓" : r.reason_ok === false ? "✗" : ""}</span>)}</> : null}</div>}</> : <span className="soft">none yet (the first Saturday is 5 Dec)</span>}</div>
      </section>

      {rw && <section style={{ marginTop: 18 }}>
        <h2>Rewards - what to arrange, and when</h2>
        <p className="small soft">Estimated from her last 14 days ({rw.pace.xp14} XP, about {rw.pace.xpPerDay} XP/day; {rw.pace.steps14} steps finished, about {rw.pace.daysPerStep} days per step). Costs and notes are yours only; edit curriculum/rewards.json.</p>
        <div className="grid three">
          {[...rw.forecast].sort((a, b) => (a.reached ? -1 : b.reached ? 1 : (a.etaDays ?? 9999) - (b.etaDays ?? 9999))).map((f) => {
            const status = f.delivered ? ["Delivered", "var(--lime)"] : f.claimed ? ["Claimed - you owe it", "var(--rose)"] : f.reached ? ["Unlocked - not claimed", "var(--amber)"] : f.arrangeNow ? ["Arrange now", "var(--amber)"] : ["Later", "var(--ink-mute)"];
            return (
              <div className="card" key={f.id} style={{ padding: "12px 14px", opacity: f.delivered ? 0.6 : 1, borderColor: f.arrangeNow || (f.claimed && !f.delivered) ? "rgba(251, 191, 36, 0.5)" : undefined }}>
                <div className="eyebrow" style={{ color: status[1] }}>{status[0]}</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{f.reward}</div>
                <div className="small soft">{f.kind === "level" ? `Level ${f.value}` : f.kind === "streak" ? `${f.value}-day streak` : f.kind === "module" ? `Pass ${f.value}` : f.kind === "start" ? `Start ${f.value}` : `Badge ${f.value}`} · {f.reached ? "reached" : f.hint || ""}{!f.reached && f.etaDate ? ` · about ${fmtDay(f.etaDate)} (${f.etaDays} d)` : ""}</div>
                {(f.cost || f.note) && <div className="small" style={{ marginTop: 6, color: "var(--ink-soft)" }}>{f.cost}{f.note ? ` - ${f.note}` : ""}</div>}
              </div>
            );
          })}
        </div>
      </section>}

      <h2 style={{ marginTop: 24 }}>Note to the tutor</h2>
      <p className="small soft">The tutor reads the latest note before every reply. Use it for things like "school exams this week - go lighter".</p>
      <form method="post" action="/api/guardian"><input type="hidden" name="action" value="note" />
        <textarea className="editor" name="body" style={{ fontFamily: "inherit", minHeight: 70 }} placeholder="Write a note" />
        <div style={{ marginTop: 8 }}><button className="btn">Save note</button></div></form>
      <ul className="small">{notes.filter((n) => !n.flagged).slice(0, 3).map((n) => <li key={n.id}>{new Date(n.created_at).toDateString()} · {n.author}: {n.body}</li>)}</ul>

      <h2 style={{ marginTop: 24 }}>Details</h2>
      <p className="small soft">Everything below is the raw record. Open a section when you need it.</p>
      <details><summary>Cost and safety</summary>
      <p style={{ color: money.over ? "var(--rose)" : undefined }}>Cost: <strong>${money.mtd.toFixed(2)}</strong> this month (since the 1st, UTC) · about ${money.rate.toFixed(2)}/day · projected <strong>${money.projected.toFixed(0)}</strong> by the end of the month against your ${SPEND_LIMIT} console limit{money.hitDate ? ` · would reach it around ${fmtDay(money.hitDate)}` : ""}{failedCalls ? ` · ${failedCalls} failed call${failedCalls > 1 ? "s" : ""} this month` : ""}. Priced per call with its own model (cache writes 1.25x, cache reads 0.1x); calls before 29 Oct are estimated from their tokens.</p>
      <p>Tutor calls: <strong>{c.day}</strong> in the last 24 h (ceiling {cap}) · <strong>{c.month}</strong> in 30 days · tokens in 30 days: {Number(c.tin).toLocaleString()} in / {Number(c.tout).toLocaleString()} out · model: <strong>{tutorModel()}</strong> (from the dated schedule in curriculum/calendar.json, else the Vercel env).</p>
      {flags.map((f) => <div className="flag" key={f.id}><strong>Flag</strong> · {new Date(f.created_at).toLocaleString()}<br />{f.body}</div>)}
      </details>

      <details><summary>Minutes per day</summary>
      <table><thead><tr><th>Day (Dhaka)</th><th>Active</th><th>Steps touched</th></tr></thead>
        <tbody>{week.map((r) => <tr key={r.d}><td>{new Date(r.d).toDateString()}</td><td>{mins(Math.max(Number(r.ms), worked14[ymd(r.d)] || 0))} <span className="soft">(in-tab clock {mins(r.ms)})</span></td><td>{r.n}</td></tr>)}
        {week.length === 0 && <tr><td colSpan={3} className="soft">Nothing yet.</td></tr>}</tbody></table>

      </details>
      <details><summary>Checkpoints and diagnostics — what she got wrong</summary>
      {today.map((r, i) => (
        <div key={i} style={{ marginBottom: 12 }}><strong>{r.step_id}</strong> · {Math.round(Number(r.score) * 100)}%<br />
          <span className="small">{(r.wrong || []).map((w) => `${w.skill}: "${w.q}" → she wrote "${w.given}"`).join(" · ") || "Nothing wrong."}</span></div>
      ))}

      </details>
      <details><summary>Time per step</summary>
      <table><thead><tr><th>Step</th><th>Kind</th><th>Time</th><th>Attempts</th><th>Score</th></tr></thead>
        <tbody>{byStep.map((r, i) => <tr key={i}><td>{r.step_id}</td><td>{r.kind}</td><td>{mins(r.ms)}</td><td>{r.attempts}</td><td>{r.score != null ? (r.kind === "typing" ? `${r.score} wpm` : `${Math.round(Number(r.score) * 100)}%`) : ""}</td></tr>)}</tbody></table>

      </details>
      <details><summary>Teach-it-back — read these</summary>
      {teach.map((t, i) => <div className="card" key={i} style={{ marginBottom: 10 }}><div className="small soft">{t.step_id} · {new Date(t.started_at).toDateString()} · clarity {Math.round(Number(t.score) * 100)}%</div><p style={{ whiteSpace: "pre-wrap" }}>{t.text}</p></div>)}
      {teach.length === 0 && <p className="soft">None yet.</p>}
      {ungradedRows.map((t, i) => <div className="card amber" key={`u${i}`} style={{ marginBottom: 10 }}><div className="small soft">{t.step_id} · {new Date(t.started_at).toDateString()} · NOT MARKED (the grader's reply could not be read twice) - your call</div><p style={{ whiteSpace: "pre-wrap" }}>{t.text}</p></div>)}

      </details>
      <details><summary>Typing warm-up — last 30 days</summary>
      <p className="small soft">The warm-up is optional since 29 Oct 2026 (~5 minutes, still XP and badges) and never gates a lesson. Part 1: keybr, done or not done (no accuracy number). Part 2: the "all the keys" code line, verified by the server. Speed is ignored.</p>
      {typing.length === 0 ? <p className="soft">None yet.</p> : (
        <table><thead><tr><th>Day (Dhaka)</th><th>keybr</th><th>All-the-keys line</th><th>Key move</th></tr></thead>
          <tbody>{typing.map((t, i) => <tr key={i}><td>{new Date(t.day).toDateString()}</td><td>{t.done ? "done" : "—"} <span className="small soft">{t.site || ""}</span></td><td>{t.drill_done ? `${Number(t.drill_accuracy)}%${t.drill_wpm ? ` · ${t.drill_wpm} wpm` : ""}` : "—"}</td><td>{t.shortcut_done ? `✓ ${t.shortcut_id || ""}` : "—"}</td></tr>)}</tbody></table>
      )}

      </details>
      <details><summary>Logbook — what she has recorded</summary>
      <p className="small soft">Every finished step and module, her own lines after each module, and the code she shipped. She sees this at /portfolio.</p>
      {journal.length === 0 && <p className="soft">None yet.</p>}
      {journal.map((j, i) => (
        <div key={i} className="small" style={{ margin: "6px 0", padding: "6px 10px", borderLeft: j.kind === "note" ? "3px solid var(--amber)" : "3px solid var(--line-2)", whiteSpace: "pre-wrap" }}>
          <span className="soft">{new Date(j.at).toLocaleString()} · {j.kind}{j.step_id ? ` · ${j.step_id}` : j.module_id ? ` · ${j.module_id}` : ""}</span>
          <div>{j.kind === "step" && j.body ? <>{j.title}<pre className="output" style={{ marginTop: 4, fontSize: 13 }}>{j.body}</pre></> : (j.kind === "note" ? j.body : j.title)}</div>
        </div>
      ))}

      </details>
      <details><summary>Practice answers — last 7 days</summary>
      <p className="small soft">Every answer she typed in a practice set, newest first. Wrong ones are marked. This is where to look when a module seems to repeat.</p>
      {answers.length === 0 && <p className="soft">None yet.</p>}
      {answers.length > 0 && (
        <table><thead><tr><th>When</th><th>Step</th><th>Skill</th><th>Question</th><th>She typed</th><th></th></tr></thead>
          <tbody>{answers.map((a, i) => <tr key={i} style={a.ok ? undefined : { background: "rgba(251, 191, 36, 0.12)" }}>
            <td className="small soft">{new Date(a.at).toLocaleString()}</td><td className="small">{a.step_id}</td><td className="small">{a.skill}</td>
            <td className="small">{a.question}</td><td><strong>{a.given}</strong></td><td>{a.ok ? "✓" : "✗"}</td></tr>)}</tbody></table>
      )}

      </details>
      <details><summary>Conversations — last 7 days</summary>
      <p className="small soft">Newest first. Everything she and the tutor said in lesson steps.</p>
      {chats.length === 0 && <p className="soft">None yet.</p>}
      {chats.map((x, i) => (
        <div key={i} className="small" style={{ margin: "6px 0", padding: "6px 10px", borderLeft: x.role === "student" ? "3px solid var(--amber)" : "3px solid var(--line-2)", whiteSpace: "pre-wrap" }}>
          <span className="soft">{new Date(x.at).toLocaleString()} · {x.step_id}{x.ctx !== "lesson" ? ` (${x.ctx})` : ""} · <strong>{x.role}</strong></span>
          <div style={{ whiteSpace: "pre-wrap" }}>{String(x.content).replace(/```svg[\s\S]*?```/g, "[drawing - open her room to see it]")}</div>
        </div>
      ))}

      </details>
      <details><summary>The path</summary>
      <table><thead><tr><th>Module</th><th>Status</th><th>Best</th><th>Passed</th></tr></thead>
        <tbody>{progress.map((p) => <tr key={p.id}><td>{p.id} · {p.title}</td><td>{p.status}</td><td>{p.best_score != null ? `${Math.round(Number(p.best_score) * 100)}%` : ""}</td><td>{p.passed_at ? new Date(p.passed_at).toDateString() : ""}</td></tr>)}</tbody></table>

      </details>
      <details><summary>Errors — what broke on the school's side (7 days)</summary>
        <p className="small soft">Every failure she may have seen: the tutor not answering, questions not arriving, a drawing cut off. If this list is not empty, the first job is here.</p>
        {errRows.length === 0 ? <p className="small" style={{ color: "var(--lime)" }}>Nothing broke this week.</p> : errRows.map((e, i) => <div key={i} className="small mono" style={{ margin: "4px 0", color: e.seen_by_her ? "var(--rose)" : "var(--ink-soft)" }}>{fmtDateTime(e.at)} · {e.where_} · {String(e.message).slice(0, 220)}</div>)}
      </details>
      <details>
        <summary>Audit trail</summary>
      <table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th><th>IP</th></tr></thead>
        <tbody>{auditRows.map((a, i) => <tr key={i}><td>{new Date(a.at).toLocaleString()}</td><td>{a.actor}</td><td>{a.action}</td><td>{a.detail || ""}</td><td>{a.ip || ""}</td></tr>)}</tbody></table>

      </details>
      <details><summary>Override</summary>
      <p className="small soft">Only if something is genuinely wrong. This is logged.</p>
      <form method="post" action="/api/guardian"><input type="hidden" name="action" value="unlock" />
        <select name="module_id" className="big-input" style={{ fontSize: 16 }}>{allModules().map((m) => <option key={m.id} value={m.id}>{m.id} · {m.title}</option>)}</select>
        <div style={{ marginTop: 8 }}><button className="btn quiet">Set as current module</button></div></form>
      <p className="small soft" style={{ marginTop: 14 }}>Reset a module to <b>locked</b> - for one wrongly marked passed (she never did it). Not the current module.</p>
      <form method="post" action="/api/guardian"><input type="hidden" name="action" value="relock" />
        <select name="module_id" className="big-input" style={{ fontSize: 16 }}>{progress.filter((p) => p.status === "passed").map((p) => <option key={p.id} value={p.id}>{p.id} · {p.title} (passed)</option>)}</select>
        <div style={{ marginTop: 8 }}><button className="btn quiet">Reset to locked</button></div></form>
      </details>
    </main>
  );
}
