/* What a model call costs, in dollars (29 Oct 2026, review 03 M1: the guardian Cost line had tokens only, no cache
   tokens and no model, so months could not be priced). Pure - tested in scripts/test-server.mjs.
   Prices per million tokens (platform.claude.com, 14 Oct 2026). Cache write (5-minute) = 1.25 x input, cache read = 0.1 x. */

export const PRICES = {
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-fable-5-1": { in: 10, out: 50 },
};
const round2 = (x) => Math.round(x * 100) / 100;
// Abid's console limit for this instance, USD per calendar month - shown, never changed by the app. Faiza's: 200 (raised
// from 60; confirmed 8 Nov 2026). 19 Nov 2026: the second instance sets the Vercel env SPEND_LIMIT_USD (this file stays
// dependency-free so the plain-node unit tests can import it).
export const SPEND_LIMIT = Number(process.env.SPEND_LIMIT_USD) || 200;

/** Price row for a model id: exact, then by family name; unknown models are priced as Opus (the scheduled model). */
export function priceOf(model) {
  const m = String(model || "");
  if (PRICES[m]) return PRICES[m];
  if (/fable/i.test(m)) return PRICES["claude-fable-5-1"];
  if (/sonnet/i.test(m)) return PRICES["claude-sonnet-5-5"];
  return PRICES["claude-opus-5-5"];
}

/** Dollars for one call. usage = the API's usage object (input_tokens excludes the cache tokens). */
export function callCost(model, usage) {
  const p = priceOf(model);
  const n = (k) => Math.max(0, Number(usage?.[k]) || 0);
  return (n("input_tokens") * p.in + n("cache_creation_input_tokens") * p.in * 1.25 + n("cache_read_input_tokens") * p.in * 0.1 + n("output_tokens") * p.out) / 1e6;
}

/** Month-to-date spend and a projection to the end of the month.
    byDay: { 'YYYY-MM-DD': usd } for this calendar month (UTC, like the console's month); today: 'YYYY-MM-DD'.
    The daily rate is the larger of the month's average and the last 7 days' average, so a heavier stretch (winter)
    shows up within days. Returns { mtd, rate, projected, limit, hitDate (YYYY-MM-DD or null), over }. */
export function projectMonth(byDay, today, limit = SPEND_LIMIT) {
  const [y, mo, d] = today.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const mtd = Object.entries(byDay).filter(([k]) => k.slice(0, 7) === today.slice(0, 7) && k <= today).reduce((a, [, v]) => a + Number(v || 0), 0);
  // 1 Nov 2026: last month's days no longer count (the model, the prices and the limit all reset with the month - on
  // 1 Nov, October's Fable week divided by one day "projected" $453).
  const last7 = Object.entries(byDay).filter(([k]) => k.slice(0, 7) === today.slice(0, 7) && k <= today && k > addDaysYmd(today, -7)).reduce((a, [, v]) => a + Number(v || 0), 0);
  const rate = Math.max(mtd / d, last7 / Math.min(7, d));
  const left = daysInMonth - d;
  const projected = mtd + rate * left;
  let hitDate = null;
  if (mtd >= limit) hitDate = today;
  else if (rate > 0) { const k = Math.ceil((limit - mtd) / rate); if (k <= left) hitDate = addDaysYmd(today, k); }
  return { mtd: round2(mtd), rate: round2(rate), projected: round2(projected), limit, hitDate, over: projected > limit };
}

function addDaysYmd(ymd, n) { return new Date(new Date(ymd + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10); }
