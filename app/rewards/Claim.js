"use client";
import { useState } from "react";

export default function Claim({ id }) {
  const [state, setState] = useState("idle");
  const go = async () => {
    setState("busy");
    const r = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim: id }) }).then((x) => x.json()).catch(() => ({ error: "offline" }));
    setState(r.error ? "idle" : "done");
  };
  if (state === "done") return <span className="small">Claimed ✓ - Abid has been told.</span>;
  return <button className="btn primary" disabled={state === "busy"} onClick={go}>Claim this reward</button>;
}
