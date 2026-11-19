# The School — Curriculum & Operating Spec v1

**Student:** Grade 7, Bangladesh. Weak math foundation. English: functional, needs support.
**Device:** iPad (laptop from ~late Oct 2026).
**Principal:** Claude (Fable 5.1). **Guardian:** Abid — weekly Friday session, weekly report.
**Start:** Week of 7 Sept 2026.

---

## 1. Non-negotiable rules of the school

1. **One door.** She opens one URL. Nothing else. No Khan, no Swift Playgrounds, no separate sites.
2. **Locked sequence.** Module N+1 does not exist until Module N is passed. No skip, no delete, no reorder — by her or by anyone in the app UI.
3. **Mastery, not attendance.** Every module ends in a checkpoint. Pass mark 80%. Below 80% → the app generates a remediation module built from her specific wrong answers. Remediation must be passed before N+1 unlocks.
4. **Teach it back.** Every module ends with her writing 3–6 sentences in English explaining the main idea to an imaginary younger student. Graded for clarity, not grammar. This is the English track — there is no separate one.
5. **Ship something.** Every 4th module ends with a small artifact saved to her portfolio (a program, a solved problem set with explanation, a short write-up). The portfolio is permanent and exportable.
6. **Time cap.** 60 min/day, Sun–Thu, hard stop enforced by the app. Friday is the live call with Abid. Saturday off. Over-work is a failure mode, not a virtue.
7. **AI is a tool she learns to use, not a crutch.** From Module 1 she is taught what the tutor is, how it can be wrong, and how to check it. Asking for the answer is allowed; the tutor will refuse and give a hint instead.
8. **The guardian sees everything.** Abid's dashboard shows: modules completed, checkpoint scores, wrong-answer patterns, minutes per day, teach-it-back texts, streak. Weekly summary emailed Thursday night (her time) before the Friday call.
9. **Nothing sensitive is stored.** Name, progress, and her written work only. No location, no photos, no chat history beyond the current module.
10. **Everything is timed.** Every lesson, practice set, checkpoint, remediation loop and teach-it-back records start time, end time, active minutes, and attempts. Timing runs silently — she never sees a stopwatch while working (a visible clock on a weak-math 12-year-old creates panic, not speed). After she passes, the app shows her a gentle "you did this in 23 min — last week's took 40" only when it's good news. Abid sees all of it, always.
11. **Hook first, teach second.** Every module opens with *why this matters* — a real thing in the world that only makes sense once you know this. Every lesson has at least one piece of rich media embedded inside the app: a YouTube video (embedded player, she never leaves), a NASA / NatGeo / museum page shown in-frame, an animation, a diagram, or an interactive widget. Fractions open with a rocket-fuel mixing clip; probability opens with a casino; the coordinate plane opens with GPS. The rule for choosing media: it must show the concept *doing something real*, and it must be under 6 minutes. Nothing is ever text-only for more than 5 minutes.
12. **She must not feel overwhelmed.** Lessons are 8–12 minutes each. One idea per lesson. If she fails a practice skill three times, the tutor stops, switches to a different explanation style (visual → story → worked example), and does not pile on more problems. If the time cap hits mid-lesson, the app saves and says "good stopping point" — never "you didn't finish".

---

## 2. How a module works

```
LEARN     2–4 short lessons. Tutor explains, asks a question every ~3 min,
          adapts pace. Bangla words allowed for a concept if she's stuck;
          English is the working language.
PRACTICE  Adaptive problem sets. Must hit 5 correct in a row per skill.
          Hints escalate: nudge → worked example → tutor walks it through.
CHECK     10–15 question test, no hints, one attempt. ≥80% → pass.
FIX       (if <80%) Remediation module targeting the exact skills missed.
          Re-check on those skills only. Loop until passed.
TEACH     Teach-it-back paragraph.
SHIP      (every 4th module) Portfolio artifact.
```

Module length target: one week (≈5 hrs). The app doesn't care about calendar weeks — it cares about passing.

---

## 3. Year 1 — Grade 7 (Sept 2026 – June 2027)

Single ordered sequence, 42 modules. Math is the spine; Code, Science and AI are woven in so no week is only math. **AI Lab** is a 15-minute step inside every third module — she learns to use, question and build with AI from week two, not year three.

### Phase 0 — Where you are (M1–M2)
- **M1 · Where you are.** Three untimed diagnostics (Grade 5, 6, 7 math). Typing test. "What I want to build by 16" paragraph. No pass/fail. Output: her gap map.
- **M2 · You have an AI. Here's how it works.** What an AI model is (kid-level, accurate). The tutor is one; it can be wrong; she catches three planted mistakes. Prompting basics: be specific, give context, ask for steps, ask for a check. Rule of the school: AI helps you learn, never does the work for you — and she can tell the difference. **Ship: her first "prompt notebook" — five prompts that worked and why.**

### Phase 1 — Foundations (M3–M15)
- **M3 · Numbers & place value.** Code: none yet.
- **M4 · Multiplication & division fluency.**
- **M5 · Fractions I.** Code: Hello Python. **AI Lab 1:** ask the tutor for three practice questions, solve them, check its answers by hand — it makes one mistake on purpose.
- **M6 · Fractions II.** **Ship: times-table printer.**
- **M7 · Fractions III.** Code: variables, input.
- **M8 · Decimals.** Code: a calculator. **AI Lab 2:** prompt patterns — "explain like I'm 9", "give me a worked example", "what did I do wrong here".
- **M9 · Negative numbers.** Code: if/else.
- **M10 · Ratios & rates.** **Ship: recipe scaler.**
- **M11 · SCIENCE: Speed, density and scale.** Why a whale can't live on land; how far the Moon really is; a kitchen density experiment she photographs. **AI Lab 3:** use AI to plan an experiment, then check its plan against what actually happened.
- **M12 · Percent.** Code: for loops.
- **M13 · SCIENCE: Matter and mixtures.** Concentration, dissolving, why the sea is salty; a saltwater density-layers experiment.
- **M14 · Order of operations & expressions.** Code: while loops, a guessing game. **AI Lab 4:** automate something boring — ask AI to write a Python script that prints her weekly timetable; she reads every line before running it.
- **M15 · Foundations checkpoint.** Cumulative M3–M14. **Ship: portfolio review.**

### Phase 2 — Pre-Algebra (M16–M30)
- **M16 · Variables & expressions.** Code: functions.
- **M17 · One-step equations.** **AI Lab 5:** explain a topic to the AI and have it find the hole in her explanation.
- **M18 · Two-step equations & inequalities.** **Ship: equation checker.**
- **M19 · The coordinate plane.** Code: lists.
- **M20 · Linear relationships I.** Code: sum/average over lists. **AI Lab 6:** how models are trained (kid-level) — patterns, examples, why they hallucinate.
- **M21 · Linear relationships II.** Slope, y = mx + b.
- **M22 · SCIENCE: Motion.** Distance-time graphs of a real car, a dropped ball, a rocket launch; she plots real data in Python.
- **M23 · Exponents & roots.** **Ship: powers-of-2 explorer.** **AI Lab 7:** AI writes code, she breaks it and fixes it.
- **M24 · SCIENCE: Cells and growth.** Bacteria doubling, why an epidemic is an exponent problem; a doubling simulation.
- **M25 · Geometry I.** Angles, triangles. Code: drawing shapes with code.
- **M26 · Geometry II.** Area, perimeter, circles. **AI Lab 8:** automate a chore — a script that renames or sorts files, written with AI, understood by her.
- **M27 · SCIENCE: Astronomy.** How Eratosthenes measured Earth with a stick and a shadow; she does it with the Sun in Bangladesh.
- **M28 · Statistics I.** Mean, median, misleading graphs. Code: dictionaries.
- **M29 · Probability I.** **Ship: dice simulator, 10,000 rolls.** **AI Lab 9:** bias — ask three AIs the same question, compare, decide who to trust and why.
- **M30 · Pre-algebra checkpoint.** Portfolio review.

### Phase 3 — Algebra 1 begins + building with AI (M31–M42)
- **M31 · SCIENCE: Genetics.** Eye colour, why siblings differ, Punnett squares — probability applied.
- **M32 · Multi-step equations.** **AI Lab 10:** prompt a full study plan for a school exam, then edit it — she is the boss, AI is the assistant.
- **M33 · Systems of equations (intro).** Code: solve ax + b = c.
- **M34 · Linear inequalities & graphing.** **Ship: grade calculator app.**
- **M35 · Functions.** Code: read a CSV. **AI Lab 11:** her first automation with a real tool — a script that reads a spreadsheet and emails a summary (with Abid's help on the email part).
- **M36 · Data project I.** Weather in Dhaka or cricket scores: clean, compute, chart.
- **M37 · Integers & number theory.** Primes, GCD/LCM. Code: prime-finder.
- **M38 · Problem-solving toolkit.** AMC 8-style. **Ship: 10 solved problems with explanations.** **AI Lab 12:** build a tiny chatbot in Python that answers questions about one topic she chooses.
- **M39 · Geometry III.** Pythagoras, similar triangles.
- **M40 · Being an AI creator.** What people build with AI (real examples, kid-appropriate), what she could build next year, what it means to be a creator not a consumer. **Ship: a "how I use AI" guide she writes for a friend.**
- **M41 · Year-end capstone.** 2-week project from a menu — a text game, a data report, a chatbot, a math explainer site. Presented to Abid on the Friday call.
- **M42 · Year 1 final checkpoint.** Cumulative. Gap map regenerated; Year 2 adjusted.

### Explore track (runs alongside, no test, 30 min/week)
One item per module, chosen by the tutor from a curated list: short science video, a chapter of a popular-science book, a "how does X work" explainer. She writes two sentences. This is the part that's supposed to be fun.

---

## 4. Years 2–6 — outline (rebuilt each June from the gap map)

| Year | Grade | Math spine | Code / Tech | Milestone |
|---|---|---|---|---|
| 2 | 8 | Algebra 1 complete, Geometry begins | Python intermediate, first web page (HTML/CSS/JS), Git & GitHub, first AI-powered app using an API | First public GitHub repo; AMC 8 attempt |
| 3 | 9 | Geometry, Algebra 2 begins | Web apps, APIs, intro physics with simulation, no-code + code automations that run on their own | First project someone else uses; Bangladesh Math Olympiad regional |
| 4 | 10 | Algebra 2, Precalculus begins | Data science (pandas), intro ML concepts, installs Linux herself | Competition results; research-style write-up |
| 5 | 11 | Precalculus, Calculus begins | Algorithms & data structures, ML hands-on, CS theory | Capstone research project; SAT / IELTS; olympiad |
| 6 | 12 | Calculus, Statistics | Specialisation of her choice | University applications with a 5-year portfolio |

---

## 4b. Media rules (what goes in the app)

- **Allowed in-app:** YouTube embeds (official channels: NASA, NatGeo, Veritasium, Kurzgesagt, 3Blue1Brown, Numberphile, Crash Course, TED-Ed, What If), public web pages shown in-frame (NASA, NatGeo, Smithsonian, Khan-style explainers), original diagrams and animations built into the app, interactive widgets.
- **Not allowed:** movie or documentary clips that aren't officially published on YouTube. We can't host or rip them, and pirated embeds get the app taken down. If a film illustrates a concept, we link the *official* trailer or a licensed clip, or describe the scene and use something else.
- **Every link is verified at authoring time** — it plays, it's the right video, it's appropriate for a 12-year-old, it's under 6 min. Dead links are a bug.
- **Media is inside the lesson, not a homework list.** Watch → tutor asks one question about it → lesson begins.

## 5. Guardian dashboard — what Abid sees

- Current module, days on it, minutes today / this week
- Time taken per lesson, per practice set, per checkpoint — and the trend over modules (is she getting faster?)
- Every checkpoint score, with the wrong-answer list
- Teach-it-back texts (read these — they show understanding better than scores)
- Streak and time-cap hits
- Thursday-night weekly summary: 5 bullets, the exact thing to cover on Friday
- A "note to tutor" box: Abid can tell the tutor something ("she's stressed about school exams this week — go lighter") without touching the curriculum
- Manual override: unlock/relock a module, extend the time cap. Logged.

---

## 6. Tutor behaviour spec (model: Sonnet 5 to start, upgraded to Fable 5.1 as she advances; API spend capped at $30 USD/month)

- Patient, warm, never sarcastic. Praises effort and method, not "smart".
- English at CEFR B1 level. Short sentences. Defines every new term. Bangla gloss for a term if she asks twice.
- Never gives an answer to a practice or check question. Gives escalating hints.
- Every explanation ends with a question back to her.
- If she's wrong, asks her to explain her thinking before correcting.
- Never discusses anything outside the curriculum beyond a friendly sentence; redirects.
- Never asks for or stores personal details beyond first name.
- If she expresses distress or says something concerning, responds kindly, tells her to talk to Abid or a parent, and flags it on the guardian dashboard.

---

## 7. Build order

1. **Curriculum content** — M1–M12 fully authored (lessons, practice banks, checkpoints, remediation trees). *M13+ authored in batches ahead of her pace.*
2. **App v1** — student flow (learn/practice/check/fix/teach), locked sequence, progress DB, in-browser Python (Pyodide), time cap.
3. **Guardian dashboard** + Thursday email.
4. **Deploy** — Vercel + Postgres (free tiers), Abid's Anthropic API key in env vars, one student link, one guardian login.
5. **Week 1 live**: she does M1 on the iPad.

Target: M1 live for her by Friday 11 Sept 2026, so the first Friday call is about her gap map.
