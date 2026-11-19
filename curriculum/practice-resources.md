# Gamified practice resources — dropped in at milestones

Curated by the guardian, 23 Sep 2026. Every item here is a sanctioned, legal,
isolated learning environment. They slot into the existing CS track at the
modules named below — introduce each one only when she reaches that module, as
practice/muscle-memory alongside the lesson, never as a replacement for it.

## Phase 1 — Pure logic & syntax (Year 1, Months 3-6)
- **cyber-dojo (cyber-dojo.org)** — write-a-line, run-the-test, fix-it loop with
  red/amber/green feedback. Pairs with CS2/CS2A checkpoints: reinforces the
  "run it, read the error, fix it" reflex and the boss-battle/debug framing.
- **Flexbox Froggy & Grid Garden** — CSS layout taught as logic puzzles. Use
  right before **CS9: Build a Website I**, so element positioning is muscle
  memory before she styles a real page.

## Phase 2 — Linux mastery & the defender's interface (Year 1, Months 6-12)
- **OverTheWire: Bandit (overthewire.org)** — the systems-engineer rite of
  passage. She uses her **WSL2 terminal as the SSH client** to connect to
  OverTheWire's own sanctioned game server (their machine, her playground). Each
  level uses standard Linux commands (ls, cat, find, grep) to locate the game
  password for the next level. Introduce after she's solid on cd/ls/cat — i.e.
  during/after **CS3 (terminal/Linux)**. NOTE: needs outbound SSH (port 22);
  confirm it isn't blocked on her network before the session.
- **Cmd Challenge (cmdchallenge.com)** — single-line browser drills solving
  text problems with grep/awk/pipes. Perfect 5-minute daily drill once she
  enters **CS4 (permissions/shell)**.

## Phase 3 — Elite architecture & real code (Year 2)
- **CyLab Security Academy (cylabacademy.org; called picoCTF until 2026)** — Carnegie Mellon's gamified security "gym" built
  for middle/high-school students; web, crypto, reversing, all foundational and
  safe. Introduce in Year 2 as she reaches data structures / networking / early C.
- **Advent of Code (adventofcode.com)** — yearly December puzzle set; early ones
  are arithmetic, then scale into data structures and algorithmic efficiency.
  Have her tackle the first 5-10 puzzles in Year 2 to stretch her Python.
- **Reading public repositories (GitHub)** — at **CS5 (Git & GitHub)**, don't
  stop at pushing her own code: have her clone and READ small, elegant
  open-source tools. Reading clean professional code is how she moves from
  writing scripts to designing systems.

## Guardrails (apply to all of the above)
Owned/isolated environments only; game "passwords" in Bandit are the intended,
sanctioned objective, not real credentials; every offensive-flavoured challenge
(CyLab Security Academy) is paired with understanding the corresponding defense. Builder-
defender ethos. See CLAUDE.md "North Star & standing pedagogy".
