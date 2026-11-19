"use client";
import { useEffect, useRef, useState } from "react";
import { markOffline, markOnline, waitForInternet } from "./Offline";

const api = (url, body) => fetch(url, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  .then((r) => { markOnline(); return r.json().catch(() => ({ error: "Something went wrong on the school's side." })); }, () => { markOffline(); return { error: "No internet right now.", offline: true }; });
const C = { cyan: "#22d3ee", lime: "#a3e635", amber: "#fbbf24", rose: "#fb7185", violet: "#a78bfa", ink: "#e8eef8", soft: "#9fb0c7", line: "#2c3d5c", bg: "#0f1522" };

/* ---------- The Arena: six fast rounds, keyboard only, scored on the server. ---------- */
export default function Arena() {
  const [state, setState] = useState(null);     // GET /api/arena
  const [game, setGame] = useState(null);       // { id, rounds, results }
  const [ri, setRi] = useState(0);              // round index
  const [phase, setPhase] = useState("lobby");  // lobby | intro | play | result | end
  const [result, setResult] = useState(null);
  const [end, setEnd] = useState(null);
  const [err, setErr] = useState(null);         // { text, retry? } - said on the page; the old alert() pop-ups are gone (22 Oct 2026)
  useEffect(() => { api("/api/arena").then(setState); }, []);

  const start = async () => { setErr(null); const g = await api("/api/arena", { start: true }); if (g.error) { setErr({ text: g.offline ? "No internet right now. Press Try again when the banner at the top goes away." : g.error, retry: start }); return; } setGame(g);
    // 29 Oct 2026 (CONTRACT 5): after today's game is finished, Start returns that game with done:true - one game a day.
    if (g.done) { setEnd({ score: g.score, best: Math.max(Number(state?.best) || 0, Number(g.score) || 0) }); setPhase("end"); return; }
    const first = g.rounds.findIndex((r) => !g.results[r.id]); setRi(Math.max(0, first)); setPhase("intro"); };
  const submit = async (answers, seconds) => {
    const round = game.rounds[ri];
    setErr(null);
    let r = await api("/api/arena", { id: game.id, round: round.id, answers, seconds });
    if (r.offline) {
      setErr({ text: "No internet right now. Your answers for this round are kept and will be sent by themselves when the internet comes back." });
      await waitForInternet();
      r = await api("/api/arena", { id: game.id, round: round.id, answers, seconds });
    }
    if (r.error) { setErr({ text: r.error, retry: () => submit(answers, seconds) }); return; }
    setErr(null);
    setGame((g) => ({ ...g, results: { ...g.results, [round.id]: r.result } }));
    setResult({ ...r, round });
    setPhase("result");
  };
  const next = async () => {
    const n = game.rounds.findIndex((r, i) => i > ri && !game.results[r.id]);
    if (n < 0) {
      const f = await api("/api/arena", { id: game.id, finish: true });
      if (f.error && !f.offline) { setEnd({ score: Object.values(game.results || {}).reduce((a, r) => a + (Number(r?.points) || 0), 0), best: state?.best }); setPhase("end"); return; }
      if (f.error) { setErr({ text: "No internet right now. Press Try again when the banner at the top goes away.", retry: next }); return; }
      setEnd(f); setPhase("end");
    }
    else { setRi(n); setPhase("intro"); }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Enter" && (phase === "lobby" || phase === "intro" || phase === "result")) { e.preventDefault(); if (phase === "lobby") start(); else if (phase === "intro") setPhase("play"); else next(); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  });  

  if (!state) return <p className="soft">Opening the Arena…</p>;
  if (state.error) return <p className="hint">{state.error}</p>;
  if (err) return (
    <div className="card">
      <p className="notice small" role="alert">{err.text}{err.retry && <button className="btn primary" onClick={err.retry}>Try again</button>}</p>
      {err.retry && <p className="small soft"><a href="/">Back to the map</a></p>}
    </div>
  );
  if (!state.arenaDay) return (
    <div className="card" style={{ textAlign: "center", padding: 30 }}>
      <div className="eyebrow">the arena</div>
      <h2>Closed today - it is a Wonder day.</h2>
      <p className="soft">The Arena opens every second day. Today, read your Wonder instead: <a href="/wonder">open it →</a></p>
    </div>
  );
  if (state.today?.done && phase === "lobby") return (
    <div className="card" style={{ textAlign: "center", padding: 30 }}>
      <div className="eyebrow" style={{ color: "var(--amber)" }}>played today</div>
      <h2>{state.today.score} points</h2>
      <p className="soft">Your best ever: {state.best}. The Arena opens again the day after tomorrow.</p>
      <p><a className="btn" href="/">Back to the map</a></p>
    </div>
  );

  if (phase === "lobby") return (
    <div className="card lit" style={{ textAlign: "center", padding: 30 }}>
      <ArenaMark />
      <div className="eyebrow" style={{ marginTop: 10 }}>game day</div>
      <h1 style={{ margin: "4px 0 8px" }}>The Arena</h1>
      <p className="soft">Six fast rounds, about ten minutes, keyboard only. Quiz, lamps, keys, bugs, pictures, one line of code. Everything you have learned, at speed.</p>
      <p className="small mute">Best ever: <b style={{ color: "var(--ink)" }}>{state.best}</b> points · {state.days} game day{state.days === 1 ? "" : "s"} played</p>
      <button className="btn primary" onClick={start} style={{ fontSize: 17 }}>Start <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Enter</kbd></button>
    </div>
  );

  const round = game.rounds[ri];
  const HOW = {
    quiz: "Twelve quick questions from everything you have passed. Type the answer, Enter. Skip with Enter if you are stuck - speed matters.",
    lamps: "A number appears. Make it with the eight lamps: keys 1 to 8 switch lamps on and off (1 is the left lamp, worth 128). Enter when it is right.",
    keys: "An action appears. Type the keys that do it, like ctrl+t, then Enter.",
    bugs: "Three lines of Python, one bug. Press 1, 2 or 3 for the line with the bug.",
    pictures: "A picture and a question. Answer from the picture, Enter.",
    line: "Type the line exactly - every bracket and quote. Accuracy first, then speed.",
  };
  if (phase === "intro") return (
    <div className="card" style={{ textAlign: "center", padding: 30 }}>
      <div className="eyebrow">round {ri + 1} of {game.rounds.length} · {round.seconds} seconds</div>
      <h2>{round.title}</h2>
      <p className="soft">{HOW[round.id]}</p>
      <button className="btn primary" onClick={() => setPhase("play")}>Go <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Enter</kbd></button>
    </div>
  );
  if (phase === "play") return <Round key={round.id} round={round} onSubmit={submit} />;
  if (phase === "result") return (
    <div className="card" style={{ padding: 24 }}>
      <div className="eyebrow" style={{ color: "var(--lime)" }}>{result.round.title}</div>
      <h2 style={{ margin: "4px 0" }}>{result.result.points} <span className="small soft">of {result.result.max}{result.result.bonus ? ` · +${result.result.bonus} speed bonus` : ""}</span></h2>
      <p className="small soft">Total so far: <b style={{ color: "var(--ink)" }}>{result.score}</b></p>
      {result.detail.some((d) => !d.ok) && (
        <div className="small" style={{ marginTop: 8 }}>
          <div className="eyebrow" style={{ color: "var(--amber)" }}>the ones to remember</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{result.detail.map((d, i) => !d.ok && <li key={i}>{result.round.id === "line" ? `${d.accuracy}% accurate` : <>#{i + 1}: <span style={{ color: "var(--lime)" }}>{d.a}</span></>}</li>)}</ul>
        </div>
      )}
      <div style={{ marginTop: 14 }}><button className="btn primary" onClick={next}>Next <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>Enter</kbd></button></div>
    </div>
  );
  return (
    <div className="card lit" style={{ textAlign: "center", padding: 30 }}>
      <div className="bloom" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 14px", background: "radial-gradient(circle at 30% 30%, #fde68a, var(--amber) 60%, #92400e)", boxShadow: "0 0 40px rgba(251,191,36,0.5)" }} />
      <div className="eyebrow" style={{ color: "var(--amber)" }}>{end?.newBest ? "new best!" : "game day done"}</div>
      <h1 style={{ margin: "4px 0" }}>{end?.score} points</h1>
      <p className="soft">Best ever: {end?.best}. The Arena opens again the day after tomorrow.</p>
      <p><a className="btn primary" href="/">Back to the map</a></p>
    </div>
  );
}

function ArenaMark() {
  return (
    <svg viewBox="0 0 120 60" width="160" height="80" aria-hidden="true">
      <polygon points="60,4 110,30 60,56 10,30" fill="none" stroke={C.cyan} strokeWidth="2" />
      <polygon points="60,16 90,30 60,44 30,30" fill={C.cyan} opacity="0.15" stroke={C.cyan} strokeWidth="1.5" />
      <circle cx="60" cy="30" r="5" fill={C.amber} />
    </svg>
  );
}

/* ---------- One round: a countdown, items one at a time, answers collected, submitted at the end or when time is up. ---------- */
function Round({ round, onSubmit }) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState("");
  const [bits, setBits] = useState("00000000");
  const answers = useRef([]);
  const t0 = useRef(Date.now());
  const [left, setLeft] = useState(round.seconds);
  const done = useRef(false);
  const finish = () => { if (done.current) return; done.current = true; onSubmit(answers.current, (Date.now() - t0.current) / 1000); };
  useEffect(() => { const id = setInterval(() => { const l = round.seconds - (Date.now() - t0.current) / 1000; setLeft(Math.max(0, l)); if (l <= 0) finish(); }, 250); return () => clearInterval(id); }, []);  
  const item = round.items[i];
  const commit = (v) => { answers.current[i] = v; if (i + 1 < round.items.length) { setI(i + 1); setVal(""); setBits("00000000"); } else finish(); };

  useEffect(() => {
    if (round.id !== "lamps" && round.id !== "bugs") return;
    const onKey = (e) => {
      if (round.id === "lamps") {
        if (/^[1-8]$/.test(e.key)) { e.preventDefault(); const k = Number(e.key) - 1; setBits((b) => b.slice(0, k) + (b[k] === "1" ? "0" : "1") + b.slice(k + 1)); }
        if (e.key === "Enter") { e.preventDefault(); commit(bits); }
      } else if (/^[1-3]$/.test(e.key)) { e.preventDefault(); commit(e.key); }
    };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  });  

  const pct = Math.round((left / round.seconds) * 100);
  const bar = <div className="meter" style={{ marginBottom: 14 }}><div style={{ width: `${pct}%`, background: pct < 25 ? "var(--rose)" : undefined }} /></div>;
  const head = <div style={{ display: "flex", justifyContent: "space-between" }} className="small soft"><span>{round.title} · {i + 1} / {round.items.length}</span><span className="mono" style={{ color: pct < 25 ? "var(--rose)" : "var(--ink)" }}>{Math.ceil(left)}s</span></div>;
  const input = (placeholder, mono) => (
    <input className={`big-input ${mono ? "mono" : ""}`} autoFocus autoComplete="off" spellCheck={false} placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(val.trim()); } }} onPaste={(e) => e.preventDefault()} />
  );

  if (round.id === "quiz") return <div className="card">{head}{bar}<div className="small mute">{item.from}</div><div className="question">{item.q}</div>{input("Your answer, then Enter")}</div>;
  if (round.id === "keys") return <div className="card">{head}{bar}<div className="small mute">{item.where}</div><div className="question">{item.does}</div>{input("which keys? e.g. ctrl+t", true)}</div>;
  if (round.id === "line") return <div className="card">{head}{bar}<p className="mono" style={{ fontSize: 21, background: "#0a0e15", border: "1px solid var(--line-2)", borderRadius: 12, padding: "12px 14px", userSelect: "none", color: "#c9f7ff" }}>{item.line}</p>{input("Type the line, then Enter", true)}</div>;
  if (round.id === "bugs") return (
    <div className="card">{head}{bar}
      <div className="eyebrow">which line has the bug? press 1, 2 or 3</div>
      <pre className="output" style={{ fontSize: 17, marginTop: 8 }}>{item.lines.map((l, k) => <div key={k}><span style={{ color: C.amber, marginRight: 14 }}>{k + 1}</span>{l}</div>)}</pre>
    </div>
  );
  if (round.id === "lamps") {
    const val8 = parseInt(bits, 2);
    return (
      <div className="card" style={{ textAlign: "center" }}>{head}{bar}
        <div className="eyebrow">make this number</div>
        <div style={{ fontFamily: "var(--display)", fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{item.n}</div>
        <svg viewBox="0 0 360 150" style={{ width: "100%", maxWidth: 520, margin: "10px auto 0", display: "block" }}>
          {bits.split("").map((b, k) => { const x = 30 + k * 43; const on = b === "1"; return (
            <g key={k}>
              {on && <circle cx={x} cy="50" r="24" fill={C.amber} opacity="0.2" />}
              <circle cx={x} cy="50" r="16" fill={on ? C.amber : C.bg} stroke={on ? C.amber : C.line} strokeWidth="2" />
              <rect x={x - 12} y="86" width="24" height="18" rx="4" fill={C.bg} stroke={C.line} />
              <text x={x} y="99" fontSize="12" textAnchor="middle" fill={C.ink} fontFamily="JetBrains Mono, monospace">{k + 1}</text>
              <text x={x} y="128" fontSize="11" textAnchor="middle" fill={on ? C.amber : C.soft} fontFamily="JetBrains Mono, monospace">{2 ** (7 - k)}</text>
            </g>); })}
        </svg>
        <div className="small" style={{ marginTop: 6 }}>Lamps say: <b className="mono" style={{ color: val8 === item.n ? "var(--lime)" : "var(--ink)" }}>{val8}</b> · <kbd>1</kbd>–<kbd>8</kbd> toggle · <kbd>Enter</kbd> when right</div>
      </div>
    );
  }
  if (round.id === "pictures") return (
    <div className="card">{head}{bar}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, alignItems: "center" }}>
        <div className="art" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}><Picture item={item} /></div>
        <div><div className="question" style={{ fontSize: 21 }}>{item.q}</div>{input("Answer, then Enter")}</div>
      </div>
    </div>
  );
  return null;
}

/* ---------- Picture round drawings: lamps, a fraction bar, a rectangle of squares, the three parts of the machine. ---------- */
function Picture({ item }) {
  const W = 360, H = 200;
  const frame = (children) => <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%" }}><rect width={W} height={H} fill={C.bg} />{children}</svg>;
  if (item.kind === "lamps") return frame(item.bits.split("").map((b, k) => { const x = 60 + k * 60; const on = b === "1"; return <g key={k}>{on && <circle cx={x} cy="90" r="30" fill={C.amber} opacity="0.2" />}<circle cx={x} cy="90" r="20" fill={on ? C.amber : C.bg} stroke={on ? C.amber : C.line} strokeWidth="2.5" /><text x={x} y="150" fontSize="14" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace">{2 ** (4 - k)}</text></g>; }));
  if (item.kind === "fraction") return frame(<>{Array.from({ length: item.den }, (_, k) => { const w = 300 / item.den; return <rect key={k} x={30 + k * w} y="70" width={w - 3} height="60" rx="4" fill={k < item.num ? C.cyan : C.bg} stroke={C.line} strokeWidth="2" />; })}<text x="180" y="165" fontSize="13" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace">{item.den} equal parts</text></>);
  if (item.kind === "rect") { const s = Math.min(300 / item.w, 150 / item.h); const x0 = (W - s * item.w) / 2, y0 = (H - s * item.h) / 2; return frame(<>{Array.from({ length: item.w * item.h }, (_, k) => <rect key={k} x={x0 + (k % item.w) * s} y={y0 + Math.floor(k / item.w) * s} width={s - 2} height={s - 2} fill={C.violet} opacity="0.35" stroke={C.violet} strokeWidth="1" />)}<text x={W / 2} y={y0 - 8} fontSize="13" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace">{item.w} across</text><text x={x0 - 10} y={H / 2} fontSize="13" textAnchor="end" fill={C.soft} fontFamily="JetBrains Mono, monospace">{item.h} down</text></>); }
  if (item.kind === "parts") return frame(item.order.map((p, k) => { const x = 60 + k * 120; const col = { CPU: C.violet, RAM: C.lime, SSD: C.amber }[p]; return (
    <g key={k} transform={`translate(${x} 70)`}>
      <text x="0" y="-20" fontSize="14" textAnchor="middle" fill={C.ink} fontFamily="JetBrains Mono, monospace">{k + 1}</text>
      {p === "CPU" && <><rect x="-22" y="-10" width="44" height="44" rx="4" fill={C.bg} stroke={col} strokeWidth="2.5" />{[...Array(5)].map((_, j) => <line key={j} x1={-16 + j * 8} y1="-18" x2={-16 + j * 8} y2="-10" stroke={col} strokeWidth="2" />)}{[...Array(5)].map((_, j) => <line key={j} x1={-16 + j * 8} y1="34" x2={-16 + j * 8} y2="42" stroke={col} strokeWidth="2" />)}</>}
      {p === "RAM" && <><rect x="-40" y="0" width="80" height="24" rx="3" fill={C.bg} stroke={col} strokeWidth="2.5" />{[...Array(6)].map((_, j) => <rect key={j} x={-34 + j * 12} y="5" width="8" height="14" fill={col} opacity="0.6" />)}</>}
      {p === "SSD" && <><rect x="-34" y="-6" width="68" height="46" rx="6" fill={C.bg} stroke={col} strokeWidth="2.5" /><rect x="-24" y="4" width="48" height="26" rx="3" fill="none" stroke={col} strokeWidth="1.5" strokeDasharray="4 3" /></>}
    </g>); }));
  return frame(null);
}
