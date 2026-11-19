# The ten-year map (first drafted 4 Oct 2026 - a map of possible paths, not a fixed destination)

29 Oct 2026 (the neutral review): this map is a direction, not a destination. The path is hers to choose - Faiza says
what she wants to become and learn, and the map changes with her. The one fixed thing is builder-defender. Labels such as
"elite", "top-tier" or "world-class" are not used with her or about her; specialist modules are electives she can pick.
Until she is 16 her public identity is a handle only (no real name, face, city, school or real-name domain).

Abid's brief: the structure must produce someone who understands how things really work, all the way down, in
several domains at once - a builder-defender in security, someone who understands AI from the inside, someone who
can read how governments, markets and institutions actually work on the global stage. The word for that is not
"genius"; it is depth, in four strands, with the hours growing as she grows. Said to her, it is always: "you will
understand how things really work." Never "super genius" - that is pressure, not identity.

## The four strands (side by side, every year)

### 1. The Machine - security, from the bits up (the spine; already the North Star)
Year 1 (12): binary, Python, her own laptop built by her, Linux in WSL2, the shell, Git, her website.
Year 2 (13): networks (packets she builds herself, Scapy on her own network), the Pi, the Companion, Omarchy, CTFs
(picoCTF, OverTheWire), Kali in a VM against sanctioned targets only.
Year 3 (14): C and memory - pointers, the stack, one buffer overflow she creates and fixes in a VM she owns;
how operating systems isolate processes; her first write-ups published.
Year 4-5 (15-16): reverse engineering (reading binaries she compiled), web security on apps she builds, fuzzing,
hardware hacking on her own devices, cryptography implemented and then broken, open-source contributions.
TWO MODULES ADDED TO THE PLAN (Abid, 22 Oct 2026, the PHP week: "how can Faiza be someone like those researchers?"),
both after CS8, roughly Year 3 - planned, not built; build them when CS8 is a month away:
- FUZZ1 "Let the machine try a million inputs" (phase Security, ~8 steps): the Boundary Question automated. Mechanism
  first (a fuzzer is a loop that feeds random and mutated inputs to a program and watches for a crash - her CS2A loop
  plus her CS2B input checks, at scale); her hands: a 20-line Python fuzzer against her own vowel counter and quiz
  (LV2/CS2B), then AFL++ or libFuzzer against the C program from CS8-L3 in her own VM, a crash found, minimised, read,
  fixed; coverage as the map of what was tried; Horizon: how the PHP bugs of Oct 2026 and most CVEs are found today
  (fuzzing + AI-assisted code reading), OSS-Fuzz. Own programs only; the gift is a fuzzer Abid can run on his own code.
- DISC1 "Found a bug - now what? Responsible disclosure" (phase Security, ~6 steps): the rule that turns a skilled
  person into a trusted one. Mechanism: coordinated disclosure (tell the owner privately, a fixed waiting period, the
  fix ships, then the write-up and the credit), CVE numbers, security.txt, bug bounty rules; her hands: a disclosure
  letter written for a bug in her OWN program (as if someone else found it), a timeline, a write-up that teaches
  without handing out a weapon; the law and the ethics as mechanism (what is legal to test, what never is, why the
  PHP researchers waited two months); Horizon: the day the PHP fix shipped, seen from the researchers', the PHP team's,
  and Newfoundland's side. Capstone: her first real report goes to a real project only with Abid, age 15-16 (MILESTONES).

TWO VIRTUAL-MACHINE MODULES ADDED TO THE PLAN (Abid, 23 Oct 2026 - Faiza asked "can I run Kali and Arch together on one
PC at the same time?"). Planned, not built; build VM1 when CS5 is a month away, VM2 when DEF1 is a month away:
- VM1 "A computer inside your computer: virtual machines, and Arch built by hand" (phase Computing, ~9 steps, after CS5,
  end of Arc 1). Problem first: one laptop, many systems, and a place where breaking things costs nothing. Mechanism: a
  hypervisor (KVM, inside the Linux kernel) lends a VM slices of the real CPU, memory and disk; a virtual disk is just a
  file; a snapshot is an undo button for a whole machine; the VM cannot see her files (isolation - the CS3 question again).
  Her hands: measure her budget first (free -h, nproc, df -h: with 8 GB RAM one VM at a time, Arch without a desktop at
  2 GB; with 16 GB two at once), install virt-manager with apt, make her first VM, then install ARCH BY HAND from the
  Arch wiki's installation guide (partition, format, pacstrap, fstab, chroot, bootloader, a user, sudo) - every command
  read before it is run; snapshot; break it on purpose (delete the bootloader), roll back. This replaces the old
  "Omarchy dual-boot" capstone: a dual-boot would mean re-partitioning her encrypted Mint disk, a VM risks nothing.
  Horizon: the cloud is VMs (every big provider rents slices of real machines), malware analysts open suspicious files in
  throwaway VMs, a "VM escape" is the defenders' nightmare - mechanism only. Gift: a one-page "how Linux starts" drawing
  from her own install (firmware -> bootloader -> kernel -> systemd -> login).
- VM2 "Kali in a VM: the tester's toolbox, on her own lab only" (phase Security, ~8 steps, after DEF1, before DEF2) - the
  approved "vulnerable app on her own Pi" lab lives here. Kali is a toolbox, never a daily system. Lab rule in her words
  before anything: only her own Pi, on her own lab network (the GL.iNet sandbox when she has it, otherwise the VM's
  isolated network), with permission written down - permission is the whole difference between a tester and a criminal.
  Her hands: Kali in a VM; her own deliberately weak app on the Pi (written by her in WEB1-style Python, with three known
  mistakes: a default password, a page that trusts its input, a file the web server should not serve); each finding goes
  scan -> evidence -> fix -> re-scan; tools named only as she uses them (nmap first). Then DEF2 reads her own scan from the
  Pi's logs as the incident. Horizon: who uses Kali (testers under contract, red teams), the law, and the blue side seeing
  every scan. Gift: a two-page test report of her own Pi for Abid (what was found, how it was fixed, how it was proved).

Year 6-10 (17-22): real research: a bug class, a tool, a paper; CTF teams; responsible disclosure as practice.
Guardrails never move: owned or sanctioned systems only, every attack paired with its defense, builder-defender.

### 2. Mathematics - the strand that decides how far she goes
Now: fundamentals rebuilt (M1-M10), every topic anchored to code.
By 14: algebra fluently, logic and proof (she proves small things), number theory for cryptography (primes, modulo).
By 15: probability and statistics - the maths of evidence, and of every model.
By 16: linear algebra - vectors, matrices, what a transformer is made of; discrete maths, graphs.
By 17: calculus - rates of change, optimisation, what "training" is numerically.
By 18+: cryptographic maths, information theory, the maths behind the attacks and the models.
Rule: a maths topic is learned when she has made Python do it and explained it to someone.

### 3. AI, from the inside
Year 1: an if/else bot; LV2 (what a model does, test it, break it); CS-TINY: train a tiny character model herself.
Year 2: run and shape a small open model (the Companion), design its memory and rules; what data is; what a token is.
Year 3: how training works - loss, gradient, why models get better; embeddings: words as directions.
Year 4-5: build a small transformer from scratch (Karpathy-style), train it; evaluation: how to tell a good model
from a bad one; how models fail (hallucination, bias, injection) and how people try to align them.
Year 6+: research-level: she can read a paper, reproduce a result, break a model, and say what it cannot do.
Honest line throughout: she will understand models better than most people who use them for a living, because
she will have built, trained, broken and judged them.

### 4. Systems and Society - the global stage (NEW, from Year 1 term 2)
Taught exactly like the machine: as mechanisms, neutral, with "who benefits, how would you break it, how would you
fix it" at the end of every module. Multiple countries as examples; never a single country's politics; no opinions
from the tutor; Bangladesh appears as one example among many, never as the subject.
SS1  How a state works: constitutions, the three powers, and why they are separated (US, UK, India, Germany, Japan).
SS2  How money exists: central banks, interest, inflation, why the dollar is everywhere, what a currency crisis is.
SS3  How laws are made and enforced: parliaments, courts, police, prisons - the chain from a vote to a cell.
SS4  Elections: how votes become seats (first-past-the-post vs proportional), why systems give different results.
SS5  Companies and markets: shares, who owns what, how a company answers to owners, what a market price is.
SS6  The international system: states, the UN, treaties, borders, why there is no world government, what sanctions are.
SS7  How the internet is governed: IP addresses, DNS roots, ICANN, IETF, undersea cables, who can switch it off and how.
SS8  Surveillance and rights: what can be seen (metadata, location, purchases), by whom, and what rights exist where.
SS9  Media and incentives: who pays for news, attention as a product, why institutions behave the way they do.
SS10 Power and geography: resources, chokepoints (straits, cables, chips), energy, why wars happen where they do.
SS11 War and security in the modern world: deterrence, alliances, cyber as a domain, what "critical infrastructure" is.
SS12 How to read a system: incentives, feedback loops, failure modes - the same lens for a government, a bank, a program.
Each is 4-6 steps: the problem it solves, the mechanism, her hands (a simulation in Python - a vote count, an
interest rate, a DNS lookup), a teach-back, and the Boundary Question. One module a term alongside the others.

## Feeding all four
- Leverage (LV1-LV5): speed, automation, AI as a tool, search, reading the system, loopholes found and closed.
- Wonders: one timeless fact every second day; Arena: spaced review every other day.
- Reading ladder: Year 1 The Cuckoo's Egg; Year 2 The Code Book; Year 3 Surely You're Joking, Mr Feynman;
  Year 4 Gödel, Escher, Bach (slowly); Year 5+ papers and primary sources. One line in the logbook per book.
- Writing: teach-backs -> write-ups -> essays -> a paper. Thinking is written down or it did not happen.
- The logbook and the website: every strand leaves evidence a university or an engineer can read.

## Hours
Year 1 (12): 60 min/day, 6 days = ~300 h/yr. Year 2-3 (13-14): 90 min. Year 4-5 (15-16): 2-3 h, most of it
projects she chose. Year 6+: her call. Where she takes it at 22 is her choice; the hours grow only as she chooses.

## What stays fixed
Depth over mention. Mechanisms before names. Her hands inside everything. Teach it back. Keyboard first.
From zero: define every word. Two wrong, then teach. Builder-defender. The gym rule. Records as credentials.

## Build 2 (Abid, 26 Oct 2026: "her curriculum needs to be top of the world; add hacking modules; prepare her for the next 50 years")
Sixteen modules added to modules.json and FULL_ORDER (see curriculum/BUILD-PLAN-2026-10-26.md for every spec). The strands now read:
- The Machine: SEC0 the human door (after CS1C) → CS2C Python II → VM1 Arch in a VM → NET3 packets by hand (tcpdump,
  Wireshark, Scapy on loopback) → VM2 Kali against her own Pi → HACK1 how attackers think / defenders think first →
  JS1 → RE1 reverse engineering on her own binaries → FUZZ1 → DISC1 → AISEC1 security of AI systems → CS9 her website.
- Mathematics: M8B integers, powers, roots (before NT1) → G1 geometry (after M12) → PQ1 quantum computers and the lock
  that must change (after M15: qubits as mechanism, Shor's idea as period-finding, what breaks and what holds,
  post-quantum lattices, NIST 2024 standards, "harvest now, decrypt later").
- Leverage: LV5 learning for fifty years (what will not change vs what changes; one CVE a week; the reading ladder).
Guardrails unchanged: every offensive idea is taught to explain its defence, hands-on only on what she owns or is
sanctioned, every finding paired with its fix and a write-up under her handle. VM1/VM2/FUZZ1/DISC1, planned on 22-23 Oct,
are now built.
