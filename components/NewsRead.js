"use client";
/* "I read this" for one cyber news story (3 Nov 2026). */
import { useState } from "react";
import { api } from "./tutorStream";

export default function NewsRead({ id, read }) {
  const [done, setDone] = useState(read);
  const [busy, setBusy] = useState(false);
  if (done) return <span className="small" style={{ color: "var(--lime)" }}>✓ Read · +5 XP</span>;
  return <button className="btn quiet" disabled={busy} onClick={async () => { setBusy(true); const r = await api("/api/news", { id }); setBusy(false); if (!r.error) setDone(true); }}>I read this and watched the video</button>;
}
