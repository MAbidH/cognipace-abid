import { NextResponse } from "next/server";
import { dayToday } from "../../../lib/day";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { PASS_MARK, advanceStep, currentModule, getProgress, minutesToday, passModule, setRemediation } from "../../../lib/curriculum";
import { sameOrigin, answerMatches, safeError } from "../../../lib/guard";
import { typingToday } from "../../../lib/typing";
import { computeRewards, markSessionIfComplete } from "../../../lib/rewards";
import { todaysGoal } from "../../../lib/goal";
import { dailyCap, todayPlan, nightStatus } from "../../../lib/calendar";
import { lastTraceAt } from "../../../lib/presence";
import { clampActive } from "../../../lib/timing";
import { isRealAttempt } from "../../../lib/checks";
import { warmupDone } from "../../../components/warmup";
import { learned } from "../../../lib/review";

export const runtime = "nodejs";
const NEED = Number(process.env.PRACTICE_STREAK || 2); // correct in a row per skill to finish a practice set (was 3; every miss resets it)

const deny = () => NextResponse.json({ error: "not signed in" }, { status: 401 });
const stripQ = (qs) => (qs || []).map(({ a, variants, explain, tries, solved, revealed, ...rest }) => rest);

/** The module as the browser may see it: every answer key removed, and (29 Oct 2026, review 01 L11) the tutor's
    private brief and closing limits too - the browser never needed them. */
function publicModule(m) {
  return { ...m, steps: m.steps.map(({ tutor_brief, max_turns, time_box, ...s }) => (s.questions ? { ...s, questions: s.questions.map(({ a, ...rest }) => rest) } : s)) };
}

/** The fix lesson's conversation since the last failed check (so a reload resumes it instead of restarting). */
async function fixHistory(stepId) {
  const rows = await q(`SELECT role, content FROM chats WHERE step_id=$1 AND ctx='fix'
    AND at > COALESCE((SELECT MAX(ended_at) FROM events WHERE step_id=$1 AND kind='check' AND passed=false), 'epoch'::timestamptz) ORDER BY id DESC LIMIT 40`, [stepId]);
  return rows.reverse().map((r) => ({ role: r.role === "student" ? "user" : "assistant", content: r.content }));
}

async function snapshot(extra = {}) {
  const sessionNow = await markSessionIfComplete();
  const [progress, cur, mins, typing, rewards, day] = await Promise.all([getProgress(), currentModule(), minutesToday(), typingToday(), computeRewards(), dayToday().catch(() => null)]);
  // Her conversation on the current step, so a reload, a break or a new day continues it instead of starting over
  // (she was re-taught the same step five times in a week when Python would not load - Oct 2026).
  let history = [], stepDone = false, fix = null, checkSet = null;
  if (cur) {
    const step = cur.module.steps[cur.row.step_index];
    if (step && ["lesson", "code"].includes(step.kind)) {
      const rows = await q("SELECT role, content FROM chats WHERE step_id=$1 AND ctx='lesson' ORDER BY id DESC LIMIT 40", [step.id]);
      history = rows.reverse().map((r) => ({ role: r.role === "student" ? "user" : "assistant", content: r.content }));
      stepDone = (await q("SELECT 1 FROM completions WHERE key=$1", [step.id])).length > 0;
    }
    // 29 Oct 2026 (review 02/05: recess or a reload restarted the fix lesson and lost checkpoint answers): the fix
    // lesson's history and whether it is done, and the open checkpoint set with her saved draft answers.
    if (step && step.kind === "check") {
      if (cur.row.remediation) {
        fix = { done: (await q("SELECT 1 FROM completions WHERE key=$1", [`${step.id}:fix`])).length > 0, history: await fixHistory(step.id) };
      }
      const open = await q("SELECT id, questions, draft FROM qsets WHERE step_id=$1 AND kind='check' AND NOT done AND graded_at IS NULL AND NOT void ORDER BY started_at DESC LIMIT 1", [step.id]);
      if (open.length) checkSet = { qsetId: open[0].id, questions: stripQ(open[0].questions), draft: Array.isArray(open[0].draft) ? open[0].draft : null };
    }
  }
  const goal = cur ? await todaysGoal(cur, rewards).catch(() => null) : null;
  return NextResponse.json({
    history, stepDone, goal, fix, checkSet,
    ...extra,
    rewards, sessionNow,                                    // XP/level/badges/streak; sessionNow = today just became a complete session
    // 1 Nov 2026 (Abid): the warm-up gates the day's first lesson again (it was optional 29-31 Oct and her typing slid back
    // to one hand, eyes on the keys). Never on install days; every part still waives after three honest tries.
    // 8 Nov 2026 (audit N1): an optional warm-up (exam days) never gates - the 5 Nov exam change left this line gating it,
    // and the gate's "Back to the lesson" only re-fetched the same gate.
    typingGate: !!typing && !typing.installDay && !typing.optional && !warmupDone(typing),
    typing,                                                 // the warm-up parts + today's line (typing.optional = true)
    progress,
    current: cur ? { module: publicModule(cur.module), step_index: cur.row.step_index, remediation: cur.row.remediation } : null,
    minutesToday: mins,
    day,                                                    // the school day (3 Nov 2026): started / ended / desk / moves
    cap: dailyCap(), plan: todayPlan(), night: nightStatus(),
    name: process.env.STUDENT_NAME || "",
  });
}

export async function GET() {
  try {
    if (!(await isStudent())) return deny();
    return await snapshot();
  } catch (e) { return NextResponse.json(safeError(e, "state"), { status: 500 }); }
}

/** Word overlap of what she typed with the passage (review 01 L3: only the word COUNT was checked). */
function wordOverlap(passage, typed) {
  const w = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
  const p = w(passage), t = w(typed);
  if (!p.length) return 0;
  const m = new Map(); for (const x of t) m.set(x, (m.get(x) || 0) + 1);
  let hit = 0; for (const x of p) { const n = m.get(x) || 0; if (n) { hit++; m.set(x, n - 1); } }
  return hit / p.length;
}

export async function POST(req) {
  try {
    if (!(await isStudent())) return deny();
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b;
    try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    // ---- A line for her logbook, in her own words. Allowed at any time.
    if (b.journal) {
      const text = String(b.journal.text || "").trim().slice(0, 600);
      if (text.split(/\s+/).length < 6) return NextResponse.json({ error: "A little more - at least one full sentence." }, { status: 400 });
      await q("INSERT INTO journal (module_id, step_id, kind, title, body) VALUES ($1,$2,'note',$3,$4)",
        [String(b.journal.module_id || "").slice(0, 20) || null, String(b.journal.step_id || "").slice(0, 40) || null, String(b.journal.title || "").slice(0, 200) || null, text]);
      return await snapshot({ saved: true });
    }

    // ---- Claiming one of Abid's real rewards: recorded once, shown to Abid on the dashboard as owed.
    if (b.claim) {
      const rw = await computeRewards();
      const u = rw.unlocks.find((x) => x.id === String(b.claim));
      if (!u || !u.reached) return NextResponse.json({ error: "not reached yet" }, { status: 400 });
      if (!u.claimed) await q("INSERT INTO journal (kind, title, body) SELECT 'claim', $1, $2 WHERE NOT EXISTS (SELECT 1 FROM journal WHERE kind='claim' AND title=$1)", [u.id, `${u.title}: ${u.reward}`]);
      return await snapshot({ claimed: u.id });
    }

    const cur = await currentModule();
    if (!cur) return NextResponse.json({ error: "no current module" }, { status: 400 });
    const m = cur.module;
    const step = m.steps[cur.row.step_index];
    const remediation = cur.row.remediation || null;
    // 29 Oct 2026 (review 01 H2): time from the browser is clamped by the server's clock - an event claims at most the
    // wall-clock time since the last thing the server saw of this step (+10%), never more than an hour.
    const clampFrom = async (baseline) => clampActive(b.active_ms, baseline !== undefined ? baseline : await lastTraceAt(step.id));
    const startedFor = (ms) => new Date(Date.now() - ms).toISOString();

    // ---- Her checkpoint answers so far, kept on the server so a reload or a recess never loses them (29 Oct 2026).
    if (b.checkDraft) {
      if (step.kind !== "check") return NextResponse.json({ error: "not a checkpoint" }, { status: 400 });
      const answers = Array.isArray(b.checkDraft.answers) ? b.checkDraft.answers.slice(0, 40).map((a) => (a == null ? null : String(a).slice(0, 100))) : [];
      const r = await q("UPDATE qsets SET draft=$3 WHERE id=$1 AND step_id=$2 AND kind='check' AND NOT done RETURNING id", [String(b.checkDraft.qsetId || "").slice(0, 64), step.id, JSON.stringify(answers)]);
      return NextResponse.json(r.length ? { ok: true } : { error: "no such set" }, { status: r.length ? 200 : 400 });
    }

    // ---- One practice answer: graded here, streaks kept here. The browser only learns right/wrong + hint.
    if (b.answer) {
      if (step.kind !== "practice") return NextResponse.json({ error: "not practice" }, { status: 400 });
      const rows = await q("SELECT * FROM qsets WHERE id=$1 AND step_id=$2 AND kind='practice' AND NOT done AND NOT void", [String(b.answer.qsetId || "").slice(0, 64), step.id]);
      if (!rows.length) return NextResponse.json({ error: "no such set" }, { status: 400 });
      const set = rows[0];
      const i = Number(b.answer.index);
      const qq = Number.isInteger(i) ? set.questions[i] : null;
      if (!qq) return NextResponse.json({ error: "no such question" }, { status: 400 });
      const ok = answerMatches(qq.a, b.answer.value);
      await q("INSERT INTO answers (module_id, step_id, qset_id, skill, question, given, ok) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [m.id, step.id, set.id, String(qq.skill || "").slice(0, 60), String(qq.q).slice(0, 400), String(b.answer.value ?? "").slice(0, 100), ok]);
      const streak = set.streak || {}, stuck = set.stuck || {};
      // Abid's rule (4 Oct 2026): two wrong answers on one question -> she gets the answer and the reason, then a similar
      // question (a variant written with the set) checks that it landed. Variants are appended to the set as new questions.
      let help = null, reveal = null, variantIndex = null;
      const questions = set.questions;
      // 29 Oct 2026 (review 01 M1): a question already answered right, or whose answer was shown, never moves the streak
      // again - resubmitting one right answer used to finish a whole set.
      const counts = !qq.solved && !qq.revealed;
      qq.tries = (qq.tries || 0) + 1;
      if (ok) { if (counts) { streak[qq.skill] = (streak[qq.skill] || 0) + 1; stuck[qq.skill] = 0; } qq.solved = true; }
      else if (counts) {
        streak[qq.skill] = 0;
        if (qq.tries >= 2) {
          const pool = qq.variants || [];
          const used = questions.filter((x) => x.parent === (qq.parent ?? i)).length;
          const v = pool[used];
          // 17 Oct 2026: a variant used to inherit its parent's explain/hint, so after two misses on "lives = 3 ... * 4"
          // she was shown answer 20 with the parent's reasoning ("score starts at 10 ... 15 * 2 = 30"). A variant now carries
          // only its OWN explain/hint (older sets have none: then a neutral line, never someone else's numbers).
          const own = qq.parent == null;
          const inherited = !own && qq.explain && questions[qq.parent]?.explain === qq.explain; // sets made before this fix
          reveal = { answer: Array.isArray(qq.a) ? qq.a[0] : String(qq.a), why: String((inherited ? "" : qq.explain) || (own ? qq.hint : "") || "Go through it one line at a time, from the top, and write down what each box holds after each line.") };
          qq.revealed = true;
          if (v) {
            questions.push({ skill: qq.skill, q: String(v.q).slice(0, 400), a: Array.isArray(v.a) ? v.a : [String(v.a)], hint: String(v.hint || ""), explain: String(v.explain || ""), variants: [], parent: qq.parent ?? i, tries: 0 });
            variantIndex = questions.length - 1;
          } else {
            // Variants used up: a short tutor detour on this skill, then on.
            stuck[qq.skill] = (stuck[qq.skill] || 0) + 1;
            if (stuck[qq.skill] >= 2) { help = qq.skill; stuck[qq.skill] = 0; }
          }
        }
      }
      const done = Object.keys(streak).length > 0 && Object.values(streak).every((n) => n >= NEED);
      // Optimistic lock (review 01 L10): two answers at once used to overwrite each other's streak.
      const upd = await q("UPDATE qsets SET questions=$5, streak=$2, stuck=$3, attempts=attempts+1, done=$4 WHERE id=$1 AND attempts=$6 AND NOT done RETURNING id",
        [set.id, JSON.stringify(streak), JSON.stringify(stuck), done, JSON.stringify(questions), set.attempts]);
      if (!upd.length) return NextResponse.json({ error: "busy - send that answer again" }, { status: 409 });
      if (done) {
        const ms = await clampFrom(set.started_at);
        await q(`INSERT INTO events (module_id, step_id, kind, started_at, ended_at, active_ms, attempts, passed, payload) VALUES ($1,$2,'practice',$3,now(),$4,$5,true,$6)`,
          [m.id, step.id, startedFor(ms), ms, set.attempts + 1, JSON.stringify({ streak })]);
        await q("INSERT INTO completions (key, module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [step.id, m.id]);
        // 9 Nov 2026 (practice spine): every skill of a finished practice set goes on the review ladder, due tomorrow.
        await learned(step.skills || Object.keys(streak), m.id).catch(() => {});
      }
      return NextResponse.json({ ok, counted: counts, hint: ok || reveal ? null : String(qq.hint || ""), streak, done, help, need: NEED, reveal, variantIndex, questions: variantIndex != null ? stripQ(questions) : undefined });
    }

    // ---- Checkpoint or diagnostic: batch graded against the server-held bank.
    if (b.grade) {
      let bank, setId = null, baseline;
      if (step.kind === "diagnostic") bank = step.questions;
      else if (step.kind === "check") {
        // 29 Oct 2026 (review 01 H5): fix first, enforced HERE too (it was only checked when a set was generated) ...
        if (remediation && !(await q("SELECT 1 FROM completions WHERE key=$1", [`${step.id}:fix`])).length) return NextResponse.json({ error: "fix first" }, { status: 409 });
        // ... and the set is claimed in one statement, so two grade requests cannot both mark it.
        const rows = await q("UPDATE qsets SET graded_at=now(), done=true WHERE id=$1 AND step_id=$2 AND kind='check' AND graded_at IS NULL AND NOT done AND NOT void RETURNING questions, started_at", [String(b.grade.qsetId || "").slice(0, 64), step.id]);
        if (!rows.length) return NextResponse.json({ error: "no such set" }, { status: 400 });
        bank = rows[0].questions; setId = String(b.grade.qsetId); baseline = rows[0].started_at;
      } else return NextResponse.json({ error: "nothing to grade" }, { status: 400 });

      const answers = Array.isArray(b.grade.answers) ? b.grade.answers.slice(0, bank.length).map((a) => String(a ?? "").slice(0, 100)) : [];
      let correct = 0; const wrong = [];
      bank.forEach((qq, i) => {
        if (answerMatches(qq.a, answers[i])) correct++;
        else wrong.push({ skill: qq.skill, q: qq.q, given: answers[i] ?? "" });
      });
      const score = correct / bank.length;
      // 20 Oct 2026: after three failed checks on the same checkpoint, 60% passes (the mercy teach-backs already have).
      // 29 Oct 2026 (review 01 H5): only checks she really answered count (at least half the answers not blank) - three
      // blank hand-ins in a row used to drop the mark to 60%.
      let priorFails = 0;
      if (step.kind === "check") {
        const prev = await q("SELECT payload FROM events WHERE step_id=$1 AND kind='check' AND passed=false", [step.id]);
        priorFails = prev.filter((r) => isRealAttempt(r.payload)).length;
      }
      const passMark = priorFails >= 3 ? 0.6 : PASS_MARK;
      const passed = step.kind === "check" ? score >= passMark : null;
      const ms = await clampFrom(baseline);
      await q(`INSERT INTO events (module_id, step_id, kind, started_at, ended_at, active_ms, attempts, score, passed, payload) VALUES ($1,$2,$3,$4,now(),$5,1,$6,$7,$8)`,
        [m.id, step.id, step.kind, startedFor(ms), ms, score, passed, JSON.stringify({ answers, wrong, total: bank.length, qsetId: setId })]);

      const result = { score, correct, total: bank.length, wrong, passed };
      // 9 Nov 2026 (practice spine): right skills join the ladder (due tomorrow); missed ones drop to the bottom of it.
      if (step.kind === "check") {
        const missed = new Set(wrong.map((w) => String(w.skill || step.id)));
        const right = [...new Set(bank.map((qq) => String(qq.skill || step.id)))].filter((k) => k && !missed.has(k));
        await learned(right, m.id).catch(() => {});
        await learned([...missed].filter(Boolean), m.id, { ok: false }).catch(() => {});
      }
      if (step.kind === "diagnostic") {
        await q("INSERT INTO completions (key, module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [step.id, m.id]);
      } else if (passed) {
        await q("UPDATE progress SET remediation=NULL, best_score=GREATEST(COALESCE(best_score,0),$2) WHERE module_id=$1", [m.id, score]);
        await q("INSERT INTO completions (key, module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [step.id, m.id]);
      } else {
        const skills = [...new Set(wrong.map((w) => w.skill))];
        await setRemediation(m.id, skills, score);
        await q("DELETE FROM completions WHERE key=$1", [`${step.id}:fix`]); // must fix again before the next re-check
        result.remediation = skills;
      }
      return await snapshot({ result });
    }

    // ---- Typing check: the typed text is verified here.
    if (b.typing) {
      if (step.kind !== "typing") return NextResponse.json({ error: "not typing" }, { status: 400 });
      const typed = String(b.typing.text || "").slice(0, 2000);
      const words = step.passage.trim().split(/\s+/).length;
      const typedWords = typed.trim().split(/\s+/).filter(Boolean).length;
      const secs = Math.max(5, Math.min(3600, Number(b.typing.seconds) || 60));
      if (typedWords < words * 0.9) return NextResponse.json({ error: "not finished" }, { status: 400 });
      // 29 Oct 2026 (review 01 L3): the words must be the passage's words (80% of them), not any words.
      if (wordOverlap(step.passage, typed) < 0.8) return NextResponse.json({ error: "not the passage" }, { status: 400 });
      const wpm = Math.round(words / (secs / 60));
      const ms = await clampFrom();
      await q(`INSERT INTO events (module_id, step_id, kind, started_at, ended_at, active_ms, score, passed, payload) VALUES ($1,$2,'typing',$3,now(),$4,$5,true,$6)`,
        [m.id, step.id, startedFor(ms), ms, wpm, JSON.stringify({ wpm, typed })]);
      await q("INSERT INTO completions (key, module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [step.id, m.id]);
      return NextResponse.json({ wpm });
    }

    // ---- Timing for lesson/code steps (the completion itself was recorded by the tutor route).
    if (b.timing) {
      if (!["lesson", "code"].includes(step.kind)) return NextResponse.json({ error: "no timing here" }, { status: 400 });
      const ms = await clampFrom();
      if (ms > 0 || !b.timing.partial) await q(`INSERT INTO events (module_id, step_id, kind, started_at, ended_at, active_ms, payload) VALUES ($1,$2,$3,$4,now(),$5,$6)`,
        [m.id, step.id, step.kind, startedFor(ms), ms, JSON.stringify({ turns: Math.min(500, Number(b.timing.turns) || 0), partial: !!b.timing.partial, reported: Math.min(3600000, Math.max(0, Number(b.active_ms) || 0)) })]);
      if (b.timing.partial && !b.advance) return await snapshot();
    }

    // ---- Advance: only if the server itself recorded this step as complete.
    if (b.advance) {
      // Round 2 (B, review 02 L1): an advance for a step she is no longer on (a second tab, a double press) is refused.
      if (b.step_id != null && String(b.step_id) !== step.id) return NextResponse.json({ error: "stale step" }, { status: 409 });
      const done = await q("SELECT 1 FROM completions WHERE key=$1", [step.id]);
      if (!done.length || (step.kind === "check" && remediation)) return NextResponse.json({ error: "step not complete" }, { status: 409 });
      const isLast = cur.row.step_index >= m.steps.length - 1;
      // Logbook: the step is recorded by the server, with the code she shipped if this was a code step.
      const proof = step.kind === "code" && b.proof ? String(b.proof).slice(0, 4000) : null;
      if (isLast) {
        const best = await q("SELECT best_score FROM progress WHERE module_id=$1", [m.id]);
        // Only the request that really passes the module writes the journal (review 01 L10: twice = two rows).
        if (await passModule(m.id, Number(best[0]?.best_score ?? 1))) {
          await q("INSERT INTO journal (module_id, step_id, kind, title, body) VALUES ($1,$2,'step',$3,$4)", [m.id, step.id, `${step.title} (${step.kind})`, proof]);
          await q("INSERT INTO journal (module_id, step_id, kind, title, body) VALUES ($1,NULL,'module',$2,NULL)", [m.id, `${m.id} · ${m.title} - passed`]);
        }
      } else if (await advanceStep(m.id, cur.row.step_index + 1, cur.row.step_index)) {
        await q("INSERT INTO journal (module_id, step_id, kind, title, body) VALUES ($1,$2,'step',$3,$4)", [m.id, step.id, `${step.title} (${step.kind})`, proof]);
      }
    }
    return await snapshot();
  } catch (e) { return NextResponse.json(safeError(e, "state"), { status: 500 }); }
}
