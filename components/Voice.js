"use client";
/* "What do you want?" (29 Oct 2026). Five boxes, each optional, each up to 600 characters. Keyboard first: Tab moves
   box to box in order, Ctrl+Enter saves from any box. Her past answers are listed with dates. Nothing here is marked. */
import { TZ } from "../lib/time";
import { useEffect, useState } from "react";
import { api, store } from "./tutorStream";

const MAX = 600;
const FIELDS = [
  ["want_to_be", "What do you want to be?", "For example: a security engineer, a doctor who codes, I don't know yet..."],
  ["want_to_learn", "What do you want to learn next?", "Anything - in CogniPace or outside it."],
  ["enjoys", "What do you enjoy here?", "The parts that feel smooth or fun."],
  ["finds_hard", "What feels hard or boring?", "Be honest - this helps Abid fix things."],
  ["wish_for_abid", "Anything you want to tell Abid?", "The tutor does not see this one - only Abid."],
];
const DRAFT = "voice:draft";
const fmt = (at) => { try { return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }); } catch { return ""; } };

export default function Voice() {
  const [vals, setValsRaw] = useState(() => { const d = store.get(DRAFT); return d && typeof d === "object" ? d : {}; });
  const setVal = (k, v) => setValsRaw((o) => { const n = { ...o, [k]: v.slice(0, MAX) }; store.set(DRAFT, n); return n; });
  const [data, setData] = useState(null);   // GET /api/voice
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);     // { ok, text }
  const load = () => api("/api/voice").then((r) => { if (!r.error) setData(r); else setData({ history: [], error: r.error }); });
  useEffect(() => { load(); }, []);

  const any = FIELDS.some(([k]) => (vals[k] || "").trim());
  const save = async () => {
    if (busy || !any) return;
    setBusy(true); setMsg(null);
    const body = Object.fromEntries(FIELDS.map(([k]) => [k, (vals[k] || "").trim()]));
    const r = await api("/api/voice", body);
    setBusy(false);
    if (r.error) { setMsg({ ok: false, text: r.offline ? "No internet right now. Your words are kept here - press Save again when the banner at the top goes away." : r.error }); return; }
    store.del(DRAFT); setValsRaw({});
    setMsg({ ok: true, text: "Saved. Thank you - Abid will read it. You can change it any time: just write again." });
    load();
  };
  const onKey = (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.repeat) { e.preventDefault(); save(); } };
  const history = Array.isArray(data?.history) ? data.history.filter(Boolean) : [];

  return (
    <>
      <div className="eyebrow" style={{ color: "var(--lime)" }}>your voice</div>
      <h1 style={{ marginTop: 4 }}>What do you want?</h1>
      <p style={{ fontSize: 18 }}>This is your school. Tell us what you want to become and what you want to learn. There are no wrong answers. Abid reads this, and you can change it any time.</p>
      <p className="small soft">Write as much or as little as you like - one box is enough. <kbd>Tab</kbd> goes to the next box. <kbd>Ctrl+Enter</kbd> saves.</p>
      <div className="card voiceform" style={{ marginTop: 12 }}>
        {FIELDS.map(([k, label, ph], i) => {
          const v = vals[k] || "";
          return (
            <div key={k} className="voicefield">
              <label htmlFor={`v-${k}`}><b>{label}</b></label>
              <textarea id={`v-${k}`} className="editor" style={{ fontFamily: "inherit", minHeight: 74 }} maxLength={MAX} value={v} placeholder={ph}
                autoFocus={i === 0} onChange={(e) => setVal(k, e.target.value)} onKeyDown={onKey} aria-describedby={`c-${k}`} />
              <div id={`c-${k}`} className="small mute" style={{ textAlign: "right", color: v.length >= MAX ? "var(--amber)" : undefined }}>{v.length} / {MAX}</div>
            </div>
          );
        })}
        {msg && <p className={msg.ok ? "small" : "notice small"} role="status" style={msg.ok ? { color: "var(--lime)" } : undefined}>{msg.text}</p>}
        <div style={{ marginTop: 6 }}><button className="btn primary" disabled={busy || !any} onClick={save}>{busy ? "Saving…" : "Save"} <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Ctrl+Enter</kbd></button></div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>What you said before</h2>
        {!data ? <p className="small soft">Loading…</p>
          : history.length === 0 ? <p className="small soft">Nothing yet. Your first answers will appear here, with the date.</p>
          : history.map((h, i) => (
            <div key={`${h.at}-${i}`} className="card" style={{ marginTop: 10, padding: "12px 16px" }}>
              <div className="eyebrow" style={{ color: "var(--ink-mute)" }}>{fmt(h.at)}</div>
              {FIELDS.filter(([k]) => h[k]).map(([k, label]) => <p key={k} className="small" style={{ margin: "6px 0 0", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}><b>{label}</b><br />{h[k]}</p>)}
            </div>
          ))}
      </section>
    </>
  );
}
