"use client";
/* The Saturday puzzle set (25 Nov 2026, MATHS-PLAN item 6): four problems, one sentence of reasoning each. Scored,
   never a gate. She sees every answer with the explanation after she checks, and the tutor's one line about each
   reason. About 20-25 minutes; the clock is shown, never enforced. */
import { useEffect, useState } from "react";

const KIND = { logic: "Follow the rule", pattern: "Find the pattern", claims: "Which claim is right?", estimate: "About how much?" };

export default function PuzzleCard() {
  const [st, setSt] = useState(null);
  const [ans, setAns] = useState([]);
  const [why, setWhy] = useState([]);
  const [t0, setT0] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let on = true;
    fetch("/api/puzzles", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j && !j.error) { setSt(j); setAns((j.items || []).map(() => "")); setWhy((j.items || []).map(() => "")); } }).catch(() => {});
    return () => { on = false; };
  }, []);
  useEffect(() => { if (!t0 || st?.done) return undefined; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [t0, st?.done]);
  if (!st || !st.show) return null;
  const items = st.items || [];
  const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const ready = items.length > 0 && items.every((_, i) => String(ans[i] || "").trim() && String(why[i] || "").trim().split(/\s+/).length >= 3);
  const submit = async () => {
    if (busy || !ready) return;
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "puzzles", answers: ans, reasons: why }) });
      const j = await r.json().catch(() => null);
      if (!j || j.error) setErr(j?.error || "No answer from the school. Try again in a minute.");
      else if (j.limited) setErr(j.text || "Not now.");
      else setSt((s) => ({ ...s, done: true, score: j.score, total: j.total, results: j.results }));
    } catch { setErr("No internet right now. Press Check again when it is back."); }
    setBusy(false);
  };

  if (st.done) {
    const res = st.results || [];
    return (
      <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(167, 139, 250, 0.4)" }}>
        <div className="eyebrow" style={{ color: "var(--violet)" }}>saturday puzzles · done</div>
        <h3 style={{ margin: "2px 0" }}>{st.score} of {st.total} today{res.filter((r) => r.reason_ok).length ? ` - and ${res.filter((r) => r.reason_ok).length} clear reason${res.filter((r) => r.reason_ok).length === 1 ? "" : "s"}` : ""}</h3>
        <ol className="small" style={{ margin: "6px 0 0", paddingLeft: 20 }}>
          {res.map((r, i) => (
            <li key={r.id} style={{ marginBottom: 6 }}>
              <b>{KIND[items[i]?.kind] || "Puzzle"}:</b> {items[i]?.q}<br />
              You: <b>{r.given || "-"}</b> {r.right ? <span style={{ color: "var(--lime)" }}>✓</span> : <>- the answer is <b>{r.correct}</b></>}. <span className="soft">{r.explain}</span>
              {r.note ? <><br /><span style={{ color: "var(--violet)" }}>Your reason:</span> <span className="soft">{r.note}</span></> : null}
            </li>
          ))}
        </ol>
      </section>
    );
  }
  return (
    <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(167, 139, 250, 0.4)" }}>
      <div className="eyebrow" style={{ color: "var(--violet)" }}>saturday puzzles · about 20 minutes · level {st.level}</div>
      <h3 style={{ margin: "2px 0" }}>Four puzzles - the answer AND one sentence that says why</h3>
      <p className="small soft" style={{ margin: "4px 0 8px" }}>Do them after your review. Think first, paper is allowed, no rush: the reason you write counts as much as the answer. Getting one wrong is normal - that is where the learning is.</p>
      {!open && <button className="btn primary" onClick={() => { setOpen(true); setT0(Date.now()); }}>Open today's puzzles</button>}
      {open && (
        <>
          <ol style={{ paddingLeft: 20, margin: "6px 0" }}>
            {items.map((it, i) => (
              <li key={it.id} style={{ marginBottom: 12 }}>
                <div className="small" style={{ color: "var(--violet)" }}>{KIND[it.kind] || "Puzzle"}</div>
                <div style={{ margin: "2px 0 6px" }}>{it.q}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="big-input mono" style={{ fontSize: 16, width: 180 }} placeholder="your answer" autoComplete="off" value={ans[i] || ""} onChange={(e) => setAns((a) => a.map((x, j) => (j === i ? e.target.value.slice(0, 60) : x)))} />
                  <input className="big-input" style={{ fontSize: 15, flex: 1, minWidth: 240 }} placeholder="because... (one sentence - why is that the answer?)" value={why[i] || ""} onChange={(e) => setWhy((a) => a.map((x, j) => (j === i ? e.target.value.slice(0, 400) : x)))} />
                </div>
              </li>
            ))}
          </ol>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn primary" disabled={busy || !ready} onClick={submit}>{busy ? "Checking..." : "Check my answers"}</button>
            <span className="mono small">{fmt(now - t0)}</span>
            {!ready && <span className="small soft">An answer and a reason (at least a few words) for each one.</span>}
          </div>
        </>
      )}
      {err && <p className="hint" style={{ marginTop: 8 }}>{err}</p>}
    </section>
  );
}
