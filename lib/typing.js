import { q } from "./db";
import { todaysDrill, DRILL_PASS, dhakaDayIndex } from "./drills";
import { forDay, pub } from "./shortcuts";
import { todaysCodeLine } from "./codelines";
import { currentModule } from "./curriculum";
import { mathQuestions, wpmTarget, mathTarget, MATH_COUNT } from "./mathdrill";
import { todayPlan } from "./calendar";
import { localDayIndex } from "./time";
import { isAdult, STUDENT } from "./student";
import { reviewToday } from "./review";

/** Day 0 of the key-move ladder: the first day the gate recorded anything (so the list starts from Win, Ctrl+T...). */
/** 28 Oct 2026: the Python line is picked from the ideas a PASSED module has taught. The set is read as of the start
    of today (Dhaka), so passing a module mid-session cannot change the line she is already working on. */
export async function codeLineToday() {
  // 8 Nov 2026 (audit): q() returns ROWS - this read `cr.d` off the array, so the line was null and the Python line
  // silently vanished from the warm-up from 28 Oct to 8 Nov (0 lines in 11 days). Destructure the first row.
  const [[cr], passed] = await Promise.all([
    q(`SELECT MIN(at) AS d FROM completions WHERE module_id = $1`, [STUDENT.codeLineStart || "CS2A"]),
    q(`SELECT module_id FROM progress WHERE status = 'passed' AND (passed_at IS NULL OR passed_at < (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka') AT TIME ZONE 'Asia/Dhaka'))`).catch(() => []),
  ]);
  if (!cr?.d) return null;
  const start = localDayIndex(new Date(cr.d).getTime());
  return todaysCodeLine(dhakaDayIndex() - start, new Set(passed.map((r) => r.module_id)), STUDENT);
}

/** Her last 8 days of the drill and maths (for targets that follow her own last week, 8 Nov 2026). */
export async function recentTyping() {
  return q(`SELECT to_char(day, 'YYYY-MM-DD') AS ymd, drill_wpm, math_score, math_seconds FROM typing WHERE day >= (now() AT TIME ZONE 'Asia/Dhaka')::date - 8 ORDER BY day`).catch(() => []);
}

export async function shortcutDay() {
  const [r] = await q(`SELECT MIN(day) AS d FROM typing WHERE shortcut_id IS NOT NULL`);
  if (!r?.d) return 0;
  const first = localDayIndex(new Date(r.d).getTime());
  return Math.max(0, dhakaDayIndex() - first);
}

/** Today's gate status (Dhaka day) and the line to type. Server only. */
export async function typingToday() {
  const [rows, meta, hist, vaultRows, codeLine, osRows, cur, spine] = await Promise.all([
    q(`SELECT done, accuracy, site, drill_done, drill_accuracy, drill_wpm, vault_done, vault_asked, shortcut_done, review_done, code_done, code_fails, code_waived, math_done, math_score, math_seconds, math_tries FROM typing WHERE day = (now() AT TIME ZONE 'Asia/Dhaka')::date`),
    q(`SELECT to_char((now() AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS today, (SELECT MAX(drill_wpm) FROM typing) AS best_wpm`),
    recentTyping(),
    q(`SELECT 1 FROM completions WHERE key = 'CS1C-A3'`),
    // The Python line (Abid, 12 Oct 2026) starts the day she finishes her first CS2A step, and never stops.
    codeLineToday(),
    q(`SELECT value FROM settings WHERE key='os'`).catch(() => []),
    currentModule().catch(() => null),
    // 9 Nov 2026 (practice spine): today's review items - two from earlier days (ten on a Saturday). Never throws.
    reviewToday().catch(() => null),
  ]);
  // INSTALL DAYS (Abid, 20 Oct 2026: "tomorrow she won't be able to open the school on her laptop"): while her current
  // step runs on the laptop-as-patient (LX1-L5..L7B carry a `machine` block: live Mint from the stick, or the fresh
  // install), the School is on her iPad and a typing warm-up there is theatre. The gate stays open; the room says why.
  const curStep = cur?.module?.steps?.[cur.row?.step_index];
  const installDay = !!(curStep && curStep.machine);
  const r = rows[0];
  const os = osRows?.[0]?.value === "linux" ? "linux" : "windows";
  const sc = forDay(await shortcutDay(), os);
  // 5 Nov 2026: an exam day (calendar.json, 10 minutes a day) gets the SHORT warm-up - the drill line and quick maths,
  // about 5 minutes, optional (never a gate). The full one would have eaten the whole ten minutes and more.
  const exam = !!todayPlan().exam;
  // 19 Nov 2026: the adult instance keeps the Python line and the review as the required warm-up; keybr, the drill line,
  // quick maths, the key move and the vault are a child's and do not appear.
  const adult = isAdult();
  return {
    installDay, exam, adult,
    shortcutDone: !!r?.shortcut_done, reviewDone: !!r?.review_done || !sc.review, shortcut: exam || adult ? null : pub(sc.today), review: exam || adult ? null : pub(sc.review),
    vaultEnabled: !exam && !adult && vaultRows.length > 0, vaultAsked: !!r?.vault_asked, vaultDone: !!r?.vault_done,
    // 29 Oct 2026: the warm-up is optional (~5 minutes, still XP and badges) and never gates a lesson. keybr is done or
    // not done - no accuracy number (the self-reported figure carried no information; review 05 rec. 11).
    // 1 Nov 2026 (Abid: she types with one hand, looking at the keys): the warm-up is REQUIRED again before the day's
    // lesson - keybr 10 min eyes up, the drill line, the key move, the Python line. Each part still lets her through after
    // three honest tries, so it can never trap her.
    optional: exam, minutes: exam ? 5 : 10,
    keybrDone: !!r?.done, keybrAccuracy: null, site: r?.site ?? null,
    drillDone: !!r?.drill_done, drillAccuracy: r?.drill_accuracy ?? null, drillWpm: r?.drill_wpm ?? null,
    drillLine: todaysDrill(), drillPass: DRILL_PASS,
    codeEnabled: !exam && !!codeLine, codeDone: !!r?.code_done, codeFails: Number(r?.code_fails || 0), codeWaived: !!r?.code_waived,
    codeLine: codeLine ? { ask: codeLine.ask, idea: codeLine.idea } : null,
    // 3 Nov 2026 (Abid: "fast and efficient"): a speed target on the drill line, and the maths fluency drill.
    wpmTarget: wpmTarget(meta[0].today, hist), bestWpm: meta[0].best_wpm ?? null,
    mathEnabled: !adult, mathDone: !!r?.math_done, mathScore: r?.math_score ?? null, mathSeconds: r?.math_seconds ?? null, mathTries: Number(r?.math_tries || 0),
    mathTarget: mathTarget(meta[0].today, hist), mathCount: MATH_COUNT, mathQuestions: r?.math_done ? null : mathQuestions(dhakaDayIndex()), mathDayIndex: dhakaDayIndex(),
    // The practice spine (9 Nov 2026): answers stay on the server; the room sees the question, the tries and the verdicts.
    spine: spine && spine.count ? spine : null,
  };
}
