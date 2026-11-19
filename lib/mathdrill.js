/* THE MATHS FLUENCY DRILL (3 Nov 2026, Abid: "she needs to be extremely good in math ... fast and efficient").
   Part of the daily warm-up: 20 quick questions, timed. Facts that should come without thinking - times tables,
   division facts, adding and taking away, a fraction simplified, a fraction of a number, x10 / /10, simple percentages,
   squares. The set is fixed for the Dhaka day (same day -> same questions; the server regrades from the day number, so
   the answers never leave the server). Pure; tested in scripts/test-server.mjs.
   Speed targets for typing and for this drill grow week by week (wpmTarget, mathTarget). */

export const MATH_COUNT = 20;
export const MATH_START = "2026-11-02"; // the week the targets start from

/** A small seeded random generator (mulberry32) so a day always gives the same set. */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

const KINDS = [
  (r) => { const a = 3 + Math.floor(r() * 10), b = 3 + Math.floor(r() * 10); return { q: `${a} × ${b}`, a: String(a * b) }; },
  (r) => { const a = 3 + Math.floor(r() * 10), b = 2 + Math.floor(r() * 11); return { q: `${a * b} ÷ ${a}`, a: String(b) }; },
  (r) => { const a = 15 + Math.floor(r() * 70), b = 12 + Math.floor(r() * 60); return { q: `${a} + ${b}`, a: String(a + b) }; },
  (r) => { const a = 50 + Math.floor(r() * 50), b = 11 + Math.floor(r() * 38); return { q: `${a} − ${b}`, a: String(a - b) }; },
  (r) => { const pairs = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8], [5, 8], [7, 10]]; const [p, d] = pairs[Math.floor(r() * pairs.length)], k = 2 + Math.floor(r() * 4); return { q: `Simplify ${p * k}/${d * k}`, a: `${p}/${d}`, frac: true }; },
  (r) => { const d = [2, 3, 4, 5, 10][Math.floor(r() * 5)], k = 2 + Math.floor(r() * 9); return { q: `1/${d} of ${d * k}`, a: String(k) }; },
  (r) => { const x = (1 + Math.floor(r() * 99)) / 10; const up = r() < 0.5; return up ? { q: `${x} × 10`, a: String(Math.round(x * 100) / 10) } : { q: `${Math.round(x * 10)} ÷ 10`, a: String(x) }; },
  (r) => { const p = [10, 20, 25, 50][Math.floor(r() * 4)], base = [20, 40, 60, 80, 100, 120, 200][Math.floor(r() * 7)]; return { q: `${p}% of ${base}`, a: String((p * base) / 100) }; },
  (r) => { const a = 2 + Math.floor(r() * 14); return { q: `${a}²  (${a} × ${a})`, a: String(a * a) }; },
];

/** The day's set: [{ q, a, frac? }] (server only - the answers stay here). dayIndex = lib/drills dhakaDayIndex(). */
export function mathSet(dayIndex, n = MATH_COUNT) {
  const r = rng(0x5eed ^ (Number(dayIndex) * 2654435761));
  const out = [], seen = new Set();
  // a fixed mix: 6 times tables, 3 division, 2 add, 2 take away, 2 fractions, 1 fraction-of, 2 decimals, 1 percent, 1 square
  const mix = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 8];
  for (let i = 0; i < n; i++) {
    let item, guard = 0;
    do { item = KINDS[mix[i % mix.length]](r); } while (seen.has(item.q) && guard++ < 20);
    seen.add(item.q); out.push(item);
  }
  // shuffle so the kinds are mixed (mixed practice beats blocks of one kind)
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** What she sees: the questions only. */
export const mathQuestions = (dayIndex) => mathSet(dayIndex).map((x) => x.q);

/** "2/4" and "1/2" are not the same answer here: the question asks to simplify. Numbers compare as numbers. */
export function sameAnswer(given, want, frac = false) {
  const g = String(given ?? "").trim().replace(/\s+/g, "").replace(",", ".").replace(/^\+/, "");
  if (!g) return false;
  if (frac || want.includes("/")) return g === want;
  const x = Number(g), y = Number(want);
  return Number.isFinite(x) && Math.abs(x - y) < 1e-9;
}

/** Grade a submission: answers = [string]; returns { score, total, wrong: [{ i, q, given, a }] }. */
export function gradeMath(dayIndex, answers) {
  const set = mathSet(dayIndex);
  const wrong = [];
  let score = 0;
  set.forEach((x, i) => { const g = Array.isArray(answers) ? String(answers[i] ?? "").slice(0, 20) : ""; if (sameAnswer(g, x.a, x.frac)) score++; else wrong.push({ i, q: x.q, given: g, a: x.a }); });
  return { score, total: set.length, wrong };
}


/* 8 Nov 2026 (Abid, after the audit): the targets follow HER last week, not the calendar. The calendar ratchet (15 wpm
   +2 a week to 40; 4 min -15 s a week to 90 s) showed "not yet" every day while she was at ~6 wpm.
   history = [{ ymd, drill_wpm, math_score, math_seconds }] - any days; only the 7 days before ymd count. */
const median = (xs) => { const a = [...xs].sort((x, y) => x - y); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; };
const lastWeek = (history, ymd) => {
  const end = new Date(ymd + "T00:00:00Z").getTime(), start = end - 7 * 86400000;
  return (history || []).filter((h) => { const t = new Date(String(h.ymd).slice(0, 10) + "T00:00:00Z").getTime(); return t >= start && t < end; });
};

/** Typing speed target on the drill line: her median of the last 7 days + 1 wpm (at least 6, never above 25); 8 to start. */
export function wpmTarget(ymd, history = []) {
  const m = median(lastWeek(history, ymd).map((h) => Number(h.drill_wpm)).filter((x) => Number.isFinite(x) && x > 0));
  return m == null ? 8 : Math.min(25, Math.max(6, Math.round(m) + 1));
}

/** Maths drill target: 18 of 20, inside her median time of the last 7 days (days she had 18+) minus 5 s, never under 90 s;
    4 minutes to start. */
export function mathTarget(ymd, history = []) {
  const m = median(lastWeek(history, ymd).filter((h) => Number(h.math_score) >= 18).map((h) => Number(h.math_seconds)).filter((x) => Number.isFinite(x) && x > 0));
  return { score: 18, seconds: m == null ? 240 : Math.max(90, Math.round((m - 5) / 5) * 5) };
}
