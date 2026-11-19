"use client";
import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import Face from "./Face";
import { api, streamTutor } from "./tutorStream";
import { waitForInternet } from "./Offline";

// The shared caller (29 Oct 2026, review M6): a dropped line marks the School offline, the message waits marked
// "waiting for the internet" and is sent again ONCE by itself when the line is back - the lesson chat's pattern.
/** Talk about today's wonder with the tutor. Nothing is graded; "I read it" is the only button that records anything. */
export default function WonderRoom({ wonder, readToday, history = [] }) {
  // The first saved student line is the hidden opener; keep it hidden on resume too.
  const [msgs, setMsgs] = useState(() => history.map((h, i) => ({ ...h, hidden: i === 0 && h.role === "user" })));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null);
  const [read, setRead] = useState(readToday);
  const bottom = useRef(null);
  const [queued, setQueued] = useState(null);
  const deliver = async (next, retried = false) => {
    setBusy(true); setLive("");
    const r = await streamTutor({ mode: "wonder", wonder: wonder.id, text: next[next.length - 1]?.content, messages: next.map(({ role, content }) => ({ role, content })) }, setLive);
    setBusy(false); setLive(null);
    if (r.offline && !retried) { setMsgs(next.map((x, i) => (i === next.length - 1 ? { ...x, pending: true } : x))); setQueued(next); return; }
    setQueued(null);
    setMsgs([...next.map(({ pending: _p, ...x }) => x), { role: "assistant", content: r.text || r.error || "Something went wrong." }]);
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
  useEffect(() => { if (!history.length) send("I have read today's wonder.", true);   }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, live]);
  // 16 Oct 2026 (Abid: "it keeps showing the same one"): a failed save used to be silent, so she pressed again and again.
  // Now the answer is shown, the failure is reported to the school (errors table -> guardian), and one retry is automatic.
  const [saveMsg, setSaveMsg] = useState("");
  const markRead = async () => {
    setSaveMsg("saving…");
    let r = await api("/api/wonder", { read: wonder.id });
    if (r.error) r = await api("/api/wonder", { read: wonder.id });
    if (!r.error) { setRead(true); setSaveMsg(""); return; }
    setSaveMsg(`Could not save: ${r.error} - not your fault. It has been reported; try once more, or carry on.`);
    api("/api/stuck", { page: "/wonder", what: `wonder save failed: ${r.error} (${wonder.id})` });
  };
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 420 }}>
      <div className="eyebrow">talk about it · no test, no marks</div>
      <div className="stream" style={{ flex: 1 }}>
        {msgs.filter((x) => !x.hidden).map((x, i) => x.role === "user" ? <div key={i} className="turn me"><div className="bubble">{x.content}{x.pending ? <span className="small pendingtag">waiting for the internet - sends by itself</span> : null}</div></div> : <div key={i} className="turn"><div className="avatar"><Face mood="idle" /></div><div className="body"><Markdown text={x.content} /></div></div>)}
        {live !== null && <div className="turn live"><div className="avatar"><Face mood={live ? "talking" : "thinking"} /></div><div className="body">{live ? <Markdown text={live} live /> : <span className="small mute">thinking…</span>}</div></div>}
        <div ref={bottom} />
      </div>
      <div className="composer" style={{ position: "static", background: "none", padding: "8px 0 0" }}>
        <div className="box">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={queued ? "Waiting for the internet…" : "Ask anything about it, or say what you think"} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && input.trim() && !busy && !queued) { e.preventDefault(); send(input.trim()); setInput(""); } }} />
          <button className="btn primary" disabled={busy || !!queued || !input.trim()} onClick={() => { send(input.trim()); setInput(""); }}>Send</button>
        </div>
        <div style={{ marginTop: 10 }}>
          {read ? <span className="small" style={{ color: "var(--lime)" }}>✓ Saved in your logbook. A new wonder tomorrow.</span>
            : <button className="btn primary" onClick={markRead}>Done reading? Click to save in logbook</button>}
          {saveMsg && <div className="small" style={{ color: "var(--amber)", marginTop: 6 }}>{saveMsg}</div>}
        </div>
      </div>
    </div>
  );
}
