# CogniPace - engineering notes (what is true about the code now)

Updated 29 Oct 2026. The story of how each piece came to be is in docs/HISTORY.md; this file is the current map.

## Stack
Next.js 15 app router, plain JS, no Tailwind. Postgres on Neon (free tier, 100 CU-hours/month, suspends when exceeded)
via `pg` (lib/db.js: schema DDL, retry on transient errors, 20 s connect). Anthropic SDK. Vercel Hobby (maxDuration 300
needs Fluid compute). Firewall geo-fence Bangladesh + Canada (Abid's; never loosen). UptimeRobot -> /api/ping.

## Where things live
- Curriculum: curriculum/modules.json ONLY (build sources and order: curriculum/build/assemble.py FULL_ORDER).
  calendar.json (vacations, exams, birthday, dated tutorModel schedule - overrides ANTHROPIC_MODEL), machine.json (what is
  on her laptop - the tutor's single source of truth; update whenever a step installs or removes anything), rewards.json
  (cost/note fields are Abid-only, never sent to her), meetings.json, wonders.json.
- Tutor: lib/tutorSystem.js (TUTOR_SYSTEM, cached, ~2,600 words - keep it short; one rule once, no contradictions);
  app/api/tutor/route.js (dynamic per-step block: HER MACHINE, links, MONEY rule, time box, open parks, exam/vacation,
  HER OWN GOALS; marker handling; generators; teach-back grading).
- Grading: app/api/state/route.js only. Answers never leave the server.
- Rewards/streaks: lib/rewards.js (from server records only). Goal: lib/goal.js. Time: lib/presence.js (presence +
  clock). Warm-up: lib/typing.js, lib/drills.js, lib/shortcuts.js, lib/codelines.js (optional since 29 Oct).
- Teaching foundation (30 Oct): lib/teachingHandbook.js (in the cached system block), teacher_notes per step + the
  learner profile (lib/knowledge.js; guardian buttons Prepare / Refresh her profile; own cached block in the tutor route).
- Offline pack (2 Nov 2026): lib/offline.js, /api/offline (GET status / ?pack=1 the HTML file; POST her work file),
  components/OfflineCard.js, tables offline_sheets / offline_work / offline_days; offline days count in lib/rewards.js.
- School day + quick maths + targets (3 Nov 2026): lib/day.js (/api/day, table school_day), lib/mathdrill.js (warm-up
  Part 6, typing.math_*), components/SchoolDay.js (Start/End, movement card, confetti), /agree (lib/agreement.js),
  /news (curriculum/news.json, news_read), step media videos -> tutor videosLine.
- Step videos (5 Nov 2026): at most one core video per step; `extra: true` entries fold away and the tutor never asks
  about them; optional `from`/`to` seconds start/end the player. Her one-tap verdict -> /api/video, table video_votes,
  listed on /guardian. Exam days: short optional warm-up (typing.exam; drill line + quick maths).
- The practice spine (9 Nov 2026): lib/review.js - tables skills (one row per passed skill: stage 0-3 = due in 1/7/30/90
  days, a miss -> stage 0), reviews (the day's set, built once per Dhaka day, answers server-side), review_bank (fresh
  questions the writer made for a skill with none left; POST /api/review, <= 4 skills a day, reserved like a tutor
  call), rechecks (five questions from one old module on a Saturday, once a month). Hooks: a finished practice set and
  a graded checkpoint (app/api/state/route.js) call learned(); the warm-up answers go through /api/typing {review}.
  typingToday().spine feeds components/Learn.js ReviewPart; warmupDone() waits for it (not on exam days). Skills with a
  name come from practice/check `skills` lists and hand-written bank questions (a bank question without a skill belongs
  to its step id); diagnostics never. Modules with no check at all (CS1B, GK1, LX1, LX2) put nothing on the ladder.
  The Arena quiz draws from every passed module's sets and her misses. /guardian shows retention.
- Her voice: /voice page + /api/voice + table voice (29 Oct) -> tutor's HER OWN GOALS line + guardian "In her words".
- Guardian: app/guardian/page.js (never let anything run before the helpers it uses are defined; exercise every new
  filter with at least one row), app/api/guardian/route.js (overrides log a note; export = every table; restore with
  scripts/restore.mjs).
- Ops: docs/RUNBOOK.md (what to do when something breaks; monthly checklist).

## Markers in tutor replies
[STEP DONE] [LOGBOOK: ...] [PARKED: ...] [RESOLVED: STEP-ID] [FLAG] [CURIOUS: ...] [SHORTCUT] [FLAG CAPTURED: name].
The server strips them before she sees anything (also while streaming).

## Gates (push.ps1 refuses to commit on any failure)
`npm run lint:audit` (0 errors; ignore plain `npx eslint .`, it scans .next), `node scripts/test-curriculum.mjs`,
`node scripts/test-codelines.mjs`, `node scripts/test-shortcuts.mjs`, `node scripts/test-server.mjs`, `npx next build`.
After push: smoke.mjs waits for the new commit on /api/ping, then checks every page and route.

## Rules for changing code
- Every route checks session + origin; every input length-capped; errors generic; no new dependency without npm audit.
- Every step completion posts a timing event; a new step kind needs its event.
- Any failure she can see must land in the errors table.
- The room is measured at 1093x614 (her IdeaPad at 125%) before it ships; no inline layout styles in the room.
- Any screen that replaces the room refetches state before the room comes back.
- After any module reorder, check the guardian progress table (her place must not move).
- A link is a flow: walk it to the end before shipping - what does a 13-year-old with no card meet? Every sign-up step
  carries the money rule (gate-checked).
- A warm-up never blocks a session; nothing she must do may depend on an outside site working.
- Before telling Abid "verified": run the gates in the container copy, stage to his PC, md5-check, give him the two-line push.
