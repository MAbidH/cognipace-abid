/* Small pure helpers for the guardian page and the teach-back (29 Oct 2026). Tested in scripts/test-server.mjs. */

/** "How is she" (review 05, rec. 12): counts in her own lines. lines = array of strings (her messages). */
export function moodCounts(lines) {
  let caps = 0, idk = 0, confused = 0;
  for (const raw of lines || []) {
    const t = String(raw || "").replace(/^\[screenshot\]\s*/, "").replace(/^\[program output\][\s\S]*/, "").trim();
    if (!t) continue;
    const letters = t.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 6 && letters === letters.toUpperCase()) caps++;
    if (/\b(i\s*(do\s*not|don'?t|dont)\s*know|idk|dunno|no idea)\b/i.test(t)) idk++;
    if (/\b(wdym|huh|what do you mean|i (do\s*not|don'?t|dont) (understand|get it)|confus|i can'?t (find|read|see)|where is|we weren'?t here)\b/i.test(t) || /\?\?/.test(t)) confused++;
  }
  return { caps, idk, confused };
}

const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

/** Near-identical texts (a teach-back handed in again unchanged, or with a word or two moved): token-multiset overlap
    of at least 90% on both sides. */
export function nearSame(a, b) {
  const x = words(a), y = words(b);
  if (!x.length || !y.length) return false;
  const count = (arr) => arr.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map());
  const cx = count(x), cy = count(y);
  let common = 0;
  for (const [w, n] of cx) common += Math.min(n, cy.get(w) || 0);
  return common / x.length >= 0.9 && common / y.length >= 0.9;
}

/** The grader's reply, read strictly: the first {...} object in the text, with a numeric score 0..1. Else null. */
export function parseGrade(text) {
  const t = String(text || "").replace(/```json|```/g, "");
  const s = t.indexOf("{");
  if (s < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = s; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        const o = JSON.parse(t.slice(s, i + 1));
        const score = Number(o?.score);
        if (!Number.isFinite(score) || score < 0 || score > 1) return null;
        return { score, feedback: String(o.feedback || "") };
      } catch { return null; }
    }
  }
  return null;
}

/** 27 Nov 2026: does a generated question's text show the construct its skill slug names? Only slugs that name a Python
    construct are checked; every other skill fits by definition. Pure; tested in scripts/test-server.mjs. */
const SKILL_NEEDS = [
  [/while/, (q) => /\bwhile\b/.test(q)],
  [/if-inside-loop/, (q) => /\bif\b/.test(q) && /\b(for|while)\b/.test(q)],
  [/if-elif-else/, (q) => /\b(elif|else)\b/.test(q)],
  [/for-range/, (q) => /\bfor\b/.test(q) && /range\(/.test(q)],
  [/predict-output-function/, (q) => /\bdef\b/.test(q)],
  [/modulo/, (q) => /%|\/\//.test(q)],
  [/predict-output-loop/, (q) => /\b(for|while)\b/.test(q)],
  [/predict-output-list/, (q) => /\[/.test(q)],
  [/lower-strip/, (q) => /\.(lower|strip|upper)\(/.test(q)],
];
export function skillFits(skill, q) {
  const k = String(skill || "").toLowerCase(), text = String(q || "");
  for (const [re, ok] of SKILL_NEEDS) if (re.test(k) && !ok(text)) return false;
  return true;
}
