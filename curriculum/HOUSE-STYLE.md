# House style for every module and step (read fully before writing anything)

WHO: Faiza, 13, Dhaka, learning alone at a Linux Mint 22.3 laptop (user faiza, host Powerhouse, LUKS, Firefox, VS Code,
Bitwarden, Proton Mail, keyboard-first; NO Print key: screenshots = the "Show my screen" button or Firefox Ctrl+Shift+S).
She was new to computers in Sept 2026. B1 English. The tutor is an AI (Claude Opus) reading `tutor_brief` - the brief is
written TO THE TUTOR, in imperative prose, and is the whole lesson plan. She never sees the brief.

NON-NEGOTIABLE RULES
1. Builder-defender. Offence only to explain defence; hands-on only on HER OWN machines/VMs/apps/Pi or sanctioned sites
   (OverTheWire, CyLab Security Academy = learn.cylabacademy.org, cmdchallenge). Never an exploit recipe, payload, or
   tool how-to aimed at a system she does not own. Every attack idea is paired with its defence and a write-up. State the
   lab rule in her own words in every security module. Never the outlaw framing; "Dario, not Elliot".
2. Never ask for, see, or store a password/passphrase/token/key. Never ask her to type a password into chat.
3. FOUR-PART DEPTH for every tool/concept: the problem it solves, the mechanism underneath (in her words, tied to the
   hardware/OS reality - RAM, disk, process, packet), her hands inside it (make it, break it, fix it), teach-back.
   Nothing introduced by name only. Vocabulary taught the first time it appears (define + check).
4. ONE IDEA PER STEP, ~25 minutes at her pace. `time_box` on every lesson/code step (20-60; 20 for quick wins).
   No two heavy steps (lesson/code over ~35 min) in a row without a quick win (`*-W1`, `*-W2`...) or a practice set.
5. FROM ZERO. Each lesson brief opens with "FROM ZERO:" - the glossary of every new word (plain definition; a Bangla gloss
   in brackets is allowed only for the hardest 1-2 words, for the tutor's use when she struggles). Then "WHAT/WHY/WHAT FOR"
   in three plain sentences the tutor opens with. Then the lesson in order. Then "CLOSE:" the closing question.
6. KEYBOARD-FIRST, TASKS AS MANUALS (Abid, 31 Oct 2026): a task on her screen is given as ONE numbered manual - a Goal line,
   numbered steps each saying where (window, part of it), what it looks like (exact label in quotes), the action (exact
   keys / click-path) and "you see: ...", then "Done when: ...". She follows it to the end and reports done or a step
   number. Exact keys named (Ctrl+Alt+T terminal, Super menu). Never "search for it".
   Any download/sign-up has `links: [{label, url, what}]` (https only, maker domain) and the brief says "press the button
   called ...". Never ask her to type an address.
7. ONLY WHAT EXISTS on her machine: Mint 22.3 (Ubuntu 24.04 base) defaults. Name `sudo apt install <pkg>` for anything not
   default (strace, build-essential, binutils, xxd, nmap, tcpdump, wireshark, virt-manager, aria2, bind9-dnsutils,
   python3-venv, python3-matplotlib...). pip only inside a venv (PEP 668). No Windows, no Print key; the iPad appears only as her 2FA device and second screen (CS1C/CS1D).
8. Python she has (by CS2B): print, variables, int/str, + - * / // %, comparisons, if/elif/else, for/range, while/break,
   lists (index, append, len, for over), def/return, .lower/.strip, ord/chr. LV1 adds os, str(), open/with/.strip (CODE3).
   CS2C (new, after CS5) adds dicts, tuples, != <= +=, f-strings, try/except, import + stdlib (random/json/datetime/
   pathlib), venv/pip, tracebacks, assert, re.search, while True. Anything used before it is taught gets ONE defining line
   in that brief/starter. The browser editor is Pyodide: input() is unavailable (put answers in variables), its file
   system persists between runs (starters that create files must clean up first), no network, no endless loops.
9. EVERY `starter` must run clean with `python3 -I` and the printed output must match what the brief says it prints.
   Predict-then-run: the starter has "Predict each line BEFORE you run" and "Your turn" tasks at the bottom. Two tests
   per code step, and the Boundary Question ("what input breaks this line?") at the end of code steps and in the
   checkpoint.
10. CLOSING IN THREE MESSAGES, IN HER WORDS (TUTOR_SYSTEM, 29 Oct 2026): one closing question; SHE says the I CAN NOW
   sentence; the tutor writes the summary + "I CAN NOW: <her sentence>" + [LOGBOOK: <her sentence> - evidence: ...], then
   [STEP DONE]. Briefs name an "EVIDENCE TO CLOSE" line (what she must do or say), never the line she must say.
11. Student-facing titles: short, warm, concrete ("Code: Python adds 0.1 and 0.2 - and gets it slightly wrong").
   Never "genius". Never "you failed".
12. HORIZON step (`*-H1`): the wider world of the thing - who else uses it, how states bend it, how criminals abuse it,
   how defenders answer - as mechanism, with glossary, a "which protects and which controls" question, and the Boundary
   Question. Facts must be TRUE and durable (no invented statistics; name real, well-known cases only, year given).
   Dark web / Tor: not taught (Abid tells her himself); the CURIOSITY RULE in TUTOR_SYSTEM handles questions.
13. GIFT: `gift: {for, what}` on the module - one small thing she makes for someone (Abid, parents, a friend); a step whose
   id ends in -GIFT is where it is made, otherwise the last code step. The brief of that step says so.
14. Module ends: ... `*-C` checkpoint (`kind: "check", skills: [...kebab ids...], count: 8-12`; the generator writes the
   questions from the module's `taught` list, so write `taught` carefully: exactly what was taught + an explicit
   "NOT taught here - never ask:" list), then `*-T` teach-back (`kind: "teach", prompt: "... Say it out loud first, then
   write it. 3-6 sentences."`). Practice sets: `{id, kind: "practice", title, skills: [...], count: 6-8}` (generated).
15. `max_turns`: lessons 30-45, code 40-60, quick wins 12, practice/check omitted. `media: []` unless a verified embeddable
   YouTube id is known (prefer none). `read: {url, title}` on the module only for a real, stable, public page.

STEP SHAPES (JSON)
lesson: {id, kind:"lesson", title, time_box, max_turns, objectives:[2-3 strings], media:[], tutor_brief, links?}
code:   {id, kind:"code", title, time_box, max_turns, objectives, starter, tutor_brief}
practice: {id, kind:"practice", title, skills:[...], count}
check:  {id, kind:"check", title:"<Module> checkpoint", skills:[...], count}
teach:  {id, kind:"teach", title:"Teach it back", prompt}
quick win (lesson or code, id *-W1): time_box 20, max_turns 12, objectives ["Three sure things on what she just did - a
  short, easy step after a big one"], brief begins: "QUICK WIN. This step is SHORT and SURE: nothing new is taught, no new
  word, no detour. First message: say plainly 'this one is short - three small things and you are done'. One thing per
  message; a wrong answer gets one plain sentence and the next one, never a lesson. After the three: one I CAN NOW line
  and [STEP DONE] - inside 15 minutes. Never extend this step. " then the three things.
module: {id, title, phase, hook (2-3 sentences to her: why this matters in her life), read?, gift, taught, steps:[...]}
Phases in use: Foundations, Mathematics, Computing, Leverage, Security, Networks, Web, AI, Hardware, Systems & Society, Project.

A MODEL BRIEF (M6-L1, lesson) - match this density and voice:
"FROM ZERO: fraction = a part of one whole, written top/bottom. numerator (top) = how many parts; denominator (bottom) =
how many equal parts the whole was cut into. like fractions = same bottom. WHAT/WHY/WHAT FOR (open with these three):
today we add two fractions with the same bottom; because the bottom says what SIZE the pieces are, so same-size pieces can
be counted together; for sharing food, money and time fairly - and later for the maths inside every measurement. ONE IDEA:
same bottom → add the tops, keep the bottom. Draw it (DRAW rule): a bar cut into 8, shade 3 then 2 more. Her hands: 3/8 +
2/8 (5/8), then 1/5 + 3/5, then 2/6 + 3/6 - predict, then check by drawing. The trap: 1/4 + 1/4 is NOT 2/8 - ask her why
(the pieces did not change size). Two wrong → teach with the bar again → a similar one. CLOSE: 'in one or two sentences:
what did we do and why do we keep the bottom?' I CAN NOW line to aim for: 'I can now add fractions with the same bottom
and say why the bottom stays.' Time box 25."

OUTPUT FORMAT FOR A NEW MODULE: one file `<ID>.json` holding the complete module object (valid JSON, 2-space indent). Starters
are plain strings with \n. Before finishing: run every starter with `python3 -I` in a scratch dir and paste the outputs
into a `<ID>.check.txt` file next to it, and validate the JSON with node.
OUTPUT FORMAT FOR FIXES TO EXISTING MODULES: one node script `fix_<name>.js` taking the modules.json path as argv[2],
using the exact pattern of apply_audit2.js (st map, rep() that asserts a unique match, QW factory, splice for new steps,
JSON.stringify(mods, null, 2) + "\n" write-back). Read the current step text with node first; every rep() old-string must
be copied exactly. Run the script against a COPY of modules.json in your scratch dir to prove it applies cleanly, then
run `node scripts/test-curriculum.mjs` logic against the copy (copy the test file and point it at your copy), and run
every changed starter with python3 -I.
