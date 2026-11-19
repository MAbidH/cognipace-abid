import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError, logError, reserveCall, finishCall, budgetPaused, noteBudgetPaused } from "../../../lib/guard";
import { getModule } from "../../../lib/curriculum";
import { tutorModel, todayPlan } from "../../../lib/calendar";
import { skillsNeedingQuestions, addToBank, reviewToday } from "../../../lib/review";

export const runtime = "nodejs";

/* The practice spine's question writer (9 Nov 2026, lib/review.js). POST {} from the warm-up, fire and forget: when a due
   skill has no question left that she has not just answered right, the model writes two fresh ones for it, inside the
   module's `taught` fence, and they go into review_bank for every later review. At most GEN_PER_DAY skills a day, every
   call reserved against the daily ceiling like any tutor call. Answers never leave the server. */
const GEN_PER_DAY = 4;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 45000, maxRetries: 1 });

const SYSTEM = `You write review questions for a 13-year-old with B1 English who is revising ONE skill she already learned.
Return ONLY a JSON array of exactly 2 items, no prose, no code fences. Each item: {"q": string, "a": [string, ...alternates], "explain": string}.
ONE short sentence, ONE ask, everyday words only - never "convert", "evaluate", "determine", "express", "denote". The same pictures the lessons used.
CODE IN A QUESTION: every line of code on its OWN line, separated by \\n, indented with four spaces.
Answers: a single number, a fraction like "3/4" in lowest terms, one word or one short command with no spaces around it - something that can be typed into one box and compared exactly. Include every equivalent form she might type ("0.5" and "1/2"; "ss -tuln" and "ss -tulpn" only if both are right). Never a question whose answer is a sentence.
"explain" is 1-2 plain sentences that show how to get the answer, for after she has missed it twice.
USE ONLY WHAT THE MODULE TAUGHT (given below). A question that needs a word, symbol or idea she has not met is a wrong question: do not write it.`;

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await reviewToday().catch(() => null); // makes sure today's set exists before we look for gaps
    const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM calls WHERE mode='review' AND at > now() - interval '24 hours'");
    if (n >= GEN_PER_DAY) return NextResponse.json({ ok: true, wrote: 0, why: "enough for today" });
    const need = await skillsNeedingQuestions(GEN_PER_DAY - n);
    let wrote = 0;
    for (const { skill, moduleId } of need) {
      const m = getModule(moduleId); if (!m) continue;
      const taught = m.taught || (m.steps || []).filter((x) => ["lesson", "code"].includes(x.kind)).flatMap((x) => x.objectives || []).join("; ");
      const seen = await q("SELECT q FROM review_bank WHERE skill=$1 ORDER BY id DESC LIMIT 10", [skill]).catch(() => []);
      const model = tutorModel();
      const res = await reserveCall("review", todayPlan().callsCeiling, 1, model);
      if (!res.ok) break;
      let text = "";
      try {
        const r = await client.messages.create({ model, max_tokens: 1200, system: SYSTEM,
          messages: [{ role: "user", content: `Module: ${m.title}. Skill: ${skill}. What the module taught: ${taught}.${seen.length ? ` Do not repeat these: ${seen.map((s) => s.q).join(" | ")}` : ""} Write exactly 2 questions.` }] });
        await finishCall(res.id, r.usage, { model });
        text = r.content.filter((x) => x.type === "text").map((x) => x.text).join("");
      } catch (e) {
        await finishCall(res.id, null, { model, ok: false, error: e?.message });
        await logError("review:generate", e, false);
        if (budgetPaused(e)) { await noteBudgetPaused(e); break; }
        continue;
      }
      let items = [];
      try { const t = text.trim(); const s0 = t.indexOf("["); items = JSON.parse(t.slice(s0 >= 0 ? s0 : 0, t.lastIndexOf("]") + 1)); } catch (e) { await logError("review:parse", e, false); continue; }
      for (const it of (Array.isArray(items) ? items : []).slice(0, 2)) if (await addToBank(skill, moduleId, it)) wrote++;
    }
    return NextResponse.json({ ok: true, wrote, skills: need.length });
  } catch (e) { return NextResponse.json(safeError(e, "review"), { status: 500 }); }
}
