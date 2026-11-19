"use client";
/* "Something is broken" (Abid, 8 Oct 2026): one button on every page. When the machine, not she, is the problem, she says so
   in one line and carries on. It lands on the guardian page in red and in the tutor's notes. The reply always tells her
   it is not her fault. */
import { useState } from "react";
import { markOffline, waitForInternet } from "./Offline";

export default function Broken({ page }) {
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState("");
  const [sent, setSent] = useState(false); // false | "ok" | "later"
  const send = async () => {
    const body = JSON.stringify({ page, what });
    const post = () => fetch("/api/stuck", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    // Offline (22 Oct 2026): the report used to vanish when the line was down - exactly when things look broken. It now
    // waits and goes by itself when the internet is back (as long as the page stays open).
    // 29 Oct 2026 (review L9): it said "Recorded... Abid can see it" even when nothing had reached the school yet.
    let ok = false;
    try { const r = await post(); ok = r.ok; } catch { markOffline(); }
    if (!ok) waitForInternet().then(() => post().catch(() => {}));
    setSent(ok ? "ok" : "later"); setTimeout(() => { setOpen(false); setSent(false); setWhat(""); }, 6000);
  };
  if (!open) return <button className="broken" onClick={() => setOpen(true)} title="Something on the screen is not working? Press this.">something is broken?</button>;
  return (
    <div className="broken-box">
      {sent ? <div className="small" style={{ color: sent === "ok" ? "var(--lime)" : "var(--amber)" }}>{sent === "ok" ? "Recorded. This is not your fault. Abid can see it, and the tutor knows." : "Kept. It could not reach the school yet - it goes by itself when the internet is back (keep this page open). This is not your fault."} Carry on with what you can, or close the laptop for today - either is fine.</div>
        : <>
          <div className="small"><b>Tell me in one line what happened</b> (what you pressed, what the screen said). You can also just press Send.</div>
          <textarea className="editor" style={{ fontFamily: "inherit", minHeight: 56, marginTop: 6 }} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g. the line says == but I typed = and it is red" autoFocus />
          <div style={{ marginTop: 6, display: "flex", gap: 8 }}><button className="btn primary" onClick={send}>Send</button><button className="btn quiet" onClick={() => setOpen(false)}>Never mind</button></div>
        </>}
    </div>
  );
}
