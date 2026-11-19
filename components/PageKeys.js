"use client";
/* Page keys (29 Oct 2026, review M4). The top bar used accessKey="1".."7" and labelled it "Alt+1". In Firefox on Linux
   (her Mint laptop since 22 Oct) Alt+1..9 AND Ctrl+1..9 switch browser tabs, and an accessKey needs Alt+Shift - so the
   labels lied. Ctrl+Alt+arrows/digits belong to Mint's workspaces. The page keys are now Alt+Shift+digit, handled here
   by one keydown listener (e.code, so Shift+1 = "!" does not matter); no accessKey attributes are left.
   Also measures the real height of the sticky top bar into the CSS variable --topbar-h, so sticky panels in the room
   start under it (at 1093 px the bar wraps to two lines: 99 px, not the 64 px the CSS assumed). */
import { useEffect } from "react";
import { PAGE_KEYS } from "./keymap";

export default function PageKeys() {
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || "");
      if (!m) return;
      const hit = PAGE_KEYS.find(([n]) => n === m[1]);
      if (!hit) return;
      e.preventDefault();
      if (location.pathname !== hit[1]) location.href = hit[1];
    };
    document.addEventListener("keydown", onKey);
    const bar = document.querySelector(".topbar");
    let ro = null;
    const set = () => { if (bar) document.documentElement.style.setProperty("--topbar-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`); };
    set();
    if (bar && typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(set); ro.observe(bar); }
    return () => { document.removeEventListener("keydown", onKey); ro?.disconnect(); };
  }, []);
  return null;
}
