# Three-year milestones (Abid, 12 Oct 2026)

"Among everything I am doing, this is the one where I have the highest hope. I want Faiza to become someone valuable
in the cyber world in the next three years."

What "valuable" means at 16, honestly: nobody hires a sixteen-year-old. What is achievable, and rare, is a sixteen-year-old
who writes Python fluently, lives in Linux and the terminal, understands how networks and web applications work, solves
CyLab Security Academy (formerly picoCTF) and OverTheWire challenges, has a public GitHub and a site with her own write-ups, and has built one real thing
(the Companion on her Pi). That person is taken seriously by any university and any security team she meets. Every module
written for this school is checked against the list below. The inputs (minutes, streaks, XP) exist to produce these
OUTPUTS; if a month shows minutes but no outputs, the school is wrong, not her.

## The outputs we count (guardian page, every week)
- Programs written (code steps shipped + Python lines passed) - the number that must grow every week from CS2A on.
- Terminal commands she can use (LX/CS3/CS4 steps finished).
- Flags captured (CyLab Security Academy (formerly picoCTF) / OverTheWire, with a write-up each) - from Year 1 Q2.
- Things she can now do (her own "I can now" lines).
- Logbook entries and programs in her archive (school-folder, later GitHub).

## By 13½ (April 2027) - "I can make the computer do what I say"
- Python fluently: variables, if/else, loops, lists, dicts, functions, files; input checks as a reflex (the Boundary Question).
- Lives in Linux Mint: terminal daily; files, paths, permissions, pipes, processes; apt; her own backup ritual - and her own
  check.sh (CS1D: firewall, automatic updates, a check that goes red when the laptop drifts). 'Installed' is never 'safe'.
- Her own accounts, her own vault, 2FA on everything; the master-password protocol internalised.
- 200+ programs (the Python line alone gives ~150 by then), the if/else chatbot (CS2B), the lazy-programmer scripts (LV1).
- Git locally; her archive is a repository.

## By 14 (October 2027) - "I know what a network is because I built one"
- Networking as mechanism: IP, ports, DNS (she already fixed one), HTTP, TLS - packets she captured on her own network, a
  raw packet she built (Scapy, loopback). The Great Firewall / Tor / cables as Horizon.
- Her Pi is a LAB: a server she set up (SSH, a small web app, a firewall, logs), that she attacks from her laptop and
  defends on the Pi - owned machines only. harden.sh v2 (DEF1): laptop and server profiles, --dry-run, --restore,
  check; run on a fresh image, attacked three ways, proven to hold; monthly green report. Written by her, never downloaded. A small local AI model runs on it (see the Pi plan below).
- First flags: OverTheWire Bandit finished, CyLab Security Academy (formerly picoCTF) beginner track, every flag with a write-up in the logbook.
- GitHub public (13+), the archive pushed, her README written for a stranger.
- Maths: fractions, decimals, percentages, ratio, data; algebra begun; modular arithmetic through her own cipher;
  number theory (NT1: primes, Euclid's gcd, clock arithmetic, a toy key exchange she breaks) BEFORE CRYPTO1 - the
  maths inside the lock is learned by hand first, so cryptography is never hand-waved.

## By 15 (October 2028) - "I can read a system and find the loophole, then close it"
- Web security as mechanism: how a web app works (she built one), injection, auth mistakes, the OWASP ideas - on her own
  apps and sanctioned targets, each attack paired with its fix.
- The Companion running on the Pi: a small open model, voice in and out, her memory design, her safety rules.
- C begun: pointers, real addresses, one buffer overflow she creates and fixes in a VM she owns.
- Virtual machines owned (VM1): her own VM built and snapshotted (Arch by hand only if she chooses the elective VM1A), and she can explain what
  a hypervisor lends a VM; Kali used only in her own lab (VM2) with a written test report of her own Pi.
- Electives she may choose (29 Oct 2026: not a schedule): fuzzing (FUZZ1), disclosure (DISC1), reverse engineering (RE1),
  AI security (AISEC1), quantum (PQ1), Arch by hand (VM1A) - counted only if she picks them.
- the CyLab Security Academy (picoCTF) yearly competition entered; 30+ write-ups public; Advent of Code attempted.
- Her website live (CS9) under her handle: one line about what she builds, three projects with evidence, the logbook.
  Until she is 16: a handle only - no real name, face, city, school or real-name domain anywhere public.

## By 16 (October 2029) - "someone a security team takes seriously"
- A body of public work: write-ups, the Companion build log, two or three real tools she wrote and others could use.
- Reverse-engineering and binary basics; a CVE-class bug understood end to end (not necessarily found).
- A first real report, with Abid: a bug (any size) in an open-source project she uses, reported privately and credited.
- Tutor-free weeks: she plans a project, builds it, writes it up, and teaches it back on a call.
- Admissions-ready record: dated logbook of three years, GitHub, site, CTF standings, a reference from a real engineer
  she met through the school (Orpi Apu, Sifat Bhaiya).

## The Raspberry Pi 5 plan (Abid, 12 Oct 2026: "she will run a local AI model of her own to practise cybersecurity")
The Pi earns its place twice over, and the order matters:
1. THE LAB BOX (first, Year 1 Q2, after CS3): her own Linux server on the home network - SSH from her laptop, a tiny web
   app she wrote, a firewall she configured, logs she reads. It is the TARGET she attacks (from her laptop, with the tools
   she is taught) and the SYSTEM she defends (patch, harden, watch the logs). Most of what a security person does, she
   does here, on a machine where nothing can be lost. This is the single most valuable use of a Pi for her path.
2. THE LOCAL MODEL (second, once the lab exists): a small open-weights model (1-3B, GGUF, llama.cpp/Ollama) running on
   the Pi, offline. Honest expectation: a few words a second, and it is often WRONG about security facts - which is the
   lesson: she learns what a model is, how to run one herself, how to give it a memory and rules, and why its answers must
   be checked (LV2's AI-checker reflex, now on her own hardware). It becomes the Companion later (voice, body, her rules).
   It is NOT a replacement for the school's tutor and is never the source of truth for security - the lab box and the
   write-ups are. A Pi 5 with 8 GB RAM is the minimum for the model stage; 16 GB is better if the price allows.
3. Guardrails as always: her own network, her own machines, every attack paired with its defence, every experiment in
   the logbook with what it taught her about the defence.

## Calendar reality (Abid, 12 Oct 2026)
- Puja vacation 16-24 Oct 2026, 5-7 h/day: CS2A (first Python, on Windows until install day) -> LX1 on day one (16 Oct; SSD in hand 14 Oct) -> LX2 -> M5 ->
  CS1C-A1/A2 on the 23rd-24th (she is 13 on the 22nd; she works on her birthday).
- November: school finals. Exam mode = 10 minutes a day (warm-up + Python line + Wonder), streak safe.
- December to mid-January: winter days of about 3 hours (29 Oct 2026 review), one real day off a week: CS2B (with a CS2A
  review first), CS1D, SEC0, LV1/LV2, M6, M7, M7B, CS3 - see the curriculum order.

## Build 2 additions (26 Oct 2026) - what the new modules let us count
- By 13½: SEC0 the family card made; M8B powers of two by heart (2**10 = 1024); CS2C a program with a dict, a try/except
  and a test file; VM1 a VM with a snapshot she rolled back.
- By 14: NET3 a packet she built (Scapy, loopback) and a capture she annotated; VM2 a two-page test report of her own
  Pi with every finding fixed; HACK1 a threat model of the house; JS1 a page that fetches from her own API.
- By 15: G1 Pythagoras proved and coded; CS9 her website live under her handle (her own domain only from 16 - the
  elective CS9D). Electives if she chooses them: RE1, FUZZ1, DISC1, AISEC1.
- By 16: LV5 a yearly learning plan she writes herself (and PQ1, if she chose that elective).
