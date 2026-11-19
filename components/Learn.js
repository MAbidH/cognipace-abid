"use client";
import { useEffect, useRef, useState } from "react";
import Python from "./Python";
import Markdown from "./Markdown";
import Shell from "./Shell";
import { ModuleArt } from "./Art";
import Face, { FaceStrip, FaceMoodCtx, useFaceMood } from "./Face";
import { waitForInternet } from "./Offline";
import { api, streamTutor, reportFail, cleanMarkers, store } from "./tutorStream";
import { localDayIndex } from "../lib/time";
import { warmupDone } from "./warmup";
import { StartSchool, MoveBreak, EndSchool, StepToast, Confetti, GoalReached } from "./SchoolDay";

/* api / streamTutor / reportFail / the marker filter live in ./tutorStream (29 Oct 2026), shared with the Wonder and
   Meet rooms so all three recover from a dropped line the same way and never show the tutor's private markers. */

/** Silent active-time clock: counts only while the tab is visible and she has touched the keyboard or screen in the
 *  last 3 minutes. Persisted per step in sessionStorage so a reload or a break does not throw the minutes away (Oct 2026:
 *  a day with two sittings and one reload logged 23 minutes). */
function useClock(key) {
  const sk = key ? `clock:${key}` : null;
  const load = () => { try { return sk ? Number(sessionStorage.getItem(sk)) || 0 : 0; } catch { return 0; } };
  const start = useRef(new Date().toISOString());
  const active = useRef(load());
  const last = useRef(Date.now());
  const lastTouch = useRef(Date.now());
  useEffect(() => {
    const IDLE = 3 * 60 * 1000;
    const touch = () => { lastTouch.current = Date.now(); };
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === "visible" && now - lastTouch.current < IDLE) {
        active.current += now - last.current;
        try { if (sk) sessionStorage.setItem(sk, String(active.current)); } catch {}
      }
      last.current = now;
    };
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    for (const ev of ["keydown", "pointerdown", "touchstart"]) document.addEventListener(ev, touch, { passive: true });
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); for (const ev of ["keydown", "pointerdown", "touchstart"]) document.removeEventListener(ev, touch); };
  }, [sk]);
  const clear = () => { try { if (sk) sessionStorage.removeItem(sk); } catch {} };
  return { started_at: start.current, ms: () => active.current, reset: () => { start.current = new Date().toISOString(); active.current = 0; last.current = Date.now(); clear(); }, clear };
}

/** Heartbeat: every 5 minutes of active time (and when the tab is hidden), send the minutes earned since the last send,
 *  so an unfinished step still counts toward the day, the cap, and the streak. Returns a function giving the unsent remainder. */
function useHeartbeat(clock, enabled) {
  const sentKey = enabled ? `sent:${enabled}` : null;
  const sent = useRef((() => { try { return sentKey ? Number(sessionStorage.getItem(sentKey)) || 0 : 0; } catch { return 0; } })());
  const flush = async () => {
    const delta = clock.ms() - sent.current;
    if (!enabled || delta < 60 * 1000) return;
    sent.current += delta;
    try { sessionStorage.setItem(sentKey, String(sent.current)); } catch {}
    await api("/api/state", { timing: { partial: true }, active_ms: delta });
  };
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => { if (clock.ms() - sent.current >= 5 * 60 * 1000) flush(); }, 30 * 1000);
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); };
  }, [enabled]);  
  return { remainder: () => Math.max(0, clock.ms() - sent.current), clear: () => { try { if (sentKey) sessionStorage.removeItem(sentKey); } catch {} } };
}

export default function Learn() {
  const [state, setState] = useState(null);
  const [finished, setFinished] = useState(null); // { id, title } when a module is passed this session
  const [cheer, setCheer] = useState(null);       // { badges: [...], session: bool, rewards } shown once after a step
  const [mood, setMood] = useState("idle");       // the tutor's face, set by whichever part of the room is talking to her
  const [toast, setToast] = useState(null);       // 3 Nov 2026: every finished step gets confetti and its XP
  const [ending, setEnding] = useState(false);    // the End school screen
  const [goGo, setGoGo] = useState(() => { try { return sessionStorage.getItem("goal5_" + new Date().toDateString()) === "1"; } catch { return false; } });

  useEffect(() => { api("/api/state").then(setState); }, []);

  // RECESS IS HERS (Abid, 17 Oct 2026: "don't make recess a tutor or the school's decision - Faiza will press recess when
  // she needs one"). The room no longer forces a break after N minutes. She presses "Recess" (Alt+R) in the room header;
  // the recess screen shows a suggested 10-minute timer (the plan's recessMinutes), but "Back to the lesson" works at
  // any moment. sessionStorage keeps an open recess across a reload.
  const [onBreak, setOnBreak] = useState(false);
  const [breakUntil, setBreakUntil] = useState(0);
  const [breakKind, setBreakKind] = useState("recess");
  useEffect(() => {
    let until = 0; try { until = Number(sessionStorage.getItem("break_until")) || 0; } catch {}
    if (until > Date.now()) { setBreakUntil(until); setOnBreak(true); }
  }, []);
  // THE WARM-UP IS OPTIONAL (29 Oct 2026, review + Abid): the room opens without it. It is a card in the room header and
  // on the map ("5-minute warm-up - keeps your fingers ready, +XP"); /learn?warmup=1 opens it straight away.
  const [warm, setWarm] = useState(false);
  useEffect(() => { try { if (new URLSearchParams(location.search).get("warmup") === "1") setWarm(true); } catch {} }, []);
  const closeWarm = () => {
    setWarm(false);
    try { const u = new URL(location.href); if (u.searchParams.has("warmup")) { u.searchParams.delete("warmup"); history.replaceState(null, "", u.pathname + u.search); } } catch {}
    api("/api/state").then((s) => { if (s && !s.error) setState(s); });
  };
  // Below 1280 px a code step hides the step card; this button brings it back (29 Oct 2026, review H3).
  const [showCard, setShowCard] = useState(false);
  const [notice, setNotice] = useState(""); // replaces the old alert() pop-ups (22 Oct 2026): said in the room, in plain words
  const startRecess = () => {
    if (typeof window !== "undefined" && window.__schoolQueued) { setNotice("One message is still waiting for the internet. Recess opens as soon as it has gone."); return; }
    // 29 Oct 2026 (review L5): while a reply is still arriving, the server has not saved the exchange yet.
    if (typeof window !== "undefined" && window.__schoolBusy) { setNotice("The tutor is still writing. Recess opens as soon as the reply has arrived - press it again then."); return; }
    const mins = Number(state?.plan?.recessMinutes) || 10;
    const u = Date.now() + mins * 60000;
    try { sessionStorage.setItem("break_until", String(u)); } catch {}
    setBreakKind("recess"); setBreakUntil(u); setOnBreak(true);
  };
  useEffect(() => {
    const k = (e) => { if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === "r" || e.key === "R") && !onBreak && state?.current) { e.preventDefault(); startRecess(); } };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }); // re-binds each render so it sees the current step
  // 17 Oct 2026: the break screen REPLACES the room, so the lesson chat unmounts. When she came back, the chat remounted
  // with the conversation as it was when the page first loaded (state.history is a snapshot) - for a step begun earlier
  // in the same page that snapshot was empty, so the chat sent its opener again and the tutor started the step over,
  // just as she was writing her logbook line. Coming back from a break now reloads her state from the server first.
  // (29 Oct 2026: the teach-back draft, checkpoint answers and the fix lesson now survive too - see Teach, Check, Remediation.)
  const [resuming, setResuming] = useState(false);
  const endBreak = async () => {
    try { sessionStorage.setItem("break_until", "0"); } catch {}
    setResuming(true);
    const s = await api("/api/state");
    if (s && !s.error) setState(s);
    setResuming(false); setOnBreak(false);
  };
  const finishing = useRef(false); // 29 Oct 2026 (review L1): Ctrl+Enter auto-repeat / a double click must not advance twice

  if (!state) return <main className="wrap"><p className="soft">Opening your room…</p></main>;
  if (state.error) return (
    <main className="wrap">
      <h2>That didn't load</h2>
      <p className="soft">{state.error}</p>
      <button className="btn primary" onClick={() => { setState(null); api("/api/state").then(setState); }}>Try again</button>
      <p className="small soft" style={{ marginTop: 20 }}><a href="/">Back to the path</a></p>
    </main>
  );
  if (!state.current) return <main className="wrap"><h2>Nothing to do yet</h2><p>Abid will unlock the next module.</p><a className="btn" href="/">Back to the path</a></main>;
  const shell = (child) => <Shell active="/learn" rw={state.rewards} mins={state.minutesToday} cap={state.cap}>{child}</Shell>;
  // Order matters (29 Oct 2026, review M5): the module-passed screen and the celebration come BEFORE "Good stopping
  // point" - the step that passes a module usually ends a long sitting, and its logbook prompt was never shown.
  if (cheer) return shell(<Cheer {...cheer} onClose={() => setCheer(null)} />);
  if (finished) return shell(<ModuleDone id={finished.id} title={finished.title} next={finished.next} />);
  if (onBreak) return shell(resuming ? <main className="wrap"><p className="soft">Bringing back where you were…</p></main> : <Break until={breakUntil} kind={breakKind} onResume={endBreak} />);
  if (state.night === "closed") return shell(<Stop night />);
  if (state.minutesToday >= state.cap) return shell(<Stop />);
  const t = state.typing || {};
  // THE SCHOOL DAY (3 Nov 2026, Abid: punch in / punch out). Start school comes first (the plan and the desk check),
  // then the warm-up, then the room. End school shows the day's numbers. Never on install days (the laptop is the patient).
  const reload = () => api("/api/state").then((s2) => { if (s2 && !s2.error) setState(s2); });
  if (ending || (state.day && state.day.ended)) return shell(<EndSchool onRestart={async () => { await api("/api/day", { start: { desk: !!state.day?.desk } }); try { sessionStorage.setItem("goal5_" + new Date().toDateString(), "1"); } catch {} setGoGo(true); setEnding(false); reload(); }} />);
  const target = state.plan?.targetMinutes;
  if (target && state.day?.started && state.minutesToday >= target && !goGo) return shell(<GoalReached minutes={state.minutesToday} cap={state.cap} onEnd={() => setEnding(true)} onGo={() => { try { sessionStorage.setItem("goal5_" + new Date().toDateString(), "1"); } catch {} setGoGo(true); }} />);
  if (state.day && !state.day.started && !t.installDay) return shell(<StartSchool plan={state.plan} goal={state.goal} typing={t} onStarted={(r) => { if (r?.day) setState((s2) => ({ ...s2, day: r.day })); else setState((s2) => ({ ...s2, day: { ...(s2.day || {}), started: true } })); }} />);
  const warmOffered = !!(state.typingGate || t.optional) && !t.installDay && !warmupDone(t);
  if (warm) return shell(<TypingGate typing={t} onDone={() => api("/api/state").then((s) => { if (s && !s.error) setState(s); })} onClose={closeWarm} />);
  // 1 Nov 2026: required again - until today's warm-up is done the room shows it first (the lesson waits).
  if (state.typingGate && !t.installDay && !warmupDone(t)) return shell(<TypingGate typing={t} onDone={() => api("/api/state").then((s) => { if (s && !s.error) setState(s); })} onClose={() => api("/api/state").then((s) => { if (s && !s.error) setState(s); })} />);

  const { module: m, step_index, remediation } = state.current;
  const step = m.steps[step_index];

  const onDone = async (extra = {}) => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      setNotice("");
      const body = { advance: true, step_id: step.id, ...extra };
      let r = await api("/api/state", body);
      if (r.offline) {
        // Offline (22 Oct 2026): the step is finished on her side; save it by itself when the line is back.
        setNotice("No internet right now. Your step is finished - it will be saved by itself the moment the internet comes back. Keep this page open.");
        await waitForInternet();
        r = await api("/api/state", body);
        // The first try may have reached the school after all (only the answer was lost) - then it is already saved.
        if (r.error === "step not complete" || r.error === "stale step") r = await api("/api/state");
      }
      // A stale advance (the step already moved on - a second press, another tab) just reloads the room.
      if (r.error === "stale step") r = await api("/api/state");
      if (r.error) { setNotice(r.error === "step not complete" ? "Finish this step first." : r.error); return; }
      setNotice("");
      if (r.current && r.current.module.id !== m.id) setFinished({ id: m.id, title: m.title, next: r.goal?.next || null });
      else if (!r.current && r.progress) setFinished({ id: m.id, title: m.title, next: null });
      const levelUp = r.rewards?.level && state.rewards?.level && r.rewards.level.n > state.rewards.level.n ? r.rewards.level : null;
      const gained = r.rewards && state.rewards ? r.rewards.xp - state.rewards.xp : 0;
      if ((r.rewards?.newBadges?.length || 0) > 0 || r.sessionNow || r.goal?.allDone || levelUp) setCheer({ badges: r.rewards?.newBadges || [], session: !!r.sessionNow, rewards: r.rewards, goal: r.goal, levelUp, gained });
      else setToast(`Step done${gained > 0 ? ` · +${gained} XP` : ""}! ${["Brilliant work.", "That is yours now.", "One more brick.", "Keep going.", "Nice - on to the next one."][Math.floor(Math.random() * 5)]}`);
      setState(r);
      window.scrollTo(0, 0);
    } finally { finishing.current = false; }
  };

  const title = remediation && step.kind === "check" ? "Let's fix the ones you missed" : step.title;
  const code = step.kind === "code";
  return (
    <Shell active="/learn" rw={state.rewards} mins={state.minutesToday} cap={state.cap}>
      <main className="wrap" style={{ paddingTop: 14 }}>
        {/* 14 Oct 2026: this div used to carry an inline gridTemplateColumns of "minmax(320px, 46%)" on code steps - inline
            beats every media query, so the task panel took 46% and the chat was left with 185 px. The widths live in globals.css. */}
        <div className={`room-shell${code ? " is-code" : ""}${showCard ? " show-card" : ""}`}>
          <section className="chatcol">
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <FaceStrip mood={mood} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="eyebrow">{m.id} · step {step_index + 1} of {m.steps.length} · {step.kind}</div>
                  <h2 style={{ margin: "4px 0 0" }}>{title}</h2>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {code && <button className="btn quiet cardtoggle" aria-expanded={showCard} onClick={() => setShowCard((v) => !v)} title="Show or hide the step card: where you are in the module and what this step is for">{showCard ? "Hide step card" : "Step card"}</button>}
                  <button className="btn" onClick={startRecess} title="Take a recess whenever you need one. Your place is saved. (Alt+R)">Recess <kbd>Alt+R</kbd></button>
                  {state.day?.started && <button className="btn quiet" onClick={() => { if (!window.__schoolBusy) setEnding(true); }} title="Finish today and see what you did">End school</button>}
                </div>
              </div>
              {t.installDay && <p className="hint" style={{ borderLeftColor: "var(--amber)" }}>Install days: no warm-up - your laptop is the patient and CogniPace is on your iPad. Your streak is safe. The warm-up comes back the day you log in to your own Linux.</p>}
              {warmOffered && <WarmOffer t={t} onOpen={() => setWarm(true)} />}
              <Goal goal={state.goal} />
              <RoomNote />
              {notice && <p className="notice small" role="alert">{notice}</p>}
            </div>
            <FaceMoodCtx.Provider value={setMood}>
              <Step key={step.id + (remediation ? "-fix" : "")} m={m} step={step} remediation={remediation} onDone={onDone} setState={setState} history={state.history} stepDone={state.stepDone}
                fixHistory={Array.isArray(state.fix?.history) ? state.fix.history : Array.isArray(state.fixHistory) ? state.fixHistory : null}
                fixDone={!!(state.fix ? state.fix.done : state.fixDone)} checkSet={state.checkSet || null} />
            </FaceMoodCtx.Provider>
          </section>
          <aside className="side">
            <StepCard m={m} step={step} step_index={step_index} rewards={state.rewards} mins={state.minutesToday} cap={state.cap} />
          </aside>
        </div>
      </main>
      {/* 3 Nov 2026: a one-minute movement card every 25 minutes of active lesson time (not on install days) */}
      <MoveBreak every={state.day?.moveEvery || 25} seconds={state.day?.moveSeconds || 60} enabled={!!state.day?.started && !t.installDay} onXp={(r) => { if (r.rewards) setState((s2) => ({ ...s2, rewards: r.rewards, day: r.day })); setToast("Movement break done · +3 XP. Your body thanks you."); }} />
      {toast && <StepToast text={toast} onGone={() => setToast(null)} />}
    </Shell>
  );
}

/* The optional warm-up, offered in one line (29 Oct 2026). Never a gate; the XP is the reason to do it. */
function WarmOffer({ t, onOpen }) {
  const parts = [...(t.exam ? [] : [["keybr", t.keybrDone]]), ["the drill line", t.drillDone], ...(t.mathEnabled ? [["quick maths", t.mathDone]] : []), ...(t.shortcut ? [["the key move", t.shortcutDone]] : []), ...(t.codeEnabled ? [["the Python line", t.codeDone]] : []), ...(t.vaultEnabled ? [["the vault", t.vaultAsked]] : [])];
  const done = parts.filter(([, d]) => d).length;
  return (
    <div className="warmoffer">
      <span><b>5-minute warm-up</b> <span className="soft">- keeps your fingers ready, +XP.</span>{done > 0 && <span className="soft"> {done} of {parts.length} parts done today.</span>}</span>
      <button className="btn quiet" onClick={onOpen}>{done > 0 ? "Carry on" : "Warm up"}</button>
    </div>
  );
}

/* A one-time note carried from the warm-up into the room (e.g. the drill waiver). */
function RoomNote() {
  const [note, setNote] = useState(() => { try { const n = sessionStorage.getItem("room_note"); sessionStorage.removeItem("room_note"); return n; } catch { return null; } });
  if (!note) return null;
  return <div className="hint" style={{ marginTop: 8, borderLeftColor: "var(--lime)" }}>{note} <button className="btn quiet" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={() => setNote(null)}>ok</button></div>;
}

/* ---------- Today's goal (Abid, 5 Oct 2026): the least she finishes today, so the path flows and rewards come sooner. ---------- */
function Goal({ goal, big }) {
  if (!goal || !goal.steps?.length) return null;
  const done = goal.steps.filter((s) => s.done).length;
  return (
    <div className={big ? "card amber" : ""} style={big ? { marginTop: 12 } : { marginTop: 8, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)" }}>
      <div className="small" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="eyebrow" style={{ color: goal.allDone ? "var(--lime)" : "var(--amber)" }}>{goal.allDone ? "today's goal done" : "today's goal"}</span>
        <span className="mono" style={{ color: "var(--ink)" }}>{done} / {goal.steps.length}</span>
        <span className="steps" style={{ margin: 0, width: 80 }}>{goal.steps.map((s) => <i key={s.id} className={s.done ? "done" : ""} />)}</span>
      </div>
      <div className="small" style={{ marginTop: 4 }}>
        {goal.allDone ? <span style={{ color: "var(--lime)" }}>You finished what today needed. Anything more is a gift to future you.{!big && goal.next && <span className="soft"> If you go on: <b>{goal.next.title}</b> needs about {goal.next.minutes} minutes.</span>}</span>
          : <>Finish at least: {goal.steps.map((s, i) => <span key={s.id} style={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--ink-mute)" : "var(--ink)" }}>{i > 0 ? ", " : ""}<b>{s.title}</b>{!s.done && <span className="soft"> (~{s.minutes} min)</span>}</span>)}.
            {goal.remainingMinutes > 0 && <span className="soft"> About <b style={{ color: "var(--ink)" }}>{goal.remainingMinutes} minutes</b> of work left for today.</span>}
            {goal.sooner && <span className="soft"> At this pace, {goal.sooner.reward.replace(/[-:].*$/, "").trim()} comes in about {goal.sooner.now} days instead of {goal.sooner.was}.</span>}</>}
      </div>
      {big && <NextUp next={goal.next} />}
    </div>
  );
}

/* The one line she takes away from a finish (Abid, 5 Oct 2026): what comes next and how much time to bring for it. */
export function NextUp({ next, style }) {
  if (!next) return <div className="small" style={{ marginTop: 10, color: "var(--cyan)", ...style }}>Next time: a new module begins. Bring about 30 minutes.</div>;
  return (
    <div className="small" style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(34,211,238,.08)", border: "1px solid rgba(34,211,238,.25)", ...style }}>
      <span className="eyebrow" style={{ color: "var(--cyan)" }}>next thing</span>{" "}
      <b>{next.title}</b> <span className="soft">({next.kind})</span> - it will need about <b style={{ color: "var(--cyan)" }}>{next.minutes} minutes</b>.
      <span className="soft"> Sit down with that much time, so you can finish it in one go.</span>
    </div>
  );
}

/* ---------- The side panel: where she is in the module, what this step is for, and the module's picture ---------- */
function StepCard({ m, step, step_index, rewards, mins, cap }) {
  const pct = cap ? Math.min(100, Math.round((mins / cap) * 100)) : 0;
  return (
    <>
      <div className="art"><ModuleArt id={m.id} phase={m.phase} /></div>
      <div className="card" style={{ padding: "14px 16px" }}>
        <div className="eyebrow">{m.phase}</div>
        <h3 style={{ margin: "2px 0 0" }}>{m.title}</h3>
        <div className="steps" aria-label={`step ${step_index + 1} of ${m.steps.length}`}>{m.steps.map((s, i) => <i key={s.id} className={i < step_index ? "done" : i === step_index ? "now" : ""} title={s.title} />)}</div>
        <div className="small soft">{step_index} done · <b style={{ color: "var(--ink)" }}>{step.title}</b> · {m.steps.length - step_index - 1} ahead</div>
        {Array.isArray(step.objectives) && step.objectives.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="eyebrow" style={{ color: "var(--ink-mute)" }}>this step</div>
            <ul className="small" style={{ margin: "4px 0 0", paddingLeft: 18 }}>{step.objectives.slice(0, 4).map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="card" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="small soft">Today</span><span className="num" style={{ fontSize: 20 }}>{mins}<span className="small soft"> / {cap} min</span></span>
        </div>
        <div className="meter"><div style={{ width: `${pct}%` }} /></div>
        {rewards?.next && <div className="small soft" style={{ marginTop: 6 }}>{rewards.next.xp - rewards.xp} XP to <b style={{ color: "var(--ink)" }}>{rewards.next.name}</b>{rewards.session?.done ? " · session complete ✓" : ""}</div>}
      </div>
    </>
  );
}

/* ---------- The warm-up (was the daily gate, Sep/Oct 2026). 29 Oct 2026: OPTIONAL, about 5 minutes, earns XP; the room
   opens without it. keybr is a done / not-done tick - no accuracy number (it was self-reported 96-100 every day and told
   nobody anything). The drill line, the key move, the Python line and the vault question stay as optional parts. ---------- */
function TypingGate({ typing, onDone, onClose }) {
  const t = typing || {};
  const [site, setSite] = useState("keybr");
  const [err, setErr] = useState(null);
  const [line, setLine] = useState("");
  const [t0, setT0] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const submitKeybr = async () => {
    if (busy) return;
    setBusy(true);
    const r = await api("/api/typing", { keybr: { accuracy: null, done: true, site } });
    setBusy(false);
    if (r.error) { setErr(r.offline ? "No internet right now. Press the button again when the banner at the top goes away." : r.error); return; }
    onDone();
  };
  const submitDrill = async () => {
    if (busy) return;
    setBusy(true);
    const r = await api("/api/typing", { drill: { text: line, seconds: t0 ? (Date.now() - t0) / 1000 : 60 } });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setRes(r);
    if (r.ok) { if (r.waived) { try { sessionStorage.setItem("room_note", "Three honest tries on the typing line - that counts. It is marked done and Abid can see it. Now the real work."); } catch {} } onDone(); } else { setLine(""); setT0(null); }
  };
  const all = warmupDone(t);
  return (
    <main className="wrap narrow">
      <div className="eyebrow">daily warm-up · first · +XP</div>
      <h2>{t.exam ? "Exam-day warm-up - about 5 minutes" : "Warm-up - about 10 minutes"}</h2>
      <p>{t.exam ? "Exam time: just the typing line and quick maths, so your fingers and your number sense stay warm. Your exams come first; your streak is safe." : t.adult ? "Your Python line and today's review questions - what you learned on earlier days comes back until it is yours. Then the session opens." : "Sit at your desk, on a chair. Both hands on the home row (feel the bumps on F and J), eyes on the screen. Then your lesson opens."}</p>
      {(all || t.optional) && <p><button className="btn primary" onClick={onClose} autoFocus={all}>{all ? "All done - back to the lesson" : "Back to the lesson"}</button></p>}
      {!all && !t.optional && <p className="small soft">The lesson opens by itself when every part below is done. Each part lets you through after three honest tries.</p>}
      {all && <p className="small" style={{ color: "var(--lime)" }}>Every part is done today. Nice work.</p>}

      {!t.exam && !t.adult && <div className="card" style={{ marginTop: 16, opacity: t.keybrDone ? 0.6 : 1 }}>
        <p><strong>Part 1 - six minutes on keybr.</strong> {t.keybrDone && <span className="small" style={{ color: "var(--lime)" }}>✓ Done today.</span>}</p>
        {!t.keybrDone && <>
          <p><a className="btn" href="https://www.keybr.com/" target="_blank" rel="noopener noreferrer" onClick={() => { api("/api/typing", { keybrOpen: true }).catch(() => {}); }}>Open keybr ↗</a> <a className="btn quiet" href="https://monkeytype.com/" target="_blank" rel="noopener noreferrer" onClick={() => { api("/api/typing", { keybrOpen: true }).catch(() => {}); }}>or monkeytype ↗</a></p>
          <p className="small soft"><b>Both hands on the home row</b> - left fingers on A S D F, right fingers on J K L ; (feel the little bumps on F and J). <b>Eyes on the screen, not the keys.</b> Slow is fine; looking down is not. Type for six minutes, then come back and tick it.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={site} onChange={(e) => setSite(e.target.value)} aria-label="which site"><option value="keybr">keybr</option><option value="monkeytype">monkeytype</option><option value="other">other</option></select>
            <button className="btn primary" disabled={busy} onClick={submitKeybr}>✓ I did my typing</button>
          </div>
        </>}
      </div>}

      {t.codeEnabled && <CodeLine t={t} onDone={onDone} />}
      {t.spine && <ReviewPart t={t} onDone={onDone} />}

      {!t.adult && <div className="card" style={{ marginTop: 16, opacity: t.drillDone ? 0.6 : 1 }}>
        <p><strong>{t.exam ? "Part 1" : "Extra, if you want"} - all the keys.</strong> {t.drillDone && <span className="small">Done today - {Number(t.drillAccuracy)}%{t.drillWpm ? `, ${t.drillWpm} wpm` : ""}.{t.drillWpm && t.wpmTarget ? (t.drillWpm >= t.wpmTarget ? <b style={{ color: "var(--lime)" }}> Speed target hit ({t.wpmTarget} wpm)! +XP</b> : <span className="soft"> Speed target: {t.wpmTarget} wpm - tomorrow.</span>) : null}</span>}</p>
        {!t.drillDone && t.wpmTarget && <p className="small" style={{ margin: "0 0 6px" }}>Speed target this week: <b style={{ color: "var(--cyan)" }}>{t.wpmTarget} words a minute</b>{t.bestWpm ? <span className="soft"> · your best so far: {t.bestWpm}</span> : null}. Accuracy first, then speed - both hands, eyes up.</p>}
        {!t.drillDone && <>
          <p className="small soft">Type this line exactly - every bracket, quote and symbol. It is shaped like real code because that is what your fingers are training for. You need {t.drillPass || 95}%. Press Enter when you are done.</p>
          <p className="mono drillline" aria-label={t.drillLine} style={{ fontSize: 21, background: "#0a0e15", border: "1px solid var(--line-2)", borderRadius: 12, padding: "12px 14px", userSelect: "none", color: "#c9f7ff", whiteSpace: "pre-wrap", letterSpacing: "0.04em" }}>
            {[...String(t.drillLine)].map((ch, i) => <span key={i} className={i < line.length ? (line[i] === ch ? "ok" : "bad") : i === line.length ? "next" : ""}>{ch}</span>)}
          </p>
          <p className="small soft" style={{ margin: "-4px 0 8px" }}>Every symbol is one key press - when you see two signs side by side, like <kbd>==</kbd>, type it twice. Green means right so far, red means look again.</p>
          <input className="big-input mono" style={{ fontSize: 20 }} autoComplete="off" spellCheck={false} placeholder="Type the line here" value={line}
            onFocus={() => !t0 && setT0(Date.now())} onChange={(e) => setLine(e.target.value)} onKeyDown={(e) => e.key === "Enter" && line.trim() && submitDrill()} onPaste={(e) => e.preventDefault()} />
          {res && !res.ok && <div className="hint" style={{ marginTop: 10 }}>{res.accuracy}% - not yet ({res.need}% needed{res.tries ? `, try ${res.tries} of 3` : ""}). The first difference is at character {res.at + 1}{/[=!<>*\/+-]/.test(String(t.drillLine)[res.at] || "") && String(t.drillLine)[res.at] === String(t.drillLine)[res.at + 1] ? ` - that is a double symbol (${String(t.drillLine)[res.at]}${String(t.drillLine)[res.at]}), typed twice` : ""}: look at that spot in the line above (it is red), then type it again. No rush.</div>}
          <div style={{ marginTop: 12 }}><button className="btn primary" disabled={busy || !line.trim()} onClick={submitDrill}>Check the line</button></div>
        </>}
      </div>}
      {t.mathEnabled && <MathDrill t={t} onDone={onDone} />}
      {t.shortcut && <KeyMove t={t} onDone={onDone} />}
      {t.vaultEnabled && (
        <div className="card" style={{ marginTop: 16, opacity: t.vaultAsked ? 0.6 : 1 }}>
          <p><strong>Extra, if you want - your vault.</strong> {t.vaultAsked && <span className="small">{t.vaultDone ? "From memory today. That is how it stays yours." : "Recorded. Tomorrow, try from memory first."}</span>}</p>
          {!t.vaultAsked && <>
            <p className="small soft">Did you unlock Bitwarden today by typing your master password from memory? Be honest - the point is that your head keeps it, not that you tick a box. If you had to look at your paper, say so; that is useful to know.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); await api("/api/typing", { vault: { fromMemory: true } }); setBusy(false); onDone(); }}>Yes, from memory</button>
              <button className="btn quiet" disabled={busy} onClick={async () => { setBusy(true); await api("/api/typing", { vault: { fromMemory: false } }); setBusy(false); onDone(); }}>I looked at my paper</button>
            </div>
          </>}
        </div>
      )}
      {err && <p className="hint" style={{ marginTop: 12 }}>{err}</p>}
      <p style={{ marginTop: 20 }}>{(all || t.optional) && <button className="btn" onClick={onClose}>Back to the lesson</button>} <a className="small soft" href="/" style={{ marginLeft: 12 }}>Back to the map</a></p>
    </main>
  );
}

/* ---------- Part 6 - quick maths (3 Nov 2026, Abid: "she needs to be extremely good in math ... fast"). Twenty quick
   questions, timed from the first answer; Tab or Enter moves on. The server grades it; she sees every miss with the right
   answer, so she learns the fact. One honest go a day counts; a second go can beat her own time. ---------- */
function MathDrill({ t, onDone }) {
  const qs = t.mathQuestions || [];
  const [ans, setAns] = useState(() => qs.map(() => ""));
  const [t0, setT0] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);
  useEffect(() => { if (!t0 || res) return undefined; const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, [t0, res]);
  const secs = t0 ? Math.round(((res ? res.at : now) - t0) / 1000) : 0;
  const target = t.mathTarget || { score: 18, seconds: 240 };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const r = await api("/api/typing", { math: { answers: ans, seconds: t0 ? (Date.now() - t0) / 1000 : 0, dayIndex: t.mathDayIndex } });
    setBusy(false);
    if (r.error) { setRes({ error: r.offline ? "No internet right now. Press Check again when it is back." : r.error }); return; }
    setRes({ ...r, at: Date.now() }); // onDone waits for her "Continue", so the misses stay on screen until she has read them
  };
  const fmt = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  if (t.mathDone && !res) return (
    <div className="card" style={{ marginTop: 16, opacity: 0.7 }}>
      <p><strong>{t.exam ? "Part 2" : "Extra, if you want"} - quick maths.</strong> <span className="small">Done today: {t.mathScore}/{t.mathCount} in {fmt(Number(t.mathSeconds) || 0)}.{Number(t.mathScore) >= target.score && Number(t.mathSeconds) <= target.seconds ? <b style={{ color: "var(--lime)" }}> Target hit! +XP</b> : <span className="soft"> Target: {target.score}/{t.mathCount} inside {fmt(target.seconds)}.</span>}</span></p>
    </div>
  );
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p><strong>{t.exam ? "Part 2" : "Extra, if you want"} - quick maths.</strong> <span className="small soft">{qs.length} questions, in your head. Target: <b style={{ color: "var(--cyan)" }}>{target.score} right inside {fmt(target.seconds)}</b>. The clock starts at your first answer. Fractions like 3/4. <kbd>Enter</kbd> goes to the next one.</span></p>
      {!res && <>
        <div className="mathgrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
          {qs.map((qq, i) => (
            <label key={i} className="small" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8 }}>
              <span className="mono" style={{ flex: 1 }}>{qq} =</span>
              <input ref={(el) => { refs.current[i] = el; }} className="mono" inputMode="decimal" autoComplete="off" spellCheck={false} style={{ width: 70 }} value={ans[i]} aria-label={qq}
                onChange={(e) => { const v = e.target.value.slice(0, 12); setAns((a) => a.map((x, j) => (j === i ? v : x))); if (!t0) setT0(Date.now()); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (i + 1 < qs.length) refs.current[i + 1]?.focus(); else submit(); } }} />
            </label>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn primary" disabled={busy || !t0} onClick={submit}>Check my answers</button>
          <span className="mono">{fmt(secs)}</span>
        </div>
      </>}
      {res && !res.error && <div style={{ marginTop: 6 }}>
        <p style={{ fontSize: 20, margin: "4px 0" }}><b>{res.score}/{res.total}</b> in <b>{fmt(res.seconds)}</b>{res.hit ? <b style={{ color: "var(--lime)" }}> - target hit! +XP</b> : <span className="small soft"> - target {res.target.score} inside {fmt(res.target.seconds)}. Tomorrow.</span>}</p>
        {res.wrong?.length > 0 ? <div className="small"><p style={{ margin: "4px 0" }}>Learn these - say each one out loud once:</p><ul style={{ margin: 0 }}>{res.wrong.map((w, i) => <li key={i} className="mono">{w.q} = <b style={{ color: "var(--lime)" }}>{w.a}</b>{w.given ? <span className="soft"> (you wrote {w.given})</span> : <span className="soft"> (empty)</span>}</li>)}</ul></div> : <p className="small" style={{ color: "var(--lime)" }}>Every one right. That is fluency.</p>}
      </div>}
      {res && !res.error && <p style={{ marginTop: 10 }}><button className="btn primary" autoFocus onClick={onDone}>Continue</button></p>}
      {res?.error && <p className="hint">{res.error}</p>}
    </div>
  );
}

/* ---------- Part 5 - the Python line (Abid, 12 Oct 2026: "code every day, like typing"). One tiny program a day from the
   day CS2A starts, written and run in her own editor; the server checks the printed output. Three misses and the gate
   opens anyway (recorded for Abid). Every passed line is saved as one of her programs. */
function CodeLine({ t, onDone }) {
  const code = useRef("");
  const [out, setOut] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    const r = await api("/api/typing", { codeline: { code: code.current, output: out } });
    setBusy(false);
    setRes(r);
    if (r.ok) { if (r.waived) { try { sessionStorage.setItem("room_note", "Three honest tries on the Python line - that counts. It is marked done and Abid can see it. The tutor can explain it in the room."); } catch {} } onDone(); }
  };
  return (
    <div className="card" style={{ marginTop: 16, opacity: t.codeDone ? 0.6 : 1 }}>
      <p><strong>Part 2 - the Python line.</strong> {t.codeDone && <span className="small">Done today{t.codeWaived ? " (after three tries - ask the tutor about it)" : ""}. One more program in your logbook.</span>}</p>
      {!t.codeDone && t.codeLine && <>
        <p className="small soft">One tiny program, every day, for years - that is how programmers are made. Write it, press <kbd>Ctrl+Enter</kbd> to run it, then press Check. The printed output must match exactly - print only what is asked, no extra words.</p>
        <p style={{ fontSize: 18 }}>{t.codeLine.ask}</p>
        <Python starter="" storageKey={`codeline:${t.codeLine.idea}:${t.codeLine.ask.length}`} onChange={(c) => { code.current = c; }} onOutput={setOut} />
        {res && !res.ok && <div className="hint" style={{ marginTop: 10 }}>Not yet (try {res.tries} of 3). {res.why}</div>}
        {res && !res.ok && res.example && <div className="card codeex" style={{ marginTop: 10 }}><p className="small" style={{ margin: "0 0 6px" }}>Here is the same idea with different words. Copy the <strong>shape</strong>, then use today&apos;s words:</p><pre className="mono">{res.example}</pre></div>}
        <div style={{ marginTop: 12 }}><button className="btn primary" disabled={busy || !out} onClick={check}>Check my program</button>{!out && <span className="small soft" style={{ marginLeft: 10 }}>Run it first - the output is what gets checked.</span>}</div>
      </>}
    </div>
  );
}

/* ---------- Part 3 - the review (9 Nov 2026, the practice spine; Abid: "the same things she learns today must be
   practised ahead"). Two questions a day from skills she passed on earlier days (ten on a Saturday, plus five from one old
   module once a month), on a 1/7/30/90-day ladder kept on the server. Two tries per question; the second miss shows the
   answer and the reason and moves on - it can never trap her. */
function ReviewPart({ t, onDone }) {
  const sp = t.spine || {};
  const cur = sp.next;
  const [val, setVal] = useState("");
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    if (!cur || busy || !val.trim()) return;
    setBusy(true);
    const r = await api("/api/typing", { review: { i: cur.i, value: val } });
    setBusy(false);
    if (r.error) { setV({ error: r.offline ? "No internet right now. Try again when the banner at the top goes away." : r.error }); return; }
    setV({ ...r.verdict, forI: cur.i });
    if (r.verdict?.ok || r.verdict?.reveal) setVal("");
    onDone();
  };
  // once a day: ask the server to write fresh questions for any due skill that has none left (background, never blocks)
  useEffect(() => { if (sp.day && !sp.done) api("/api/review", {}).catch(() => {}); }, [sp.day]);
  const label = t.exam ? "Extra, if you want" : "Part 3";
  const title = sp.kind === "saturday" ? `Saturday review - ${sp.count} questions from earlier days` : `review - ${sp.count} questions from earlier days`;
  const shown = (sp.items || []).filter((x) => x.closed);
  return (
    <div className="card" style={{ marginTop: 16, opacity: sp.done ? 0.6 : 1 }}>
      <p><strong>{label} - {title}.</strong> {sp.done && <span className="small" style={{ color: "var(--lime)" }}>✓ Done today - {sp.right} of {sp.count} right.</span>}</p>
      {!sp.done && <p className="small soft">Things you learned on earlier days come back here so they stay yours: tomorrow, a week later, a month later. Answer from your head; two tries each.{sp.recheckTitle ? <> Today also has five from <b>{sp.recheckTitle}</b> - a monthly look back, nothing to pass.</> : null}</p>}
      {!sp.done && cur && <>
        <p className="small soft" style={{ margin: "0 0 4px" }}>Question {cur.i + 1} of {sp.count} · from <b>{cur.module}</b>{cur.tries ? ` · try ${cur.tries + 1} of 2` : ""}</p>
        <p className={cur.q.includes("\n") ? "mono" : undefined} style={{ fontSize: cur.q.includes("\n") ? 16 : 18, whiteSpace: "pre-wrap" }}>{cur.q}</p>
        <input className="big-input" autoComplete="off" spellCheck={false} placeholder="Your answer" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} aria-label="review answer" />
        <div style={{ marginTop: 10 }}><button className="btn primary" disabled={busy || !val.trim()} onClick={check}>Check</button></div>
      </>}
      {v && v.error && <div className="hint" style={{ marginTop: 10 }}>{v.error}</div>}
      {v && !v.error && v.ok && <div className="small" style={{ marginTop: 10, color: "var(--lime)" }}>Right. That one moves further down the road.</div>}
      {v && !v.error && !v.ok && !v.reveal && <div className="hint" style={{ marginTop: 10 }}>{v.hint || "Not yet - one more try."}</div>}
      {shown.length > 0 && <ul className="small" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
        {shown.map((x) => <li key={x.i} style={{ marginBottom: 4 }}>{x.ok ? "✓" : "✗"} {x.q}{!x.ok && x.answer ? <> - <b>answer: {x.answer}</b>{x.explain ? <span className="soft"> · {x.explain}</span> : null}</> : null}</li>)}
      </ul>}
    </div>
  );
}

/* ---------- Part 3 - one key move a day (Abid, 4 Oct 2026: "she needs to be a master of the keyboard").
   She does the move on her laptop for real, then types which keys she pressed; the server checks it. A wrong answer
   gives the first key, a second wrong answer shows the whole thing and she types it to practise. One review from an
   earlier day keeps old moves alive. All her moves live at /keys. ---------- */
function KeyMove({ t, onDone }) {
  const [phase, setPhase] = useState(t.shortcutDone ? "review" : "today"); // today -> review -> done
  const [val, setVal] = useState("");
  const [tries, setTries] = useState(0);
  const [reveal, setReveal] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = phase === "today" ? t.shortcut : t.review;
  const done = t.shortcutDone && t.reviewDone;
  const check = async () => {
    setBusy(true);
    const r = await api("/api/typing", { shortcut: { answer: val, review: phase === "review", reveal: tries >= 1, tries } });
    setBusy(false);
    if (r.error) { setMsg(r.error); return; }
    if (r.ok) {
      setMsg(r.waived ? `Three honest tries - that counts. The keys are ${r.keys}; try them once more on your laptop. Abid can see this one, and the tutor can show you.` : `Yes - ${r.keys}. That one is yours now.`); setVal(""); setTries(0); setReveal(null);
      if (phase === "today" && t.review && !t.reviewDone) { setTimeout(() => { setMsg(null); setPhase("review"); }, 900); }
      onDone();
      return;
    }
    setTries((n) => n + 1);
    if (r.keys) { setReveal(r.keys); setMsg(`It is ${r.keys}. Press it now on your laptop, then type it here exactly like that.`); }
    else setMsg(`Not that one. Hint: the first key is ${cur.first}. Try the move on your laptop again, then type the keys.`);
    setVal("");
  };
  return (
    <div className="card" style={{ marginTop: 16, opacity: done ? 0.6 : 1 }}>
      <p><strong>Extra, if you want - today's key move.</strong> {done && <span className="small">Done today. <a href="/keys">All your moves ↗</a></span>}</p>
      {!done && cur && <>
        <div className="eyebrow" style={{ color: phase === "review" ? "var(--violet)" : "var(--cyan)" }}>{phase === "review" ? "quick review from an earlier day" : "new move"} · {cur.where}</div>
        <p style={{ fontSize: 22, fontFamily: "var(--display)", margin: "6px 0 4px" }}>{cur.does}.</p>
        {cur.what && <p className="small" style={{ margin: "0 0 6px", color: "var(--ink-soft)" }}><b style={{ color: "var(--ink)" }}>What that means: </b>{cur.what}</p>}
        {cur.tip && <p className="small soft" style={{ margin: "0 0 8px" }}>{cur.tip}</p>}
        <p className="small soft">Do it on your laptop right now, for real. Then type the keys you pressed, like <kbd>ctrl+t</kbd>, and press Enter. Arrow keys are typed as words: <kbd>left</kbd> <kbd>right</kbd> <kbd>up</kbd> <kbd>down</kbd>. If you have no idea, press <b>Show me</b> - that is allowed.</p>
        {/text|word|letter|cursor|line|select|delete/i.test(`${cur.does} ${cur.what || ""}`) && <p className="small soft" style={{ margin: "0 0 8px" }}>Try it here first: click in this line and move around in it - <input className="mono" style={{ width: "100%", maxWidth: 420, marginTop: 4 }} defaultValue="the quick brown fox jumps over the lazy dog" spellCheck={false} aria-label="practice line" /></p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input className="big-input mono" style={{ maxWidth: 260, fontSize: 20 }} autoComplete="off" spellCheck={false} placeholder="which keys?" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && val.trim() && !busy && check()} />
          <button className="btn primary" disabled={busy || !val.trim()} onClick={check}>Check</button>
          <button className="btn quiet" disabled={busy} onClick={async () => { setBusy(true); const r = await api("/api/typing", { shortcut: { answer: "?", review: phase === "review", reveal: true } }); setBusy(false); if (r.keys) { setReveal(r.keys); setTries(2); setMsg(`It is ${r.keys}. ${cur.what || ""} Press it now on your laptop, see what happens, then type it here exactly like that.`); } }}>Show me</button>
        </div>
        {msg && <div className="hint" style={{ marginTop: 10, borderLeftColor: reveal ? "var(--rose)" : msg.startsWith("Yes") ? "var(--lime)" : "var(--amber)" }}>{msg}</div>}
      </>}
    </div>
  );
}

function Break({ until, kind = "recess", onResume }) {
  const [left, setLeft] = useState(Math.max(0, until - Date.now()));
  useEffect(() => { const id = setInterval(() => setLeft(Math.max(0, until - Date.now())), 1000); return () => clearInterval(id); }, [until]);
  const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000);
  useEffect(() => { const k = (e) => { if (e.key === "Enter") onResume(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onResume]);
  return (
    <main className="wrap narrow done">
      <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}><Face mood="sleepy" size={96} /></div>
      <h2>{kind === "lunch" ? "Lunch." : "Recess."}</h2>
      <p>Stand up, drink some water, look at something far away. Your place is saved exactly where you left it.</p>
      {left > 0
        ? <p className="big" style={{ fontSize: 40, margin: "16px 0" }}>{m}:{String(sec).padStart(2, "0")}</p>
        : <p className="soft" style={{ margin: "16px 0" }}>Ten minutes are up - come back whenever you are ready.</p>}
      <button className="btn primary" onClick={onResume}>Back to the lesson <kbd>Enter</kbd></button>
      <p className="small soft" style={{ marginTop: 10 }}>The timer is only a suggestion. You decide when to come back.</p>
      <p className="small soft" style={{ marginTop: 20 }}><a href="/">Back to the path</a></p>
    </main>
  );
}

function Stop({ night }) {
  return (
    <main className="wrap narrow done">
      <h2>{night ? "School is closed for tonight." : "Good stopping point."}</h2>
      <p>{night ? "It is after 11:30 at night in Dhaka. Sleep well - your place is saved, and the path is right here in the morning." : "You've used today's minutes. The path will be right here tomorrow."}</p>
      <a className="btn" href="/">Back to the path</a>
    </main>
  );
}

function ModuleDone({ id, title, next }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const save = async () => {
    const r = await api("/api/state", { journal: { text, module_id: id, title: `${id} · ${title}` } });
    if (r.error) { setErr(r.error); return; }
    setSaved(true);
  };
  return (
    <main className="wrap narrow done">
      <Confetti pieces={180} seconds={4.5} />
      <div className="bloom" />
      <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}><Face mood="happy" size={96} /></div>
      <div className="eyebrow" style={{ color: "var(--lime)" }}>module complete · +100 XP</div>
      <h2>{title} — passed.</h2>
      <p>The next stone on the path is open.</p>
      {!saved ? (
        <div className="card" style={{ marginTop: 16, textAlign: "left" }}>
          <p><strong>Two lines for your logbook.</strong> What did you build or learn in this module, and what can you now do that you couldn't before? This is your record - one day you will show it to people.</p>
          <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 90 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="I can now ... because I ..."
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && words >= 6) save(); }} />
          {err && <p className="hint">{err}</p>}
          <div style={{ marginTop: 10 }}><button className="btn primary" disabled={words < 6} onClick={save}>Save to my logbook (Ctrl+Enter)</button></div>
        </div>
      ) : <p className="small">Saved. <a href="/portfolio">See your logbook ↗</a></p>}
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "left" }}><NextUp next={next} /></div>
      <p style={{ marginTop: 16 }}><a className="btn primary" href="/">See the path</a></p>
    </main>
  );
}

function Step(props) {
  const { step } = props;
  if (step.kind === "lesson" || step.kind === "code") return <Chat {...props} />;
  if (step.kind === "diagnostic") return <Diagnostic {...props} />;
  if (step.kind === "practice") return <Practice {...props} />;
  if (step.kind === "check") return props.remediation ? <Remediation {...props} /> : <Check {...props} />;
  if (step.kind === "teach") return <Teach {...props} />;
  if (step.kind === "typing") return <Typing {...props} />;
  return <p>Unknown step.</p>;
}

/* ---------- Lesson / code: a conversation with the tutor ---------- */
const MEDIA_OK = ["https://www.youtube-nocookie.com/embed/", "https://www.youtube.com/embed/"];
const VIDEO_VOTES = [["useful", "Useful"], ["long", "Too long"], ["off", "Not about this"]];
/** One step video: the player, what to look for (and that she may stop once she has seen it), and her one-tap verdict.
    `from`/`to` (seconds) in the media entry start and end the player at the useful part when someone has found it. */
function Video({ md, stepId }) {
  const voteKey = `vidvote:${stepId}:${md.url}`;
  const [vote, setVote] = useState(() => store.get(voteKey));
  const [err, setErr] = useState(null);
  const extra = [md.from > 0 ? `start=${Math.floor(md.from)}` : null, md.to > 0 ? `end=${Math.floor(md.to)}` : null].filter(Boolean).join("&");
  const src = md.url + (md.url.includes("?") ? "&" : "?") + "playsinline=1&rel=0&modestbranding=1" + (extra ? "&" + extra : "");
  const cast = async (v) => {
    setErr(null); setVote(v); store.set(voteKey, v);
    const r = await api("/api/video", { stepId, url: md.url, vote: v });
    if (r?.error) setErr(r.error);
  };
  return (
    <div className="media">
      {/* No sandbox and a strict-origin referrer: YouTube's player refuses to play on iPad Safari under a sandbox
          or with no referrer ("Error" / spinner). Frames are already limited to youtube-nocookie by the CSP. */}
      <iframe src={src} title={md.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
      <div className="small soft" style={{ padding: "6px 10px" }}>
        {md.why ? <><b style={{ color: "var(--ink)" }}>Look for:</b> {md.why}. {md.from > 0 || md.to > 0 ? "It starts at the useful part. " : ""}Stop when you have seen it - the rest is not for today. · </> : null}
        {md.title} · <a href={md.url.replace("youtube-nocookie.com/embed/", "youtube.com/watch?v=")} target="_blank" rel="noopener noreferrer">open in YouTube ↗</a>
      </div>
      <div className="small soft videovote" style={{ padding: "0 10px 8px" }}>
        {vote ? <span>Thanks - Abid will see that. {vote !== "useful" ? "You can skip it." : ""} </span> : <span>Was it worth it? </span>}
        {VIDEO_VOTES.map(([v, label]) => <button key={v} type="button" className={"btn quiet tiny" + (vote === v ? " on" : "")} aria-pressed={vote === v} onClick={() => cast(v)}>{label}</button>)}
        {err ? <span style={{ color: "var(--amber)" }}> {err}</span> : null}
      </div>
    </div>
  );
}
function Chat({ m, step, onDone, ctx, skill, onStepDone, history, stepDone }) {
  const clock = useClock(ctx ? `${step.id}:${ctx}` : step.id);
  const beat = useHeartbeat(clock, !ctx && ["lesson", "code"].includes(step.kind) ? step.id : null);
  // Every chat resumes from what the server kept: the lesson (state.history) and, since 29 Oct 2026, the fix lesson
  // (state.fixHistory, when the server sends it). A detour with no history starts fresh.
  const resumed = Array.isArray(history) && history.length > 0;
  const [msgs, setMsgs] = useState(() => (resumed ? history.map((h) => ({ role: h.role, content: h.content })) : []));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null); // text of the reply as it streams in
  const [ready, setReady] = useState(() => !!stepDone);
  const [shot, setShot] = useState(null);       // a pasted screenshot waiting to be sent (data URL, already shrunk)
  const [shotHelp, setShotHelp] = useState(false);
  const [shotErr, setShotErr] = useState("");
  // Paste a screenshot (Win+Shift+S, then Ctrl+V): shrink it in the browser to at most 1280 px wide, JPEG, so it is
  // small to send and cheap for the tutor to look at. Nothing is uploaded until she presses Enter / Send.
  // One-button capture (Abid, 12 Oct 2026: "she doesn't know how to do all that"): the button asks Chrome to share a
  // window, takes ONE picture of it and stops sharing at once - she clicks the window she means in Chrome's own box and
  // presses Share. The window can be behind the School; nothing is recorded or kept running. Where the browser cannot
  // do this (iPad), the paste instructions are shown instead.
  const shrink = (src, w, h) => {
    const scale = Math.min(1, 1280 / w, 1280 / h);
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  };
  const bottom = useRef(null);
  const box = useRef(null);
  const grabScreen = async () => {
    setShotErr("");
    if (!navigator.mediaDevices?.getDisplayMedia) { setShotHelp(true); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "window" }, audio: false, selfBrowserSurface: "exclude", surfaceSwitching: "exclude", monitorTypeSurfaces: "include" });
      const v = document.createElement("video");
      v.srcObject = stream; v.muted = true; v.playsInline = true;
      await v.play();
      await new Promise((r) => setTimeout(r, 400)); // let the first real frame arrive
      const data = shrink(v, v.videoWidth, v.videoHeight);
      if (!v.videoWidth || data.length > 1_500_000) throw new Error("empty");
      setShot(data); setShotHelp(false); box.current?.focus();
    } catch (e) {
      // She pressed Cancel, or the browser refused: no fuss, show the other way.
      if (e?.name !== "NotAllowedError") setShotErr("That did not work. Use the other way below.");
      setShotHelp(true);
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
    }
  };
  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((it) => it.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile(); if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const data = shrink(img, img.width, img.height);
      if (data.length > 1_500_000) { setShotErr("That picture is too big. Take a smaller part of the screen."); return; }
      setShotErr(""); setShot(data); setShotHelp(false); box.current?.focus();
    };
    img.onerror = () => { URL.revokeObjectURL(url); setShotErr("That picture could not be read. Take the screenshot again."); };
    img.src = url;
  };
  const setMood = useFaceMood();
  // 22 Oct 2026: she is on Linux Mint now - the screenshot help must not say Win+Shift+S there. 23 Oct: her IdeaPad has
  // no Print key either, so on Linux the help names Firefox's own Ctrl+Shift+S and the Show my screen button.
  const [linux, setLinux] = useState(false);
  useEffect(() => { setLinux(/Linux|X11/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent)); }, []);

  const code = useRef(step.starter || "");
  // Offline (22 Oct 2026): a message that could not reach the school waits here and is sent again by itself when the
  // internet is back - she never types it twice. While it waits, the composer is held so the order stays right.
  const [queued, setQueued] = useState(null);
  const blocked = busy || !!queued;
  const deliver = async (next, image, words, mood, extra = null) => {
    setBusy(true); setLive(""); setMood(mood);
    let first = true;
    const payload = next.map(({ role, content }) => ({ role, content }));
    if (image) payload[payload.length - 1].content = words;
    // CONTRACT 1 (29 Oct 2026): the server rebuilds the history from its own records and reads her newest message from
    // `text`; `messages` is still sent so an older server keeps working.
    const r = await streamTutor({ mode: "chat", ctx, skill, text: payload[payload.length - 1]?.content, messages: payload, ...(image ? { image } : {}), ...(step.kind === "code" ? { editor: code.current } : {}), ...(extra || {}) }, (t) => { if (first) { first = false; setMood(/```svg/.test(t) ? "drawing" : "talking"); } else if (/```svg/.test(t) && !/```svg[\s\S]*```/.test(t)) setMood("drawing"); setLive(t); });
    setBusy(false); setLive(null);
    if (r.offline) {
      setMsgs(next.map((x, i) => (i === next.length - 1 ? { ...x, pending: true } : x)));
      setQueued({ next, image, words, mood, extra }); setMood("idle");
      return;
    }
    setQueued(null);
    const sent = next.map(({ pending: _p, ...x }) => x);
    const t = r.text || r.error || "Something went wrong. Try again.";
    // 29 Oct 2026 (review L11): a rate-limited reply used to delete her own message, so she had to type it again.
    if (r.limited) { setMsgs([...sent, { role: "assistant", content: t, selfStudy: r.selfStudy || null }]); setMood("sleepy"); return; }
    setMsgs([...sent, { role: "assistant", content: cleanMarkers(t), selfStudy: r.selfStudy || null }]);
    if (r.done) { setReady(true); setMood("happy"); } else setMood("idle");
    box.current?.focus();
  };
  // extra: { run: true } marks a program-output message (review M8) so the server can leave runs out of the turn counts.
  const send = async (text, hidden = false, mood = "thinking", image = null, extra = null) => {
    // A screenshot rides on this one message only; the history keeps a marker, never the picture (12 Oct 2026).
    const words = text || "Here is my screen.";
    const next = [...msgs, { role: "user", content: image ? `[I showed you my screen] ${words}` : words, hidden, thumb: image || undefined }];
    setMsgs(next); setShot(null); setShotHelp(false);
    await deliver(next, image, words, mood, extra);
  };
  // Recess replaces the room, which would drop a queued message - the room says so instead (26 Oct 2026).
  useEffect(() => { try { window.__schoolQueued = !!queued; } catch {} return () => { try { window.__schoolQueued = false; } catch {} }; }, [queued]);
  useEffect(() => { try { window.__schoolBusy = !!busy; } catch {} return () => { try { window.__schoolBusy = false; } catch {} }; }, [busy]);
  useEffect(() => {
    if (!queued) return;
    const stop = new AbortController();
    waitForInternet(stop.signal).then((ok) => { if (ok && !stop.signal.aborted) deliver(queued.next.map(({ pending: _p, ...x }) => x), queued.image, queued.words, queued.mood, queued.extra); });
    return () => stop.abort();
  }, [queued]);
  // Left alone for a while, the face dozes; a keystroke wakes it.
  useEffect(() => {
    if (busy) return;
    const t = setTimeout(() => setMood((x) => (x === "idle" ? "sleepy" : x)), 90000);
    const wake = () => setMood((x) => (x === "sleepy" ? "idle" : x));
    document.addEventListener("keydown", wake);
    return () => { clearTimeout(t); document.removeEventListener("keydown", wake); };
  }, [busy, msgs.length]);  

  useEffect(() => { if (!resumed) send("Hello! I'm here for this step.", true);   }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, live]);

  const finish = () => {
    const timing = { turns: msgs.length };
    if (onStepDone) { onStepDone(); return; }
    const rest = beat.remainder();
    clock.clear(); beat.clear();
    onDone({ timing, active_ms: rest, proof: step.kind === "code" ? code.current : undefined });
  };
  const explainAgain = () => !blocked && send("I didn't understand that. Can you explain it again in an easier way, with an example?", false, "puzzled");
  const drawIt = () => !blocked && send("Can you draw that for me?", false, "drawing");
  const inBangla = () => !blocked && send("Can you say that in Bangla first, then in English?");
  // Abid, 9 Oct 2026: she must always know what she is doing, why, and what it is for - one key away.
  const whyThis = () => !blocked && send("Why am I doing this? Tell me in three short sentences: what I am doing, why, and what it is for in my life.", false, "thinking");

  // Keyboard first (Abid's rule, Oct 2026): everything in the room has a key. Enter sends (already),
  // Ctrl+Enter finishes the step once the tutor has opened it, Ctrl+/ asks for an easier explanation, Ctrl+D asks for a drawing.
  // Firefox (her Mint laptop): Ctrl+D = bookmark and Ctrl+B = bookmarks sidebar there, but neither is a reserved key, so
  // preventDefault here wins. Inside the Python editor (29 Oct 2026, review L4) the room keys do NOTHING - VS Code uses
  // Ctrl+/ and Ctrl+D for other things - but D and B are still swallowed so Firefox does not open its bookmark box.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const inEditor = !!(e.target && e.target.classList?.contains("editor"));
      const k = e.key.toLowerCase();
      if (inEditor) { if (k === "d" || k === "b") e.preventDefault(); return; }
      if (e.key === "Enter" && ready && !e.repeat) { e.preventDefault(); finish(); }
      if (e.key === "/") { e.preventDefault(); explainAgain(); }
      if (e.key === "?") { e.preventDefault(); whyThis(); }
      if (k === "d" && !e.shiftKey) { e.preventDefault(); drawIt(); }
      if (k === "b" && !e.shiftKey) { e.preventDefault(); inBangla(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });  

  const visible = msgs.filter((x) => !x.hidden);
  const chat = (
    <>
      <div className="stream" role="log" aria-live="polite">
        {resumed && <div className="small mute" style={{ padding: "4px 0" }}>Continuing where you left off.{ready ? " This step is already finished - press Finish when you are ready." : ""}</div>}
        {visible.map((x, i) => x.role === "user"
          ? <div key={i} className="turn me rise"><div className="bubble">{x.thumb ? <img className="shotthumb" src={x.thumb} alt="your screenshot" /> : null}{x.content.replace(/^\[I showed you my screen\] /, "")}{x.pending ? <span className="small pendingtag">waiting for the internet - sends by itself</span> : null}</div></div>
          : <div key={i} className="turn rise"><div className="avatar"><Face mood="idle" /></div><div className="body"><Markdown text={x.content} />{x.selfStudy ? <SelfStudy data={x.selfStudy} step={step} /> : null}</div></div>)}
        {queued && live === null && <div className="small waitline" role="status">No internet right now. Your message is kept and will go by itself when the internet comes back - you do not need to type it again.</div>}
        {live !== null && <div className="turn live"><div className="avatar"><Face mood={live ? "talking" : "thinking"} /></div><div className="body">{live ? <Markdown text={live} live /> : <span className="small mute">thinking…</span>}</div></div>}
        <div ref={bottom} />
      </div>
      <div className="composer">
        {ready && <div style={{ marginBottom: 8 }}><button className="btn primary" onClick={finish}>Finish this step <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Ctrl+Enter</kbd></button></div>}
        <div className="box">
          <textarea ref={box} value={input} onChange={(e) => setInput(e.target.value)} onPaste={onPaste} placeholder={queued ? "Waiting for the internet…" : busy ? "The tutor is writing…" : shot ? "Say what you want the tutor to look at, then Enter" : "Type here, then Enter"} rows={1} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && (input.trim() || shot) && !blocked) { e.preventDefault(); send(input.trim(), false, "thinking", shot); setInput(""); } }} />
          <button className="btn primary" disabled={blocked || !(input.trim() || shot)} onClick={() => { send(input.trim(), false, "thinking", shot); setInput(""); }}>Send</button>
          <div className="tools">
            <button className="btn quiet" disabled={blocked} title="Show the tutor a picture of a window on your screen" onClick={grabScreen}>Show my screen</button>
            <button className="btn quiet" disabled={blocked} title="Ask the tutor to explain the last idea again in easier words (Ctrl+/)" onClick={explainAgain}>Explain again</button>
            <button className="btn quiet" disabled={blocked} title="What am I doing, why, and what is it for? (Ctrl+?)" onClick={whyThis}>Why this?</button>
            <button className="btn quiet" disabled={blocked} title="Ask the tutor to draw the idea (Ctrl+D)" onClick={drawIt}>Draw it</button>
            <button className="btn quiet" disabled={blocked} title="Say it in Bangla first, then English (Ctrl+B)" onClick={inBangla}>বাংলায়</button>
          </div>
        </div>
        {shot && <div className="shotbar"><img className="shotthumb" src={shot} alt="the screenshot you will send" /><span className="small">Your screenshot is ready. Type what you want the tutor to look at, then Enter.</span><button className="btn quiet" onClick={() => setShot(null)}>Remove</button></div>}
        {shotErr && <div className="small" style={{ color: "var(--rose)", marginTop: 6 }}>{shotErr}</div>}
        {shotHelp && !shot && <div className="shotbar small">
          <span><b>The other way:</b> {linux
            ? <>for this page, press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>, drag a box, click <b>Copy</b>, then click in the box above and press <kbd>Ctrl</kbd>+<kbd>V</kbd>. For the terminal or another window, use <b>Show my screen</b> and pick that window.</>
            : <>press <kbd>Win</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>, drag a box around the part you want to show, then click in the box above and press <kbd>Ctrl</kbd>+<kbd>V</kbd>.</>} Cover passwords and private messages - never show those.</span></div>}
        <div className="keys">
          {[["Enter", "send"], ["Shift+Enter", "new line"], ["Ctrl+/", "explain again"], ["Ctrl+?", "why this?"], ["Ctrl+D", "draw it"], ["Ctrl+B", "in Bangla"], ...(step.kind === "code" ? [["Ctrl+Enter in the editor", "run"], ["Tab", "indent"]] : []), ...(ready ? [["Ctrl+Enter", "finish step"]] : [])].map(([k, w]) => <span key={k}><kbd>{k}</kbd> {w}</span>)}
        </div>
      </div>
    </>
  );
  /* Videos (5 Nov 2026, Faiza: "too many videos have too many unrelated information; some just introduce a product"):
     at most ONE core video per step, with what to look for and permission to stop; the rest sit folded under
     "more, if you want" and the tutor never asks about them. Under each video one tap tells Abid whether it earned
     its place (useful / too long / not about this) - the list on /guardian decides what gets cut. */
  const allMedia = (step.media || []).filter((md) => MEDIA_OK.some((p) => String(md.url).startsWith(p)));
  const coreMedia = allMedia.filter((md) => !md.extra), extraMedia = allMedia.filter((md) => md.extra);
  const media = allMedia.length ? (
    <>
      {coreMedia.map((md) => <Video key={md.url} md={md} stepId={step.id} />)}
      {extraMedia.length > 0 && (
        <details className="media-extra">
          <summary className="small soft">{coreMedia.length ? "One more video, if you want" : `${extraMedia.length === 1 ? "A video" : "Videos"}, if you want`} - not needed for this step{extraMedia.length > 1 ? ` (${extraMedia.length})` : ""}</summary>
          {extraMedia.map((md) => <Video key={md.url} md={md} stepId={step.id} />)}
        </details>
      )}
    </>
  ) : null;
  /* Links for this step (Abid, 9 Oct 2026, after the Firefox download went wrong): every download or sign-up a step
     needs is a button here - the right file, from the maker, in one click. She never types an address or searches for
     an installer. Internal links (/api/...) open in this tab; everything else in a new one. */
  const links = step.links?.length ? (
    <div className="links">
      <div className="eyebrow">Links for this step · click these, don't search</div>
      {step.links.map((l) => {
        const internal = String(l.url).startsWith("/");
        return (
          <a key={l.url} className="linkcard" href={l.url} target={internal ? undefined : "_blank"} rel={internal ? undefined : "noopener noreferrer"}>
            <span className="linklabel">{l.label} {internal ? "" : "↗"}</span>
            {l.file ? <span className="small mono">file: {l.file}</span> : null}
            <span className="small soft">{l.what}</span>
          </a>
        );
      })}
    </div>
  ) : null;
  // Code steps: the editor sits beside the conversation, like an IDE with an assistant panel.
  if (step.kind === "code") return (
    <div className="codegrid">
      <div className="chatcol">{links}{media}{chat}</div>
      <div className="side"><Python starter={step.starter} storageKey={step.id} onChange={(v) => { code.current = v; }} onOutput={(out) => { if (!blocked) send(`[program output]\n${out}`, false, "thinking", null, { run: true }); }} /></div>
    </div>
  );
  return <>{links}{media}{chat}</>;
}

/* ---------- Self-study card (29 Oct 2026): when the tutor cannot help right now (the server marks its reply with
   selfStudy - see the fix-day CONTRACT), she still has something real to do: the step's own objectives and a few
   "try this" items, under the message. Works with selfStudy = true or an object carrying its own lists. ---------- */
const asList = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.text || x?.what || "")).filter(Boolean) : []);
export function SelfStudy({ data, step }) {
  const d = data && typeof data === "object" ? data : {};
  const objectives = asList(d.objectives).length ? asList(d.objectives) : asList(step?.objectives);
  const tries = asList(d.tryThis || d.try_this || d.try || d.items || step?.try_this || step?.tryThis);
  if (!objectives.length && !tries.length && !d.note) return null;
  return (
    <div className="selfstudy" role="note">
      <div className="eyebrow" style={{ color: "var(--lime)" }}>you can do this on your own</div>
      {d.note && <p className="small" style={{ margin: "4px 0 6px" }}>{d.note}</p>}
      {objectives.length > 0 && <><div className="small soft" style={{ marginTop: 4 }}>What this step is for:</div><ul className="small">{objectives.slice(0, 5).map((o, i) => <li key={i}>{o}</li>)}</ul></>}
      {tries.length > 0 && <><div className="small soft" style={{ marginTop: 4 }}>Try this:</div><ol className="small">{tries.slice(0, 6).map((o, i) => <li key={i}>{o}</li>)}</ol></>}
    </div>
  );
}

/* ---------- One question at a time ---------- */
function OneAtATime({ questions, onAnswer, hints, start = 0, onMove }) {
  const [i, setI] = useState(start);
  const [val, setVal] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [busy, setBusy] = useState(false); // 29 Oct 2026: one Enter = one answer
  const q = questions[i];
  if (!q) return null;
  const submit = async () => {
    if (busy || !val.trim()) return;
    setBusy(true);
    let ok;
    try { ok = await onAnswer(i, val.trim(), q); } finally { setBusy(false); }
    if (ok === false && hints) { setHintLevel((h) => h + 1); setVal(""); return; }
    setVal(""); setHintLevel(0); setI(i + 1); onMove?.(i + 1);
  };
  return (
    <div className="card">
      <div className="small soft">Question {i + 1} of {questions.length}</div>
      <div className="question">{q.q}</div>
      {hints && hintLevel > 0 && <div className="hint">{hintLevel === 1 ? q.hint : "Not yet. In your own words: what is this question asking for? Then try one more time."}</div>}
      <input className="big-input" inputMode="text" autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="Your answer" disabled={busy} onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) submit(); }} />
      <div style={{ marginTop: 12 }}><button className="btn primary" disabled={busy || !val.trim()} onClick={submit}>Next</button></div>
    </div>
  );
}

/* ---------- Diagnostic: fixed bank, graded on the server, no pass/fail ---------- */
function Diagnostic({ step, onDone }) {
  const clock = useClock();
  const answers = useRef([]);
  const [result, setResult] = useState(null);
  const [intro, setIntro] = useState(true);
  const [err, setErr] = useState(null); // 29 Oct 2026 (review L8): an offline / error grade used to leave a blank card
  const grade = async () => {
    setErr(null);
    const r = await api("/api/state", { grade: { answers: answers.current }, active_ms: clock.ms() });
    if (r.result) { setResult(r.result); return; }
    setErr(r.offline ? "No internet right now. Your answers are kept - press Send again when the banner at the top goes away." : `${r.error || "The marking did not arrive"} - not your mistake; your answers are kept.`);
  };
  if (intro) return (
    <div className="card">
      <p>{step.questions.length} questions. No marks, no time limit, no hints — this one is only a map. If you don't know, type "?" and move on.</p>
      <button className="btn primary" onClick={() => { clock.reset(); setIntro(false); }}>Start</button>
    </div>
  );
  if (result) return (
    <div className="card">
      <h3>Done. {result.correct} of {result.total}.</h3>
      <p>That's not a grade — it's the map. The school is being shaped around exactly these.</p>
      <button className="btn primary" onClick={() => onDone()}>Next</button>
    </div>
  );
  if (err) return <div className="card"><p className="notice small" role="alert">{err}<button className="btn primary" onClick={grade}>Send again</button></p></div>;
  return (
    <OneAtATime questions={step.questions} onAnswer={async (i, v) => {
      answers.current[i] = v;
      if (i === step.questions.length - 1) await grade();
    }} />
  );
}

/* ---------- Practice: every answer graded on the server; streaks live there too ---------- */
// Where she is in a practice set is kept in this browser per set (29 Oct 2026, review M3) - used only when the server
// does not say (`pos` on the generate reply). A reused open set resumes there, not at question 1.
const practiceKey = (qsetId) => `practice:${qsetId}`;
function Practice({ m, step, onDone }) {
  const clock = useClock();
  const [set, setSet] = useState(null);      // { qsetId, questions (no answers), streak }
  const [i, setIRaw] = useState(0);
  const [val, setVal] = useState("");
  const [hint, setHint] = useState(null);
  const [help, setHelpRaw] = useState(() => store.get(`practicehelp:${step.id}`)); // the help detour survives a recess / reload
  const [need, setNeed] = useState(3);
  const [busy, setBusy] = useState(false);   // 29 Oct 2026 (review M2): two Enters used to count two answers
  const [note, setNote] = useState(null);
  const setI = (n) => { setIRaw(n); if (set?.qsetId) store.set(practiceKey(set.qsetId), n); };
  const setHelp = (h) => { setHelpRaw(h); if (h) store.set(`practicehelp:${step.id}`, h); else store.del(`practicehelp:${step.id}`); };

  // Where to start in a set: the server's `pos` (first unanswered), else what this browser remembers, else 0.
  const startAt = (r) => {
    const n = r.questions?.length || 0;
    let pos = Number.isInteger(r.pos) ? r.pos : Number(store.get(practiceKey(r.qsetId), 0)) || 0;
    if (Array.isArray(r.answered)) { const first = r.questions.findIndex((_, k) => !r.answered[k]); if (first >= 0 && !Number.isInteger(r.pos)) pos = first; }
    return Math.max(0, Math.min(pos, Math.max(0, n - 1)));
  };
  const accept = (r) => { setSet(r); const p = startAt(r); setIRaw(p); store.set(practiceKey(r.qsetId), p); };

  // The questions come from the server; if that fails she sees why and a button, never a page that waits forever (6 Oct 2026).
  const [loadErr, setLoadErr] = useState(null);
  const load = async () => {
    setLoadErr(null);
    const r = await api("/api/tutor", { mode: "generate" });
    if (r.qsetId) { accept(r); return; }
    if (!r.offline) reportFail(`generate:${step.id}`, r.error || r.text || "no questions");
    setLoadErr(r.text || r.error || "The questions did not arrive.");
  };
  useEffect(() => { load();   }, []);

  const [reveal, setReveal] = useState(null); // { answer, why, next } after two wrong answers: the answer, the reason, then a similar question
  const setMood = useFaceMood();
  const next = async () => {
    // After a similar question (a variant appended at the end of the set), continue from where the original question was.
    const curQ = set.questions[i];
    const target = curQ && curQ.parent != null ? curQ.parent + 1 : i + 1;
    if (target < set.questions.length && !(curQ && curQ.parent != null && set.questions[target]?.parent != null)) { setI(target); return; }
    // The set is used up. Ask for the next one - but never loop the SAME set from question 1 again (review M3: she could
    // pass by memory). If the server hands back the same set, start at its first unanswered question if it names one;
    // otherwise ask the tutor for help on what is left instead of repeating.
    setNote(null);
    const r = await api("/api/tutor", { mode: "generate", after: set.qsetId });
    if (r.qsetId && r.qsetId !== set.qsetId) { store.del(practiceKey(set.qsetId)); accept(r); return; }
    if (r.qsetId && r.qsetId === set.qsetId) {
      const p = Number.isInteger(r.pos) ? r.pos : -1;
      if (p >= 0 && p < r.questions.length && p !== i) { setSet(r); setI(p); return; }
      const left = Object.entries(r.streak || set.streak || {}).filter(([, n]) => n < need).map(([k]) => k);
      // One help detour per used-up set - never a loop of detours either.
      const helped = store.get(`practicehelped:${set.qsetId}`);
      if (left.length && !helped) { store.set(`practicehelped:${set.qsetId}`, 1); setHelp(left[0]); return; }
      reportFail(`practice-used-up:${step.id}`, `set ${set.qsetId} came back after every question was used`);
      setNote("You have answered every question in this set - well done for sticking with it. New questions are needed; press Try again in a minute. Abid can see this happened.");
      return;
    }
    if (!r.offline) reportFail(`generate:${step.id}`, r.error || r.text || "no questions");
    setSet(null); setLoadErr(r.text || r.error || "The next questions did not arrive.");
  };
  const submit = async () => {
    if (busy || !val.trim()) return;
    setBusy(true); setMood("thinking");
    try {
      const body = { answer: { qsetId: set.qsetId, index: i, value: val.trim() }, active_ms: clock.ms() };
      let r = await api("/api/state", body);
      // CONTRACT 2: a rare 409 "busy - send that answer again" when two answers race - resend once, quietly.
      if (r.error && /^busy/.test(r.error)) { await new Promise((x) => setTimeout(x, 400)); r = await api("/api/state", body); }
      if (r.error) { setMood("idle"); setHint(r.offline ? "No internet right now. Your answer is still in the box - press Check again when the banner at the top goes away." : r.error); return; }
      setNeed(r.need || 3);
      setSet((s) => ({ ...s, streak: r.streak, questions: r.questions || s.questions }));
      if (r.done) { setMood("happy"); store.del(practiceKey(set.qsetId)); store.del(`practicehelp:${step.id}`); onDone(); return; }
      if (r.help) { setMood("puzzled"); setHelp(r.help); setHint(null); setVal(""); return; }
      if (r.reveal) { setMood("puzzled"); setReveal({ ...r.reveal, next: r.variantIndex }); setHint(null); setVal(""); return; }
      if (r.ok) { setMood("happy"); setTimeout(() => setMood((x) => (x === "happy" ? "idle" : x)), 1800); setHint(null); setVal(""); await next(); }
      else { setMood("puzzled"); setHint(r.hint || "Not yet. The question again, simply: what number is it asking for? Try one more time."); setVal(""); }
    } finally { setBusy(false); }
  };

  if (help) return <div className="room"><Chat m={m} step={{ ...step, kind: "lesson" }} ctx="help" skill={help} onStepDone={() => { setHelp(null); if (set) next(); else load(); }} /></div>;
  if (!set) return loadErr
    ? <div className="card amber"><div className="eyebrow" style={{ color: "var(--amber)" }}>the questions did not arrive</div><p style={{ margin: "6px 0" }}>{loadErr} This is not your mistake - the school's side hiccuped. Abid can see it happened.</p><button className="btn primary" autoFocus onClick={load}>Try again (Enter)</button></div>
    : <p className="soft">Getting your questions ready…</p>;
  if (reveal) return (
    <div className="room">
      <div className="card amber">
        <div className="eyebrow" style={{ color: "var(--amber)" }}>two tries - so here is the answer, and why</div>
        <div className="question" style={{ marginTop: 6 }}>{set.questions[i]?.q}</div>
        <p style={{ fontSize: 22 }}>Answer: <strong>{reveal.answer}</strong></p>
        {reveal.why && <p>{reveal.why}</p>}
        <p className="small soft">Nothing is lost. Read it once more, then a similar question checks that it landed.</p>
        <button className="btn primary" autoFocus onClick={() => { const n = reveal.next; setReveal(null); if (typeof n === "number") setI(n); else next(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (e.repeat) return; const n = reveal.next; setReveal(null); if (typeof n === "number") setI(n); else next(); } }}>A similar one (Enter)</button>
      </div>
    </div>
  );
  const q = set.questions[i];
  if (!q) return <p className="soft">Getting your questions ready…</p>;
  const left = Object.values(set.streak || {}).filter((n) => n < need).length;
  return (
    <div className="room">
      <p className="small soft">Get {need} in a row for each skill. {left} skill{left === 1 ? "" : "s"} to go. A wrong answer resets that skill's count - that's normal, nothing is lost.</p>
      <div className="card">
        <div className="small soft">Question {i + 1} of {set.questions.length}</div>
        <div className="question">{q.q}</div>
        {hint && <div className="hint">{hint}</div>}
        {note && <div className="hint">{note} <button className="btn quiet" style={{ marginLeft: 8, padding: "2px 10px" }} onClick={() => { setNote(null); next(); }}>Try again</button></div>}
        <input className="big-input" autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="Your answer" disabled={busy} onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) submit(); }} />
        <div style={{ marginTop: 12 }}><button className="btn primary" disabled={busy || !val.trim()} onClick={submit}>{busy ? "Checking…" : "Check"}</button></div>
      </div>
    </div>
  );
}

/* ---------- Checkpoint: no hints, one attempt, graded on the server ---------- */
// 29 Oct 2026 (review H4): a recess or a reload at question 7 of 10 used to throw the set away; Start then generated a
// NEW one (60-240 s, money). The set (questions only - never answers) and her answers so far are kept in this browser
// per step until the set is marked, and the intro offers "Carry on from question N".
const checkKey = (stepId, fix) => `check:${stepId}${fix ? ":fix" : ""}`;
// Since the CONTRACT (29 Oct 2026) the server keeps the open set and her draft too (state.checkSet, POST {checkDraft});
// the browser copy is the second net (and the only one on an older server).
const firstGap = (a, n) => { let k = 0; while (k < n && a[k] != null && a[k] !== "") k++; return k; };
function pickResume(local, server) {
  if (server && server.qsetId && Array.isArray(server.questions) && server.questions.length) {
    const n = server.questions.length;
    const sa = Array.isArray(server.draft) ? server.draft.slice(0, n) : [];
    const la = local && local.qsetId === server.qsetId && Array.isArray(local.answers) ? local.answers.slice(0, n) : [];
    const answers = firstGap(la, n) > firstGap(sa, n) ? la : sa;
    return { qsetId: server.qsetId, questions: server.questions, answers, pos: firstGap(answers, n) };
  }
  if (local && Array.isArray(local.questions) && local.questions.length) return { ...local, pos: Math.min(local.pos || 0, local.questions.length) };
  return null;
}
function Check({ m, step, onDone, setState, remediation, checkSet }) {
  const clock = useClock();
  const saved = useRef(pickResume(store.get(checkKey(step.id, remediation)), checkSet));
  const [set, setSet] = useState(null);
  const answers = useRef([]);
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState(null);
  const [intro, setIntro] = useState(true);
  const [startErr, setStartErr] = useState(null);
  const [starting, setStarting] = useState(false);
  const [grading, setGrading] = useState(null); // null | "sending" | "waiting" | an error to show
  const keep = (s, a, p, toServer = false) => {
    store.set(checkKey(step.id, remediation), { qsetId: s.qsetId, questions: s.questions, answers: a, pos: p, at: Date.now() });
    if (toServer) api("/api/state", { checkDraft: { qsetId: s.qsetId, answers: a.map((x) => (x == null ? null : String(x).slice(0, 200))) } });
  };
  const grade = async () => {
    setGrading("sending");
    let r = await api("/api/state", { grade: { qsetId: set.qsetId, answers: answers.current }, active_ms: clock.ms() });
    if (r.offline) {
      setGrading("waiting");
      await waitForInternet();
      r = await api("/api/state", { grade: { qsetId: set.qsetId, answers: answers.current }, active_ms: clock.ms() });
      // Marked on the first try after all (only the answer was lost): the room reloads with the result applied.
      if (r.error === "no such set") { store.del(checkKey(step.id, remediation)); setGrading(null); api("/api/state").then(setState); return; }
    }
    // A kept set that the server has already marked (or no longer knows): start fresh, nothing to resend.
    if (r.error === "no such set") { store.del(checkKey(step.id, remediation)); setGrading(null); setSet(null); setIntro(true); saved.current = null; setStartErr("That question set was already finished. Press Start for the next one."); return; }
    if (r.error === "fix first") { setGrading(null); setSet(null); setIntro(true); setStartErr("Finish the fix-up lesson first - your answers are kept."); api("/api/state").then((s) => { if (s && !s.error) setState(s); }); return; }
    if (r.error) { setGrading(r.error); return; }
    store.del(checkKey(step.id, remediation));
    setGrading(null); setResult(r.result);
  };
  const begin = (s, a = [], p = 0) => { answers.current = a.slice(); setSet(s); setPos(p); clock.reset(); setIntro(false); keep(s, answers.current, p); };
  const start = async () => {
    if (starting) return;
    setStartErr(null); setStarting(true);
    const r = await api("/api/tutor", { mode: "generate" });
    setStarting(false);
    if (r.error && r.error !== "fix first" && !r.offline) reportFail(`generate:${step.id}`, r.error);
    if (r.error) { setStartErr(r.error === "fix first" ? "Finish the fix-up lesson first." : `${r.error} - not your mistake; the school's side hiccuped. Press Start again.`); return; }
    if (!r.qsetId || !Array.isArray(r.questions)) { setStartErr(r.text || "The questions did not arrive - not your mistake. Press Start again in a minute."); return; }
    // The server may hand back the same open set (reuse); then her kept answers still belong to it.
    const k = pickResume(saved.current, { qsetId: r.qsetId, questions: r.questions, draft: r.draft });
    begin(r, k?.answers || [], Math.min(k?.pos || 0, r.questions.length - 1));
  };
  const resume = () => { const k = saved.current; if (!k) return; begin({ qsetId: k.qsetId, questions: k.questions }, k.answers || [], Math.min(k.pos || 0, k.questions.length - 1)); };
  const n = set?.questions?.length || step.count || step.questions?.length || 10;
  const k = saved.current;
  const canResume = !!(k && Array.isArray(k.questions) && k.questions.length && (k.pos || 0) < k.questions.length);
  if (intro) return (
    <div className="card">
      <p>{remediation ? "Just the skills you missed this time. " : `${n} questions. `}No hints on this one — it's how we know you've got it. You need 80%. If not, we fix the gaps together and try again. Nothing is lost either way.</p>
      {startErr && <p className="hint" style={{ borderLeftColor: "var(--amber)" }}>{startErr}</p>}
      {canResume && (k.pos || 0) > 0
        ? <><p className="small" style={{ color: "var(--lime)" }}>Your place is kept: you answered {k.pos} of {k.questions.length}.</p><button className="btn primary" autoFocus onClick={resume}>Carry on from question {k.pos + 1}</button></>
        : canResume ? <button className="btn primary" onClick={resume}>Start the checkpoint</button>
        : <button className="btn primary" disabled={starting} onClick={start}>{starting ? "Getting the questions ready…" : "Start the checkpoint"}</button>}
    </div>
  );
  if (!set) return <p className="soft">Preparing…</p>;
  if (result) return (
    <div className="card">
      <h3>{result.passed ? "Boss beaten." : "Boss not beaten yet."} {result.correct} of {result.total}.</h3>
      {result.passed ? <p>That's real. On to the next step.</p> : <p>{result.correct} right on the first go - that's the part to remember. You have {result.remediation.length} bug{result.remediation.length === 1 ? "" : "s"} to fix: {result.remediation.join(", ")}. We debug those together, then you face the boss again on just those. This is what programmers do all day.</p>}
      <button className="btn primary" onClick={() => result.passed ? onDone() : api("/api/state").then(setState)}>Continue</button>
    </div>
  );
  if (grading) return (
    <div className="card">
      {grading === "sending" ? <p className="soft">Marking your answers…</p>
        : grading === "waiting" ? <p className="notice small" role="status">No internet right now. Your answers are kept and will be marked by themselves when the internet comes back. Keep this page open.</p>
        : <p className="notice small" role="alert">{grading} - not your mistake; your answers are kept.<button className="btn primary" onClick={grade}>Send my answers again</button></p>}
    </div>
  );
  return <OneAtATime key={set.qsetId} questions={set.questions} start={pos} onAnswer={async (i, v) => {
    answers.current[i] = v;
    const last = i === set.questions.length - 1;
    keep(set, answers.current, i + 1, !last); // the last answer goes with the grade itself
    if (last) await grade();
  }} />;
}

/* ---------- Remediation: teach the missed skills, then re-check only those ---------- */
// 29 Oct 2026 (review H4): the fix lesson always started at "fix" with a fresh chat, so a recess or F5 made the tutor
// re-teach every missed skill from the top - even when the fix was already finished and she was at the re-check intro.
// Now it starts at the re-check when the server says the fix is done (state.fixDone), and the fix chat resumes from
// the server's copy (state.fix = {done, history}, CONTRACT 2). Without those fields it behaves as before.
function Remediation({ m, step, remediation, onDone, setState, fixHistory, fixDone, checkSet }) {
  const [phase, setPhase] = useState(fixDone ? "recheck" : "fix");
  if (phase === "fix") return <Chat m={m} step={{ ...step, kind: "lesson", title: "Fixing the gaps" }} ctx="fix" history={fixHistory} stepDone={false} onStepDone={() => setPhase("recheck")} />;
  // 26 Oct 2026: a failed re-check used to leave the "Boss not beaten yet" card on screen for ever (the Step key never changed).
  // Now Continue after a miss reloads her state, which brings the fix lesson back for the newly missed skills.
  return <Check m={m} step={step} remediation={remediation} onDone={onDone} checkSet={checkSet} setState={(s) => { setState(s); setPhase(s && (s.fix ? s.fix.done : s.fixDone) ? "recheck" : "fix"); }} />;
}

/* ---------- Teach it back ---------- */
// Her draft is kept in this browser per step (29 Oct 2026, review H4): a recess or a reload used to empty the box -
// under a line promising "Your work is never lost".
const teachKey = (id) => `teach:${id}`;
function Teach({ m, step, onDone }) {
  const clock = useClock();
  const [text, setTextRaw] = useState(() => { const d = store.get(teachKey(step.id)); return d && typeof d.text === "string" ? d.text : ""; });
  const setText = (v) => { setTextRaw(v); store.set(teachKey(step.id), { text: v, at: Date.now() }); };
  const [fb, setFb] = useState(null);
  const [busy, setBusy] = useState(false); // 29 Oct 2026 (review M2): one press = one hand-in, never two tries
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    let r;
    try { r = await api("/api/tutor", { mode: "grade_teach", text, active_ms: clock.ms() }); } finally { setBusy(false); }
    if (r.error || !("passed" in r)) { setFb({ feedback: r.offline ? "No internet right now. Your writing is kept - press Hand it in again when the banner at the top goes away." : (r.text || r.error || "The marking did not arrive - not your mistake. Try again."), passed: false, retryOnly: true }); return; }
    if (r.passed) store.del(teachKey(step.id));
    // CONTRACT 4: `ungraded` = the marker could not read its own answer (not her fault, not a try); `same` = the same
    // text again (not a new try). Both show the server's feedback + status and let her hand in again.
    setFb(r.ungraded ? { ...r, retryOnly: true } : r);
  };
  const enough = text.trim().split(/\s+/).filter(Boolean).length >= 20;
  return (
    <div className="card">
      <p>{step.prompt}</p>
      {!fb && <p className="small soft">{step.reflective
        ? "There is no wrong answer here. Write what you honestly think, at least a few sentences, and this step is done."
        : "First say your explanation OUT LOUD to yourself, like you're talking to a 9-year-old. Then write what you said - spelling doesn't count, only whether the idea is clear. Marked out of 100; 80 finishes the step; after 3 tries, 60 is enough. Your work is never lost."}</p>}
      <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 160 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write here" disabled={!!fb || busy}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.repeat && enough && !fb) { e.preventDefault(); submit(); } }} />
      {!fb && <div style={{ marginTop: 12 }}><button className="btn primary" disabled={busy || !enough} onClick={submit}>{busy ? "Marking…" : "Hand it in (Ctrl+Enter)"}</button>{text && !busy && <span className="small soft" style={{ marginLeft: 10 }}>Kept on this laptop as you type.</span>}</div>}
      {fb && <div style={{ marginTop: 14 }}><div className="hint">{fb.feedback}</div>
        {fb.status && <p className="small" style={{ marginTop: 8 }}><strong>{fb.status}</strong></p>}
        <div style={{ marginTop: 12 }}>
          {fb.passed
            ? <button className="btn primary" onClick={() => onDone()}>Finish this step</button>
            : <button className="btn" onClick={() => setFb(null)}>{fb.retryOnly ? "Hand it in again" : "Make it clearer and try again"}</button>}
        </div></div>}
    </div>
  );
}

/* ---------- Typing check ---------- */
function Typing({ step, onDone }) {
  const clock = useClock();
  const [val, setVal] = useState("");
  const [t0, setT0] = useState(null);
  const words = step.passage.trim().split(/\s+/).length;
  const [err, setErr] = useState("");
  const finish = async () => {
    setErr("");
    const r = await api("/api/state", { typing: { text: val, seconds: (Date.now() - t0) / 1000 }, active_ms: clock.ms() });
    if (r.error) { setErr(r.error === "not finished" ? "Type the whole passage first." : r.error === "not the passage" ? "Type the passage shown above, word for word - not other words." : r.offline ? "No internet right now. What you typed is kept - press Done again when the banner at the top goes away." : r.error); return; }
    onDone();
  };
  return (
    <div className="card">
      <p className="soft small">Type this passage exactly as you see it. Speed doesn't matter today — we just need a starting number.</p>
      <p style={{ fontFamily: "var(--display)", fontSize: 21 }}>{step.passage}</p>
      <textarea className="editor" style={{ fontFamily: "inherit" }} value={val} onFocus={() => !t0 && setT0(Date.now())} onChange={(e) => setVal(e.target.value)} placeholder="Start typing here" />
      {err && <p className="notice small" role="alert">{err}</p>}
      <div style={{ marginTop: 12 }}><button className="btn primary" disabled={val.trim().split(/\s+/).length < words * 0.9} onClick={finish}>Done</button></div>
    </div>
  );
}

/* ---------- The keys for this screen: a small permanent reminder that the keyboard does everything here ---------- */
function Keys({ items }) {
  return (
    <p className="small mute" style={{ marginTop: 14 }}>
      {items.map(([k, what], i) => <span key={i} style={{ marginRight: 14, whiteSpace: "nowrap" }}><kbd>{k}</kbd> {what}</span>)}
    </p>
  );
}

/* ---------- A moment of celebration: new badges, or today's session complete ---------- */
function Cheer({ badges, session, rewards, goal, levelUp, gained, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Enter" || e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const lvl = rewards?.level, next = rewards?.next;
  return (
    <main className="wrap narrow done">
      <Confetti pieces={levelUp ? 160 : 110} seconds={levelUp ? 4.2 : 3.4} />
      <div className="bloom" />
      <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}><Face mood="happy" size={96} /></div>
      {levelUp && <div className="card marigold levelup"><div className="eyebrow">level up!</div><h2 style={{ margin: "4px 0" }}>Level {levelUp.n} - {levelUp.name}</h2><p className="small" style={{ margin: 0 }}>Every level is weeks of real work. Look at the rewards page - something may have opened for you.</p></div>}
      {gained > 0 && <p className="num" style={{ fontSize: 26, color: "var(--lime)", margin: "6px 0" }}>+{gained} XP</p>}
      {session && <><h2>Session complete.</h2><p>Real work done and a step finished. That is a day that counts.{rewards?.session?.streak > 1 ? ` Streak: ${rewards.session.streak} days.` : ""}</p></>}
      {badges.map((b) => <div className="card marigold" key={b.id} style={{ margin: "12px auto", maxWidth: 420 }}><div className="small soft">New badge</div><h3 style={{ margin: "4px 0" }}>{b.name}</h3></div>)}
      {lvl && <p className="small soft">Level {lvl.n} · {lvl.name} · {rewards.xp} XP{next ? ` · ${next.xp - rewards.xp} to ${next.name}` : ""}</p>}
      {goal && <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "left" }}><Goal goal={goal} big /></div>}
      {session && <p style={{ color: "var(--violet)" }}>Ten minutes of something true: <a href="/wonder" style={{ color: "var(--violet)" }}>read today's wonder →</a>{localDayIndex() % 2 === 0 && <span style={{ color: "var(--amber)" }}> · and the <a href="/arena" style={{ color: "var(--amber)" }}>Arena</a> is open today.</span>}</p>}
      <button className="btn primary" onClick={onClose}>Continue (Enter)</button>
      <p className="small soft" style={{ marginTop: 16 }}><a href="/rewards">See all your badges ↗</a></p>
    </main>
  );
}
