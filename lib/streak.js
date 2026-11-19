/* Streak counting, pure (no database, no JSON imports) so scripts/test-server.mjs can test it on synthetic days.

   A streak is a run of session days (YYYY-MM-DD, Dhaka). Two kinds of day never break it:
   - free days (Fridays = the call day, exam days, her birthday) - passed in as isFree(ymd);
   - 29 Oct 2026 (review: "a weekly rhythm, not a chain"): ONE missed ordinary day per Mon-Sun week (Dhaka). The second
     missed ordinary day in the same week breaks the streak. A forgiven or free day adds nothing to the count. */

export const addDays = (ymd, n) => new Date(new Date(ymd + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);

/** The Monday (YYYY-MM-DD) of the Mon-Sun week that holds ymd. */
export function weekOf(ymd) {
  const dow = new Date(ymd + "T00:00:00Z").getUTCDay(); // 0 Sun .. 6 Sat
  return addDays(ymd, -((dow + 6) % 7));
}

/** Length of the run that ends at `end` (counting back). */
export function runEndingAt(set, end, isFree) {
  let n = 0, d = end;
  const forgiven = new Set();
  for (let guard = 0; guard < 1000; guard++) {
    if (set.has(d)) n++;
    else if (isFree(d)) { /* free day: skipped */ }
    else {
      const w = weekOf(d);
      if (forgiven.has(w)) break; // second miss this week
      forgiven.add(w);
    }
    d = addDays(d, -1);
    // Nothing earlier than the first session day can extend the run.
    if (set.size && d < set.minDay) break;
  }
  return n;
}

/** { current, max } for sorted or unsorted session days. `today` not finished yet is not a miss. */
export function streaks(days, today, isFree = () => false) {
  const set = new Set(days);
  set.minDay = [...set].sort()[0] || today;
  const current = set.has(today) ? runEndingAt(set, today, isFree) : runEndingAt(set, addDays(today, -1), isFree);
  let max = 0;
  for (const d of set) max = Math.max(max, runEndingAt(set, d, isFree));
  return { current, max };
}
