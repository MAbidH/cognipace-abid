import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { q, db } from "./db";
import { callCost } from "./cost";

/** The student token as configured, with any stray whitespace/newline from copy-paste removed. */
export function studentToken() { return String(process.env.STUDENT_TOKEN || "").trim(); }

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const warnedMissing = new Set();
/** Cookies never hold the raw secret — only an HMAC of it. A leaked cookie can't be turned back into the link or the password. */
export function sessionValue(kind, secret) {
  // 29 Oct 2026 (review 01 M3): with the secret missing, HMAC("") was a public constant and a forged cookie passed.
  // Fail closed: no secret (or a too-short one) gives no session value at all, so safeEqual() refuses every cookie.
  const s = String(secret || "").trim();
  if (s.length < 8) { if (!warnedMissing.has(kind)) { warnedMissing.add(kind); console.error(`[auth] ${kind} secret missing or too short - every ${kind} session is refused`); } return ""; }
  return createHmac("sha256", s).update(`the-school:${kind}`).digest("base64url");
}

export function sameOrigin(req) {
  // Primary signal: Sec-Fetch-Site is set by the browser, cannot be forged by page
  // scripts, and reports "same-origin" for our own forms and fetches. This avoids the
  // Origin-host vs Host-header mismatch that occurs behind Vercel's proxy.
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  // Fallback for browsers that don't send Sec-Fetch-Site: compare the Origin's host to
  // the public host (x-forwarded-host behind the proxy, else Host).
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin navigations and some Safari fetches omit it
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64) || null;
}

const DAILY_CALLS = Number(process.env.MAX_TUTOR_CALLS_PER_DAY || 300);
const PER_MINUTE = Number(process.env.MAX_TUTOR_CALLS_PER_MINUTE || 12);

/* ---------- Model calls: reserved BEFORE the request, finished after (29 Oct 2026, review 01 M2 / 03 M1) ----------
   The old check counted rows written only after a call succeeded, so 50 parallel requests all passed, and a call that
   failed after being billed was never counted. Now a row is reserved under an advisory lock (the count and the insert
   cannot interleave across instances), with a WEIGHT: a chat turn is 1, a question generator ~6 (a checkpoint with 12k
   output tokens is not one chat turn). finishCall() writes the real tokens, cache tokens, model and dollars, and the
   real weight (output tokens / 2000, at least 1). A failed call keeps its reservation and is marked ok=false. */
const LOCK_KEY = 7310429; // any constant: one lock for the calls ceiling

/** Reserve one call. Returns { ok: true, id } or { ok: false, reason } (her wording). */
export async function reserveCall(mode, ceiling, weight = 1, model = null) {
  const p = await db();
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock($1)", [LOCK_KEY]);
    const { rows: [{ day, minute }] } = await c.query(
      `SELECT COALESCE(SUM(weight) FILTER (WHERE at > now() - interval '24 hours'),0)::int AS day,
              COUNT(*) FILTER (WHERE at > now() - interval '1 minute')::int AS minute FROM calls`);
    if (minute >= PER_MINUTE) { await c.query("ROLLBACK"); return { ok: false, reason: "Slow down a little — try again in a minute." }; }
    if (day + weight > (ceiling || DAILY_CALLS) && day > 0) { await c.query("ROLLBACK"); return { ok: false, reason: "That's all the tutor can do today. Back tomorrow." }; }
    const { rows: [r] } = await c.query("INSERT INTO calls (mode, weight, model) VALUES ($1,$2,$3) RETURNING id", [String(mode).slice(0, 30), Math.max(1, Math.round(weight)), model]);
    await c.query("COMMIT");
    return { ok: true, id: r.id };
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch {}
    throw e;
  } finally { c.release(); }
}

/** Write what the call really used. usage may be null (the call failed before an answer). Never throws. */
export async function finishCall(id, usage, { model = null, ok = true, error = null } = {}) {
  if (!id) return;
  try {
    const usd = usage ? callCost(model, usage) : null;
    const weight = usage?.output_tokens != null ? Math.max(1, Math.round(Number(usage.output_tokens) / 2000)) : null;
    await q(`UPDATE calls SET input_tokens=$2, output_tokens=$3, cache_read=$4, cache_write=$5, usd=$6, model=COALESCE($7, model), ok=$8, error=$9,
             weight=GREATEST(weight, COALESCE($10, weight)) WHERE id=$1`,
      [id, usage?.input_tokens ?? null, usage?.output_tokens ?? null, usage?.cache_read_input_tokens ?? null, usage?.cache_creation_input_tokens ?? null,
       usd, model, !!ok, error ? String(error).slice(0, 200) : null, weight]);
  } catch (e) { console.error("[calls] finish failed", e?.message || e); }
}

/** Kept for any caller that still records after the fact: a reservation and its finish in one go. */
export async function recordCall(mode, usage, model = null) {
  try { const r = await reserveCall(mode, 1e9, 1, model); if (r.ok) await finishCall(r.id, usage, { model }); } catch {}
}

/** Read-only check (no reservation), for pages that only want to know. */
export async function checkBudget(ceiling) {
  const [{ day, minute }] = await q(
    `SELECT COALESCE(SUM(weight) FILTER (WHERE at > now() - interval '24 hours'),0)::int AS day,
            COUNT(*) FILTER (WHERE at > now() - interval '1 minute')::int AS minute FROM calls`
  );
  if (minute >= PER_MINUTE) return { ok: false, reason: "Slow down a little — try again in a minute." };
  if (day >= (ceiling || DAILY_CALLS)) return { ok: false, reason: "That's all the tutor can do today. Back tomorrow." };
  return { ok: true };
}

/** Guardian login lockout: 8 failures in an hour locks the door for the rest of that hour.
    29 Oct 2026 (review 01 M4): with an ip, the 8 are counted for THAT ip, with a global backstop of 40 an hour, so a
    stranger's script cannot lock Abid out. Without an ip the old global rule (8, any ip) applies unchanged. */
export async function loginLocked(ip = null) {
  if (!ip) {
    const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM audit WHERE action='guardian_login_failed' AND at > now() - interval '1 hour'");
    return n >= 8;
  }
  const [{ mine, total }] = await q(`SELECT COUNT(*) FILTER (WHERE ip = $1)::int AS mine, COUNT(*)::int AS total FROM audit
    WHERE action='guardian_login_failed' AND at > now() - interval '1 hour'`, [String(ip).slice(0, 64)]);
  return mine >= 8 || total >= 40;
}

export function boundMessages(messages, maxTurns = 24, maxChars = 2000) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages.slice(-maxTurns)) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const content = String(m?.content ?? "").slice(0, maxChars);
    // A restored conversation can hold two tutor turns in a row (an opener, then a re-greeting after a reload).
    // The model needs strict alternation, so merge neighbours of the same role.
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content = (out[out.length - 1].content + "\n\n" + content).slice(0, maxChars * 2);
    else out.push({ role, content });
  }
  if (out.length && out[0].role === "assistant") out.unshift({ role: "user", content: "Hello! I'm here for this step." });
  return out;
}

export function newId() { return randomBytes(16).toString("base64url"); }

/** Answer normalisation, shared by every grader. */
export function norm(s) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/,/g, "").replace(/°/g, "").slice(0, 100);
}

const WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50, hundred: 100 };
/** Numeric value of an answer, if it has one: "6 cups", "6,700", "1/2", "0.5", "50%", "twelve", "3 1/2", "8.5 km" → a number; otherwise null. */
export function numeric(s) {
  let t = String(s ?? "").trim().toLowerCase().replace(/,/g, "").replace(/[°%]/g, "");
  if (WORDS[t] != null) return WORDS[t];
  const scaled = t.match(/^(-?\d+(?:\.\d+)?)\s*(hundred|thousand|million)s?$/); // "3 hundred", "6 thousand"
  if (scaled) return Number(scaled[1]) * { hundred: 100, thousand: 1000, million: 1e6 }[scaled[2]];
  const mixed = t.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)/);           // 3 1/2
  if (mixed && Number(mixed[3])) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/); // 1/2
  if (frac && Number(frac[2])) return Number(frac[1]) / Number(frac[2]);
  const num = t.match(/^-?\d+(?:\.\d+)?/);                             // 6 cups, 8.5 km, 60cm²
  if (num) { const rest = t.slice(num[0].length).trim(); if (/^[a-z²³\s.]*$/.test(rest)) return Number(num[0]); }
  return null;
}
/** Does her answer match any accepted answer? Exact after normalisation, or the same number (units/words/fraction form ignored). */
export function answerMatches(accepted, given) {
  const g = norm(given);
  if ((accepted || []).some((a) => norm(a) === g)) return true;
  const gv = numeric(given);
  if (gv == null) return false;
  return (accepted || []).some((a) => { const av = numeric(a); return av != null && Math.abs(av - gv) < 1e-9; });
}

/** TOTP (RFC 6238) verification, no dependencies. Secret is base32. Accepts ±1 step of drift. */
export function verifyTotp(secret, code) {
  if (!secret || !/^\d{6}$/.test(String(code || ""))) return false;
  const key = base32Decode(secret.replace(/[\s=-]/g, "").toUpperCase());
  const step = Math.floor(Date.now() / 30000);
  for (const d of [-1, 0, 1]) {
    const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(step + d));
    const h = createHmac("sha1", key).update(buf).digest();
    const o = h[19] & 0xf;
    const v = ((h[o] & 0x7f) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6;
    if (safeEqual(String(v).padStart(6, "0"), String(code))) return true;
  }
  return false;
}
function base32Decode(s) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, val = 0; const out = [];
  for (const c of s) { const i = A.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}

/** Generic error response: never leak stack traces, SQL, or provider messages to the browser. */
/** Record a failure she may have seen. Never throws; the guardian page shows these under Issues. */
export async function logError(where, e, seenByHer = true) {
  const msg = `${e?.name || "Error"}: ${String(e?.message || e).slice(0, 400)}`;
  console.error(`[${where}]`, msg);
  try { await q("INSERT INTO errors (where_, message, seen_by_her) VALUES ($1,$2,$3)", [String(where).slice(0, 60), msg, !!seenByHer]); } catch {}
}

export function safeError(e, where) {
  logError(where, e); // fire and forget
  return { error: "Something went wrong. Try again in a moment." };
}

/* ---------- The tutor's budget (14 Oct 2026) ----------
 * When the Anthropic monthly spend limit is reached (or credits run out) every call fails with HTTP 400
 * invalid_request_error: "You have reached your specified API usage limits..." / "Your credit balance is too low...".
 * On 14 Oct she met that as a bare "could not answer, try again" three times. Now she gets a calm, specific line,
 * and Abid gets one guardian note a day telling him exactly where to fix it. */
const BUDGET_RE = /usage limits|credit balance|spend limit|purchase credits|billing/i;
export function budgetPaused(e) {
  const status = Number(e?.status || 0);
  const text = String(e?.message || e || "");
  return (status === 400 || status === 402 || status === 403 || /^(Error: )?4(00|02|03)\b/.test(text)) && BUDGET_RE.test(text);
}
export const BUDGET_MESSAGE = "The tutor has used up this month's budget. This is not your fault and nothing is lost - Abid has been told and will top it up. For today: do your Python line and read the Wonder (and the Arena if it is a game day). The tutor is back as soon as Abid fixes it.";
export async function noteBudgetPaused(e) {
  try {
    const [row] = await q("SELECT 1 FROM notes WHERE body LIKE 'BUDGET PAUSED%' AND created_at > now() - interval '1 day' LIMIT 1");
    if (row) return;
    const detail = String(e?.message || e || "").replace(/\s+/g, " ").slice(0, 160);
    await q("INSERT INTO notes (author, body, flagged) VALUES ('tutor', $1, false)",
      [`BUDGET PAUSED: the tutor cannot answer her (${detail}). Fix: platform.claude.com -> Settings -> Billing -> Spend limits -> Adjust limit (or Buy credits). It works again within a minute.`]);
  } catch {}
}
