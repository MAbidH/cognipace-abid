# Runbook - cognipace-abid

## First deploy (once)
1. GitHub: a repository `cognipace-abid` under your account (public is fine - the curriculum is yours; the repo holds no
   secret; the database holds your chats and is not in the repo).
2. Neon: a new project `cognipace-abid` (region closest to you), copy its connection string (pooled) - it goes into
   Vercel only.
3. Anthropic console: a NEW API key in a separate workspace/project named cognipace-abid, spend limit USD 50/month.
   Never paste it anywhere but the Vercel env field.
4. Vercel: New Project -> import `cognipace-abid` from GitHub -> Framework Next.js -> Environment Variables
   (Production): ANTHROPIC_API_KEY, DATABASE_URL, STUDENT_TOKEN (40+ random chars - your login link is
   https://<site>/?t=<STUDENT_TOKEN>), GUARDIAN_PASSWORD (long, random, in your password manager), GUARDIAN_TOTP_SECRET
   (base32; add it to your authenticator app), STUDENT_NAME=Abid, SPEND_LIMIT_USD=50, WARM_WINDOW=0:00-24:00.
   Deploy. Then Settings -> Domains if you want a nicer name.
5. First visit: open https://<site>/?t=<STUDENT_TOKEN>. The schema is created on first use. /guardian is your
   dashboard (password + TOTP).
6. Put the live URL into CLAUDE.md and push.ps1 ($site).

## Every day
- Open the site; Start school; warm-up (Python line + review); the current step; End school. Saturday: review day.

## Every push
`cd C:\Users\ASUS\Projects\cognipace-abid` then `.\push.ps1 "what changed"`. Gates: lint, curriculum, Python line,
key-move, server unit tests, build - then commit, push, wait for Vercel, smoke-test the live site.

## Keeping the code in step with the-school
`.\sync-from-school.ps1` copies app/, components/, lib/, scripts/, config files from ..\the-school and leaves the
instance files alone (see CLAUDE.md). Run it after any fix lands in the-school, then push here.

## Backups
Neon keeps point-in-time history on paid plans only. Monthly: export your logbook from /portfolio (markdown) into the
repo under logbook/ - that is the record that matters.
