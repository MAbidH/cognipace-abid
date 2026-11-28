# cognipace-abid - read this first

Abid's own CogniPace (19 Nov 2026): the same codebase as Faiza's school (C:\Users\ASUS\Projects\the-school, GitHub
the-school), run as a second instance with its own profile (curriculum/student.json, mode "adult"), its own curriculum,
its own Vercel project, Neon database and model API key (NVIDIA NIM, free). Live at: https://cognipace-abid.vercel.app (login link = that URL + ?t=STUDENT_TOKEN).
FOCUS (28 Nov 2026, Abid's decision - supersedes ABID-PLAN-2026-11-19's six-phase cyber plan): ONE career path - the
CRA job and finance (CRA1, then IFC1; next career modules written 4-6 weeks ahead). Tech/security (SETUP1, PY1, PY2,
LNX1, FLIP1, FIN1, FIN2) is an OPTIONAL hobby track (module.track = "hobby"), switchable both ways from the home page
(app/api/track, adult only). 3-5 hours a week, ~30-minute steps, short and direct: no warm-up, no school day, no
XP/streak/rewards/wonder/arena/news UI (components/AdultHome.js; adult guards in Shell, warmup, state route).
Faiza's work belongs to her own session: here, touch only instances/abid and adult-guarded code.

## How the two instances relate
- CODE is shared: app/, components/, lib/, scripts/ are identical to the-school. Fix a bug in the-school, then
  `.\sync-from-school.ps1` here copies the code over (it never touches the files listed below) - then push.
- INSTANCE files live only here and are never copied from the-school: curriculum/student.json, calendar.json,
  rewards.json, machine.json, meetings.json, modules.json; CLAUDE.md; docs/SEQUENCE.md; docs/RUNBOOK.md; push.ps1;
  README.md. (wonders.json and news.json are shared for now - security wonders and news suit an adult too.)
- Nothing here can change Faiza's instance: different repo, different database, different key.

## Who decides
- Abid is the student AND the operator. He deploys (`.\push.ps1 "message"`), owns the model key and the plan. /guardian is his own dashboard.
- The sequence is fixed in advance (docs/SEQUENCE.md): every step is a prerequisite for the next. Order changes only
  at a phase review; a module is written at most 4-6 weeks ahead; far modules stay outlines.

## Non-negotiable
1. No password, passphrase, recovery/seed phrase, PIN, token, API key or private key is ever typed into the tutor
   chat, a file in the repo, or a session with Claude - test secrets included. Keys go into Vercel env only.
2. Builder-defender: offence only to explain defence; hands-on only on his own machines, his lab, or sites that invite
   it (TryHackMe, HTB, OverTheWire, picoCTF, Cryptopals). Criminal Code s. 342.1 and s. 430(1.1) are the law.
3. Finance house rule: the programme teaches mechanisms, never what to buy; all trading is paper; on-chain work is on
   test networks (Sepolia) only; real-money decisions are Abid's own, outside the programme.
4. Grading only on the server; a step closes on evidence (a pasted output, a commit, a hash, his own sentence), never
   because time ran out - it pauses and continues.
5. Curriculum lives only in curriculum/modules.json: one idea per step, learn -> build -> practise, a `taught` list per
   module, checks graded on the server from the taught fence, the Boundary Question at every code step and checkpoint,
   a teach-back last, a gift (what goes into the public record) per module.
6. The current PC carries other project data: no Linux, WSL, VirtualBox or dual boot on it. Linux is the TryHackMe
   AttackBox and ssh until the second laptop; Ubuntu 24.04 goes on that laptop (LNX2).

## Standing settings (19 Nov 2026)
- Tutor model: NVIDIA's free NIM API through the OpenAI-compatible adapter (lib/llm.js; Vercel env LLM_PROVIDER=openai,
  LLM_BASE_URL, LLM_API_KEY); the model id is calendar.json tutorModel (nvidia/llama-3.3-nemotron-super-49b-v1.5 to
  start). Abid, 19 Nov: "instead of anthropic let's use a free one from Nvidia ... all i need is guided instructions".
  The model still runs behind every step - it grades checks, writes the review questions and closes steps on evidence -
  but it is a free, rate-limited model, so a refused call means "try again in a minute", never a bill.
- No night rule, no exams, no vacations (calendar.json). Daily tutor-time cap 480 min (a safety cap, not a goal).
- Rhythm: 6 days x 3 h, one day off; Saturday is review day (10 review questions, one old module re-checked, one
  room, one write-up). Streak: one missed day a week is free (lib/streak.js, as hers).
- Warm-up (required before a lesson): the Python line (from the first PY1 step) + the review questions (from the
  first passed checkpoint). Nothing else.
- Rewards (rewards.json) are the plan's next physical prerequisites, delivered when their module passes - the second
  laptop after SETUP1, Ubuntu on it when LNX1 passes, the Security+ voucher after PY2, a Pi at Level 5.

## Log
Add a dated entry to docs/HISTORY.md for every change worth remembering. Keep this file short.
