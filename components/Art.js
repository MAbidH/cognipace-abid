import * as P1 from "./art/part1";
import * as P2 from "./art/part2";
import * as P3 from "./art/part3";
import * as P4 from "./art/part4";
import * as P5 from "./art/part5";
import * as P6 from "./art/part6";
/* Pre-made geometric illustrations, one family per kind of module, drawn in code so they match the lab's palette.
   Server-safe (no hooks). Every picture is a mechanism, not decoration: binary lamps for CS1, a wireframe laptop
   with traces for CS1B, place-value blocks for maths, orbits for general knowledge, a cipher wheel for CS2. */

const C = { cyan: "#22d3ee", deep: "#0e7490", lime: "#a3e635", amber: "#fbbf24", rose: "#fb7185", violet: "#a78bfa", ink: "#e8eef8", soft: "#9fb0c7", line: "#2c3d5c", bg: "#0f1522" };

function Frame({ children, title }) {
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={C.cyan} strokeOpacity="0.08" /></pattern>
        <linearGradient id="glow" x1="0" x2="1"><stop offset="0" stopColor={C.cyan} stopOpacity="0" /><stop offset="0.5" stopColor={C.cyan} stopOpacity="0.5" /><stop offset="1" stopColor={C.cyan} stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="360" height="200" fill={C.bg} />
      <rect width="360" height="200" fill="url(#g)" />
      {children}
    </svg>
  );
}

/* Binary: eight lamps, 1 0 1 1 0 1 0 0, with their place values. */
function Binary() {
  const bits = [1, 0, 1, 1, 0, 1, 0, 0];
  return (
    <Frame title="Eight binary lamps">
      {bits.map((b, i) => {
        const x = 30 + i * 40;
        return (
          <g key={i}>
            <line x1={x} y1="60" x2={x} y2="118" stroke={C.line} strokeWidth="2" />
            <circle cx={x} cy="60" r="14" fill={b ? C.amber : C.bg} stroke={b ? C.amber : C.line} strokeWidth="2" />
            {b ? <circle cx={x} cy="60" r="22" fill={C.amber} opacity="0.18" /> : null}
            <rect x={x - 12} y="118" width="24" height="14" rx="3" fill={b ? C.cyan : C.line} />
            <text x={x} y="129" fontSize="10" textAnchor="middle" fill={b ? "#04141a" : C.soft} fontFamily="JetBrains Mono, monospace" fontWeight="700">{b}</text>
            <text x={x} y="152" fontSize="10" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace">{2 ** (7 - i)}</text>
          </g>
        );
      })}
      <text x="180" y="184" fontSize="12" textAnchor="middle" fill={C.cyan} fontFamily="JetBrains Mono, monospace">128 + 32 + 16 + 4 = 180</text>
      <text x="180" y="30" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">ONE BYTE</text>
    </Frame>
  );
}

/* The machine: wireframe laptop, CPU die, traces reaching out to RAM and disk. */
function Machine() {
  return (
    <Frame title="A laptop drawn as its parts">
      <g stroke={C.cyan} strokeWidth="1.5" fill="none">
        <path d="M70 40h150a6 6 0 0 1 6 6v84H64V46a6 6 0 0 1 6-6z" />
        <path d="M44 134h202l16 26H28z" fill={C.bg} />
        <rect x="76" y="50" width="138" height="72" rx="3" stroke={C.line} />
      </g>
      <g fill={C.violet}>
        <rect x="130" y="70" width="30" height="30" rx="3" fill={C.bg} stroke={C.violet} strokeWidth="2" />
        <text x="145" y="89" fontSize="9" textAnchor="middle" fill={C.violet} fontFamily="JetBrains Mono, monospace">CPU</text>
      </g>
      {[...Array(6)].map((_, i) => <line key={i} x1={130 + i * 6} y1="62" x2={130 + i * 6} y2="70" stroke={C.violet} strokeWidth="1.5" />)}
      {[...Array(6)].map((_, i) => <line key={i} x1={130 + i * 6} y1="100" x2={130 + i * 6} y2="108" stroke={C.violet} strokeWidth="1.5" />)}
      <g stroke={C.cyan} strokeWidth="1.5" fill="none" strokeDasharray="3 3">
        <path d="M160 85h40v-20h50" /><path d="M130 85h-30v22h-30" />
      </g>
      <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill={C.soft}>
        <rect x="250" y="56" width="60" height="18" rx="3" fill={C.bg} stroke={C.lime} /><text x="280" y="68" textAnchor="middle" fill={C.lime}>RAM</text>
        <rect x="42" y="98" width="30" height="18" rx="3" fill={C.bg} stroke={C.amber} /><text x="57" y="110" textAnchor="middle" fill={C.amber}>SSD</text>
      </g>
      <text x="180" y="184" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">YOUR MACHINE, YOUR RULES</text>
    </Frame>
  );
}

/* Maths: isometric place-value blocks - a hundred flat, tens rods, ones cubes. */
function Blocks() {
  const cube = (x, y, s, fill) => (
    <g key={`${x}-${y}`} stroke={C.bg} strokeWidth="1">
      <path d={`M${x} ${y} l${s} ${-s / 2} l${s} ${s / 2} l${-s} ${s / 2}z`} fill={fill} opacity="0.95" />
      <path d={`M${x} ${y} l${s} ${s / 2} v${s} l${-s} ${-s / 2}z`} fill={fill} opacity="0.6" />
      <path d={`M${x + s} ${y + s / 2} l${s} ${-s / 2} v${s} l${-s} ${s / 2}z`} fill={fill} opacity="0.4" />
    </g>
  );
  const items = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) items.push(cube(40 + c * 14 + r * 14, 80 - c * 7 + r * 7, 14, C.cyan));
  for (let i = 0; i < 3; i++) items.push(cube(190 + i * 26, 92, 14, C.violet));
  for (let i = 0; i < 3; i++) items.push(cube(190 + i * 26, 78, 14, C.violet));
  for (let i = 0; i < 2; i++) items.push(cube(290 + i * 22, 96, 14, C.amber));
  return (
    <Frame title="Place value as blocks">
      {items}
      <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill={C.soft} textAnchor="middle">
        <text x="98" y="160">hundreds</text><text x="230" y="160">tens</text><text x="312" y="160">ones</text>
      </g>
      <text x="180" y="184" fontSize="12" textAnchor="middle" fill={C.cyan} fontFamily="JetBrains Mono, monospace">1 × 100 + 3 × 10 + 2 = 132</text>
      <text x="180" y="30" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">MATHS IS INSTRUCTIONS</text>
    </Frame>
  );
}

/* General knowledge: orbits beyond Neptune. */
function Orbits() {
  return (
    <Frame title="Orbits around a star">
      <circle cx="180" cy="100" r="10" fill={C.amber} /><circle cx="180" cy="100" r="18" fill={C.amber} opacity="0.2" />
      {[34, 56, 80, 108].map((r, i) => <ellipse key={r} cx="180" cy="100" rx={r * 1.5} ry={r * 0.55} fill="none" stroke={i === 3 ? C.violet : C.line} strokeWidth="1.2" strokeDasharray={i === 3 ? "4 4" : "none"} />)}
      <circle cx="231" cy="100" r="4" fill={C.cyan} /><circle cx="110" cy="80" r="5" fill={C.lime} /><circle cx="270" cy="128" r="6" fill={C.cyan} />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={180 + 162 * Math.cos(i * 1.1 + 0.4)} cy={100 + 59 * Math.sin(i * 1.1 + 0.4)} r="1.6" fill={C.violet} />)}
      <text x="180" y="184" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">WHAT NOBODY KNOWS YET</text>
    </Frame>
  );
}

/* Code and ciphers: a shift wheel with an arrow, and a padlock. */
function Cipher() {
  const letters = "ABCDEFGHIJKLM".split("");
  return (
    <Frame title="A cipher wheel">
      <circle cx="120" cy="100" r="64" fill="none" stroke={C.line} strokeWidth="2" />
      <circle cx="120" cy="100" r="44" fill="none" stroke={C.violet} strokeWidth="2" />
      {letters.map((l, i) => { const a = (i / 13) * Math.PI * 2 - Math.PI / 2; return (
        <g key={l} fontFamily="JetBrains Mono, monospace" fontSize="10" textAnchor="middle">
          <text x={120 + 55 * Math.cos(a)} y={100 + 55 * Math.sin(a) + 3} fill={C.soft}>{l}</text>
          <text x={120 + 34 * Math.cos(a + 0.48)} y={100 + 34 * Math.sin(a + 0.48) + 3} fill={C.violet}>{l}</text>
        </g>); })}
      <path d="M120 36 l-5 -8 h10z" fill={C.amber} />
      <g transform="translate(240 70)">
        <rect x="0" y="30" width="60" height="46" rx="8" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
        <path d="M14 30v-10a16 16 0 0 1 32 0v10" fill="none" stroke={C.cyan} strokeWidth="2" />
        <circle cx="30" cy="52" r="5" fill={C.cyan} /><line x1="30" y1="52" x2="30" y2="64" stroke={C.cyan} strokeWidth="2" />
      </g>
      <text x="180" y="184" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">SHIFT BY 3 · THEN BREAK IT</text>
    </Frame>
  );
}

/* Default: a small network of isometric nodes. */
function Network() {
  const pts = [[60, 70], [140, 50], [220, 80], [300, 60], [100, 140], [190, 150], [280, 140]];
  const edges = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 5], [5, 6]];
  return (
    <Frame title="A network of nodes">
      {edges.map(([a, b], i) => <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={C.line} strokeWidth="1.5" />)}
      {pts.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="9" fill={C.bg} stroke={i === 5 ? C.cyan : C.violet} strokeWidth="2" />{i === 5 && <circle cx={x} cy={y} r="4" fill={C.cyan} />}</g>)}
      <text x="180" y="184" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">ONE STEP AT A TIME</text>
    </Frame>
  );
}

/* Leverage: a lever lifting a heavy block - small push, big move. */
function Lever() {
  return (
    <Frame title="A lever: small push, big lift">
      <rect x="40" y="150" width="280" height="4" fill={C.line} />
      <path d="M180 150 l-14 -22 h28z" fill={C.violet} />
      <line x1="60" y1="140" x2="300" y2="92" stroke={C.cyan} strokeWidth="5" strokeLinecap="round" />
      <rect x="40" y="96" width="44" height="44" rx="4" fill={C.bg} stroke={C.amber} strokeWidth="2" transform="rotate(-11 62 118)" />
      <text x="62" y="123" fontSize="10" textAnchor="middle" fill={C.amber} fontFamily="JetBrains Mono, monospace" transform="rotate(-11 62 118)">20 min</text>
      <circle cx="300" cy="88" r="8" fill={C.lime} />
      <text x="300" y="72" fontSize="10" textAnchor="middle" fill={C.lime} fontFamily="JetBrains Mono, monospace">one script</text>
      <text x="180" y="184" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">LAZY, THE RIGHT WAY</text>
    </Frame>
  );
}


/* Security: a shield with a keyhole - defend, don't attack. */
function Shield() {
  return (
    <Frame title="A shield - the defender">
      <path d="M180 36 l70 26 v44 c0 42 -34 66 -70 82 c-36 -16 -70 -40 -70 -82 v-44z" fill={C.bg} stroke={C.rose} strokeWidth="2.5" />
      <circle cx="180" cy="104" r="14" fill="none" stroke={C.cyan} strokeWidth="3" />
      <rect x="177" y="108" width="6" height="18" fill={C.cyan} />
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">BUILDER, DEFENDER</text>
    </Frame>
  );
}

/* Networks: a laptop talking to a server across a sealed line. */
function Net() {
  return (
    <Frame title="A network: address, port, envelope">
      <rect x="44" y="92" width="72" height="44" rx="4" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <rect x="244" y="80" width="56" height="68" rx="4" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      {[94, 108, 122].map((y) => <line key={y} x1="252" y1={y} x2="292" y2={y} stroke={C.violet} strokeWidth="1.5" />)}
      <line x1="116" y1="114" x2="244" y2="114" stroke={C.lime} strokeWidth="2" strokeDasharray="6 5" />
      <rect x="168" y="104" width="24" height="18" rx="2" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      <path d="M168 104 l12 10 l12 -10" fill="none" stroke={C.lime} strokeWidth="1.5" />
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">THE SEALED ENVELOPE</text>
    </Frame>
  );
}

/* Web: a browser window with a tag and a cursor. */
function Web() {
  return (
    <Frame title="A web page you build">
      <rect x="90" y="56" width="180" height="104" rx="6" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <line x1="90" y1="76" x2="270" y2="76" stroke={C.violet} strokeWidth="1.5" />
      {[98, 104, 110].map((x) => <circle key={x} cx={x} cy="66" r="2.5" fill={C.soft} />)}
      <text x="108" y="104" fontSize="13" fill={C.cyan} fontFamily="JetBrains Mono, monospace">{"<h1>"}</text>
      <rect x="150" y="94" width="96" height="8" rx="2" fill={C.line} />
      <rect x="108" y="116" width="120" height="6" rx="2" fill={C.line} />
      <rect x="108" y="130" width="80" height="6" rx="2" fill={C.line} />
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">YOU BUILD ONE</text>
    </Frame>
  );
}

/* AI: a small brain made of nodes predicting the next piece. */
function Brain() {
  const L = [[90, 70], [90, 104], [90, 138]], M = [[160, 86], [160, 122]], R = [[230, 104]];
  const all = [...L, ...M, ...R];
  const edges = [[0,3],[1,3],[2,4],[0,4],[1,4],[3,5],[4,5]];
  return (
    <Frame title="A tiny model: predict the next piece">
      {edges.map(([a,b],i)=><line key={i} x1={all[a][0]} y1={all[a][1]} x2={all[b][0]} y2={all[b][1]} stroke={C.line} strokeWidth="1.5" />)}
      {all.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="7" fill={C.bg} stroke={i===5?C.lime:C.cyan} strokeWidth="2" />)}
      <text x="262" y="108" fontSize="13" fill={C.lime} fontFamily="JetBrains Mono, monospace">?</text>
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">WHAT COMES NEXT</text>
    </Frame>
  );
}

/* Hardware: a breadboard with an LED and a wire. */
function Board() {
  return (
    <Frame title="A circuit: input, process, output">
      <rect x="80" y="70" width="200" height="70" rx="4" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      {[0,1,2,3,4,5,6,7].map((i)=><g key={i}>{[0,1,2].map((j)=><circle key={j} cx={100+i*22} cy={84+j*14} r="2" fill={C.line} />)}</g>)}
      <circle cx="210" cy="60" r="8" fill={C.amber} opacity="0.9" />
      <line x1="210" y1="68" x2="210" y2="84" stroke={C.amber} strokeWidth="2" />
      <path d="M122 98 h40 l10 -14" fill="none" stroke={C.cyan} strokeWidth="2" />
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">CODE BECOMES LIGHT</text>
    </Frame>
  );
}

/* Systems & Society: a machine of gears turning inputs into outputs. */
function Gears() {
  const gear = (cx, cy, r, col) => <g><circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="2.5" />{[0,45,90,135,180,225,270,315].map((a)=>{const rad=a*Math.PI/180;return <line key={a} x1={cx+Math.cos(rad)*r} y1={cy+Math.sin(rad)*r} x2={cx+Math.cos(rad)*(r+6)} y2={cy+Math.sin(rad)*(r+6)} stroke={col} strokeWidth="2.5" />})}<circle cx={cx} cy={cy} r={r*0.3} fill={col} /></g>;
  return (
    <Frame title="A system: inputs, parts, outputs">
      {gear(140,100,26,C.soft)}
      {gear(200,118,20,C.cyan)}
      {gear(238,84,16,C.amber)}
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">HOW THINGS REALLY WORK</text>
    </Frame>
  );
}

/* Project: a flag on a summit. */
function Flag() {
  return (
    <Frame title="Something of your own">
      <path d="M70 150 L180 60 L290 150 Z" fill="none" stroke={C.line} strokeWidth="2" />
      <line x1="200" y1="92" x2="200" y2="140" stroke={C.soft} strokeWidth="3" />
      <path d="M200 94 l34 10 l-34 10z" fill={C.lime} />
      <text x="180" y="186" fontSize="11" textAnchor="middle" fill={C.soft} fontFamily="JetBrains Mono, monospace" letterSpacing="2">BUILT BY YOU</text>
    </Frame>
  );
}

/* One picture per module (Abid, 20 Oct 2026: "each module should have a very unique picture which illustrates it").
   The per-module drawings live in components/art/part1-4.js; the eight older family pictures stay for the modules
   they were drawn for. Anything unknown falls back by phase. */
const BY_ID = { ...P1, ...P2, ...P3, ...P4, ...P5, ...P6, CS1: Binary, CS1B: Machine, CS2B: Cipher, LV1: Lever, DEF1: Shield, WEB1: Web, HW1: Board, PROJ1: Flag };

export function ModuleArt({ id = "", phase = "" }) {
  const Pic = BY_ID[id];
  if (Pic) return <Pic />;
  if (id.startsWith("LV") || phase === "Leverage") return <Lever />;
  if (phase === "Security") return <Shield />;
  if (phase === "Networks") return <Net />;
  if (phase === "Web") return <Web />;
  if (phase === "AI") return <Brain />;
  if (phase === "Hardware") return <Board />;
  if (phase === "Systems & Society") return <Gears />;
  if (phase === "Project") return <Flag />;
  if (phase === "Computing") return <Machine />;
  if (id.startsWith("GK")) return <Orbits />;
  if (phase === "Mathematics" || id.startsWith("M")) return <Blocks />;
  return <Network />;
}

/* Hexagonal badge with a small glyph. Earned badges glow; locked ones are drawn in outline only. */
export function BadgeHex({ id, earned }) {
  const col = earned ? C.cyan : C.line;
  const glyph = {
    "first-light": <circle cx="50" cy="50" r="10" fill={C.amber} />,
    "hello-world": <text x="50" y="56" fontSize="16" textAnchor="middle" fill={C.lime} fontFamily="JetBrains Mono, monospace">{">_"}</text>,
    "home-row": <g fill={col}>{[-18, -6, 6, 18].map((d) => <rect key={d} x={50 + d - 5} y="45" width="10" height="10" rx="2" />)}</g>,
    "all-the-keys": <text x="50" y="56" fontSize="15" textAnchor="middle" fill={C.violet} fontFamily="JetBrains Mono, monospace">{"{[|]}"}</text>,
    "seven-days": <text x="50" y="58" fontSize="22" textAnchor="middle" fill={C.amber} fontFamily="Space Grotesk, sans-serif" fontWeight="700">7</text>,
    "thirty-days": <text x="50" y="58" fontSize="22" textAnchor="middle" fill={C.amber} fontFamily="Space Grotesk, sans-serif" fontWeight="700">30</text>,
    "boss-first-try": <path d="M50 34l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill={C.amber} />,
    "debugger": <g fill="none" stroke={C.rose} strokeWidth="3"><ellipse cx="50" cy="52" rx="10" ry="13" /><line x1="50" y1="39" x2="50" y2="65" /><line x1="36" y1="46" x2="64" y2="46" /><line x1="36" y1="58" x2="64" y2="58" /></g>,
    "teacher": <g fill="none" stroke={C.cyan} strokeWidth="3"><path d="M34 46l16-8 16 8-16 8z" /><path d="M40 50v10c0 4 20 4 20 0V50" /></g>,
    "builder": <g fill={C.violet}><rect x="36" y="54" width="28" height="10" rx="2" /><rect x="40" y="42" width="20" height="10" rx="2" /><rect x="45" y="32" width="10" height="8" rx="2" /></g>,
    "no-mouse": <g fill="none" stroke={C.cyan} strokeWidth="3"><rect x="32" y="40" width="36" height="22" rx="4" /><line x1="40" y1="48" x2="60" y2="48" /><line x1="40" y1="54" x2="52" y2="54" /></g>,
    "machine-owner": <g fill="none" stroke={C.lime} strokeWidth="3"><rect x="34" y="38" width="32" height="20" rx="2" /><path d="M28 64h44" /></g>,
    "foundations": <g fill={C.cyan}><rect x="34" y="58" width="32" height="8" /><rect x="38" y="48" width="24" height="8" /><rect x="42" y="38" width="16" height="8" /></g>,
    "binary-reader": <text x="50" y="56" fontSize="13" textAnchor="middle" fill={C.amber} fontFamily="JetBrains Mono, monospace">1011</text>,
    "logkeeper": <g fill="none" stroke={C.violet} strokeWidth="3"><rect x="36" y="36" width="28" height="30" rx="3" /><line x1="42" y1="46" x2="58" y2="46" /><line x1="42" y1="54" x2="54" y2="54" /></g>,
    "vault-keeper": <g fill="none" stroke={C.amber} strokeWidth="3"><rect x="36" y="46" width="28" height="20" rx="3" /><path d="M42 46v-6a8 8 0 0 1 16 0v6" /></g>,
    "marathon": <g fill="none" stroke={C.rose} strokeWidth="3"><circle cx="50" cy="52" r="13" /><path d="M50 44v9l6 4" /></g>,
    "shortcut": <path d="M54 30 L36 54 h12 l-4 18 L64 46 H52z" fill={C.amber} />,
    "lazy-programmer": <g fill="none" stroke={C.lime} strokeWidth="3"><line x1="34" y1="60" x2="66" y2="46" /><path d="M48 62l-6-8 12-2z" fill={C.lime} /></g>,
    "ai-checker": <g fill="none" stroke={C.cyan} strokeWidth="3"><rect x="36" y="38" width="28" height="22" rx="4" /><path d="M43 50l5 5 9-10" /></g>,
    "arena-10": <polygon points="50,32 68,42 68,58 50,68 32,58 32,42" fill="none" stroke={C.amber} strokeWidth="3" />,
    "lamp-master": <g>{[-14,0,14].map((d)=><circle key={d} cx={50+d} cy="50" r="5" fill={C.amber} />)}</g>,
    "memory": <g fill="none" stroke={C.violet} strokeWidth="3"><path d="M38 52c0-10 6-16 12-16s12 6 12 16-6 14-12 14-12-4-12-14z" /><path d="M50 36v-6M44 66v6M56 66v6" /></g>,
    "wonderer": <g fill="none" stroke={C.cyan} strokeWidth="3"><circle cx="50" cy="52" r="13" /><path d="M50 39v26M37 52h26" /></g>,
  }[id] || <circle cx="50" cy="50" r="8" fill={col} />;
  // Accent per badge: the glyph's own colour becomes the ring, so every earned badge has its own face (16 Oct 2026).
  const accent = { "first-light": C.amber, "hello-world": C.lime, "all-the-keys": C.violet, "seven-days": C.amber, "thirty-days": C.amber, "boss-first-try": C.amber, "debugger": C.rose, "builder": C.violet, "machine-owner": C.lime, "binary-reader": C.amber, "logkeeper": C.violet, "vault-keeper": C.amber, "marathon": C.rose, "shortcut": C.amber, "lazy-programmer": C.lime, "arena-10": C.amber, "lamp-master": C.amber, "memory": C.violet }[id] || C.cyan;
  const ring = earned ? accent : C.line;
  return (
    <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
      {earned && <defs><radialGradient id={`bg-${id}`} cx="50%" cy="45%" r="55%"><stop offset="0" stopColor={accent} stopOpacity="0.35" /><stop offset="1" stopColor={accent} stopOpacity="0" /></radialGradient></defs>}
      {earned && <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />}
      <path d="M50 8l36 21v42L50 92 14 71V29z" fill={C.bg} stroke={ring} strokeWidth={earned ? 3 : 1.5} />
      {earned && <path d="M50 15l30 17.5v35L50 85 20 67.5v-35z" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />}
      {glyph}
      {!earned && <g fill="none" stroke={C.line} strokeWidth="2"><rect x="45" y="76" width="10" height="8" rx="1.5" fill={C.bg} /><path d="M47.5 76v-2.5a2.5 2.5 0 0 1 5 0V76" /></g>}
    </svg>
  );
}

/* A small icon for each kind of reward unlock. */
export function RewardIcon({ kind }) {
  const s = { fill: "none", stroke: C.amber, strokeWidth: 2.2 };
  if (kind === "level") return <svg viewBox="0 0 40 40"><path d="M8 30l8-10 6 6 10-14" {...s} /><path d="M26 12h6v6" {...s} /></svg>;
  if (kind === "streak") return <svg viewBox="0 0 40 40"><path d="M20 6c2 6 8 8 8 16a8 8 0 0 1-16 0c0-4 2-6 4-8 0 4 2 6 4 6 0-6-2-9 0-14z" {...s} /></svg>;
  if (kind === "module") return <svg viewBox="0 0 40 40"><path d="M8 12l12-6 12 6-12 6z" {...s} /><path d="M8 12v14l12 6 12-6V12" {...s} /><path d="M20 18v14" {...s} /></svg>;
  if (kind === "start") return <svg viewBox="0 0 40 40"><rect x="7" y="14" width="26" height="18" rx="2" {...s} /><path d="M7 20h26M20 14v-6M14 8h12" {...s} /><path d="M17 26h6" {...s} /></svg>; /* a box opening: a tool handed over the day its module opens (9 Nov 2026) */
  return <svg viewBox="0 0 40 40"><path d="M20 6l14 8v12l-14 8-14-8V14z" {...s} /></svg>;
}

/* ---------- Wonder illustrations: one small emblem per picture key, drawn in the lab's palette. ---------- */
const WONDER_PICS = {
  "globe-south": (c) => <g><circle cx="180" cy="100" r="62" fill="none" stroke={c.cyan} strokeWidth="2" /><ellipse cx="180" cy="100" rx="62" ry="22" fill="none" stroke={c.line} /><line x1="118" y1="100" x2="242" y2="100" stroke={c.amber} strokeWidth="2" strokeDasharray="4 3" /><ellipse cx="180" cy="152" rx="40" ry="9" fill={c.ink} opacity="0.9" /><circle cx="150" cy="100" r="5" fill={c.lime} /><text x="150" y="88" fontSize="9" textAnchor="middle" fill={c.lime} fontFamily="JetBrains Mono, monospace">Galápagos</text><text x="180" y="176" fontSize="9" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">Antarctica</text></g>,
  ice: (c) => <g><rect x="60" y="100" width="240" height="70" rx="6" fill={c.cyan} opacity="0.25" /><path d="M120 100 l20-40 40 10 30-25 20 55z" fill={c.ink} opacity="0.9" /><path d="M120 100 l110 0 -15 50 -80 0z" fill={c.ink} opacity="0.35" /><line x1="60" y1="100" x2="300" y2="100" stroke={c.cyan} strokeWidth="2" /></g>,
  mountain: (c) => <g><path d="M30 170 L110 60 L150 110 L200 40 L260 120 L330 170z" fill={c.violet} opacity="0.35" stroke={c.violet} strokeWidth="2" /><path d="M200 40 l-18 30 h36z" fill={c.ink} /><path d="M40 170 c40-20 80 10 120 0 s80-10 130 0" fill="none" stroke={c.cyan} strokeWidth="2" /><path d="M200 36 l0 -14" stroke={c.amber} strokeWidth="2" /><path d="M196 24 l4-6 4 6" fill="none" stroke={c.amber} strokeWidth="2" /></g>,
  stars: (c) => <g>{[[60,50,2],[110,30,1.5],[160,70,2.5],[230,40,1.5],[290,80,2],[320,30,1],[90,140,1.5],[250,150,2],[200,120,1]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill={c.ink} />)}<circle cx="160" cy="70" r="12" fill="none" stroke={c.amber} strokeWidth="1.5" strokeDasharray="3 3" /><text x="160" y="100" fontSize="9" textAnchor="middle" fill={c.amber} fontFamily="JetBrains Mono, monospace">light left 1,000 years ago</text></g>,
  chip: (c) => <g><rect x="130" y="60" width="100" height="80" rx="6" fill={c.bg} stroke={c.violet} strokeWidth="2.5" />{[...Array(8)].map((_,i)=><g key={i}><line x1={138+i*12} y1="48" x2={138+i*12} y2="60" stroke={c.violet} strokeWidth="2" /><line x1={138+i*12} y1="140" x2={138+i*12} y2="152" stroke={c.violet} strokeWidth="2" /></g>)}{[...Array(5)].map((_,r)=>[...Array(6)].map((_,k)=><rect key={`${r}${k}`} x={142+k*14} y={70+r*13} width="9" height="8" fill={(r+k)%2?c.amber:c.line} />))}</g>,
  cable: (c) => <g><path d="M20 70 c60-40 120 40 180 0 s100-30 140 0" fill="none" stroke={c.cyan} strokeWidth="3" /><path d="M20 160 c40-10 80 10 120 0" fill="none" stroke={c.line} strokeWidth="2" /><path d="M40 170 L120 100" stroke={c.amber} strokeWidth="2" strokeDasharray="3 3" /><rect x="22" y="40" width="40" height="22" rx="3" fill={c.bg} stroke={c.lime} /><rect x="298" y="40" width="40" height="22" rx="3" fill={c.bg} stroke={c.lime} /></g>,
  prism: (c) => <g><line x1="30" y1="100" x2="150" y2="100" stroke={c.ink} strokeWidth="2.5" /><path d="M150 60 L210 140 L150 140z" fill={c.bg} stroke={c.ink} strokeWidth="2" />{[[c.rose,-16],[c.amber,-8],[c.lime,0],[c.cyan,8],[c.violet,16]].map(([col,d],i)=><line key={i} x1="200" y1={110+d/2} x2="330" y2={100+d*2.2} stroke={col} strokeWidth="3" />)}</g>,
  dna: (c) => <g>{[...Array(9)].map((_,i)=>{const x=50+i*32;const y1=100+Math.sin(i/1.3)*35,y2=100-Math.sin(i/1.3)*35;return <g key={i}><line x1={x} y1={y1} x2={x} y2={y2} stroke={c.line} strokeWidth="2"/><circle cx={x} cy={y1} r="6" fill={[c.cyan,c.lime,c.amber,c.rose][i%4]}/><circle cx={x} cy={y2} r="6" fill={[c.rose,c.amber,c.lime,c.cyan][i%4]}/></g>;})}</g>,
  atom: (c) => <g><circle cx="180" cy="100" r="8" fill={c.amber} />{[0,60,120].map((a)=><ellipse key={a} cx="180" cy="100" rx="80" ry="28" fill="none" stroke={c.cyan} strokeWidth="1.5" transform={`rotate(${a} 180 100)`} />)}<circle cx="260" cy="100" r="4" fill={c.lime} /><circle cx="140" cy="78" r="4" fill={c.lime} /><circle cx="150" cy="130" r="4" fill={c.lime} /></g>,
  tablet: (c) => <g><rect x="110" y="40" width="140" height="120" rx="10" fill={c.amber} opacity="0.2" stroke={c.amber} strokeWidth="2" />{[...Array(5)].map((_,r)=><g key={r}>{[...Array(6)].map((_,k)=><path key={k} d={`M${125+k*20} ${58+r*20} l4 8 l4-8`} fill="none" stroke={c.ink} strokeWidth="2"/>)}</g>)}</g>,
  globe: (c) => <g><circle cx="130" cy="100" r="55" fill="none" stroke={c.cyan} strokeWidth="2" /><ellipse cx="130" cy="100" rx="55" ry="20" fill="none" stroke={c.line} /><ellipse cx="130" cy="100" rx="22" ry="55" fill="none" stroke={c.line} /><rect x="215" y="55" width="120" height="90" fill="none" stroke={c.amber} strokeWidth="2" /><path d="M235 70 h20 v30 h-20z M300 130 h25 v10 h-25z" fill={c.rose} opacity="0.6" /><text x="275" y="165" fontSize="9" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">the flat map stretches</text></g>,
  shield: (c) => <g><path d="M180 30 l60 22 v50 c0 40-30 60-60 70 c-30-10-60-30-60-70 v-50z" fill={c.bg} stroke={c.lime} strokeWidth="2.5" /><path d="M155 100 l18 18 32-36" fill="none" stroke={c.lime} strokeWidth="4" strokeLinecap="round" /></g>,
  orbit: (c) => <g><circle cx="180" cy="100" r="30" fill={c.cyan} opacity="0.3" stroke={c.cyan} strokeWidth="2" /><ellipse cx="180" cy="100" rx="120" ry="55" fill="none" stroke={c.line} strokeWidth="1.5" strokeDasharray="5 4" /><circle cx="300" cy="100" r="9" fill={c.ink} /><path d="M300 86 l14 -8" stroke={c.amber} strokeWidth="2" /><path d="M300 100 l0 -24" stroke={c.rose} strokeWidth="2" strokeDasharray="3 2" /></g>,
  logic: (c) => <g><path d="M100 60 h40 a30 30 0 0 1 0 60 h-40z" fill={c.bg} stroke={c.violet} strokeWidth="2.5" /><line x1="70" y1="75" x2="100" y2="75" stroke={c.lime} strokeWidth="3" /><line x1="70" y1="105" x2="100" y2="105" stroke={c.rose} strokeWidth="3" /><line x1="170" y1="90" x2="210" y2="90" stroke={c.rose} strokeWidth="3" /><text x="120" y="95" fontSize="12" textAnchor="middle" fill={c.violet} fontFamily="JetBrains Mono, monospace">AND</text><text x="230" y="94" fontSize="11" fill={c.soft} fontFamily="JetBrains Mono, monospace">1 AND 0 = 0</text></g>,
  delta: (c) => <g><path d="M180 20 v50 M180 70 c-30 30-60 40-90 100 M180 70 c-10 40-20 60-20 100 M180 70 c10 40 30 60 40 100 M180 70 c30 30 60 50 100 100" fill="none" stroke={c.cyan} strokeWidth="3" strokeLinecap="round" /><rect x="40" y="170" width="280" height="12" fill={c.cyan} opacity="0.25" /></g>,
  ship: (c) => <g><path d="M60 120 h240 l-30 40 h-180z" fill={c.amber} opacity="0.3" stroke={c.amber} strokeWidth="2" /><line x1="180" y1="120" x2="180" y2="40" stroke={c.ink} strokeWidth="3" /><path d="M180 45 l70 40 h-70z" fill={c.ink} opacity="0.8" />{[...Array(6)].map((_,i)=><rect key={i} x={75+i*38} y="126" width="30" height="10" fill={i%2?c.lime:c.bg} stroke={c.line}/>)}</g>,
  lightning: (c) => <g><ellipse cx="180" cy="55" rx="90" ry="30" fill={c.line} /><path d="M190 80 l-30 50 h25 l-15 50 50-65 h-25 l15-35z" fill={c.amber} /></g>,
  coin: (c) => <g><circle cx="150" cy="100" r="48" fill={c.amber} opacity="0.25" stroke={c.amber} strokeWidth="3" /><text x="150" y="116" fontSize="44" textAnchor="middle" fill={c.amber} fontFamily="Space Grotesk, sans-serif" fontWeight="700">৳</text><rect x="220" y="70" width="110" height="60" rx="6" fill={c.bg} stroke={c.line} strokeWidth="2" /><text x="275" y="106" fontSize="13" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">trust</text></g>,
  tape: (c) => <g>{[...Array(9)].map((_,i)=><rect key={i} x={30+i*36} y="85" width="32" height="32" fill={c.bg} stroke={c.cyan} strokeWidth="2"/>)}{["1","0","1","1","0"].map((t,i)=><text key={i} x={46+(i+2)*36} y="107" fontSize="16" textAnchor="middle" fill={c.ink} fontFamily="JetBrains Mono, monospace">{t}</text>)}<path d="M166 60 l14 20 14-20z" fill={c.amber} /></g>,
  moon: (c) => <g><circle cx="180" cy="100" r="50" fill={c.ink} opacity="0.9" /><circle cx="200" cy="88" r="48" fill={c.bg} /><circle cx="90" cy="60" r="2" fill={c.ink} /><circle cx="290" cy="140" r="2" fill={c.ink} /></g>,
  lock: (c) => <g><rect x="130" y="90" width="100" height="70" rx="10" fill={c.bg} stroke={c.cyan} strokeWidth="2.5" /><path d="M150 90 v-20 a30 30 0 0 1 60 0 v20" fill="none" stroke={c.cyan} strokeWidth="2.5" /><circle cx="180" cy="122" r="8" fill={c.amber} /><text x="180" y="185" fontSize="10" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">easy one way, hard the other</text></g>,
  leaf: (c) => <g><path d="M100 150 c0-80 60-110 160-110 c0 90-60 120-160 110z" fill={c.lime} opacity="0.35" stroke={c.lime} strokeWidth="2" /><path d="M100 150 c40-40 80-70 140-95" fill="none" stroke={c.lime} strokeWidth="2" /><circle cx="60" cy="50" r="14" fill={c.amber} /></g>,
  zero: (c) => <g><text x="180" y="130" fontSize="90" textAnchor="middle" fill={c.bg} stroke={c.cyan} strokeWidth="3" fontFamily="Space Grotesk, sans-serif" fontWeight="700">0</text></g>,
  ant: (c) => <g>{[0,1,2,3].map((i)=><g key={i} transform={`translate(${70+i*70} ${100+(i%2)*20})`}><ellipse cx="0" cy="0" rx="10" ry="6" fill={c.ink} /><ellipse cx="14" cy="0" rx="7" ry="5" fill={c.ink} /><ellipse cx="-14" cy="0" rx="9" ry="6" fill={c.ink} />{[-1,0,1].map((k)=><line key={k} x1={k*6} y1="0" x2={k*8} y2="12" stroke={c.ink} strokeWidth="1.5"/>)}</g>)}<path d="M40 150 c80-40 160 20 290-30" fill="none" stroke={c.amber} strokeWidth="1.5" strokeDasharray="3 4" /></g>,
  wave: (c) => <g><path d="M20 100 c20-50 40-50 60 0 s40 50 60 0 s40-50 60 0 s40 50 60 0 s40-50 60 0" fill="none" stroke={c.cyan} strokeWidth="3" /><text x="180" y="170" fontSize="10" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">push, release, push, release</text></g>,
  scales: (c) => <g><line x1="180" y1="40" x2="180" y2="160" stroke={c.ink} strokeWidth="3" /><line x1="80" y1="70" x2="280" y2="70" stroke={c.ink} strokeWidth="3" /><path d="M80 70 l-30 50 h60z M280 70 l-30 50 h60z" fill={c.amber} opacity="0.3" stroke={c.amber} strokeWidth="2" /><rect x="140" y="160" width="80" height="8" fill={c.ink} /></g>,
  flame: (c) => <g><path d="M180 40 c30 40 50 60 50 90 a50 50 0 0 1-100 0 c0-30 20-40 30-60 c0 20 10 30 20 30 c0-20-10-40 0-60z" fill={c.amber} opacity="0.8" /><path d="M180 90 c15 20 20 30 20 45 a20 20 0 0 1-40 0 c0-15 10-25 20-45z" fill={c.rose} opacity="0.8" /></g>,
  finch: (c) => <g>{[[90,"M0 0 l16 -4 l-2 8z",c.amber],[180,"M0 0 l26 -3 l-4 8z",c.lime],[270,"M0 0 l12 -10 l4 10z",c.cyan]].map(([x,beak,col],i)=><g key={i} transform={`translate(${x} 100)`}><ellipse cx="-14" cy="6" rx="22" ry="16" fill={c.ink} opacity="0.85" /><circle cx="4" cy="-6" r="11" fill={c.ink} /><path d={beak} fill={col} transform="translate(12 -6)" /></g>)}</g>,
  share: (c) => <g>{[[80,60],[180,40],[280,60],[120,150],[240,150]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="12" fill={c.bg} stroke={c.lime} strokeWidth="2.5"/>)}{[[80,60,180,40],[180,40,280,60],[80,60,120,150],[280,60,240,150],[120,150,240,150],[180,40,120,150]].map(([a,b,x,y],i)=><line key={i} x1={a} y1={b} x2={x} y2={y} stroke={c.line} strokeWidth="1.5"/>)}</g>,
  body: (c) => <g><circle cx="180" cy="40" r="16" fill="none" stroke={c.ink} strokeWidth="2.5" /><path d="M180 56 v70 M150 80 h60 M180 126 l-25 45 M180 126 l25 45" fill="none" stroke={c.ink} strokeWidth="2.5" strokeLinecap="round" /><ellipse cx="180" cy="98" rx="14" ry="10" fill={c.rose} opacity="0.6" /></g>,
  clock: (c) => <g>{[[110,"Dhaka",0],[250,"St John's",-285]].map(([x,name,ang],i)=><g key={i}><circle cx={x} cy="95" r="45" fill={c.bg} stroke={c.cyan} strokeWidth="2.5" /><line x1={x} y1="95" x2={x+30*Math.cos((ang-90)*Math.PI/180)} y2={95+30*Math.sin((ang-90)*Math.PI/180)} stroke={c.amber} strokeWidth="3" strokeLinecap="round" /><text x={x} y="165" fontSize="11" textAnchor="middle" fill={c.soft} fontFamily="JetBrains Mono, monospace">{name}</text></g>)}</g>,
  elephant: (c) => <g><ellipse cx="190" cy="110" rx="70" ry="45" fill={c.ink} opacity="0.85" /><circle cx="120" cy="95" r="32" fill={c.ink} opacity="0.85" /><path d="M100 115 c-10 30 0 50 20 60" fill="none" stroke={c.ink} strokeWidth="10" strokeLinecap="round" /><ellipse cx="135" cy="88" rx="18" ry="22" fill={c.ink} opacity="0.5" /><circle cx="112" cy="88" r="3" fill={c.bg} /></g>,
  sand: (c) => <g>{[...Array(6)].map((_,r)=>[...Array(10)].map((_,k)=><rect key={`${r}${k}`} x={60+k*24} y={40+r*22} width="22" height="20" fill={[c.cyan,c.violet,c.amber,c.lime][(r*3+k)%4]} opacity={0.3+((r+k)%3)*0.25} />))}</g>,
};
export function WonderArt({ pic }) {
  const draw = WONDER_PICS[pic] || WONDER_PICS.stars;
  return (
    <svg viewBox="0 0 360 200" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="200" fill={C.bg} />
      {draw(C)}
    </svg>
  );
}

/* ---------- Level medals (Abid, 16 Oct 2026: "give the badges a face so they look tempting to earn") ----------
   Ten original emblems, one per level in lib/rewards.js LEVELS. Three states: earned (full colour, glow), current
   (full colour, pulsing ring), locked (grey outline - the shape is visible so she knows what is coming, the colour is
   not). Drawn in code, no images: the palette stays the lab's and the medal never cuts off. */
const MEDAL = {
  1: { col: "#9fb0c7", name: "Newcomer" },          // steel
  2: { col: "#d08a4a", name: "Keyboard Apprentice" }, // bronze
  3: { col: "#22d3ee", name: "Builder" },           // cyan
  4: { col: "#a3e635", name: "Debugger" },          // lime
  5: { col: "#34d399", name: "Shell Walker" },      // terminal green
  6: { col: "#4ade80", name: "Systems Thinker" },   // circuit green
  7: { col: "#fb7185", name: "Defender" },          // rose
  8: { col: "#60a5fa", name: "Architect" },         // blueprint blue
  9: { col: "#a78bfa", name: "Engineer" },          // violet
  10: { col: "#fbbf24", name: "Master Builder" },   // gold
};

function MedalGlyph({ n, col }) {
  const s = { fill: "none", stroke: col, strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (n) {
    case 1: // a shield taking shape: the first step
      return <g {...s}><path d="M50 30l17 6v14c0 11-7 19-17 23-10-4-17-12-17-23V36z" /><path d="M43 52l5 5 10-11" /></g>;
    case 2: // keyboard, home row lit
      return <g {...s}><rect x="29" y="40" width="42" height="24" rx="4" /><g fill={col} stroke="none">{[34, 41, 48, 55, 62].map((x) => <rect key={x} x={x} y="45" width="5" height="4" rx="1" />)}{[36, 43, 50, 57].map((x) => <rect key={x} x={x} y="51" width="5" height="4" rx="1" opacity="0.55" />)}<rect x="39" y="57" width="22" height="3" rx="1" opacity="0.55" /></g></g>;
    case 3: // hammer and wrench crossed
      return <g {...s}><path d="M36 64l20-20" /><path d="M52 40l6-6 8 8-6 6z" fill={col} /><path d="M64 64L44 44" /><path d="M40 40a7 7 0 0 1 9-9l-4 4 3 3 4-4a7 7 0 0 1-9 9z" fill={col} /></g>;
    case 4: // the bug, in brackets - found and framed
      return <g {...s}><ellipse cx="50" cy="52" rx="9" ry="12" /><path d="M50 40v24M41 48l-7-4M41 56h-8M41 62l-6 5M59 48l7-4M59 56h8M59 62l6 5M45 40l-3-6M55 40l3-6" /><path d="M30 34v-6h6M70 34v-6h-6M30 66v6h6M70 66v6h-6" opacity="0.7" /></g>;
    case 5: // the terminal window with the prompt
      return <g {...s}><rect x="29" y="33" width="42" height="34" rx="4" /><path d="M29 41h42" /><path d="M37 49l6 5-6 5M47 59h12" strokeWidth="3.6" /></g>;
    case 6: // gears meshing: a system seen whole
      return <g {...s}><circle cx="43" cy="55" r="7" /><circle cx="43" cy="55" r="12" strokeDasharray="4 3.5" /><circle cx="60" cy="42" r="5" /><circle cx="60" cy="42" r="9" strokeDasharray="3 2.7" /><path d="M62 58l8 8M30 36l6 6" opacity="0.7" /></g>;
    case 7: // shield with a lock
      return <g {...s}><path d="M50 28l19 7v15c0 12-8 20-19 24-11-4-19-12-19-24V35z" /><rect x="43" y="50" width="14" height="11" rx="2" fill={col} /><path d="M46 50v-4a4 4 0 0 1 8 0v4" /></g>;
    case 8: // a blueprint: three nodes, one plan
      return <g {...s}><rect x="42" y="30" width="16" height="10" rx="2" /><rect x="29" y="58" width="16" height="10" rx="2" /><rect x="55" y="58" width="16" height="10" rx="2" /><path d="M50 40v9M50 49H37v9M50 49h13v9" /><circle cx="50" cy="49" r="2.5" fill={col} /></g>;
    case 9: // circuit traces into a chip
      return <g {...s}><rect x="40" y="40" width="20" height="20" rx="3" /><path d="M40 46h-9M40 54h-9M60 46h9M60 54h9M46 40v-9M54 40v-9M46 60v9M54 60v9" /><circle cx="50" cy="50" r="3" fill={col} /></g>;
    case 10: // the crown over the hex: Master Builder
      return <g {...s}><path d="M50 36l13 7v14l-13 7-13-7V43z" /><path d="M35 33l5-9 10 6 10-6 5 9z" fill={col} /><path d="M44 51l4 4 8-8" /></g>;
    default: return null;
  }
}

/** One level medal. state: "earned" | "current" | "locked". size in px (default 96). */
export function LevelMedal({ n, state = "locked", size = 96, label = true }) {
  const m = MEDAL[n] || MEDAL[1];
  const col = state === "locked" ? "#3d4f6e" : m.col;
  const id = `lm${n}${state}`;
  return (
    <svg viewBox="0 0 100 112" width={size} height={size * 1.12} role="img" aria-label={`Level ${n}: ${m.name}${state === "locked" ? " (locked)" : state === "current" ? " (your level)" : " (earned)"}`} className={`medal ${state}`}>
      <defs>
        <radialGradient id={id} cx="50%" cy="40%" r="60%"><stop offset="0" stopColor={col} stopOpacity={state === "locked" ? 0.08 : 0.35} /><stop offset="1" stopColor={col} stopOpacity="0" /></radialGradient>
      </defs>
      {state !== "locked" && <circle cx="50" cy="50" r="48" fill={`url(#${id})`} />}
      <circle cx="50" cy="50" r="42" fill="#0f1522" stroke={col} strokeWidth={state === "locked" ? 2 : 3.5} />
      <circle cx="50" cy="50" r="36" fill="none" stroke={col} strokeWidth="1" opacity={state === "locked" ? 0.4 : 0.7} strokeDasharray={state === "current" ? "3 3" : undefined} />
      {state !== "locked" && [...Array(8)].map((_, i) => { const a = (i / 8) * Math.PI * 2; return <circle key={i} cx={50 + 42 * Math.cos(a)} cy={50 + 42 * Math.sin(a)} r="1.8" fill={col} />; })}
      <MedalGlyph n={n} col={col} />
      <path d="M41 80h18l3 6-3 6H41l-3-6z" fill={state === "locked" ? "#1a2436" : col} stroke={col} strokeWidth="1.5" />
      <text x="50" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="Space Grotesk, sans-serif" fill={state === "locked" ? col : "#0f1522"}>{n}</text>
      {label && (() => { const w = m.name.toUpperCase().split(" "); const lines = w.length > 1 && m.name.length > 11 ? [w[0], w.slice(1).join(" ")] : [m.name.toUpperCase()]; return lines.map((t, i) => <text key={i} x="50" y={lines.length === 1 ? 106 : 102 + i * 9} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Space Grotesk, sans-serif" fill={state === "locked" ? "#6b7d96" : "#e8eef8"} letterSpacing="0.3">{t}</text>); })()}
    </svg>
  );
}
