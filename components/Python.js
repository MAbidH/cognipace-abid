"use client";
import { useEffect, useRef, useState } from "react";

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const LOAD_TIMEOUT_MS = 180 * 1000; // first download is ~10 MB; give slow connections three minutes
export const RUN_LIMIT_MS = 10 * 1000; // a program that runs longer than this is stopped (29 Oct 2026 review H2)
const MAX_LINES = 5000;               // a printing endless loop must not fill the tab's memory
export const TOO_LONG = "Your program ran too long - stopped. Is there a loop that never ends?";
const INPUT_MSG = "input() is not available in this editor - put the answer in a variable instead (for example: name = 'Faiza')";

/* PYTHON RUNS IN A WEB WORKER (29 Oct 2026, review H2/M7). Before this, Pyodide ran on the page's own thread: a
   `while n > 0:` without `n = n - 1` froze the whole room - chat, Recess, "something is broken?" - until Firefox
   offered to kill the page, and the editor stayed dead until F5. Now:
   - the program runs in a separate worker; the page stays alive whatever the program does;
   - printed lines arrive while it runs (batched), capped at MAX_LINES;
   - a Stop button, and an automatic stop after RUN_LIMIT_MS: the worker is terminated and a fresh one started;
   - every Run gets a FRESH namespace (a new globals dict with __name__ = "__main__"), so variables never survive from
     one Run to the next, or from the warm-up's Python line into the lesson (review M7: "delete line 1 and run" must
     raise the NameError the tutor predicted).
   FILESYSTEM: Pyodide's in-memory filesystem (/home/pyodide) is NOT reset per Run - files a program writes are still
   there on the next Run while the page (and the worker) lives. Starters that write files rely on this and clean up
   first (LV1-CODE2 empties shots/ before renaming). A page reload, Stop, or the 10-second stop starts a new worker,
   which starts with an empty filesystem. Imported modules also stay imported between Runs (sys.modules).
   The worker is built from a blob: URL (CSP worker-src 'self' blob:, already allowed) and loads Pyodide from the same
   jsDelivr URL as before (script-src / connect-src already allow it). No header change was needed. */
const WORKER_SRC = `
let py = null;
const INPUT_MSG = ${JSON.stringify(INPUT_MSG)};
self.onmessage = async (e) => {
  const m = e.data || {};
  if (m.type === "load") {
    try {
      importScripts(m.url + "pyodide.js");
      py = await loadPyodide({ indexURL: m.url });
      // input() raises a plain sentence instead of Pyodide's "OSError: [Errno 29] I/O error" (the stdin hook below is a
      // second guard for anything that reads stdin directly).
      py.runPython("def _cp_no_input(*args, **kwargs):\\n    raise RuntimeError(" + JSON.stringify(INPUT_MSG) + ")\\n");
      postMessage({ type: "ready" });
    } catch (err) { postMessage({ type: "loaderror", why: String((err && err.message) || err).slice(0, 160) }); }
    return;
  }
  if (m.type === "run" && py) {
    let lines = [], total = 0, cut = false, last = Date.now();
    const flush = () => { if (lines.length) { postMessage({ type: "out", id: m.id, lines }); lines = []; } last = Date.now(); };
    const put = (t) => {
      if (total >= ${MAX_LINES}) { cut = true; return; }
      total++; lines.push(t);
      if (lines.length >= 200 || Date.now() - last > 120) flush();
    };
    py.setStdout({ batched: put });
    py.setStderr({ batched: put });
    try { py.setStdin({ stdin: () => { throw new Error(INPUT_MSG); } }); } catch (_) {}
    const g = py.globals.get("dict")();
    g.set("__name__", "__main__");
    g.set("input", py.globals.get("_cp_no_input"));
    let error = null;
    try { await py.runPythonAsync(m.code, { globals: g, filename: "main.py" }); }
    catch (err) {
      const msg = String((err && err.message) || err);
      error = msg.includes(INPUT_MSG) ? INPUT_MSG : msg.split("\\n").filter(Boolean).slice(-3).join("\\n");
    }
    finally { try { g.destroy(); } catch (_) {} }
    flush();
    postMessage({ type: "done", id: m.id, error, cut });
  }
};`;

let workerUrl = null;
function makeWorker() {
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  return new window.Worker(workerUrl);
}

export default function Python({ starter, onOutput, onChange, storageKey }) {
  // Her edits survive a reload: the editor used to snap back to the starter code (Oct 2026).
  const sk = storageKey ? `code:${storageKey}` : null;
  const [code, setCodeRaw] = useState(() => { try { return (sk && localStorage.getItem(sk)) || starter || ""; } catch { return starter || ""; } });
  useEffect(() => { onChange?.(code); }, []);  
  const setCode = (v) => { setCodeRaw(v); onChange?.(v); try { if (sk) localStorage.setItem(sk, v); } catch {} };
  const [out, setOut] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | running | error
  const [seconds, setSeconds] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [why, setWhy] = useState("");
  const [note, setNote] = useState(""); // "stopped" line under the button
  const w = useRef(null);
  const run$ = useRef(null); // { id, lines: [], timer }
  const outRef = useRef(null);
  const shown = useRef(false);

  // Start (or restart) the worker and load Python inside it.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading"); setSeconds(0);
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    let worker;
    try { worker = makeWorker(); } catch (e) { setStatus("error"); setWhy(String(e?.message || e).slice(0, 160)); clearInterval(tick); return undefined; }
    w.current = worker;
    const limit = setTimeout(() => { if (!cancelled) { setStatus("error"); setWhy("took too long"); worker.terminate(); } }, LOAD_TIMEOUT_MS);
    worker.onmessage = (e) => {
      const m = e.data || {};
      if (cancelled) return;
      if (m.type === "ready") { clearTimeout(limit); clearInterval(tick); setStatus("ready"); return; }
      if (m.type === "loaderror") { clearTimeout(limit); clearInterval(tick); setStatus("error"); setWhy(m.why || "download blocked or offline"); return; }
      const r = run$.current;
      if (!r || m.id !== r.id) return;
      if (m.type === "out") { r.lines.push(...m.lines); scheduleShow(); return; }
      if (m.type === "done") {
        clearTimeout(r.timer);
        if (m.error) r.lines.push(m.error);
        if (m.cut) r.lines.push(`(only the first ${MAX_LINES} lines are shown)`);
        finishRun("");
      }
    };
    worker.onerror = () => {
      if (cancelled) return;
      if (run$.current) { stop("Python stopped working - press Run again."); return; }
      clearTimeout(limit); clearInterval(tick); setStatus("error"); setWhy("Python stopped working");
    };
    worker.postMessage({ type: "load", url: PYODIDE });
    return () => { cancelled = true; clearInterval(tick); clearTimeout(limit); try { worker.terminate(); } catch {} if (w.current === worker) w.current = null; };
  }, [attempt]);

  // Output is shown at most once per frame, however fast the program prints.
  function scheduleShow() {
    if (shown.current) return;
    shown.current = true;
    requestAnimationFrame(() => { shown.current = false; const r = run$.current; if (r) setOut(r.lines.join("\n")); });
  }
  function finishRun(extra) {
    const r = run$.current; if (!r) return;
    run$.current = null;
    const text = (r.lines.join("\n").trim() + (extra ? `\n${extra}` : "")).trim() || "(no output)";
    setOut(text);
    if (!extra) setStatus("ready");
    onOutput?.(text);
  }
  // Stop = kill the worker (a running Python cannot be interrupted from outside without special headers) and start a fresh one.
  function stop(reason) {
    const r = run$.current; if (!r) return;
    clearTimeout(r.timer);
    setNote(reason);
    finishRun(reason);
    try { w.current?.terminate(); } catch {}
    w.current = null;
    setAttempt((a) => a + 1); // loads a new worker (Python comes from the browser cache, a few seconds)
  }

  const run = () => {
    if (!w.current || status !== "ready") return;
    setStatus("running"); setNote(""); setOut("");
    const id = Date.now() + Math.random();
    run$.current = { id, lines: [], timer: setTimeout(() => stop(TOO_LONG), RUN_LIMIT_MS) };
    w.current.postMessage({ type: "run", id, code });
  };

  useEffect(() => () => { if (run$.current) clearTimeout(run$.current.timer); }, []);
  useEffect(() => { if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight; }, [out]);

  const label = status === "loading" ? `Loading Python… ${seconds}s` : "Run (Ctrl+Enter)";

  // Keyboard first (Abid's rule): Ctrl+Enter runs, Tab indents instead of leaving the editor.
  // Line moves (16 Oct 2026: CODE2 lost 40 minutes because selecting one line in a plain textarea needs Shift+Home,
  // and Home needs Fn on her IdeaPad). Three moves that work on any keyboard, taught on the card above the editor:
  // Ctrl+L selects the current line, Alt+Up/Down moves it, Ctrl+Shift+K deletes it. Same keys as VS Code.
  // (Firefox: Ctrl+L = address bar and Ctrl+Shift+K = Web Console are not reserved keys, so preventDefault inside the
  // editor wins - the page gets them first.)
  const lineMove = (e) => {
    const el = e.target, v = code, a = el.selectionStart, b = el.selectionEnd;
    const ls = v.lastIndexOf("\n", a - 1) + 1, leEnd = v.indexOf("\n", b), le = leEnd === -1 ? v.length : leEnd;
    const after = (next, s1, s2) => { setCode(next); requestAnimationFrame(() => { el.selectionStart = s1; el.selectionEnd = s2; }); };
    if (e.key.toLowerCase() === "l" && e.ctrlKey && !e.shiftKey) { e.preventDefault(); el.selectionStart = ls; el.selectionEnd = le; return true; }
    if (e.key.toLowerCase() === "k" && e.ctrlKey && e.shiftKey) { e.preventDefault(); const cut = leEnd === -1 ? Math.max(0, ls - 1) : ls; after(v.slice(0, cut) + v.slice(leEnd === -1 ? v.length : le + 1), cut, cut); return true; }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && e.altKey) {
      e.preventDefault();
      const lines = v.split("\n"); let i = v.slice(0, ls).split("\n").length - 1;
      const j = e.key === "ArrowUp" ? i - 1 : i + 1; if (j < 0 || j >= lines.length) return true;
      [lines[i], lines[j]] = [lines[j], lines[i]];
      const next = lines.join("\n"); const start = lines.slice(0, j).join("\n").length + (j ? 1 : 0);
      after(next, start, start + lines[j].length); return true;
    }
    return false;
  };
  const onKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (status === "ready") run(); return; }
    if (e.key === "Escape" && status === "running") { e.preventDefault(); stop("Stopped."); return; }
    if (lineMove(e)) return;
    if (e.key === "Tab" && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const el = e.target, a = el.selectionStart, b = el.selectionEnd;
      const next = code.slice(0, a) + "    " + code.slice(b);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4; });
    }
  };

  return (
    <div className="card pycard" style={{ padding: 14 }}>
      <div className="termbar"><i /><i /><i /><span style={{ marginLeft: 6 }}>main.py · Python 3 in your browser</span><span style={{ marginLeft: "auto" }}>{status === "ready" ? "ready" : status}</span></div>
      <div className="small soft editor-keys" style={{ margin: "6px 0 4px", fontSize: 12 }}><kbd>Ctrl+L</kbd> select line · <kbd>Alt+↑/↓</kbd> move it · <kbd>Ctrl+Shift+K</kbd> delete it · <kbd>Ctrl+Enter</kbd> run · <kbd>Esc</kbd> stop</div>
      {/* wrap="off" (29 Oct 2026, review H3): a long line stays ONE line and the box scrolls sideways. A wrapped line showed
          its second half at column 0, like an un-indented line - the worst picture for someone learning indentation. */}
      <textarea data-editor="1" className="editor code-editor" wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={onKey} aria-label="Python editor" />
      <div className="runrow" style={{ margin: "10px 0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {status === "error" ? (
          <button className="btn primary" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
        ) : status === "running" ? (
          <><button className="btn primary" disabled>Running…</button><button className="btn" onClick={() => stop("Stopped.")} title="Stop the program (Esc in the editor)">Stop <kbd>Esc</kbd></button></>
        ) : (
          <button className="btn primary" disabled={status !== "ready"} onClick={run}>{label}</button>
        )}
        {status === "running" && <span className="small soft">It stops by itself after 10 seconds.</span>}
      </div>
      {note && note !== "Stopped." && <p className="notice small" role="status" style={{ marginTop: 0 }}>{note}</p>}
      {status === "loading" && seconds >= 10 && (
        <p className="small soft">The first time, Python downloads about 10 MB, so on a slow connection this can take a minute. Keep this page open.</p>
      )}
      {status === "error" && (
        <p className="small soft">Python couldn't load. This usually means the internet is slow or dropped. Press Try again. If it keeps failing, tell Abid and send him a photo of this screen.{why ? <><br /><span className="mono" style={{ fontSize: 12 }}>Details: {why}</span></> : null}</p>
      )}
      <div className="output" ref={outRef} aria-live="polite">{out}</div>
    </div>
  );
}
