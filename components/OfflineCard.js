"use client";
/* The offline pack card on her home page (2 Nov 2026, lib/offline.js). Download the pack while the internet works;
   bring the saved work file back when it returns. Asks her to download again when the pack is over 3 days old. */
import { useEffect, useRef, useState } from "react";

export default function OfflineCard() {
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  const load = () => fetch("/api/offline", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => j && setInfo(j)).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!info || !info.steps) return null;
  const age = info.downloadedAt ? Math.floor((Date.now() - new Date(info.downloadedAt).getTime()) / 86400000) : null;
  const stale = age == null || age >= 3;

  async function bringBack(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^cognipace-work.*\.json$/i.test(f.name)) { setMsg("Choose the file that starts with cognipace-work (in your Downloads)."); return; }
    setBusy(true); setMsg("Reading your work...");
    try {
      const r = await fetch("/api/offline", { method: "POST", headers: { "Content-Type": "application/json" }, body: await f.text() });
      const j = await r.json().catch(() => ({}));
      setMsg(r.ok ? `Saved: ${j.steps} worksheet${j.steps === 1 ? "" : "s"} and ${j.days} offline day${j.days === 1 ? "" : "s"}. The tutor will look at your work when you reach each step.` : j.error || "That did not work. Try again.");
      if (r.ok) load();
    } catch { setMsg("No internet yet. Try again when it is back."); }
    setBusy(false);
  }

  return (
    <section className="card rise" style={{ marginTop: 14, borderColor: stale ? "rgba(251, 191, 36, 0.5)" : "var(--line)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div className="eyebrow" style={{ color: stale ? "var(--amber)" : "var(--ink-mute)" }}>for days without internet</div>
        <h3 style={{ margin: "2px 0" }}>Your offline pack</h3>
        <p className="small soft" style={{ margin: 0 }}>Worksheets for your next {info.steps} steps in one file. If the internet goes off, open it from your Downloads folder and keep working - your streak counts. {age == null ? "Download it once now." : stale ? `Your pack is ${age} days old - download a new one.` : "Your pack is up to date."}</p>
        {msg && <p className="small" style={{ margin: "6px 0 0" }} role="status">{msg}</p>}
      </div>
      <a className={stale ? "btn primary" : "btn"} href="/api/offline?pack=1" onClick={() => setTimeout(load, 3000)}>Download offline pack</a>
      <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>Bring back my offline work</button>
      <input ref={file} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={bringBack} />
    </section>
  );
}
