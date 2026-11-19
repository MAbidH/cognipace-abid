# SECURITY.md - threat model and what is true today

**System:** one student (Faiza, her laptop and iPad), one guardian (Abid; a second guardian may be added - docs/RUNBOOK.md
section 4), one tutor (Anthropic API). Hosted on Vercel (Hobby), database on Neon (free), code on GitHub. No other
users, no payments, no uploads, no third-party integrations.

**What an attacker could want:** run up the API bill, read or alter her progress or chats, reach the guardian
dashboard, learn when a 13-year-old is online, or make the tutor say something it shouldn't. A realistic insider is
the student herself (she is learning security; devtools and `fetch()` from her own tab are in scope).

First audit 7 Sep 2026 (v2). **Revised 29 Oct 2026** after the independent review (claude/REVIEW-2026-10-29.md):
items that had become untrue are corrected below and marked *(corrected 29 Oct)*.

---

## A. Secrets and configuration

| Item | Status | How |
|---|---|---|
| DB credentials, API key | **Verified** | Only in Vercel env vars (encrypted at rest), read server-side only. TLS to Neon verifies the certificate. Nothing prefixed `NEXT_PUBLIC_`. |
| .env files in git | **Fixed** *(corrected 29 Oct)* | `.gitignore` now ignores `.env` and every `.env.*` except `.env.example` (placeholders only), plus `.vercel/` and `*backup*.json` (backups hold her chats). Before 29 Oct only `.env.local` was ignored, and `push.ps1` runs `git add -A`. |
| Missing secret = forgeable cookie | **Fixed 29 Oct** | A missing or too-short `STUDENT_TOKEN` / `GUARDIAN_PASSWORD` now gives no session value at all, so every cookie is refused (lib/guard.js `sessionValue`). Before, an unset secret made the expected cookie a public constant. |
| Exposed environments | **Your action** | Vercel: secrets Production-only; Deployment Protection on preview URLs. |
| Source maps / debug tools | **Verified** | `productionBrowserSourceMaps: false`; no dev overlay in production. |
| Every variable documented | **Fixed 29 Oct** | `.env.example` lists every `process.env.*` the code reads, which ones are fallbacks only (calendar.json overrides `ANTHROPIC_MODEL` and `DAILY_CAP_MINUTES`), and the ones Vercel sets itself. |

## B. Authentication and sessions (the rules as of 29 Oct 2026)

| Item | Status | How |
|---|---|---|
| Student | **As designed** | A long random token in her link, constant-time compare, then an httpOnly + Secure cookie (SameSite=lax so the link works from a chat app; every API route also checks the origin). 400-day cookie. Rotate by changing `STUDENT_TOKEN`. |
| Guardian login | **Fixed** | Password (+ TOTP 2FA when `GUARDIAN_TOTP_SECRET` is set; strongly recommended). Constant-time compare, 1.5 s delay on failure, every attempt in the audit table, failures shown in red on /guardian. 7-day SameSite=strict cookie, Sign-out button. |
| Login throttle | **Changed 29 Oct** *(corrected)* | Was: 8 failures an hour from **anyone** locked the door for **everyone** - a stranger could lock Abid out. Now (app/api/guardian/route.js): per address, 3 failures in a minute or 6 in 15 minutes and that address waits; a global backstop of 30 failures an hour (all addresses). With 2FA on, the right password **and** code still get in during the backstop; without 2FA the backstop holds for everyone. The address is Vercel's `x-forwarded-for`, which Vercel sets itself. |
| Cookie value | **Known limit** *(corrected 29 Oct)* | The guardian cookie is an HMAC of the password - it is the same value for every login and is not tied to the 2FA code. So: Sign-out cannot revoke a copied cookie, and turning 2FA on later does not end old sessions. Changing `GUARDIAN_PASSWORD` in Vercel ends every guardian session at once. A server-side session table is the planned fix. |
| Second guardian | **Process** | Shared only through Bitwarden (Send or a shared item). Never in chat, never through Claude. docs/RUNBOOK.md section 4. |
| Sensitive browser storage | **Verified** | Auth lives only in httpOnly cookies. localStorage holds only her unsent drafts and editor code (her own work). |

## C. Authorization and data access

| Item | Status | How |
|---|---|---|
| Every route checks the session | **Verified** | Student routes check the student cookie first (signed out = 401; smoke.mjs checks /api/state and /api/tutor), then the origin. Guardian actions need the guardian cookie. |
| Unauthenticated routes | **As designed** | `/api/ping` (up or not, and the live commit; never touches the database) and `/api/live` (is she active - one boolean). `/api/live?check=1` (used by push.ps1; adds minutes since her last action) answers only from Canada or Bangladesh. These two paths are the firewall's only exceptions to the geo-fence; once UptimeRobot watches /api/ping, Abid removes `/api/live` from the exception (RUNBOOK section 8). |
| Grading | **Verified** | Answer keys stay on the server; every answer is graded there; a step advances only after the server recorded its completion. Known integrity gaps from the 29 Oct review (client-sent history, client-reported time) are tracked in the review and the fix-day changes. |
| Admin route | **Fixed** | `/guardian` requires password (+2FA), throttled, audit-logged. Reachable from Bangladesh and Canada only (geo-fence). |

## D. Input handling and injection

| Item | Status | How |
|---|---|---|
| SQL injection | **Verified** | Every query uses `$n` parameters. The two places that put a table name into SQL (backup export, restore) take names only from the database's own catalogue and check them against `^[a-z_][a-z0-9_]*$`. |
| XSS | **Mitigated** *(corrected 29 Oct)* | React escapes rendered text. **One `dangerouslySetInnerHTML` exists**: components/Markdown.js renders the tutor's SVG drawings after `sanitizeSvg()` (allow-list of elements; `<script>`, `<style>`, `<foreignObject>`, `<a>`, animation and event attributes dropped). The 29 Oct review found no script path but some attribute gaps (`style`/`url()` on the root `<svg>`, namespaced `href` prefixes); the impact is limited to her own session - the guardian page does not render Markdown. Earlier versions of this file said "no dangerouslySetInnerHTML"; that was wrong. |
| CSP | **Partial** *(corrected 29 Oct)* | next.config.js sends a CSP, but `script-src` includes `'unsafe-inline'` (Next's inline bootstrap) and the whole `https://cdn.jsdelivr.net` host (Pyodide), so it gives limited XSS protection. `'wasm-unsafe-eval'` allows WebAssembly only. `worker-src 'self' blob:` covers the Python Web Worker (a blob: worker that loads Pyodide from jsDelivr; no header change was needed for it). Planned tightening: pin `script-src` to `https://cdn.jsdelivr.net/pyodide/v0.26.4/full/` (needs a browser test of her editor first) and nonces instead of `'unsafe-inline'`. Other headers: HSTS, frame-ancestors 'none' + X-Frame-Options DENY, nosniff, Referrer-Policy no-referrer, Permissions-Policy, COOP, noindex. |
| CSRF | **Fixed** | Origin / Sec-Fetch-Site check on every mutating route, plus SameSite cookies. |
| Input validation | **Fixed** | Fields typed, length-capped and clamped; malformed JSON = 400. |
| Prompt injection | **Mitigated** | The tutor has no tools, no web, no database access. Rules in the system prompt; student text and program output treated as data. Residual risk (the review's H1/L5): steering the step-closing markers - see the fix-day changes. |
| Command injection, path traversal, uploads, SSRF, open redirects | **N/A / Fixed** | No shell, no file access from requests, no uploads (screenshots are checked and never stored), the server calls only api.anthropic.com, `/api/enter` always redirects to `/`. |

## E. Cost, availability, monitoring

| Item | Status | How |
|---|---|---|
| API cost | **Fixed** *(corrected 29 Oct)* | Console spend limit **USD 60/month** (Abid's; was 30), auto-reload off. In the database: 300 calls/day (700 on vacation days, calendar.json), 12/minute. From 29 Oct each call's dollar cost is recorded (lib/cost.js) for the guardian page's cost line. |
| Timeouts | **Verified** *(corrected)* | Anthropic client 45 s / 1 retry (generator 240 s, no retry); DB connect 20 s with 2 retries on a fresh pool, statement 15 s; tutor function `maxDuration` 300 (needs Vercel Fluid compute). |
| Deploy safety | **Fixed 29 Oct** | push.ps1 gates: lint, curriculum / Python line / key-move / server tests, **`next build`**. It refuses to deploy while she is active, and when the activity check cannot answer. After the push it waits until /api/ping reports the new commit, then smoke-tests. No CI on GitHub: a direct `git push`, a GitHub web edit or a Vercel "Redeploy" skips every gate. |
| Audit log | **Fixed** | `audit` table: link use, bad links, guardian login / failed / locked / logout, notes, overrides, exports - with address and time. |
| Errors | **Fixed** | Every route wrapped; the browser sees only a generic message; failures she can see land in the `errors` table and in red on /guardian. |
| Backups / restore | **Fixed 29 Oct** *(corrected)* | Before: the export left out 7 tables and no restore existed. Now **Download backup** exports **every** table (found from the database catalogue, so new tables are included), with a format version, streamed (no 4.5 MB cap). `scripts/restore.mjs` loads it into an **empty** database (refuses a non-empty one unless `--force`, one transaction, counters reset, counts compared). Round trip tested on Postgres 16: 19/19 tables identical by count and checksum. Backups hold her chats: store them encrypted (RUNBOOK section 6). |
| Dependencies | **Fixed 29 Oct** *(corrected)* | Next **15.5.28** (15.5.25 had a critical and a high advisory, fixed in 15.5.28), React 19.1, pg 8.13, Anthropic SDK 0.52, postcss pinned. `npm audit --omit=dev`: 0 vulnerabilities on 29 Oct 2026. Exact versions, lockfile committed. |
| Uptime | **Changing** | UptimeRobot every 5 min. Move it to /api/ping (no database) - RUNBOOK section 8. |
| Logs | **Verified** | Server logs carry an error name and a short message, never request bodies or secrets. |

## F. Data minimisation *(corrected 29 Oct)*

Stored: her first name (env var), module progress, timing, practice answers, teach-back texts, **her lesson
conversations (chats table - kept so the guardian can read them, Sep 2026 decision)**, her logbook, her /voice answers,
rewards, tutor safety flags, guardian notes, audit rows with addresses, call counts and cost. Not stored: e-mail,
photos (screenshots are read once and dropped), location, any password or key. The earlier line "conversations live
in the browser tab only" stopped being true in September.

---

## Your side (nothing in code can do these)

1. 2FA on Vercel, Neon, GitHub, the Anthropic console, UptimeRobot and Bitwarden.
2. Set `GUARDIAN_TOTP_SECRET` in Vercel and the same secret in your authenticator app. With it, a stranger can never
   keep you out of /guardian.
3. Vercel: secrets Production-only; Deployment Protection on.
4. Never paste the API key, DB string, student token or guardian password anywhere except Vercel and Bitwarden.
5. Monthly: Download backup, store it encrypted; every 3 months test a restore (RUNBOOK section 6).
6. Her link leaked: change `STUDENT_TOKEN` in Vercel, redeploy, send her the new link.
7. Guardian password suspected: change `GUARDIAN_PASSWORD` in Vercel; every guardian session ends.
8. UptimeRobot to /api/ping, then remove `/api/live` from the firewall exception (RUNBOOK section 8).
