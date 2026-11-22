"use client";
/* The page that replaces Next.js's "Application error: a server-side exception has occurred" (8 Oct 2026 - Faiza saw that
   one, white screen, English she could not act on, and the guardian page said "nothing broke" because a crash while the
   server builds a page never reached the errors table). This boundary catches it, says plainly that it is not her fault,
   offers one key to try again, and records the crash (digest + page) through /api/stuck so it shows on the guardian page.
   29 Oct 2026 (review H1): "Try again" called reset(), which in Next 15 re-renders the server payload it already has -
   for the exact crash this page exists for (the database waking up too slowly) it showed the same error again and
   again, and only F5 helped. Try again (button or Enter) is now a real reload of the page. */
import { useEffect, useRef } from "react";

// A full reload always fetches the page fresh from the server - the one thing that fixes a slow-waking database.
const tryAgain = () => { try { location.reload(); } catch { location.href = location.pathname; } };

export default function Error({ error }) {
  const going = useRef(false);
  const retry = () => { if (going.current) return; going.current = true; tryAgain(); };
  useEffect(() => {
    const page = typeof location !== "undefined" ? location.pathname : "?";
    const what = `page crashed while loading${error?.digest ? ` (digest ${error.digest})` : ""}: ${String(error?.message || "").slice(0, 200)}`;
    // 22 Nov 2026: a tab left open across a deploy asks for a chunk that no longer exists ("Loading chunk 281 failed",
    // /portfolio, 20 Nov). One automatic fresh load fixes it; the guard stops a reload loop if it fails again.
    const stale = /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module/i.test(`${error?.name || ""} ${error?.message || ""}`);
    try { if (stale && Date.now() - Number(sessionStorage.getItem("chunkReload") || 0) > 60000) { sessionStorage.setItem("chunkReload", String(Date.now())); tryAgain(); return; } } catch {}
    try { fetch("/api/stuck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crash: true, page, what }) }).catch(() => {}); } catch {}
    const onKey = (e) => { if (e.key === "Enter" && !e.repeat) { e.preventDefault(); retry(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [error]);  
  return (
    <main className="wrap" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ maxWidth: 560, margin: "0 auto", padding: 28 }}>
        <div className="eyebrow">COGNIPACE · A HICCUP</div>
        <h2 style={{ marginTop: 6 }}>The school's shelf hiccuped</h2>
        <p className="soft">Something on <b>our</b> side did not answer in time. This is not your fault, and nothing you did is lost - your work is saved on the server.</p>
        <p className="soft">Press <kbd>Enter</kbd> or the button to try again. If it happens three times in a row, close the laptop for a few minutes and tell Abid - it is already recorded for him.</p>
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn primary" autoFocus onClick={retry}>Try again <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Enter</kbd></button>
          <a className="btn quiet" href="/">Back to the map</a>
        </div>
        {error?.digest ? <p className="small soft" style={{ marginTop: 14 }}>code {error.digest}</p> : null}
      </div>
    </main>
  );
}
