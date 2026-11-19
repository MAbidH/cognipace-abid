"use client";
import { TZ } from "../lib/time";
import { useEffect, useState } from "react";
/** A small live clock in Bangladesh time, so the school always shows her day, not the server's. */
export default function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }));
    tick(); const id = setInterval(tick, 15000); return () => clearInterval(id);
  }, []);
  return <span className="pill mono" title="Bangladesh time" suppressHydrationWarning>{t || "…"} <span className="mute">BD</span></span>;
}
