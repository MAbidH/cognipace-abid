"use client";
/* THE SCHOOL DAY on her side (3 Nov 2026, lib/day.js): Start school (today's plan + the desk check), the movement card
   every 25 minutes of active lesson time, End school (today's numbers, celebrated), and the confetti every finish gets.
   Abid: "her achievements need to be celebrated heavily". Nothing here can trap her: if the internet fails, Start and
   End still let her through and the movement card closes with "Done". */
import { TZ } from "../lib/time";
import { isAdult } from "../lib/student";
import { useEffect, useRef, useState } from "react";
import { api } from "./tutorStream";

/* ---------- Confetti: plain DOM pieces, no library, respects reduced motion ---------- */
export function Confetti({ pieces = 90, seconds = 3.2 }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const id = setTimeout(() => setOn(false), seconds * 1000 + 400); return () => clearTimeout(id); }, [seconds]);
  if (!on) return null;
  const colors = ["#a3e635", "#22d3ee", "#fbbf24", "#a78bfa", "#fb7185", "#f8fafc"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        const left = Math.round((i * 97) % 100), delay = ((i * 37) % 100) / 100 * 0.8, dur = seconds - 0.6 + ((i * 53) % 10) / 10, size = 6 + (i % 5) * 2;
        return <i key={i} style={{ left: `${left}%`, width: size, height: size * 0.45, background: colors[i % colors.length], animationDelay: `${delay}s`, animationDuration: `${dur}s`, transform: `rotate(${(i * 47) % 360}deg)` }} />;
      })}
    </div>
  );
}

/* A short toast with confetti for an ordinary finished step. */
export function StepToast({ text, onGone }) {
  useEffect(() => { const id = setTimeout(onGone, 3600); return () => clearTimeout(id); }, [onGone]);
  return <><Confetti pieces={60} seconds={2.6} /><div className="steptoast" role="status">{text}</div></>;
}

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "");

/* ---------- Start school ---------- */
const CHECKS = [
  ["desk", "I am at my desk, on a chair - not on the bed."],
  ["hands", "Both hands on the keyboard, eyes on the screen."],
  ["water", "Water bottle next to me."],
  ["phone", "Phone away or silent."],
];

export function StartSchool({ plan, goal, typing, onStarted }) {
  const [ticks, setTicks] = useState({});
  const [busy, setBusy] = useState(false);
  const adult = isAdult(); // 19 Nov 2026: the adult instance starts the day with one press - no desk check, no Mom
  const all = adult || CHECKS.every(([k]) => ticks[k]);
  const exam = !!plan?.exam, vac = !!plan?.vacation;
  const start = async () => {
    setBusy(true);
    const r = await api("/api/day", { start: { desk: all } });
    setBusy(false);
    onStarted(r && !r.error ? r : null);
  };
  useEffect(() => {
    const k = (e) => { if (e.key === "Enter" && all && !busy) start(); };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  });
  const blocks = adult
    ? [["Warm-up", "your Python line and the review questions - about 10 minutes"],
       ["Block 1", `75 minutes${goal?.steps?.[0] ? ` - starting with "${goal.steps[0].title}"` : ""}. A 1-minute movement break every 25 minutes.`],
       ["Break", "10 minutes, whenever you choose (Alt+R)"],
       ["Block 2", "75 minutes - the build part first"],
       ["Logbook", "10 minutes: what you can now do, in one line, with the evidence"],
       ["End session", "press End school - see today's numbers"]]
    : exam
    ? [["Warm-up, if you want", "the typing line and quick maths - about 5 minutes"], ["The Wonder or the cyber news", "10 minutes, if you want"], ["Your exams", "they come first today - your streak is safe"]]
    : [["Warm-up", "six minutes of typing (both hands, eyes up), your Python line, two review questions and quick maths - about 15 minutes; the key move is an extra"],
       ["Lesson block 1", `about 50 minutes${goal?.steps?.[0] ? ` - starting with "${goal.steps[0].title}"` : ""}. A 1-minute movement break comes every 25 minutes.`],
       ["Recess", "10 minutes, whenever you choose (Alt+R)"],
       ["Lesson block 2", "about 50 minutes - maths and code first"],
       ...(vac ? [["School maths on paper", "25 minutes from your school maths book, with a pencil - then photograph the page and hand it in below; the tutor checks three answers and asks you one question"]] : []),
       ...(vac ? [["Recess + outside", "go outside, eat, rest your eyes"], ["Lesson blocks 3-5", `about 50 minutes each - today's goal is ${Math.round((plan?.targetMinutes || 240) / 60)} hours; if you are in the middle of something you may go on, up to ${Math.round((plan?.cap || 360) / 60)}`]] : []),
       ["The Wonder + this week's cyber news", "10-15 minutes, with pictures and videos"],
       ["End school", "press End school - see what you did today"]];
  return (
    <main className="wrap narrow">
      <div className="eyebrow" style={{ color: "var(--cyan)" }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })}{exam ? " · exam day" : vac ? " · holiday school" : ""}</div>
      <h2 style={{ marginTop: 4 }}>Start school</h2>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">today's plan</div>
        <ol className="dayplan">{blocks.map(([h, d], i) => <li key={i}><b>{h}</b> <span className="soft">- {d}</span></li>)}</ol>
      </div>
      {!adult && <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">the desk check - be honest, Mom may check too</div>
        {CHECKS.map(([k, label]) => (
          <label key={k} className="deskcheck"><input type="checkbox" checked={!!ticks[k]} onChange={(e) => setTicks((t) => ({ ...t, [k]: e.target.checked }))} /> {label}</label>
        ))}
        <p className="small soft" style={{ margin: "8px 0 0" }}>Fast typing only grows at a desk with both hands. That is why this comes first.</p>
      </div>}
      <p style={{ marginTop: 16 }}>
        <button className="btn primary" disabled={!all || busy} onClick={start}>{busy ? "Starting..." : "Start school"} <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Enter</kbd></button>
        {!all && <span className="small soft" style={{ marginLeft: 10 }}>Tick all four first.</span>}
      </p>
      <p className="small soft"><a href="/">Back to the map</a></p>
    </main>
  );
}

/* ---------- The movement card (every 25 minutes of active lesson time) ---------- */
const MOVES = [
  ["Stand up", "Push the chair back and stand."],
  ["Drink water", "Three or four big sips."],
  ["Reach up", "Arms up high, hold for 5 seconds. Then touch your knees."],
  ["Roll your shoulders", "Five times back, five times forward."],
  ["Look far away", "Out of the window, at something far, for 20 seconds. Your eyes rest."],
];

function useActiveSeconds(enabled) {
  const [secs, setSecs] = useState(() => { try { const v = JSON.parse(sessionStorage.getItem("move_active") || "null"); return v && v.d === new Date().toDateString() ? v.s : 0; } catch { return 0; } });
  const last = useRef(Date.now());
  useEffect(() => {
    const mark = () => { last.current = Date.now(); };
    ["keydown", "mousedown", "wheel", "touchstart"].forEach((e) => document.addEventListener(e, mark, true));
    const id = setInterval(() => {
      if (!enabled) return;
      if (document.visibilityState === "visible" && Date.now() - last.current < 120000) {
        setSecs((s) => { const n = s + 5; try { sessionStorage.setItem("move_active", JSON.stringify({ d: new Date().toDateString(), s: n })); } catch {} return n; });
      }
    }, 5000);
    return () => { clearInterval(id); ["keydown", "mousedown", "wheel", "touchstart"].forEach((e) => document.removeEventListener(e, mark, true)); };
  }, [enabled]);
  const reset = () => { setSecs(0); try { sessionStorage.setItem("move_active", JSON.stringify({ d: new Date().toDateString(), s: 0 })); } catch {} };
  return [secs, reset, last];
}

export function MoveBreak({ every = 25, seconds = 60, enabled = true, onXp }) {
  const [active, reset, last] = useActiveSeconds(enabled);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(seconds);
  const [snoozed, setSnoozed] = useState(0);
  const [usedSnooze, setUsedSnooze] = useState(false);
  const due = active >= every * 60 + snoozed;
  // Open only at a calm moment: the tutor is not writing and she has not typed in the last 8 seconds.
  useEffect(() => {
    if (!due || open) return undefined;
    const id = setInterval(() => { if (!window.__schoolBusy && Date.now() - last.current > 8000) { setOpen(true); setLeft(seconds); } }, 2000);
    return () => clearInterval(id);
  }, [due, open, seconds, last]);
  useEffect(() => { if (!open) return undefined; const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000); return () => clearInterval(id); }, [open]);
  const finish = async () => {
    setOpen(false); reset(); setSnoozed(0); setUsedSnooze(false);
    const r = await api("/api/day", { move: true }).catch(() => null);
    if (r && !r.error) onXp?.(r);
  };
  if (!open) return null;
  return (
    <div className="moveoverlay" role="dialog" aria-modal="true" aria-label="Movement break">
      <div className="card movecard" tabIndex={-1} ref={(el) => { if (el && left === seconds) el.focus(); }}>
        <div className="eyebrow" style={{ color: "var(--lime)" }}>{every} minutes of work · movement break · +XP</div>
        <h2 style={{ margin: "4px 0 10px" }}>Stand up - one minute for your body</h2>
        <ol className="movelist">{MOVES.map(([h, d], i) => <li key={i}><b>{h}.</b> <span className="soft">{d}</span></li>)}</ol>
        <div className="movetimer mono" aria-live="polite">{left > 0 ? `0:${String(left).padStart(2, "0")}` : "Done!"}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn primary" disabled={left > 0} onClick={finish} ref={(el) => { if (el && left === 0) el.focus(); }}>{left > 0 ? "Moving..." : "I moved - back to work"}</button>
          {/* 5 Nov 2026: the snooze used to show only while left === seconds, i.e. for one second; now it stays until she
              has used it once (snoozed > 0 is the pending snooze; usedSnooze remembers it for this card). */}
          {!usedSnooze && left > 5 && <button className="btn quiet" onClick={() => { setUsedSnooze(true); setOpen(false); setSnoozed(180); }}>Finish my sentence first (3 min)</button>}
        </div>
        <p className="small soft" style={{ marginTop: 10 }}>Your place is saved. The tutor waits.</p>
      </div>
    </div>
  );
}

/* ---------- End school ---------- */
export function EndSchool({ onBack, onRestart }) {
  const [s, setS] = useState(null);
  useEffect(() => { api("/api/day", { end: true }).then((r) => setS(r && !r.error ? r : { error: true })); }, []);
  const sum = s?.summary || {};
  const lvl = s?.rewards?.level, next = s?.rewards?.next;
  const fmt = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const items = s && !s.error ? [
    [`${sum.steps}`, sum.steps === 1 ? "step finished" : "steps finished"],
    [sum.wpm ? `${sum.wpm}` : "-", "words a minute on the drill line"],
    [sum.mathScore != null ? `${sum.mathScore}/20` : "-", sum.mathSeconds ? `quick maths in ${fmt(sum.mathSeconds)}` : "quick maths"],
    [`${sum.moves}`, sum.moves === 1 ? "movement break" : "movement breaks"],
  ] : [];
  return (
    <main className="wrap narrow done">
      {s && !s.error && <Confetti pieces={120} seconds={3.6} />}
      <div className="bloom" />
      <h2>School is over for today.</h2>
      {!s && <p className="soft">Adding up your day...</p>}
      {s?.error && <p className="soft">Your day is saved. (The numbers could not load - no internet?)</p>}
      {items.length > 0 && <div className="daystats">{items.map(([n, l], i) => <div key={i} className="card"><div className="num" style={{ fontSize: 30 }}>{n}</div><div className="small soft">{l}</div></div>)}</div>}
      {sum.startedAt && <p className="small soft">You started at {fmtTime(sum.startedAt)} (Dhaka).</p>}
      {lvl && <p>Level {lvl.n} · <b>{lvl.name}</b> · {s.rewards.xp} XP{next ? <span className="soft"> · {next.xp - s.rewards.xp} XP to {next.name}</span> : null}{s.rewards.session?.streak ? <span> · streak <b>{s.rewards.session.streak}</b> days</span> : null}</p>}
      <p>Every day like this is one more brick. Abid sees today's numbers too.</p>
      <p style={{ marginTop: 14 }}><a className="btn primary" href="/">Back to the map</a> <button className="btn" onClick={onRestart}>I want to do more - start again</button></p>
      {onBack && <p className="small soft"><button className="btn quiet" onClick={onBack}>Back</button></p>}
    </main>
  );
}

/* ---------- The day's goal reached (3 Nov 2026, Abid: "keep it 5 but she can go up to 7 if she wants") ---------- */
export function GoalReached({ minutes, cap, onEnd, onGo }) {
  return (
    <main className="wrap narrow done">
      <Confetti pieces={140} seconds={3.8} />
      <div className="bloom" />
      <div className="eyebrow" style={{ color: "var(--lime)" }}>today's goal reached</div>
      <h2>{Math.round(minutes / 60)} hours of real work. That is a full school day.</h2>
      <p>School is done for today - go outside, see your family, rest your eyes. If you are in the middle of a step and want to finish it, you can go on (up to {Math.round(cap / 60)} hours).</p>
      <p style={{ marginTop: 14 }}><button className="btn primary" autoFocus onClick={onEnd}>End school</button> <button className="btn" onClick={onGo}>Finish what I was doing</button></p>
    </main>
  );
}
