/* Checkpoint helpers, pure (29 Oct 2026). Tested in scripts/test-server.mjs. */

/** How many answers in a list are not blank. */
export function realAnswerCount(answers) {
  return (Array.isArray(answers) ? answers : []).filter((a) => String(a ?? "").trim() !== "").length;
}

/** A graded check event counts toward the 60%-after-three-fails mercy only if she really answered it: at least half
    of its questions have a non-blank answer. payload = the event's {answers, wrong, total?}. */
export function isRealAttempt(payload) {
  const answers = Array.isArray(payload?.answers) ? payload.answers : [];
  const total = Number(payload?.total) || Math.max(answers.length, Array.isArray(payload?.wrong) ? payload.wrong.length : 0);
  if (!total) return false;
  return realAnswerCount(answers) * 2 >= total;
}

/** First-try and final score per checkpoint step, from check events oldest first: [{step_id, score, passed}]. */
export function checkSummary(events) {
  const by = {};
  for (const e of events || []) {
    const r = (by[e.step_id] ||= { step_id: e.step_id, first: Number(e.score), final: Number(e.score), tries: 0, passed: false });
    r.tries++; r.final = Number(e.score); if (e.passed) r.passed = true;
  }
  return Object.values(by);
}
