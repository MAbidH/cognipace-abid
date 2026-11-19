"use client";
/* Preparing to meet a real person (Abid, 5 Oct 2026): four parts with the tutor, each with a proof, then a logbook page.
   The tutor marks a part finished with [PART DONE]; her introduction and questions are saved from the boxes here. */
import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import Face from "./Face";
import { api, streamTutor } from "./tutorStream";
import { waitForInternet } from "./Offline";

// Shared caller + stream reader (29 Oct 2026, review M6): a dropped line no longer leaves "thinking..." for ever; the
// message waits and is sent again once when the internet is back. [PART DONE] and the private markers are hidden while streaming.

const PARTS = [["learn", "Learn three things"], ["intro", "Your introduction"], ["questions", "Three real questions"], ["rehearse", "Rehearse the call"], ["ready", "Ready"]];
const OPENERS = {
  learn: "Hello! I am getting ready to meet a real engineer. Teach me the three things.",
  intro: "Help me write my introduction for the call.",
  questions: "Help me write my three questions.",
  rehearse: "Let's rehearse the call. You be her.",
  ready: "I am ready. Can we go over my questions once more?",
  done: "The call is over.",
};

export default function MeetRoom({ initial }) {
  const [st, setSt] = useState(initial);               // { id, callName, stage, intro, questions, after }
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null);
  const [partDone, setPartDone] = useState(false);
  const [mood, setMood] = useState("idle");
  const [intro, setIntro] = useState(initial.intro || "");
  const [qs, setQs] = useState(initial.questions && initial.questions.length === 3 ? initial.questions : ["", "", ""]);
  const [after, setAfter] = useState(initial.after || "");
  const [msg, setMsg] = useState(null);
  const bottom = useRef(null);

  const [queued, setQueued] = useState(null);
  const deliver = async (next, retried = false) => {
    setBusy(true); setLive(""); setMood("thinking");
    let first = true;
    const r = await streamTutor({ mode: "meet", meeting: st.id, text: next[next.length - 1]?.content, messages: next.map(({ role, content }) => ({ role, content })) }, (t) => { if (first) { first = false; setMood("talking"); } setLive(t); });
    setBusy(false); setLive(null);
    if (r.offline && !retried) { setMood("idle"); setMsgs(next.map((x, i) => (i === next.length - 1 ? { ...x, pending: true } : x))); setQueued(next); return; }
    setQueued(null); setMood(r.done ? "happy" : "idle");
    setMsgs([...next.map(({ pending: _p, ...x }) => x), { role: "assistant", content: r.text || r.error || "Something went wrong." }]);
    if (r.done) setPartDone(true);
  };
  const send = async (text, hidden = false) => {
    const next = [...msgs, { role: "user", content: text, hidden }];
    setMsgs(next);
    await deliver(next);
  };
  useEffect(() => {
    if (!queued) return;
    const stop = new AbortController();
    waitForInternet(stop.signal).then((ok) => { if (ok && !stop.signal.aborted) deliver(queued.map(({ pending: _p, ...x }) => x), true); });
    return () => stop.abort();
  }, [queued]);  
  useEffect(() => { send(OPENERS[st.stage] || OPENERS.learn, true);   }, [st.stage]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, live]);

  const save = async (body) => { setMsg(null); const r = await api("/api/meet", { id: st.id, ...body }); if (r.error) { setMsg(r.error); return false; } setSt(r); setMsg("Saved."); return true; };
  const advance = async () => { const r = await api("/api/meet", { id: st.id, advance: true }); if (r.error) { setMsg(r.error); return; } setPartDone(false); setMsgs([]); setSt(r); };
  const idx = PARTS.findIndex(([k]) => k === st.stage);

  return (
    <div className="grid two" style={{ alignItems: "start" }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Face mood={mood} size={44} />
          <div><div className="eyebrow">{st.stage === "done" ? "after the call" : `part ${Math.min(idx + 1, 4)} of 4`}</div><h3 style={{ margin: 0 }}>{PARTS.find(([k]) => k === st.stage)?.[1] || "Logbook page"}</h3></div>
        </div>
        <div className="steps" aria-hidden="true">{PARTS.slice(0, 4).map(([k], i) => <i key={k} className={i < idx || st.stage === "ready" || st.stage === "done" ? "done" : i === idx ? "now" : ""} />)}</div>
        <div className="stream" style={{ flex: 1, marginTop: 8 }}>
          {msgs.filter((x) => !x.hidden).map((x, i) => x.role === "user" ? <div key={i} className="turn me"><div className="bubble">{x.content}{x.pending ? <span className="small pendingtag">waiting for the internet - sends by itself</span> : null}</div></div> : <div key={i} className="turn"><div className="avatar"><Face mood="idle" /></div><div className="body"><Markdown text={x.content} /></div></div>)}
          {live !== null && <div className="turn live"><div className="avatar"><Face mood={live ? "talking" : "thinking"} /></div><div className="body">{live ? <Markdown text={live} live /> : <span className="small mute">thinking…</span>}</div></div>}
          <div ref={bottom} />
        </div>
        <div className="composer" style={{ position: "static", background: "none", padding: "8px 0 0" }}>
          {partDone && st.stage !== "ready" && st.stage !== "done" && <div style={{ marginBottom: 8 }}><button className="btn primary" onClick={advance}>This part is done - next part <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Ctrl+Enter</kbd></button></div>}
          <div className="box">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={queued ? "Waiting for the internet…" : busy ? "The tutor is writing…" : "Type here, then Enter"} rows={1} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && partDone) { e.preventDefault(); advance(); return; } if (e.key === "Enter" && !e.shiftKey && input.trim() && !busy && !queued) { e.preventDefault(); send(input.trim()); setInput(""); } }} />
            <button className="btn primary" disabled={busy || !!queued || !input.trim()} onClick={() => { send(input.trim()); setInput(""); }}>Send</button>
          </div>
        </div>
      </div>

      <div>
        {(st.stage === "intro" || idx > 1 || st.stage === "done") && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="eyebrow" style={{ color: "var(--cyan)" }}>your introduction - what you will say first</div>
            <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 110, marginTop: 6 }} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Hello Orpi Apu, my name is Faiza, I am 12. ..." disabled={st.stage !== "intro"} />
            {st.stage === "intro" && <div style={{ marginTop: 8 }}><button className="btn" onClick={() => save({ intro })}>Save my introduction</button></div>}
          </div>
        )}
        {(st.stage === "questions" || idx > 2 || st.stage === "done") && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="eyebrow" style={{ color: "var(--amber)" }}>your three questions</div>
            {qs.map((v, i) => <input key={i} className="editor" style={{ fontFamily: "inherit", width: "100%", marginTop: 8, padding: "8px 10px", minHeight: 0 }} value={v} onChange={(e) => setQs(qs.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Question ${i + 1}?`} disabled={st.stage !== "questions"} />)}
            {st.stage === "questions" && <div style={{ marginTop: 8 }}><button className="btn" onClick={() => save({ questions: qs })}>Save my three questions</button></div>}
          </div>
        )}
        {st.stage === "ready" && (
          <div className="card lit">
            <div className="eyebrow" style={{ color: "var(--lime)" }}>you are ready</div>
            <p className="small">On the day: open this page, read your introduction once, keep your three questions in front of you. After the call, come back here and write one logbook page.</p>
            <div className="eyebrow" style={{ marginTop: 10 }}>after the call - your logbook page</div>
            <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 140, marginTop: 6 }} value={after} onChange={(e) => setAfter(e.target.value)} placeholder="What she said about her work. What surprised me. One thing I will do because of this call." />
            <div style={{ marginTop: 8 }}><button className="btn primary" onClick={() => save({ after })}>Save my logbook page</button></div>
          </div>
        )}
        {st.stage === "done" && <div className="card lit"><div className="eyebrow" style={{ color: "var(--lime)" }}>in your logbook</div><p style={{ whiteSpace: "pre-wrap" }}>{st.after}</p></div>}
        {msg && <p className="hint" style={{ marginTop: 10, borderLeftColor: msg === "Saved." ? "var(--lime)" : "var(--rose)" }}>{msg}</p>}
      </div>
    </div>
  );
}
