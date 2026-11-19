/* The Arena (Abid, 4 Oct 2026): every second day, ten minutes of games at the end of her session. Half game, half
   spaced review: the quiz pulls old questions back (weighted to the ones she got wrong), the lamp race is binary at
   speed, Which key? drills the key moves, Spot the bug and Type the line are code reflexes, the Picture round is a
   quiz drawn in pictures. Everything is scored on the server; nothing here costs a model call. Server only. */
import modules from "../curriculum/modules.json";
import { q } from "./db";
import { SHORTCUTS, LINUX_SHORTCUTS, matches, pickKeys } from "./shortcuts";
import { DRILLS, drillAccuracy } from "./drills";
import { dhakaDayIndex } from "./drills";
import { norm } from "./guard";

export const ARENA_MINUTES = 10;
/** Even Dhaka day index = Arena, odd = Wonder. Exported so the map and the nav agree. */
export const isArenaDay = (now = Date.now()) => dhakaDayIndex(now) % 2 === 0;

const pick = (arr, n, rnd) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
/** Deterministic-ish randomness per call (seeded by time) so two starts in a day differ. */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const BUGS = [
  { lines: ['name = "Faiza"', 'print(Hello, name)', 'print(len(name))'], bug: 2, why: 'Hello has no quotes, so Python looks for a variable called Hello.' },
  { lines: ['total = 0', 'for i in range(1, 4)', '    total = total + i'], bug: 2, why: 'The for line needs a colon at the end.' },
  { lines: ['x = 7', 'if x = 7:', '    print("seven")'], bug: 2, why: 'One = puts a value in a box; == asks "are they equal?"' },
  { lines: ['age = 12', 'print("I am " + age)', 'print("done")'], bug: 2, why: 'You cannot glue text and a number with +; use str(age) or a comma.' },
  { lines: ['def area(w, h):', 'return w * h', 'print(area(3, 4))'], bug: 2, why: 'The body of a function must be indented under def.' },
  { lines: ['numbers = [1, 2, 3]', 'print(numbers[3])', 'print(numbers[0])'], bug: 2, why: 'Boxes are counted from 0, so a list of 3 has boxes 0, 1, 2 - there is no box 3.' },
  { lines: ['n = int("12")', 'm = int("twelve")', 'print(n + 1)'], bug: 2, why: 'int() can read the digits "12", but "twelve" is a word, not digits.' },
  { lines: ['print(bin(5)[2:])', 'print(bin(5)[2])', 'print(bin(5)[2:]])'], bug: 3, why: 'An extra ] - brackets must come in pairs.' },
  { lines: ['text = "hello"', 'print(text.upper)', 'print(text.upper())'], bug: 2, why: 'A method needs () to run; without them you print the recipe, not the result.' },
  { lines: ['for ch in "abc":', 'print(ch)', 'print("end")'], bug: 2, why: 'The line inside the loop must be indented.' },
  { lines: ['secret = shift("HI", 3)', 'print(secret)', 'print(shift(secret, 3))'], bug: 3, why: 'To decrypt you shift back: -3, not +3.' },
  { lines: ['count = 0', 'count + 1', 'print(count)'], bug: 2, why: 'count + 1 computes a number but throws it away; you need count = count + 1.' },
];

/* ---- Picture round: questions drawn by the client from these specs; the server keeps the answer. ---- */
function pictureQuestions(rnd, n) {
  const out = [];
  while (out.length < n) {
    const t = Math.floor(rnd() * 4);
    if (t === 0) { const v = 1 + Math.floor(rnd() * 31); out.push({ kind: "lamps", bits: v.toString(2).padStart(5, "0"), q: "These five lamps are a number. Which number? Answer with a normal number, like 22.", a: [String(v)] }); }
    else if (t === 1) { const d = [2, 3, 4, 5, 6, 8][Math.floor(rnd() * 6)]; const nn = 1 + Math.floor(rnd() * (d - 1)); out.push({ kind: "fraction", num: nn, den: d, q: "How much of the bar is filled? Answer as a fraction, like 3/4.", a: [`${nn}/${d}`] }); }
    else if (t === 2) { const w = 2 + Math.floor(rnd() * 7), h = 2 + Math.floor(rnd() * 5); const per = rnd() < 0.5; out.push({ kind: "rect", w, h, q: per ? "What is the distance all the way around this rectangle? Answer with a normal number." : "How many small squares fit inside this rectangle? Answer with a normal number.", a: [String(per ? 2 * (w + h) : w * h)] }); }
    else { const parts = ["CPU", "RAM", "SSD"]; const want = parts[Math.floor(rnd() * 3)]; const asks = { CPU: "Which part is the clerk - the one that does the work? Answer 1, 2 or 3.", RAM: "Which part is the desk - the fast memory that is wiped when the power goes? Answer 1, 2 or 3.", SSD: "Which part is the filing cabinet - the storage that keeps files when the power is off? Answer 1, 2 or 3." }; const order = pick(parts, 3, rnd); out.push({ kind: "parts", order, q: asks[want], a: [String(order.indexOf(want) + 1)] }); }
  }
  return out;
}

/** Quiz bank: fixed questions from every module she has passed, plus the questions she once got wrong (weighted in). */
async function quizQuestions(rnd, n) {
  const passed = (await q("SELECT module_id FROM progress WHERE status='passed'")).map((r) => r.module_id);
  const bank = [];
  for (const m of modules) {
    if (!passed.includes(m.id)) continue;
    for (const s of m.steps) if (Array.isArray(s.questions)) for (const x of s.questions) if (x.q && x.a) bank.push({ q: x.q, a: x.a, skill: x.skill || s.id, from: m.id });
  }
  // 9 Nov 2026 (practice spine): most modules have no hand-written bank - the quiz drew only from M2. Now it also draws
  // from every practice/check set she met in a passed module (and their variants), so every module she passed comes back.
  if (passed.length) {
    const sets = await q("SELECT module_id, questions FROM qsets WHERE kind IN ('practice','check') AND module_id = ANY($1) ORDER BY started_at DESC LIMIT 120", [passed]).catch(() => []);
    const seen = new Set(bank.map((b) => b.q));
    for (const r of sets) for (const x of r.questions || []) {
      for (const y of [x, ...(Array.isArray(x.variants) ? x.variants : [])]) {
        if (!y || typeof y.q !== "string" || !Array.isArray(y.a) || !y.a.length || seen.has(y.q)) continue;
        seen.add(y.q); bank.push({ q: y.q, a: y.a, skill: x.skill || r.module_id, from: r.module_id });
      }
    }
  }
  // Things she got wrong before, from checkpoints and practice: they come back until she gets them right here.
  const wrongRows = await q("SELECT payload->'wrong' AS wrong FROM events WHERE kind='check' AND payload ? 'wrong' ORDER BY id DESC LIMIT 20");
  // ... and her misses in practice sets and the daily review (9 Nov 2026), last 60 days.
  const missRows = await q("SELECT DISTINCT question FROM answers WHERE NOT ok AND at > now() - interval '60 days' LIMIT 200").catch(() => []);
  const wrongQs = [...wrongRows.flatMap((r) => (r.wrong || []).map((w) => w.q)), ...missRows.map((r) => r.question)].filter(Boolean);
  const missed = bank.filter((b) => wrongQs.includes(b.q));
  const fresh = bank.filter((b) => !wrongQs.includes(b.q));
  const picked = [...pick(missed, Math.min(missed.length, Math.ceil(n / 2)), rnd), ...pick(fresh, n, rnd)].slice(0, n);
  return picked;
}

/* "Which key?" (29 Oct 2026, review L2): it picked from the Windows/Chrome ladder whatever her machine, so on Mint she got
   "Open the Start menu" and Chrome Incognito, and her right Firefox answers were marked wrong. Now the ladder follows
   settings.os (the same rule as the warm-up and /keys), and it prefers moves she has already PROVED in the warm-up
   (typing.shortcut_done), topped up from the start of her ladder - never moves far ahead of her. Scoring uses the same
   matches() as the warm-up, so every honest spelling the warm-up accepts ("super left/right", "Fn+Home", "ctrl t") passes. */
const ALL_MOVES = [...SHORTCUTS, ...LINUX_SHORTCUTS];
export async function keyLadder() {
  const [osRows, provedRows] = await Promise.all([
    q("SELECT value FROM settings WHERE key='os'").catch(() => []),
    q("SELECT DISTINCT shortcut_id FROM typing WHERE shortcut_done AND shortcut_id IS NOT NULL").catch(() => []),
  ]);
  const list = osRows?.[0]?.value === "linux" ? LINUX_SHORTCUTS : SHORTCUTS;
  const proved = new Set(provedRows.map((r) => r.shortcut_id));
  return { list, proved };
}
/** Build a new Arena day: five rounds. Answers stay on the server; the client gets only what it needs to draw. */
export async function buildArena() {
  const rnd = rng(Date.now() % 2147483647);
  const quiz = await quizQuestions(rnd, 12);
  const lamps = Array.from({ length: 8 }, () => 1 + Math.floor(rnd() * 255));
  const ladder = await keyLadder();
  const keys = pickKeys(ladder.list, ladder.proved, 8, rnd, pick);
  const bugs = pick(BUGS, 4, rnd);
  const line = DRILLS[Math.floor(rnd() * DRILLS.length)];
  const pics = pictureQuestions(rnd, 6);
  const rounds = [
    { id: "quiz", title: "Lightning quiz", seconds: 120, items: quiz.map((x) => ({ q: x.q, a: x.a, from: x.from })) },
    { id: "lamps", title: "Lamp race", seconds: 75, items: lamps.map((v) => ({ n: v, a: [String(v)] })) },
    { id: "keys", title: "Which key?", seconds: 60, items: keys.map((s) => ({ does: s.does, where: s.where, id: s.id })) },
    { id: "bugs", title: "Spot the bug", seconds: 90, items: bugs },
    { id: "pictures", title: "Picture round", seconds: 90, items: pics },
    { id: "line", title: "Type the line", seconds: 60, items: [{ line }] },
  ];
  return rounds;
}

/** What the browser may see of a round: never the answers. */
export function publicRounds(rounds) {
  return rounds.map((r) => ({
    id: r.id, title: r.title, seconds: r.seconds,
    items: r.items.map((it) => {
      if (r.id === "quiz") return { q: it.q, from: it.from };
      if (r.id === "lamps") return { n: it.n };
      if (r.id === "keys") return { does: it.does, where: it.where };
      if (r.id === "bugs") return { lines: it.lines };
      if (r.id === "pictures") { const { a, ...rest } = it; return rest; }
      if (r.id === "line") return { line: it.line };
      return {};
    }),
  }));
}

/** Score one round. answers: array aligned with items (strings), or for lamps the bit strings she set. Returns {points, max, detail}. */
export function scoreRound(round, answers, seconds) {
  const A = Array.isArray(answers) ? answers.map((x) => String(x ?? "").slice(0, 200)) : [];
  let points = 0, max = 0; const detail = [];
  if (round.id === "quiz") { for (const [i, it] of round.items.entries()) { max += 10; const ok = it.a.some((x) => norm(x) === norm(A[i])); if (ok) points += 10; detail.push({ ok, a: ok ? undefined : it.a[0] }); } }
  else if (round.id === "lamps") { for (const [i, it] of round.items.entries()) { max += 10; const ok = parseInt(A[i] || "x", 2) === it.n; if (ok) points += 10; detail.push({ ok, a: ok ? undefined : it.n.toString(2).padStart(8, "0") }); } }
  else if (round.id === "keys") { for (const [i, it] of round.items.entries()) { max += 10; const s = ALL_MOVES.find((x) => x.id === it.id); const ok = s ? matches(s, A[i]) : false; if (ok) points += 10; detail.push({ ok, a: ok ? undefined : s?.keys }); } }
  else if (round.id === "bugs") { for (const [i, it] of round.items.entries()) { max += 15; const ok = Number(A[i]) === it.bug; if (ok) points += 15; detail.push({ ok, a: ok ? undefined : `line ${it.bug}: ${it.why}` }); } }
  else if (round.id === "pictures") { for (const [i, it] of round.items.entries()) { max += 10; const ok = it.a.some((x) => norm(x) === norm(A[i])); if (ok) points += 10; detail.push({ ok, a: ok ? undefined : it.a[0] }); } }
  else if (round.id === "line") { max = 40; const acc = drillAccuracy(round.items[0].line, A[0] || ""); points = Math.round((acc / 100) * 40); detail.push({ ok: acc >= 95, accuracy: acc }); }
  // Speed bonus: finishing with time to spare is worth up to 20% more, only when she got most of it right.
  const frac = max ? points / max : 0;
  const left = Math.max(0, round.seconds - (Number(seconds) || round.seconds));
  const bonus = frac >= 0.7 ? Math.round(points * 0.2 * (left / round.seconds)) : 0;
  return { points: points + bonus, max, bonus, detail };
}
