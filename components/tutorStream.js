"use client";
/* Shared by the room (Learn), the Wonder room and the Meet room (29 Oct 2026 review M1/M6): one way to call the school,
   one way to read a streamed tutor reply, one rule for hiding the tutor's private markers. Before this, the Wonder and
   Meet rooms had their own copies that hung on "thinking..." for ever when the line dropped mid-reply, and showed
   [FLAG] / [CURIOUS: ...] / [PARKED: ...] to her while a reply was still arriving. */
import { markOffline, markOnline } from "./Offline";

export const OFFLINE_MSG = "No internet right now. Nothing is lost - this will go by itself when the internet comes back.";

/** 26 Oct 2026: when the server dies before it can log (a timeout), the room reports it, so "Abid can see it happened" is true. */
export const reportFail = (page, what) => { try { fetch("/api/stuck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crash: true, page, what: String(what || "").slice(0, 300) }) }).catch(() => {}); } catch {} };

/** GET (no body) or POST JSON. Never throws. `offline: true` = nothing came back at all, so the caller may wait for the
 *  internet and send the same thing again. */
export const api = (url, body) =>
  fetch(url, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
    .then((r) => { markOnline(); return r.json().catch(() => ({ error: "Something went wrong on the school's side. Try again." })); },
      () => { markOffline(); return { error: OFFLINE_MSG, offline: true }; });

/* The tutor's private markers. The server strips them from the final text (app/api/tutor afterChat), but the stream
   carries the raw words, so the browser must hide them too - complete ones always, and a half-arrived one at the end
   of the text while it is still streaming ("[FL", "[PARKED: Proton sig"). [LOGBOOK: x] is shown as "Logbook: x", the
   same as the server's final text. [PART DONE] belongs to the Meet room. */
const PRIVATE = /\[(?:STEP DONE|PART DONE|FLAG CAPTURED[^\]\n]*|FLAG|SHORTCUT|CURIOUS[^\]\n]*|PARKED[^\]\n]*|RESOLVED[^\]\n]*)\]/g;
// An unfinished marker at the very end: "[" then capitals/spaces, optionally ":" and anything without a "]".
const TAIL = /\[[A-Z][A-Z ]*(?::[^\]\n]*)?$|\[$/;
export function cleanMarkers(t, streaming = false) {
  let s = String(t || "").replace(/\[LOGBOOK:\s*([^\]\n]*)\]/g, "Logbook: $1").replace(PRIVATE, "");
  if (streaming) s = s.replace(TAIL, "");
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

/** Streamed tutor call (NDJSON). onDelta gets the text so far (markers hidden) as it arrives; resolves to the final
 *  { text, done, selfStudy? } or { error } / { error, offline } / { text, limited }. Falls back to a plain JSON reply.
 *  A line that drops half-way never throws out of here: it returns { offline: true } so the caller can resend once. */
export async function streamTutor(body, onDelta) {
  let res;
  try {
    res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, stream: true }) });
  } catch { markOffline(); return { error: OFFLINE_MSG, offline: true }; }
  markOnline();
  const type = res.headers.get("content-type") || "";
  if (!type.includes("ndjson")) {
    try { const j = await res.json(); return j && j.text ? { ...j, text: cleanMarkers(j.text) } : j; } catch { return { error: "Something went wrong. Try again." }; }
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "", text = "", final = null;
  const handle = (line) => {
    if (!line.trim()) return;
    let o; try { o = JSON.parse(line); } catch { return; }
    if (o.t) { text += o.t; onDelta?.(cleanMarkers(text, true), text); }
    if (o.end) final = { ...o, text: cleanMarkers(o.text ?? text), done: !!o.done };
    if (o.error) final = { error: o.error, ...(o.selfStudy ? { selfStudy: o.selfStudy } : {}) };
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n"); buf = parts.pop();
      parts.forEach(handle);
    }
  } catch { if (!final) { markOffline(); return { error: OFFLINE_MSG, offline: true }; } }
  if (buf) handle(buf);
  // No end line: the reply stopped early. Show what arrived (an unfinished marker at its end stays hidden).
  return final || (text ? { text: cleanMarkers(text, true), done: false } : { error: "The tutor went quiet. Try again." });
}

/** localStorage that never throws (private window, blocked storage, thumbnail capture). */
export const store = {
  get(k, fallback = null) { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
