"use client";
/* Her winter school agreement (3 Nov 2026, lib/agreement.js): the rules, Abid's promises, and her own words. */
import { TZ } from "../lib/time";
import { useEffect, useState } from "react";
import { api, store } from "./tutorStream";
import { Confetti } from "./SchoolDay";

const DRAFT = "agree:draft";

export default function Agreement({ title, rules, promises, minWords }) {
  const [data, setData] = useState(null);
  const [text, setTextRaw] = useState(() => store.get(DRAFT) || "");
  const setText = (v) => { setTextRaw(v); store.set(DRAFT, v); };
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/api/agree").then((r) => setData(r && !r.error ? r : { signed: false })); }, []);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sign = async () => {
    if (busy || words < minWords) return;
    setBusy(true);
    const r = await api("/api/agree", { words: text });
    setBusy(false);
    if (r.error) { setMsg(r.offline ? "No internet right now. Your words are kept - press Sign again later." : r.error); return; }
    store.del(DRAFT); setData({ signed: true, at: r.at, words: text, fresh: true });
  };
  return (
    <>
      {data?.fresh && <Confetti pieces={120} seconds={3.5} />}
      <div className="eyebrow" style={{ color: "var(--cyan)" }}>from 4 December</div>
      <h2 style={{ marginTop: 4 }}>{title}</h2>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">what I do</div>
        <ol className="dayplan">{rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">what Abid promises</div>
        <ul className="dayplan">{promises.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </div>
      {data?.signed ? (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(163,230,53,.6)" }}>
          <div className="eyebrow" style={{ color: "var(--lime)" }}>signed{data.at ? ` · ${new Date(data.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ })}` : ""}</div>
          <p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{data.words}</p>
          <p className="small soft" style={{ marginTop: 8 }}>If you want to change something, tell Abid on your voice page or on a call.</p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 12 }}>
          <p><strong>In your own words:</strong> which rules do you agree to, and why? If one rule feels wrong, say which one and what you would change - Abid reads this.</p>
          <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 110 }} value={text} onChange={(e) => setText(e.target.value.slice(0, 1500))} placeholder="I agree to ... because ..." onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sign(); }} />
          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn primary" disabled={busy || words < minWords} onClick={sign}>Sign it (Ctrl+Enter)</button>
            <span className="small soft">{words < minWords ? `${minWords - words} more words` : "Ready"}</span>
          </div>
          {msg && <p className="hint">{msg}</p>}
        </div>
      )}
    </>
  );
}
