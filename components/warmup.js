/* Shared by the map (server) and the room (client): is today's optional warm-up complete? Plain module (no "use client")
   so a server page can call it. The server may send typing.allDone itself (fix-day CONTRACT); otherwise every part that
   exists today must be done. */
export function warmupDone(t) {
  if (!t) return true;
  if (typeof t.allDone === "boolean") return t.allDone;
  if (t.exam) return !!(t.drillDone && (!t.mathEnabled || t.mathDone)); // exam day: the short warm-up (5 Nov 2026)
  if (t.adult) return !!((!t.codeEnabled || t.codeDone) && (!t.spine || t.spine.done)); // 19 Nov 2026: the adult instance
  // 8 Nov 2026 (Abid, after the audit: the warm-up took 13-21 min, 14-24% of her day): keybr (6 min) and the Python line
  // are the required part; the drill line, quick maths, the key move and the vault question are extras she may do.
  // 9 Nov 2026 (practice spine): the day's review questions are part of the required warm-up (two a day, ten on Saturday);
  // each item closes after two tries, so it can never trap her.
  // 25 Nov 2026 (MATHS-PLAN): quick maths is required too - one honest go (it is marked done on the first submit, so it
  // can never trap her either); about 4 minutes. The drill line, the key move and the vault stay extras.
  return !!(t.keybrDone && (!t.codeEnabled || t.codeDone) && (!t.spine || t.spine.done) && (!t.mathEnabled || t.mathDone));
}
export const WARMUP_LINE = "Daily warm-up - about 15 minutes: six minutes of typing, your Python line, two review questions and quick maths, then your lesson";
