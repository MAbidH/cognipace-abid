/* THE MATHS FLUENCY DRILL (3 Nov 2026, Abid: "she needs to be extremely good in math ... fast and efficient").
   Part of the daily warm-up: 20 quick questions, timed. Facts that should come without thinking - times tables,
   division facts, adding and taking away, a fraction simplified, a fraction of a number, x10 / /10, simple percentages,
   squares. The set is fixed for the Dhaka day (same day -> same questions; the server regrades from the day number, so
   the answers never leave the server). Pure; tested in scripts/test-server.mjs.
   Speed targets for typing and for this drill grow week by week (wpmTarget, mathTarget).
   25 Nov 2026 (MATHS-PLAN item 1): the drill is REQUIRED on school and winter days (one honest go), and four kinds join
   it for her 0-right review skills - rounding, an estimate (round first), comparing two fractions, and binary <-> number
   (CS1 taught binary; hex waits for DEF1). The mix stays 20. */

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
  // 9: round to the nearest 10 or 100 (no ties, so there is one right answer)
  (r) => { if (r() < 0.5) { let n; do { n = 11 + Math.floor(r() * 880); } while (n % 10 === 5 || n % 10 === 0); return { q: `Round ${n} to the nearest 10`, a: String(Math.round(n / 10) * 10) }; }
           let n; do { n = 110 + Math.floor(r() * 8800); } while (n % 100 === 50 || n % 100 === 0); return { q: `Round ${n} to the nearest 100`, a: String(Math.round(n / 100) * 100) }; },
  // 10: an estimate - round first, then multiply or add; numbers are chosen so the exact answer rounds to the same place
  (r) => { for (let k = 0; k < 40; k++) { if (r() < 0.5) { const a = [19, 21, 29, 31, 39, 41, 49, 51][Math.floor(r() * 8)], b = 2 + Math.floor(r() * 8); const est = Math.round(a / 10) * 10 * b; if (Math.round(a * b / 10) * 10 === est) return { q: `About ${a} × ${b} (round ${a} first)`, a: String(est) }; }
           else { const a = 100 + Math.floor(r() * 800), b = 100 + Math.floor(r() * 800); const est = Math.round(a / 100) * 100 + Math.round(b / 100) * 100; if (Math.round((a + b) / 100) * 100 === est) return { q: `About ${a} + ${b} (nearest 100)`, a: String(est) }; } }
           return { q: "About 21 × 4 (round 21 first)", a: "80" }; },
  // 11: which fraction is bigger (both proper, different bottoms, never equal)
  (r) => { const fr = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [5, 8], [7, 8], [7, 10]]; let x, y; do { x = fr[Math.floor(r() * fr.length)]; y = fr[Math.floor(r() * fr.length)]; } while (x[1] === y[1] || x[0] * y[1] === y[0] * x[1]);
           const big = x[0] * y[1] > y[0] * x[1] ? x : y; return { q: `Bigger: ${x[0]}/${x[1]} or ${y[0]}/${y[1]}`, a: `${big[0]}/${big[1]}`, frac: true }; },
  // 12: binary <-> normal number (4-5 bits, as CS1 taught it with the lamps)
  (r) => { const n = 5 + Math.floor(r() * 27); return r() < 0.5 ? { q: `Binary ${n.toString(2)} as a normal number`, a: String(n) } : { q: `${n} in binary (1s and 0s)`, a: n.toString(2) }; },
];

/** The day's set: [{ q, a, frac? }] (server only - the answers stay here). dayIndex = lib/drills dhakaDayIndex(). */
export function mathSet(dayIndex, n = MATH_COUNT) {
  const r = rng(0x5eed ^ (Number(dayIndex) * 2654435761));
  const out = [], seen = new Set();
  // a fixed mix of 20 (25 Nov 2026): 5 times tables, 2 division, 1 add, 2 take away, 1 simplify, 1 fraction-of, 1 decimal x10,
  // 1 percent, 1 square, 1 round, 1 estimate, 1 compare fractions, 2 binary
  const mix = [0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12];
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
