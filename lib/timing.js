/* Client-reported time is clamped by the server's own clock (29 Oct 2026, review 01 H2: one POST of active_ms=3600000
   fired the 40-minute TIME BOX and made a fake session day). An event can claim no more than the wall-clock time since
   the last event the server recorded for that step (+10%, +1 s), and never more than an hour. Pure; tested in
   scripts/test-server.mjs. The database lookup lives in lib/presence.js lastTraceAt(). */

export const SLACK_MS = 1000;               // clock jitter between her laptop and the server
export const SLACK_RATIO = 1.1;            // at most 10% more than the wall clock (so many tiny POSTs gain nothing)
export const MAX_EVENT_MS = 60 * 60 * 1000; // one event never logs more than an hour (unchanged rule)
export const FIRST_MS = 5 * 60 * 1000;      // nothing on record for this step yet: at most five minutes

/** reported: ms the browser says; lastAt: Date/ISO/ms of the last server trace for the step (or null); now: ms. */
export function clampActive(reported, lastAt, now = Date.now()) {
  const r = Math.max(0, Math.min(MAX_EVENT_MS, Number(reported) || 0));
  const last = lastAt == null ? NaN : new Date(lastAt).getTime();
  const allowed = Number.isFinite(last) ? Math.max(0, now - last) * SLACK_RATIO + SLACK_MS : FIRST_MS;
  return Math.round(Math.min(r, allowed));
}
