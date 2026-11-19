"use client";
/* Offline banner and auto-resend (22 Oct 2026, audit backlog "App: offline banner + auto-resend").
   Her house line drops now and then (the old router, Oct 2026; load-shedding). Before this, a dropped connection turned
   her message into an error in the chat and she had to type it again. Now: any request that cannot reach the server
   marks the School offline; a banner on every page says so plainly and that nothing is lost; the room keeps her
   message and sends it by itself when the internet is back. Probing uses /api/ping, which never touches the database
   (the Neon compute budget is the scarce thing - /api/live would wake it every few seconds). */
import { useEffect, useState } from "react";

const EVT = "school:net";
let offline = false;

function setOffline(v) {
  if (offline === v) return;
  offline = v;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
}

/** Call when a request to the School failed because nothing came back (fetch threw). */
export function markOffline() { setOffline(true); probeLoop(); }
/** Call when a request to the School got an answer. */
export function markOnline() { setOffline(false); }

let probing = false;
async function probeOnce() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try { const r = await fetch("/api/ping", { cache: "no-store" }); return r.ok; } catch { return false; }
}
/** While offline, check every 8 seconds (and at once when the browser says the network is back). */
function probeLoop() {
  if (probing || typeof window === "undefined") return;
  probing = true;
  const tick = async () => {
    if (!offline) { probing = false; return; }
    if (await probeOnce()) { probing = false; setOffline(false); return; }
    setTimeout(tick, 8000);
  };
  setTimeout(tick, 3000);
}

/** Resolves when the School can be reached again. Pass an AbortSignal to stop waiting (e.g. the room closed). */
export function waitForInternet(signal) {
  return new Promise((resolve) => {
    if (!offline && (typeof navigator === "undefined" || navigator.onLine !== false)) { resolve(true); return; }
    const onOnline = () => { markOffline(); }; // the browser's "online" can be wrong; let the probe decide
    let done = null;
    const cleanup = (ok) => {
      window.removeEventListener(EVT, done); window.removeEventListener("online", onOnline);
      if (ok) resolve(true);
    };
    done = (e) => { if (e?.detail === false) cleanup(true); };
    window.addEventListener(EVT, done); window.addEventListener("online", onOnline);
    signal?.addEventListener("abort", () => cleanup(false));
    markOffline();
  });
}

/** True while the School cannot be reached (browser offline, or the last request got nothing back). */
export function useOffline() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const sync = () => setOff(offline || navigator.onLine === false);
    const onEvt = () => sync();
    const onOff = () => { markOffline(); sync(); };
    const onOn = () => { if (offline) probeLoop(); sync(); };
    sync();
    window.addEventListener(EVT, onEvt); window.addEventListener("offline", onOff); window.addEventListener("online", onOn);
    return () => { window.removeEventListener(EVT, onEvt); window.removeEventListener("offline", onOff); window.removeEventListener("online", onOn); };
  }, []);
  return off;
}

/** The banner under the top bar. Plain words, not her fault, nothing lost. */
export default function OfflineBanner() {
  const off = useOffline();
  if (!off) return null;
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <b>No internet right now.</b> Nothing is lost. Keep CogniPace open - anything you sent will go by itself when the internet comes back. If it stays off, open your offline pack from your Downloads folder (cognipace-offline) and keep working there.
    </div>
  );
}
