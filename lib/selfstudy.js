/* When the tutor cannot answer (the budget is paused, the API failed), the room still shows something useful (29 Oct 2026,
   review 06 "a mode where she can keep working when the tutor is down"). Built from the step itself; no answers, no
   tutor_brief. Pure; tested in scripts/test-server.mjs. Shape is in the fix-day CONTRACT.md:
   { title, objectives: [string], tryThis: [string], starter?: string } */
export function selfStudy(step) {
  if (!step) return null;
  const objectives = (step.objectives || []).map((o) => String(o).slice(0, 200)).slice(0, 6);
  const tryThis = [];
  if (step.kind === "code") {
    tryThis.push("Run the starter code in your editor (Ctrl+Enter). Before you run it, say out loud what you think it will print.");
    tryThis.push("Change one number or one word in it, predict again, and run it again.");
  }
  for (const o of objectives.slice(0, 3)) tryThis.push(`In your notebook, explain in one or two sentences: ${o.replace(/\.$/, "")}.`);
  tryThis.push("Write down one question you want to ask the tutor when it is back.");
  const out = { title: String(step.title || "").slice(0, 120), objectives, tryThis };
  if (step.kind === "code" && step.starter) out.starter = String(step.starter).slice(0, 4000);
  return out;
}
