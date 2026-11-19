"use client";
/* The map card for her winter school agreement (3 Nov 2026): shown until she has signed this version. */
import { useEffect, useState } from "react";

export default function AgreeCard() {
  const [due, setDue] = useState(false);
  useEffect(() => {
    let on = true;
    fetch("/api/agree", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j && !j.signed) setDue(true); }).catch(() => {});
    return () => { on = false; };
  }, []);
  if (!due) return null;
  return (
    <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(34, 211, 238, 0.5)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: "var(--cyan)" }}>from 4 December</div><h3 style={{ margin: "2px 0" }}>Your winter school - read the rules and sign them</h3><p className="small soft" style={{ margin: 0 }}>The rules for winter school, what Abid promises you, and your own words. Five minutes.</p></div>
      <a className="btn primary" href="/agree">Read and sign</a>
    </section>
  );
}
