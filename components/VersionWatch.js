"use client";
// A page left open across a deploy must not keep running the old school (30 Oct 2026: her Firefox tab still said
// "THE SCHOOL", showed streak 22 and walked her into the OLD step W1 after she had finished A2C on the new version).
// Vercel keeps an open tab on the deployment it loaded (skew protection, a cookie), so every request from that tab -
// the tutor included - is answered by the old code. This asks /api/ping WITHOUT cookies (= the live deployment) every
// two minutes and when she comes back to the tab; if the live commit is not the one this page was built from, the
// page reloads by itself when that is safe (the tab is hidden, or she has typed nothing for 20 s and every box she
// types into is empty) and otherwise shows a one-line banner with a button. Nothing is lost on a reload: the chat,
// her place, teach-back drafts and checkpoint answers all come back from the server or the browser's storage.
import { useEffect, useRef, useState } from "react";

const BUILT = process.env.NEXT_PUBLIC_BUILD_COMMIT || "";

// Never a reload loop: at most two automatic reloads in ten minutes, then only the banner and its button.
function reloadAllowed() {
  try {
    const now = Date.now();
    const log = JSON.parse(sessionStorage.getItem("cp-auto-reload") || "[]").filter((t) => now - t < 600000);
    if (log.length >= 2) return false;
    sessionStorage.setItem("cp-auto-reload", JSON.stringify([...log, now]));
    return true;
  } catch { return false; }
}

function safeToReload(lastKey) {
  if (typeof document === "undefined") return false;
  if (document.visibilityState === "hidden") return true;
  if (Date.now() - lastKey < 20000) return false;
  if (document.querySelector(".turn.live")) return false; // the tutor is mid-reply: wait until it lands
  // Any box with her words in it (chat, teach-back, voice page) waits for her. The Python editor always has code in it,
  // so it is left out - a reload brings the step's code back, and she sees the banner first while she is typing.
  const boxes = [...document.querySelectorAll("textarea, input[type=text]")].filter((el) => !el.hasAttribute("data-editor"));
  return boxes.every((el) => !String(el.value || "").trim());
}

export default function VersionWatch() {
  const [stale, setStale] = useState(false);
  const lastKey = useRef(0);
  useEffect(() => {
    if (!BUILT) return undefined; // local dev / a build without a commit: nothing to compare
    let stop = false;
    const onKey = () => { lastKey.current = Date.now(); };
    const check = async () => {
      try {
        const r = await fetch(`/api/ping?v=${Date.now()}`, { cache: "no-store", credentials: "omit" });
        const j = await r.json();
        if (stop || !j?.commit || j.commit === BUILT.slice(0, 12)) return;
        setStale(true);
        if (safeToReload(lastKey.current) && reloadAllowed()) window.location.reload();
      } catch { /* offline: the offline banner handles that */ }
    };
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(check, 120000);
    const first = setTimeout(check, 5000);
    return () => { stop = true; clearInterval(t); clearTimeout(first); window.removeEventListener("keydown", onKey, true); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  useEffect(() => {
    if (!stale) return undefined;
    const t = setInterval(() => { if (safeToReload(lastKey.current) && reloadAllowed()) window.location.reload(); }, 15000);
    return () => clearInterval(t);
  }, [stale]);
  if (!stale) return null;
  return (
    <div className="notice" role="status" style={{ margin: "6px 0" }}>
      CogniPace was just updated. Press <kbd>F5</kbd> when you finish this message - nothing is lost.{" "}
      <button type="button" className="ghost" onClick={() => window.location.reload()}>Update now</button>
    </div>
  );
}
