"use client";
/* The daily Wonder banner (Abid, 5 Oct 2026: "make sure she reads it - pop up at the top every day when she logs in").
   Sits under the top bar on every student page until today's wonder is in her logbook; then it goes away for the day.
   29 Oct 2026 (review, strategy): it is now dismissable for the day - a small × remembered in this browser for today
   (Dhaka date). The Wonder stays on the map and in the nav (Alt+Shift+6); only the banner goes. */
import { useEffect, useState } from "react";
import { localYmd } from "../lib/time";

const dhakaDay = () => localYmd();
const readDismissed = (k) => { try { return localStorage.getItem(`banner_hidden:${k}`) === dhakaDay(); } catch { return false; } };
const writeDismissed = (k) => { try { localStorage.setItem(`banner_hidden:${k}`, dhakaDay()); } catch {} };

export default function WonderBanner({ active }) {
  const [w, setW] = useState(null);
  const [arena, setArena] = useState(null);
  const [hidden, setHidden] = useState({ wonder: true, arena: true }); // hidden until we know (no flash after dismissing)
  useEffect(() => {
    let on = true;
    setHidden({ wonder: readDismissed("wonder"), arena: readDismissed("arena") });
    fetch("/api/wonder", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (on && j && j.title) setW(j); }).catch(() => {});
    fetch("/api/arena", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (on && j && j.arenaDay && !(j.today && j.today.done)) setArena(j); }).catch(() => {});
    return () => { on = false; };
  }, []);
  const hide = (k) => { writeDismissed(k); setHidden((h) => ({ ...h, [k]: true })); };
  const close = (k, what) => (
    <button className="bannerx" aria-label={`Hide the ${what} banner for today`} title={`Hide for today (the ${what} stays on the map)`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); hide(k); }}>×</button>
  );
  // The Wonder comes first; once it is read (or hidden), a game day shows the Arena nudge instead (6 Oct 2026).
  if (w && !w.readToday && active !== "/wonder" && !hidden.wonder) return (
    <div className="bannerrow">
      <a href="/wonder" className="wonderbar rise">
        <span className="spark" aria-hidden="true">✦</span>
        <span className="txt"><b>Did you know…!!!</b> {w.title} <span className="more">Read more, only 10 minutes →</span></span>
      </a>
      {close("wonder", "Wonder")}
    </div>
  );
  if (arena && active !== "/arena" && !hidden.arena) return (
    <div className="bannerrow">
      <a href="/arena" className="wonderbar rise arenabar">
        <span className="spark" aria-hidden="true">▶</span>
        <span className="txt"><b>Game day!</b> The Arena is open: six fast rounds, ten minutes, keyboard only.{arena.best > 0 ? ` Your best: ${arena.best}.` : " Your first time - no score to beat yet."} <span className="more">Play →</span></span>
      </a>
      {close("arena", "Arena")}
    </div>
  );
  return null;
}
