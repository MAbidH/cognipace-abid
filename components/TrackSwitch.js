"use client";
/* The "Work on this" button on Abid's home page (28 Nov 2026): POST /api/track, then reload. */
import { useState } from "react";

export default function TrackSwitch({ id, label = "Work on this" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ module_id: id }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) throw new Error(j.error || "could not switch");
      window.location.reload();
    } catch (e) { setErr(String(e.message || e)); setBusy(false); }
  };
  return (
    <span>
      <button className="btn quiet" disabled={busy} onClick={go}>{busy ? "Switching..." : label}</button>
      {err && <span className="small" style={{ color: "var(--amber)", marginLeft: 8 }}>{err}</span>}
    </span>
  );
}
