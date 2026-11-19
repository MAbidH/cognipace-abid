"use client";
/* The map card for her voice (29 Oct 2026): shown only when GET /api/voice says it is time (never answered, or 30+ days). */
import { useEffect, useState } from "react";
import { keyLabel } from "./keymap";

export default function VoiceCard() {
  const [due, setDue] = useState(false);
  useEffect(() => {
    let on = true;
    fetch("/api/voice", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j && j.due) setDue(true); }).catch(() => {});
    return () => { on = false; };
  }, []);
  if (!due) return null;
  return (
    <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(163, 230, 53, 0.5)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: "var(--lime)" }}>your voice</div><h3 style={{ margin: "2px 0" }}>Tell us what you want - 5 minutes</h3><p className="small soft" style={{ margin: 0 }}>What you want to become, what you want to learn next, what is fun and what is hard. Abid reads it.</p></div>
      <a className="btn primary" href="/voice">Open <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>{keyLabel(8)}</kbd></a>
    </section>
  );
}
