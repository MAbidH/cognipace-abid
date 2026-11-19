/* The tutor's private markers (29 Oct 2026, review 02/05): she must never see [STEP DONE], [PARKED: ...] and the rest,
   not even for the half-second while a reply streams in. The server records them (app/api/tutor afterChat), then strips
   them from the text it sends - from every streamed delta too. Pure; tested in scripts/test-server.mjs. */

export const MARKER_NAMES = ["STEP DONE", "FLAG CAPTURED", "FLAG", "CURIOUS", "PARKED", "RESOLVED", "LOGBOOK", "SHORTCUT", "PART DONE"];

// A complete marker: [NAME] or [NAME: ...] (no nested brackets, at most 500 characters inside).
const CORE = `\\[(?:${MARKER_NAMES.map((n) => n.replace(/ /g, "\\s")).join("|")})(?:\\s*:[^\\]\\n]{0,500})?\\]`;
const FULL = new RegExp(`[ \\t]*${CORE}[ \\t]*`, "g");
const ONE = new RegExp(`^${CORE}$`);

/** Remove every complete marker from a finished text, tidy the blank lines it leaves. */
export function stripMarkers(text) {
  return String(text || "").replace(FULL, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Could `s` (starting with "[") still grow into a marker? */
function couldBeMarker(s) {
  if (s.length > 520 || s.includes("\n") && !/^\[[A-Z ]+:/.test(s)) return false;
  const body = s.slice(1);
  return MARKER_NAMES.some((n) => n.startsWith(body) || (body.startsWith(n) && /^(\s*:[^\]]*)?$/.test(body.slice(n.length))));
}

/** Streaming filter: push(delta) returns the text that is safe to show now; a possible marker is held back until it
    either completes (and is dropped) or turns out to be ordinary text (and is released). end() flushes the rest. */
export function markerStream() {
  let buf = "";
  const take = (final) => {
    let out = "";
    for (;;) {
      const i = buf.indexOf("[");
      if (i < 0) { out += buf; buf = ""; break; }
      out += buf.slice(0, i); buf = buf.slice(i);
      const close = buf.indexOf("]");
      if (close >= 0) {
        const cand = buf.slice(0, close + 1);
        if (ONE.test(cand)) { buf = buf.slice(close + 1); continue; }   // a whole marker: dropped
        out += "["; buf = buf.slice(1); continue;          // ordinary bracket text
      }
      if (!final && couldBeMarker(buf)) break;              // wait for more
      out += "["; buf = buf.slice(1);
    }
    return out;
  };
  return { push: (d) => { buf += String(d || ""); return take(false); }, end: () => take(true) };
}
