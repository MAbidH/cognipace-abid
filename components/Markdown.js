"use client";
import { useState } from "react";
/* A small, safe Markdown renderer for tutor turns. No dependency, no raw HTML: everything becomes React elements,
   except drawings, which the tutor writes as ```svg fenced blocks and we render only after a whitelist sanitiser.
   Supports: paragraphs, **bold**, `code`, # headings, - lists, 1. lists, > quotes, fenced code, ```svg drawings.
   Keys written as `Ctrl+Enter`, `Enter`, `Win`, `Alt+Tab`... render as keycaps. */

const KEY_NAMES = "Ctrl|Control|Alt|Shift|Win|Windows|Cmd|Fn|Tab|Enter|Return|Esc|Escape|Space|Spacebar|Backspace|Delete|Del|Insert|Home|End|PageUp|PageDown|PrtSc|Super|Up|Down|Left|Right|F\d{1,2}|[↑↓←→]";
const KEY_RE = new RegExp(`^(${KEY_NAMES})(\\s*\\+\\s*(${KEY_NAMES}|[A-Za-z0-9\\/.,;'\\[\\]\\\\=\`-]))*$`, "i");

const SVG_TAGS = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "lineargradient", "radialgradient", "stop", "marker", "pattern", "clippath", "title", "desc", "use", "symbol"]);

/** Whitelist sanitiser: unknown elements are dropped with their children; event handlers, scripts, external links and
 *  CSS url() are removed. The result is a string of safe SVG. Returns null if nothing usable is left. */
export function sanitizeSvg(src) {
  if (typeof window === "undefined" || !window.DOMParser) return null;
  let doc;
  try { doc = new DOMParser().parseFromString(String(src).slice(0, 60000), "image/svg+xml"); } catch { return null; }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return null;
  const walk = (el) => {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 1) {
        if (!SVG_TAGS.has(child.nodeName.toLowerCase())) { child.remove(); continue; }
        for (const a of Array.from(child.attributes)) {
          const n = a.name.toLowerCase(), v = String(a.value);
          if (n.startsWith("on") || ((n === "href" || n === "xlink:href") && !v.trim().startsWith("#")) || (n === "style" && /url\s*\(|expression|@import/i.test(v))) child.removeAttribute(a.name);
        }
        walk(child);
      } else if (child.nodeType !== 3) child.remove(); // comments, processing instructions
    }
  };
  for (const a of Array.from(root.attributes)) { const n = a.name.toLowerCase(); if (n.startsWith("on") || n === "width" || n === "height") root.removeAttribute(a.name); }
  if (!root.getAttribute("viewBox")) root.setAttribute("viewBox", "0 0 400 220");
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  root.setAttribute("role", "img");
  walk(root);
  if (!root.children.length) return null;
  try { return new XMLSerializer().serializeToString(root); } catch { return null; }
}

function Drawing({ src, open }) {
  if (open) return <div className="drawing"><div className="cap">drawing…</div></div>;
  let safe = sanitizeSvg(src);
  let partial = false;
  if (!safe) {
    // The drawing was cut off mid-way (5 Oct 2026: she saw raw <text ...> code twice). Keep every complete element
    // up to the last closing bracket, close the picture, and show what there is - never the recipe.
    if (/<svg[\s>]/i.test(src)) {
      const cut = src.lastIndexOf(">");
      if (cut > 0) {
        const head = src.slice(0, cut + 1);
        // Close whatever is still open, innermost first.
        const stack = [];
        for (const m of head.matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^<>]*?(\/?)>/g)) {
          if (m[1]) { const at = stack.lastIndexOf(m[2]); if (at >= 0) stack.length = at; }
          else if (!m[3]) stack.push(m[2]);
        }
        safe = sanitizeSvg(head + stack.reverse().map((t) => `</${t}>`).join(""));
        partial = !!safe;
      }
    }
  }
  if (!safe) return <div className="drawing"><div className="cap" style={{ color: "var(--amber)" }}>The drawing broke on the way here. Press <kbd>Ctrl+D</kbd> and the tutor will draw a smaller one.</div></div>;
  return <div className="drawing"><div dangerouslySetInnerHTML={{ __html: safe }} /><div className="cap">{partial ? "part of a drawing - the rest got cut off; press Ctrl+D for a smaller one" : "drawn for you by the tutor"}</div></div>;
}

/** Inline: **bold**, `code` (keys become keycaps), *italic*.
 *  29 Oct 2026 (review L6): "3*4*5" used to render as 345 with the 4 in italics, and "2**3 and 4**2" turned bold. An
 *  emphasis star now needs a non-word character (or the start) before it and after its closing star, so maths and Python
 *  written outside backticks stays as typed. (No lookbehind: older iPad Safari cannot parse it.) */
function inline(text, keyBase) {
  const out = [];
  const re = /(`[^`]+`)|(^|[^\w*])(\*\*[^*\s](?:[^*]*[^*\s])?\*\*|\*[^*\s](?:[^*]*[^*\s])?\*)(?![\w*])/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    const pre = m[1] ? "" : m[2] || "";
    const t = m[1] || m[3];
    const at = m.index + pre.length;
    if (at > last) out.push(text.slice(last, at));
    if (t.startsWith("**")) out.push(<strong key={`${keyBase}-${i++}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) { const c = t.slice(1, -1); out.push(KEY_RE.test(c) && c.length <= 24 ? <kbd key={`${keyBase}-${i++}`}>{c}</kbd> : <code key={`${keyBase}-${i++}`}>{c}</code>); }
    else out.push(<em key={`${keyBase}-${i++}`}>{t.slice(1, -1)}</em>);
    last = at + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, live }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const L = lines[i];
    const fence = L.match(/^\s*```\s*([\w-]*)\s*$/);
    if (fence) {
      const lang = (fence[1] || "").toLowerCase();
      const buf = [];
      i++;
      let closed = false;
      while (i < lines.length) { if (/^\s*```\s*$/.test(lines[i])) { closed = true; i++; break; } buf.push(lines[i]); i++; }
      const src = buf.join("\n");
      if (lang === "svg" || /^\s*<svg[\s>]/i.test(src)) blocks.push(<Drawing key={k++} src={src} open={!closed && live} />);
      else blocks.push(<div key={k++} className="codeblock">{lang && <div className="lang">{lang}</div>}<pre><code>{src}</code></pre>{closed && <CopyBtn src={src} />}</div>);
      continue;
    }
    if (/^\s*$/.test(L)) { i++; continue; }
    const h = L.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) { blocks.push(h[1].length <= 2 ? <h3 key={k++}>{inline(h[2], k)}</h3> : <h4 key={k++}>{inline(h[2], k)}</h4>); i++; continue; }
    if (/^\s*>/.test(L)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      blocks.push(<blockquote key={k++}>{inline(buf.join(" "), k)}</blockquote>);
      continue;
    }
    if (/^\s*[-*•]\s+/.test(L)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*•]\s+/, "")); i++; }
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(L)) {
      const items = [];
      // 8 Nov 2026: keep the tutor's own number. A manual has "→ you see" lines and code blocks between its steps, so each
      // step is its own little list; without start= every one showed "1." and "tell me the step number" meant nothing.
      const first = Number(L.match(/^\s*(\d+)/)[1]) || 1;
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++; }
      blocks.push(<ol key={k++} start={first}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ol>);
      continue;
    }
    // paragraph: consecutive non-empty, non-special lines; single line breaks are kept (the tutor uses them for layout)
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*(```|#{1,6}\s|>|[-*•]\s|\d+[.)]\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    blocks.push(<p key={k++}>{buf.map((t, j) => <span key={j}>{j > 0 && <br />}{inline(t, `${k}-${j}`)}</span>)}</p>);
  }
  return <div className="md">{blocks}{live && <span className="caret" aria-hidden="true" />}</div>;
}

/* Copy button on every finished code block (8 Nov 2026, Faiza "can't copy" the backup.sh lines into nano). The note says
   the one thing that trips everyone: a terminal pastes with Ctrl+Shift+V, not Ctrl+V. */
function CopyBtn({ src }) {
  const [done, setDone] = useState(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(src); setDone("ok"); } catch { setDone("fail"); }
  };
  return (
    <div className="copyrow">
      <button type="button" className="btn quiet tiny" onClick={copy}>{done === "ok" ? "Copied ✓" : "Copy"}</button>
      {done === "ok" && <span className="small soft"> In the terminal or nano, paste with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>. Anywhere else: <kbd>Ctrl</kbd>+<kbd>V</kbd>.</span>}
      {done === "fail" && <span className="small soft"> Copy did not work here - select the lines with the mouse and press <kbd>Ctrl</kbd>+<kbd>C</kbd>.</span>}
    </div>
  );
}
