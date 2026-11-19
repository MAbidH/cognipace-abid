import { Pool } from "pg";
import { STUDENT } from "./student.js";

let pool, ready;

function getPool() {
  if (!pool) {
    const raw = process.env.DATABASE_URL || "";
    // The TLS choice is made explicitly below; a `sslmode=` in the URL only makes pg print a red "SECURITY WARNING" on
    // every cold start (seen in Vercel's error log, 9 Oct 2026), which buries real errors. Strip it.
    const url = raw.replace(/([?&])sslmode=[^&]*&?/i, "$1").replace(/[?&]$/, "");
    pool = new Pool({
      connectionString: url,
      // Verify the database's TLS certificate (Neon uses a public CA). Local dev may use plain TCP.
      ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: true },
      max: 5,
      // Neon pauses an idle database; the first connection after a pause can take several seconds to wake it.
      // 8 s was not always enough (8 Oct 2026: "server-side exception" page in front of her) - 20 s, and a retry below.
      connectionTimeoutMillis: 20000,
      statement_timeout: 15000,
      idleTimeoutMillis: 30000,
    });
    // A pool error (a socket Neon closed while idle) must never crash the process; the next query reconnects.
    pool.on("error", (e) => console.error("[db:pool]", e?.message || e));
  }
  return pool;
}

/** A failure that a fresh connection a moment later will fix: a connection timeout while the database wakes, a socket
    closed by the server, a connection dropped between instances. Anything else (a bad query, a constraint) is real. */
export function isTransient(e) {
  const code = String(e?.code || "");
  const msg = String(e?.message || "").toLowerCase();
  return code.startsWith("08") || code === "57P01" || code === "57P02" || code === "57P03" || code === "53300" ||
    ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ENOTFOUND"].includes(code) ||
    msg.includes("timeout exceeded when trying to connect") || msg.includes("connection terminated") ||
    msg.includes("connection timeout") || msg.includes("socket hang up") || msg.includes("the database system is starting up") ||
    msg.includes("too many connections") || msg.includes("client has encountered a connection error") ||
    msg.includes("cannot use a pool after calling end"); // 29 Oct 2026 (review 01 L8): a concurrent resetPool() ended the pool under us
}

/** Drop the pool so the next query starts from a clean socket (after a transient failure). */
async function resetPool() {
  const old = pool;
  pool = null; ready = null;
  if (old) { try { await old.end(); } catch {} }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS progress (
  module_id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'locked', step_index INT NOT NULL DEFAULT 0,
  best_score NUMERIC, attempts INT NOT NULL DEFAULT 0, remediation JSONB, started_at TIMESTAMPTZ, passed_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY, module_id TEXT NOT NULL, step_id TEXT NOT NULL, kind TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ, active_ms INT NOT NULL DEFAULT 0, attempts INT NOT NULL DEFAULT 1,
  score NUMERIC, passed BOOLEAN, payload JSONB);
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY, author TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), flagged BOOLEAN NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS calls (
  id BIGSERIAL PRIMARY KEY, mode TEXT, at TIMESTAMPTZ NOT NULL DEFAULT now(), input_tokens INT, output_tokens INT);
-- Server-held question sets: answers never leave the server.
CREATE TABLE IF NOT EXISTS qsets (
  id TEXT PRIMARY KEY, module_id TEXT NOT NULL, step_id TEXT NOT NULL, kind TEXT NOT NULL,
  questions JSONB NOT NULL, streak JSONB, stuck JSONB, attempts INT NOT NULL DEFAULT 0,
  done BOOLEAN NOT NULL DEFAULT false, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), graded_at TIMESTAMPTZ);
-- Server-verified step completions: the only thing that unlocks the next step.
CREATE TABLE IF NOT EXISTS completions (
  key TEXT PRIMARY KEY, module_id TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Lesson conversations, kept so the guardian can read them on the dashboard (guardian's decision, Sep 2026).
CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY, module_id TEXT NOT NULL, step_id TEXT NOT NULL, ctx TEXT NOT NULL DEFAULT 'lesson',
  role TEXT NOT NULL, content TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS chats_at ON chats (at);
-- Every practice answer, right or wrong, so the guardian can see exactly where she is stuck (Sep 2026).
CREATE TABLE IF NOT EXISTS answers (
  id BIGSERIAL PRIMARY KEY, module_id TEXT NOT NULL, step_id TEXT NOT NULL, qset_id TEXT, skill TEXT,
  question TEXT NOT NULL, given TEXT NOT NULL, ok BOOLEAN NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS answers_at ON answers (at);
-- Daily typing gateway (Abid, Sep 2026): 10 minutes of touch-typing before the day's modules unlock. Self-reported accuracy.
CREATE TABLE IF NOT EXISTS typing (
  day DATE PRIMARY KEY, done BOOLEAN NOT NULL DEFAULT true, accuracy NUMERIC, site TEXT, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Her logbook (Abid, Oct 2026): every finished step and module, her own one-line proofs, and the code she shipped.
-- Shown to her at /portfolio; it is the record she will one day show people.
CREATE TABLE IF NOT EXISTS journal (
  id BIGSERIAL PRIMARY KEY, module_id TEXT, step_id TEXT, kind TEXT NOT NULL, title TEXT, body TEXT, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS journal_at ON journal (at);
-- The Arena (games every second day) and Wonders (timeless general knowledge the other days). Oct 2026.
CREATE TABLE IF NOT EXISTS arena (
  id TEXT PRIMARY KEY, day DATE NOT NULL, rounds JSONB NOT NULL, results JSONB NOT NULL DEFAULT '{}', score INT NOT NULL DEFAULT 0,
  done BOOLEAN NOT NULL DEFAULT false, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ);
-- Meetings with real people (Oct 2026): her preparation, stage by stage. stage: learn | intro | questions | rehearse | ready | done
-- Small key/value settings (Oct 2026): e.g. os = windows | linux, flipped when LX1-L7B (the launcher) completes.
-- Errors she may have seen (6 Oct 2026): what broke, where, when - so nothing fails silently any more.
CREATE TABLE IF NOT EXISTS errors (
  id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), where_ TEXT NOT NULL, message TEXT NOT NULL, seen_by_her BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS meet (
  id TEXT PRIMARY KEY, stage TEXT NOT NULL DEFAULT 'learn', intro TEXT, questions JSONB, after TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS wonders_read (
  wonder_id TEXT PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Which wonder each Dhaka day showed (1 Nov 2026): the day's wonder is fixed when first shown and the next day moves on
-- whether or not she pressed "save" (before, an unsaved wonder came back every day for a week).
CREATE TABLE IF NOT EXISTS wonders_shown (
  day DATE PRIMARY KEY, wonder_id TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Badges, with the date each was first earned (Oct 2026). The conditions live in lib/rewards.js.
CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit (
  id BIGSERIAL PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, ip TEXT, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Second half of the daily gate (Oct 2026): the "all the keys" line, verified on the server.
ALTER TABLE typing ADD COLUMN IF NOT EXISTS shortcut_done BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS shortcut_id TEXT, ADD COLUMN IF NOT EXISTS review_done BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE typing ADD COLUMN IF NOT EXISTS drill_fails INT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS drill_waived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drill_done BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drill_accuracy NUMERIC, ADD COLUMN IF NOT EXISTS drill_wpm INT, ADD COLUMN IF NOT EXISTS drill_line TEXT,
  ADD COLUMN IF NOT EXISTS vault_done BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS vault_asked BOOLEAN NOT NULL DEFAULT false;
-- The Python line (12 Oct 2026): warm-up Part 5, one tiny program a day from CS2A on.
ALTER TABLE typing ADD COLUMN IF NOT EXISTS code_done BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS code_fails INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS code_waived BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS code_text TEXT;
-- Fix day (29 Oct 2026): every call priced and reserved before it runs; unverified closes; her own voice; check drafts.
ALTER TABLE calls ADD COLUMN IF NOT EXISTS model TEXT, ADD COLUMN IF NOT EXISTS cache_read INT, ADD COLUMN IF NOT EXISTS cache_write INT,
  ADD COLUMN IF NOT EXISTS usd NUMERIC, ADD COLUMN IF NOT EXISTS weight INT NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS ok BOOLEAN, ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE typing ADD COLUMN IF NOT EXISTS key_fails INT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS review_fails INT NOT NULL DEFAULT 0;
ALTER TABLE qsets ADD COLUMN IF NOT EXISTS draft JSONB, ADD COLUMN IF NOT EXISTS void BOOLEAN NOT NULL DEFAULT false;
-- A step closed by count or time, not by her own evidence: revisited with one recall question the next day.
CREATE TABLE IF NOT EXISTS unverified (
  step_id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT, why TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now(),
  asked_at TIMESTAMPTZ, asked_on TEXT, answer TEXT, answered_at TIMESTAMPTZ);
-- Her voice (29 Oct 2026): what she wants to be, to learn, enjoys, finds hard, wishes Abid knew. Each answer <= 600 chars.
CREATE TABLE IF NOT EXISTS voice (
  id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), want_to_be TEXT, want_to_learn TEXT, enjoys TEXT, finds_hard TEXT, wish_for_abid TEXT);
-- The tutor's knowledge base (30 Oct 2026, lib/knowledge.js): notes per lesson/code step, written before she gets there.
CREATE TABLE IF NOT EXISTS teacher_notes (
  step_id TEXT PRIMARY KEY, module_id TEXT NOT NULL, notes JSONB NOT NULL, model TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), chars INT);
-- The offline pack (2 Nov 2026, lib/offline.js): worksheets written ahead; her offline work and offline days brought back.
CREATE TABLE IF NOT EXISTS offline_sheets (
  step_id TEXT PRIMARY KEY, module_id TEXT NOT NULL, sheet JSONB NOT NULL, model TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS offline_work (
  step_id TEXT PRIMARY KEY, module_id TEXT, work JSONB NOT NULL, done BOOLEAN NOT NULL DEFAULT false,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS offline_days (
  day DATE PRIMARY KEY, minutes INT NOT NULL, imported_at TIMESTAMPTZ NOT NULL DEFAULT now());
-- The school day (3 Nov 2026, Abid: punch in / punch out): when she started and ended, the desk check, movement breaks.
CREATE TABLE IF NOT EXISTS school_day (
  day DATE PRIMARY KEY, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, desk BOOLEAN NOT NULL DEFAULT false, moves INT NOT NULL DEFAULT 0, last_move_at TIMESTAMPTZ);
-- The maths fluency drill in the warm-up (3 Nov 2026, lib/mathdrill.js).
ALTER TABLE typing ADD COLUMN IF NOT EXISTS math_done BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS math_score INT, ADD COLUMN IF NOT EXISTS math_seconds INT, ADD COLUMN IF NOT EXISTS math_tries INT NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS math_hit BOOLEAN NOT NULL DEFAULT false;
-- Her December agreement (3 Nov 2026): the rules of the winter school, in her own words, signed by her.
CREATE TABLE IF NOT EXISTS agreement (
  id BIGSERIAL PRIMARY KEY, version TEXT NOT NULL, her_words TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Cyber news stories she read (3 Nov 2026, curriculum/news.json).
CREATE TABLE IF NOT EXISTS news_read (news_id TEXT PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now());
-- Her verdict on each step video (5 Nov 2026): useful / too long / not about this. One row per video, last vote wins.
CREATE TABLE IF NOT EXISTS video_votes (step_id TEXT NOT NULL, url TEXT NOT NULL, vote TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (step_id, url));
-- Presence beats (4 Nov 2026): every warm-up part and the keybr minutes, so the required warm-up counts as work time.
CREATE TABLE IF NOT EXISTS beats (id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), kind TEXT);
CREATE INDEX IF NOT EXISTS beats_at ON beats (at);
-- The practice spine (9 Nov 2026, lib/review.js): every passed skill on a 1/7/30/90-day ladder; the day's review set;
-- fresh questions written for a skill that had none left; the monthly five-question re-check of one old module.
CREATE TABLE IF NOT EXISTS skills (
  skill TEXT PRIMARY KEY, module_id TEXT NOT NULL, learned_at TIMESTAMPTZ NOT NULL DEFAULT now(), stage INT NOT NULL DEFAULT 0,
  due DATE NOT NULL, last_at TIMESTAMPTZ, last_ok BOOLEAN, hits INT NOT NULL DEFAULT 0, misses INT NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS skills_due ON skills (due);
CREATE TABLE IF NOT EXISTS reviews (
  day DATE PRIMARY KEY, items JSONB NOT NULL, results JSONB NOT NULL DEFAULT '[]', done BOOLEAN NOT NULL DEFAULT false,
  kind TEXT NOT NULL DEFAULT 'daily', recheck_module TEXT, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS review_bank (
  id BIGSERIAL PRIMARY KEY, skill TEXT NOT NULL, module_id TEXT NOT NULL, q TEXT NOT NULL, a JSONB NOT NULL, explain TEXT,
  source TEXT NOT NULL DEFAULT 'generated', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS review_bank_skill ON review_bank (skill);
CREATE TABLE IF NOT EXISTS rechecks (module_id TEXT NOT NULL, day DATE NOT NULL, score NUMERIC, total INT, PRIMARY KEY (module_id, day));
-- (No UNIQUE on arena.day: older days may hold two finished games; XP counts DISTINCT days instead.)
CREATE INDEX IF NOT EXISTS chats_step ON chats (step_id, ctx, id);
CREATE INDEX IF NOT EXISTS events_started ON events (started_at);
CREATE INDEX IF NOT EXISTS calls_at ON calls (at);
CREATE INDEX IF NOT EXISTS audit_at ON audit (at);
`;

export async function db() {
  const p = getPool();
  if (!ready) ready = p.query(SCHEMA).catch((e) => { ready = null; throw e; });
  await ready;
  return p;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every query goes through here. A transient failure (see isTransient) is retried twice on a fresh pool, with a short
    pause, so a database waking from a pause never becomes an error page in front of her. Real errors throw at once. */
/* 19 Nov 2026: every SQL date in this codebase is written against 'Asia/Dhaka' (sixty places). The second instance
   (cognipace-abid) runs in another time zone, so q() rewrites that one literal to the student's zone before the query
   leaves the process. For Faiza's instance the text is unchanged. */
const SQL_TZ_LITERAL = "'Asia/Dhaka'";
const sqlTz = () => STUDENT.timezone === "Asia/Dhaka" ? null : `'${STUDENT.timezone.replace(/[^A-Za-z0-9_+\-\/]/g, "")}'`;

export async function q(text, params = []) {
  const tz = sqlTz();
  if (tz && text.includes(SQL_TZ_LITERAL)) text = text.split(SQL_TZ_LITERAL).join(tz);
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const p = await db();
      return (await p.query(text, params)).rows;
    } catch (e) {
      lastErr = e;
      if (!isTransient(e) || attempt === 2) throw e;
      console.error(`[db] transient failure, retry ${attempt + 1}:`, e?.code || "", String(e?.message || e).slice(0, 160));
      await resetPool();
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

export async function audit(actor, action, detail = null, ip = null) {
  await q("INSERT INTO audit (actor, action, detail, ip) VALUES ($1,$2,$3,$4)", [actor, action, detail ? String(detail).slice(0, 500) : null, ip]);
}
