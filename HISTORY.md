
- 22 Nov 2026 (later): two modules added to this instance. FLIP1 (Flipper Zero I - the device and its seven subsystems,
  the law (sanctioned targets, Criminal Code s.342.1/430(1.1), Radiocommunication Act transmit/jamming), official-vs-
  custom firmware and the region/TX-power legal line, infrared learn/replay on his own appliances, GPIO/UART reading his
  own Arduino; 7 steps, phase "Hardware"; builder-defender, own gear only; radio/RFID/NFC and BadUSB deferred to FLIP2
  until after the crypto phase - outline in docs/SEQUENCE.md). IFC1 (CSI Investment Funds in Canada - the real 18
  chapters consolidated into 12 recall passes + a 25-question mock weighted like the exam + teach-back; 14 steps; active
  recall for the exam Abid is about to sit - 1 proctored exam, 100 MCQ, 3h, 60% pass, 85% Honours; house rule kept:
  suitability is a skill for advising a client, not personal advice to him). Order now SETUP1, IFC1, PY1, FIN1, PY2,
  LNX1, FLIP1, FIN2 = 83 steps (IFC1 placed early so it serves his imminent exam; one-line reorder if he wants it
  elsewhere). test-curriculum passed in the container against the adult overlay (8 modules, 83 steps, well-formed);
  modules.json md5 b4edbc74 committed to instances/abid/curriculum/. Still needs the normal the-school push + sync into
  cognipace-abid. LIVE CHECK (IFC1-L11): his Sept-2026 IFC textbook may still name MFDA/IIROC; CIRO replaced them in 2023.

## 28 Nov 2026 - CRA1: CRA-ready before day one
- What happened: after his CRA interview (SP-03 Assessment Processing Clerk, req. 62649327) Abid asked to be fluent in everything the job uses before he starts, without going back to school (full-time work, expenses).
- What changed: new module CRA1 (17 steps, ~30 min each), placed right after SETUP1, before IFC1. Covers the tax-centre flow and how a clerk is judged; confidentiality (ITA s.241, need-to-know, CRA values); the T1 from 15000 to 48400/48500; number pad KPH + the Tax Centre Clerical Test number checking; T4 and other slips; deductions vs credits and NL428; Excel I and II; his own return line by line (SIN masked); NOA, Change my return/ReFILE/T1-ADJ, adjustment vs objection; shortcuts and the four-part case note; benefits and CRA scams; the WST (106 MCQ, 90 min) and SJT-R (102 Q, 2h20); the first 90 days. Reward a-cra1: register for CVITP. Generator: curriculum/src/cra1.mjs. All links checked against canada.ca search results 28 Nov.
- Rule learned: never put real taxpayer data (SIN, account numbers, someone else's figures) into the tutor - practise with made-up numbers or his own return on paper. Free only; no school.

## 28 Nov 2026 - one focus: career (CRA + finance); tech becomes a hobby track
- What happened: Abid said the programme felt scattered ("trying to achieve everything at once") and copied from Faiza's school. His answers: focus CRA job + finance; cyber/tech = optional hobby; short and direct; 3-5 h/week.
- What changed: modules.json order CRA1, IFC1 (career) then SETUP1, PY1, FIN1, PY2, LNX1, FLIP1, FIN2 with track "hobby" (FIN1/FIN2 moved to hobby: they need Python). New adult-only home page (components/AdultHome.js): current step + Continue, career list, hobby list with "Work on this" (app/api/track switches the current module and keeps the old one's step), what-I-can-do list. Adult guards: no warm-up (components/warmup.js), no school day (state route day=null), top bar only Home/Room/Logbook, no XP/streak pills, no wonder banner. Tutor prompt (lib/tutorSystemAdult.js) now names the career focus and 30-minute steps. Daily cap 120 min. Faiza's instance: every change is behind isAdult(); server checks 427/427; eslint clean.
- Rule learned: his instance is his - adult guards only, nothing of Faiza's changed or discussed here.
