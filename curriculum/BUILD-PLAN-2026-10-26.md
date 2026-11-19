# Build plan, 26 Oct 2026 (Abid: "I want all the changes — her curriculum needs to be top of the world; add hacking modules; prepare her for the next 50 years, not today")

Guardrails never move: builder-defender. Offence is taught to explain defence, hands-on only on her own machines
(laptop, Pi, her VMs, her own apps) or sanctioned sites (OverTheWire, CyLab Security Academy, cmdchallenge, her own lab).
Never an exploit recipe against a system she does not own. Every attack is paired with its defence and written up.

## The new order (FULL_ORDER)

```
M1 M2 M3 GK1 M4 CS1 CS1B CS2A LX1 LX2 M5
CS1C SEC0 CS2B LV1 LV2 M6 M7                      ← Year 1 Q1-Q2 (done to M5; SEC0 new: the human door)
CS3 CS4 CS5 CS2C VM1 LV3                           ← ARC 1 her machine, properly (CS2C Python II, VM1 new)
M8 M8B SS1                                         ← maths beat (M8B integers/powers/roots new)
NET1 NET2 NET3 DEF1 VM2 HACK1                      ← ARC 2 the network and the Pi lab (NET3 packets, VM2 Kali lab, HACK1 new)
M9 NT1 SS2                                         ← maths beat
WEB1 JS1 WEB2 CRYPTO1 DEF2 CTF1                    ← ARC 3 build the web, make it safe (JS1 new; DEF2 moved after WEB2 - it reads WEB1's app)
M10 M11 SS3                                        ← maths beat
CS6 CS7 CS8 RE1 FUZZ1 DISC1 LV4                    ← ARC 4 how programs really run (RE1 reversing, FUZZ1, DISC1 new)
M12 G1 M13 SS4                                     ← maths beat (G1 geometry new)
CSTINY AI1 HW1 AI2 AISEC1                          ← ARC 5 AI from the inside (AISEC1 new)
M14 M15 PQ1 SS5                                    ← maths beat (PQ1 quantum + post-quantum new)
CS9 LV5 PROJ1                                      ← CS9 her website, LV5 learning for 50 years (new)
```

## New modules — specs (every one: four-part depth, a gift, a Horizon lesson, Boundary Question at the checkpoint,
## B1 English, from-zero glossary, one idea per 25-min step with time_box, quick win / practice between heavy steps,
## `taught` list, keyboard-first, click-path primary. Model briefs: M6-L1, M7-CODE, LV1-CODE3, CS2B-W3 (quick win).)

- SEC0 "The human door: phishing, scams and the three questions" (phase Security, ~7 steps, after CS1C). Why most
  break-ins start with a person, not a bug. Mechanism: urgency + authority + a link; OTP/"bKash" scams in Bangladesh as one
  example among many; how a login page is faked (she looks at the address bar, never types a password from a link).
  Hands: she sorts ten messages (given in the step) into real/fake with reasons; writes the family's three questions;
  checks a link by hovering; reports a phish in Proton. Gift: a one-page "how to spot a scam" card for her parents.
- CS2C "Python II: the ideas every real program uses" (Computing, ~12 steps, after CS5). dicts (key→value, the smart
  shelf), tuples and pairs, != <= +=, f-strings, try/except (loud failure), import and the standard library (random, json,
  datetime, pathlib) + pip in a venv, reading a traceback (the one skill), assert and her first test file, a regex intro
  (re.search for one pattern), a while True loop with break. Gift: a program for Abid that reads a JSON file and reports.
- VM1 "A computer inside your computer: virtual machines, and Arch built by hand" (Computing, ~9 steps, after CS2C). Per
  TEN_YEAR_MAP (23 Oct): free -h first; virt-manager/KVM; a VM; Arch installed from the wiki guide; snapshot; break it,
  roll back. Horizon: the cloud is VMs; VM escape as the defenders' nightmare.
- M8B "Integers, powers and roots" (Foundations, ~8 steps, after M8). Negative numbers on the number line (temperature,
  debt), adding/subtracting/multiplying them; powers (2**10 = 1024, why computers love 2), square roots, scientific
  notation (10**600 in NT1), big-number sense. Code: Python ** and math.sqrt, the "powers of two" table.
- NET3 "Packets by hand: capture, read, build" (Networks, ~8 steps, after NET2). tcpdump on her own laptop, Wireshark
  reading her own DNS/HTTP, the layers (frame/IP/TCP/HTTP) seen in a real capture, then Scapy on loopback: build a packet
  byte by byte and send it to herself. Her own network only. Gift: an annotated capture of one page load, for Abid.
- VM2 "Kali in a VM: the tester's toolbox, on her own lab only" (Security, ~8 steps, after DEF1). Per TEN_YEAR_MAP: the
  lab rule in her words; Kali VM; her own deliberately weak app on the Pi (written by her: default password, trusting
  input, a served file that should not be) - scan → evidence → fix → re-scan; nmap/nikto named as used. Gift: a two-page
  test report of her own Pi.
- HACK1 "How attackers think - and how defenders think first" (Security, ~8 steps, after VM2). The kill chain as
  mechanism (recon, foothold, privilege, persistence, exfiltration) with each stage's defence; recon on HER lab only
  (nmap, the Pi's banner, what her own logs show about her own scan); threat modelling her own house network (assets,
  doors, who would want what); the attacker's notebook = the defender's checklist. Horizon: red teams, blue teams,
  purple; the MITRE ATT&CK idea named not detailed. Boundary: "what is the one thing you must have before any test?"
  (written permission). Gift: a threat model of the house for Abid.
- JS1 "JavaScript: the language inside the browser" (Web, ~7 steps, after WEB1). The console, variables/functions
  (same ideas as Python, different coat), the DOM (change the page), fetch to her own Flask API, the dev tools Network
  tab. Why this matters for security (code that runs on the visitor's machine). Gift: a live clock on her noticeboard.
- RE1 "Reading a program you did not write: reverse engineering basics" (Security, ~7 steps, after CS8). strings, file,
  xxd, objdump -d on HER OWN compiled C programs, a first look at Ghidra (free) on her own binary, what a crackme is,
  one CyLab reversing challenge. Gift: a write-up of her own binary's secret string.
- FUZZ1, DISC1 per TEN_YEAR_MAP (22 Oct): fuzzing her own programs (Python fuzzer, then AFL++ on her CS8 program in VM1);
  responsible disclosure (letter, timeline, write-up for a bug in her OWN program; a real report only with Abid at 15-16).
- G1 "Geometry: shapes, angles, and the maths of space" (Mathematics, ~10 steps, after M12). Angles and triangles,
  Pythagoras (with a proof she checks), area and perimeter, circles and pi, coordinates again (distance between points),
  Code: Python draws shapes as text / turtle, checks Pythagoras for 1000 triangles. Horizon: GPS, graphics, robots.
- AISEC1 "Security of AI systems: attacking and defending a model you run" (Security, ~8 steps, after AI2). Prompt
  injection on HER Companion (she injects, then defends: separate instructions from data - the WEB2 rule again), data
  poisoning as mechanism, jailbreaks named not catalogued, AI agents with tools and why they are dangerous, the defender's
  checklist for an LLM app, and the other side: AI as the defender's tool (reading logs, finding bugs - the PHP story).
  Horizon: how the field is changing yearly; what will not change (input is data; least privilege; verify).
- PQ1 "Quantum computers and the lock that must change" (Mathematics/Security, ~7 steps, after M15). A qubit as a
  mechanism (not magic), why factoring gets easy on a quantum computer (Shor's idea in words), what breaks (RSA, key
  exchange) and what does not (hashing mostly, symmetric with bigger keys), post-quantum lattices in one picture,
  "harvest now, decrypt later", the migration happening now (NIST standards 2024). Boundary: what should she encrypt
  today for a secret that must hold in 2050?
- CS9 "Her website: a page about her, built by her, on her own domain" (Web, ~7 steps, after SS5). Static site (HTML/CSS
  from WEB1, a little JS1), GitHub Pages, the privacy rule in her words (first name, work, city - never school, address,
  routine), the logbook export as a page, write-ups section, Abid registers the domain in his name (L8 reward).
- LV5 "Learning for fifty years: how a professional stays current" (Leverage, ~6 steps, after CS9). The reading habit
  (one CVE a week read as mechanism, one write-up), following the field (security lists, conference talks, papers read
  with the LV4 skim), the Cuckoo's Egg and The Code Book as the reading ladder, teaching as learning (her write-ups), what
  will not change in 50 years and how to spot what is changing (AI, quantum, new platforms). Gift: her own learning plan
  for the year ahead, shown to Abid.

## Fixes to existing modules (from claude/AUDIT-2026-10-26.md) — all applied in this build
CS3, CS4, CS5, LV3, M8, M9, M10 (B list); NET1, NET2, DEF1, DEF2, NT1, WEB1, WEB2, CRYPTO1, CTF1, CS6, CS7, CS8, M12,
AI1, AI2, HW1 (C list). Quick wins / practice between heavy steps and time boxes everywhere.
