/* Per-module illustrations, part 1: M1, M2, M4, CS2A, LX1, LX2, M5, CS1D, LV2, M6, M7. Server-safe, no hooks. */
import { Frame, C, MONO, Caption } from "./base";

const T = (props) => <text fontFamily={MONO} {...props} />;

/* M1: a gauge with three zones and a needle, and a pin on a path - where you start. */
export function M1() {
  const cx = 110, cy = 120, r = 70;
  const arc = (a0, a1, col) => {
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return <path d={`M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`} stroke={col} strokeWidth="12" fill="none" strokeLinecap="butt" />;
  };
  const na = Math.PI + Math.PI * 0.38;
  return (
    <Frame title="A gauge showing where you start">
      {arc(Math.PI, Math.PI + Math.PI / 3, C.rose)}
      {arc(Math.PI + Math.PI / 3, Math.PI + (2 * Math.PI) / 3, C.amber)}
      {arc(Math.PI + (2 * Math.PI) / 3, 2 * Math.PI, C.lime)}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = Math.PI + (i * Math.PI) / 6;
        return <line key={i} x1={cx + 54 * Math.cos(a)} y1={cy + 54 * Math.sin(a)} x2={cx + 60 * Math.cos(a)} y2={cy + 60 * Math.sin(a)} stroke={C.soft} strokeWidth="1.5" />;
      })}
      <line x1={cx} y1={cy} x2={cx + 58 * Math.cos(na)} y2={cy + 58 * Math.sin(na)} stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill={C.cyan} />
      <T x="40" y="150" fontSize="9" fill={C.rose}>not yet</T>
      <T x="94" y="36" fontSize="9" fill={C.amber}>nearly</T>
      <T x="160" y="150" fontSize="9" fill={C.lime}>solid</T>
      <path d="M215 150c30-20 20-60 60-70s40-40 60-50" stroke={C.line} strokeWidth="2" fill="none" strokeDasharray="4 4" />
      <circle cx="335" cy="30" r="5" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      <path d="M232 128l-12 24 24 0z" fill={C.cyan} />
      <circle cx="232" cy="124" r="10" fill={C.bg} stroke={C.cyan} strokeWidth="2.5" />
      <circle cx="232" cy="124" r="3.5" fill={C.cyan} />
      <T x="262" y="140" fontSize="10" fill={C.cyan}>you are here</T>
      <T x="292" y="22" fontSize="9" fill={C.soft}>the path</T>
      <Caption text="WHERE YOU START" />
    </Frame>
  );
}

/* M2: next-word prediction - the sentence and three candidate words with probabilities. */
export function M2() {
  const cands = [["mat", 62, C.lime], ["sofa", 25, C.cyan], ["roof", 13, C.soft]];
  return (
    <Frame title="An AI predicting the next word">
      <rect x="28" y="30" width="304" height="40" rx="8" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <T x="44" y="56" fontSize="15" fill={C.ink}>The cat sat on the</T>
      <rect x="252" y="40" width="54" height="22" rx="4" fill={C.bg} stroke={C.amber} strokeWidth="2" strokeDasharray="4 3" />
      <T x="279" y="56" fontSize="13" fill={C.amber} textAnchor="middle">?</T>
      <path d="M279 72v14" stroke={C.soft} strokeWidth="1.5" />
      <path d="M279 86l-150 14M279 86l0 14M279 86l50 14" stroke={C.line} strokeWidth="1.5" fill="none" />
      {cands.map(([w, p, col], i) => {
        const x = 70 + i * 100;
        const top = i === 0;
        return (
          <g key={w}>
            <rect x={x - 42} y="104" width="84" height="24" rx="5" fill={top ? "#1a2a1e" : C.bg} stroke={col} strokeWidth={top ? 2 : 1.2} />
            <T x={x} y="121" fontSize="12" fill={col} textAnchor="middle" fontWeight={top ? 700 : 400}>{w}</T>
            <rect x={x - 42} y="138" width="84" height="8" rx="2" fill={C.line} />
            <rect x={x - 42} y="138" width={84 * p / 100} height="8" rx="2" fill={col} />
            <T x={x} y="162" fontSize="10" fill={col} textAnchor="middle">{p}%</T>
          </g>
        );
      })}
      <T x="20" y="100" fontSize="9" fill={C.soft}>guesses</T>
      <Caption text="IT PREDICTS THE NEXT WORD" />
    </Frame>
  );
}

/* M4: a times-table grid with 7x8 lit, and a long-division bracket. */
export function M4() {
  const n = 6, s = 18, ox = 30, oy = 42;
  const rows = [3, 4, 5, 6, 7, 8], cols = [3, 4, 5, 6, 7, 8];
  return (
    <Frame title="Times table and long division">
      {cols.map((c, j) => <T key={`c${j}`} x={ox + j * s + s / 2} y={oy - 6} fontSize="9" fill={C.soft} textAnchor="middle">{c}</T>)}
      {rows.map((r, i) => <T key={`r${i}`} x={ox - 8} y={oy + i * s + 12} fontSize="9" fill={C.soft} textAnchor="end">{r}</T>)}
      {rows.map((r, i) => cols.map((c, j) => {
        const hot = r === 7 && c === 8;
        return (
          <g key={`${i}-${j}`}>
            <rect x={ox + j * s} y={oy + i * s} width={s - 1} height={s - 1} fill={hot ? C.amber : (r === 7 || c === 8 ? "#182538" : C.bg)} stroke={C.line} strokeWidth="0.8" />
            <T x={ox + j * s + s / 2} y={oy + i * s + 12} fontSize="8" fill={hot ? "#1a1300" : C.soft} textAnchor="middle" fontWeight={hot ? 700 : 400}>{r * c}</T>
          </g>
        );
      }))}
      <T x={ox + n * s / 2} y={oy + n * s + 18} fontSize="11" fill={C.amber} textAnchor="middle">7 × 8 = 56</T>
      <g fontFamily={MONO}>
        <T x="268" y="60" fontSize="16" fill={C.lime} textAnchor="middle">309</T>
        <path d="M232 70h74M232 70v46" stroke={C.cyan} strokeWidth="2" fill="none" />
        <T x="215" y="88" fontSize="14" fill={C.ink} textAnchor="middle">4</T>
        <T x="268" y="88" fontSize="14" fill={C.ink} textAnchor="middle">1236</T>
        <T x="258" y="108" fontSize="12" fill={C.soft} textAnchor="middle">−12</T>
        <path d="M236 113h40" stroke={C.line} strokeWidth="1.5" />
        <T x="272" y="128" fontSize="12" fill={C.soft} textAnchor="middle">36</T>
        <T x="272" y="146" fontSize="12" fill={C.soft} textAnchor="middle">−36</T>
        <path d="M252 151h40" stroke={C.line} strokeWidth="1.5" />
        <T x="282" y="166" fontSize="12" fill={C.lime} textAnchor="middle">0</T>
      </g>
      <Caption text="MULTIPLY, DIVIDE, CHECK" />
    </Frame>
  );
}

/* CS2A: a variable box, an if/else fork, a for loop. */
export function CS2A() {
  return (
    <Frame title="Variables, decisions and loops">
      <rect x="24" y="64" width="80" height="54" rx="6" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <rect x="24" y="52" width="38" height="16" rx="3" fill={C.cyan} />
      <T x="43" y="64" fontSize="10" fill="#04141a" textAnchor="middle" fontWeight="700">age</T>
      <T x="64" y="100" fontSize="22" fill={C.ink} textAnchor="middle">12</T>
      <T x="64" y="138" fontSize="10" fill={C.soft} textAnchor="middle">age = 12</T>
      <path d="M180 40v34" stroke={C.cyan} strokeWidth="2" />
      <path d="M180 74l-40 40M180 74l40 40" stroke={C.cyan} strokeWidth="2" fill="none" />
      <polygon points="180,60 200,74 180,88 160,74" fill={C.bg} stroke={C.amber} strokeWidth="2" />
      <T x="180" y="78" fontSize="9" fill={C.amber} textAnchor="middle">&gt; 10?</T>
      <rect x="112" y="114" width="52" height="20" rx="4" fill={C.bg} stroke={C.lime} strokeWidth="1.5" />
      <T x="138" y="128" fontSize="10" fill={C.lime} textAnchor="middle">if: big</T>
      <rect x="196" y="114" width="52" height="20" rx="4" fill={C.bg} stroke={C.rose} strokeWidth="1.5" />
      <T x="222" y="128" fontSize="10" fill={C.rose} textAnchor="middle">else</T>
      <T x="180" y="152" fontSize="10" fill={C.soft} textAnchor="middle">decide</T>
      <path d="M290 110a30 30 0 1 1 30 -30" stroke={C.violet} strokeWidth="2.5" fill="none" />
      <path d="M320 80l-8-8M320 80l8-8" stroke={C.violet} strokeWidth="2.5" fill="none" />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={290 + 30 * Math.cos(Math.PI / 2 + i * 1.1)} cy={80 + 30 * Math.sin(Math.PI / 2 + i * 1.1)} r="3" fill={C.violet} />)}
      <T x="290" y="84" fontSize="9" fill={C.violet} textAnchor="middle">×5</T>
      <T x="290" y="138" fontSize="9" fill={C.soft} textAnchor="middle">for n in range(5)</T>
      <Caption text="REMEMBER · DECIDE · REPEAT" />
    </Frame>
  );
}

/* LX1: a stick writes a new system onto the laptop's disk; the disk gets a lock; the hash matched. */
export function LX1() {
  return (
    <Frame title="Installing an operating system from a USB stick">
      <rect x="30" y="76" width="56" height="26" rx="4" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <rect x="86" y="82" width="18" height="14" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <T x="58" y="93" fontSize="9" fill={C.cyan} textAnchor="middle">MINT</T>
      <path d="M110 89h52" stroke={C.cyan} strokeWidth="2" strokeDasharray="5 4" />
      <path d="M156 83l8 6-8 6" stroke={C.cyan} strokeWidth="2" fill="none" />
      <path d="M186 42h120a5 5 0 0 1 5 5v70H181V47a5 5 0 0 1 5-5z" stroke={C.cyan} strokeWidth="1.5" fill="none" />
      <path d="M166 122h160l10 16H156z" stroke={C.cyan} strokeWidth="1.5" fill={C.bg} />
      <rect x="194" y="56" width="104" height="14" rx="3" fill={C.line} />
      <rect x="194" y="56" width="66" height="14" rx="3" fill={C.lime} />
      <T x="246" y="84" fontSize="9" fill={C.soft} textAnchor="middle">writing the disk · 63%</T>
      <rect x="194" y="92" width="104" height="14" rx="3" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
      <T x="236" y="102" fontSize="9" fill={C.amber} textAnchor="middle">encrypted disk</T>
      <rect x="282" y="94" width="10" height="9" rx="1.5" fill={C.amber} />
      <path d="M284 94v-3a3 3 0 0 1 6 0v3" stroke={C.amber} strokeWidth="1.5" fill="none" />
      <rect x="30" y="126" width="96" height="40" rx="5" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <T x="38" y="142" fontSize="9" fill={C.soft}>sha256</T>
      <T x="38" y="156" fontSize="9" fill={C.ink}>8f3a…c1e2</T>
      <path d="M104 146l6 7 12-14" stroke={C.lime} strokeWidth="2.5" fill="none" />
      <Caption text="YOUR OWN SYSTEM, INSTALLED BY YOU" />
    </Frame>
  );
}

/* LX2: a terminal window with a prompt, ls output and a cursor. */
export function LX2() {
  return (
    <Frame title="A terminal window">
      <rect x="34" y="26" width="292" height="142" rx="8" fill="#0a0f1a" stroke={C.line} strokeWidth="1.5" />
      <rect x="34" y="26" width="292" height="20" rx="8" fill="#182538" />
      <circle cx="48" cy="36" r="4" fill={C.rose} /><circle cx="62" cy="36" r="4" fill={C.amber} /><circle cx="76" cy="36" r="4" fill={C.lime} />
      <T x="180" y="40" fontSize="9" fill={C.soft} textAnchor="middle">Terminal</T>
      <T x="46" y="66" fontSize="11" fill={C.lime}>faiza@mint:~$ <tspan fill={C.ink}>ls school</tspan></T>
      <T x="46" y="86" fontSize="11" fill={C.cyan}>programs/</T>
      <T x="130" y="86" fontSize="11" fill={C.cyan}>notes/</T>
      <T x="200" y="86" fontSize="11" fill={C.ink}>README.md</T>
      <T x="46" y="106" fontSize="11" fill={C.lime}>faiza@mint:~$ <tspan fill={C.ink}>cat school/README.md</tspan></T>
      <T x="46" y="126" fontSize="11" fill={C.soft}># Faiza's school folder</T>
      <T x="46" y="150" fontSize="11" fill={C.lime}>faiza@mint:~$ </T>
      <rect x="146" y="141" width="7" height="12" fill={C.ink} />
      <Caption text="THE TERMINAL, PROPERLY" />
    </Frame>
  );
}

/* M5: 2/4 and 1/2 are the same point on the number line. */
export function M5() {
  const pie = (cx, cy, r, n, shaded, col) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n, a1 = a0 + (2 * Math.PI) / n;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      out.push(<path key={i} d={`M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z`} fill={i < shaded ? col : C.bg} fillOpacity={i < shaded ? 0.85 : 1} stroke={C.ink} strokeWidth="1.5" />);
    }
    return out;
  };
  return (
    <Frame title="Two quarters equal one half">
      {pie(90, 70, 40, 4, 2, C.amber)}
      <T x="90" y="128" fontSize="12" fill={C.amber} textAnchor="middle">2/4</T>
      <T x="180" y="76" fontSize="22" fill={C.ink} textAnchor="middle">=</T>
      {pie(270, 70, 40, 2, 1, C.cyan)}
      <T x="270" y="128" fontSize="12" fill={C.cyan} textAnchor="middle">1/2</T>
      <line x1="40" y1="156" x2="320" y2="156" stroke={C.soft} strokeWidth="2" />
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => <line key={i} x1={40 + 280 * f} y1="150" x2={40 + 280 * f} y2="162" stroke={C.soft} strokeWidth="1.5" />)}
      <T x="40" y="174" fontSize="10" fill={C.soft} textAnchor="middle">0</T>
      <T x="320" y="174" fontSize="10" fill={C.soft} textAnchor="middle">1</T>
      <circle cx="180" cy="156" r="6" fill={C.lime} />
      <T x="180" y="145" fontSize="10" fill={C.lime} textAnchor="middle">1/2 = 2/4</T>
      <Caption text="SAME POINT, DIFFERENT NAME" />
    </Frame>
  );
}

/* CS1D (was CS1C's picture until 29 Oct 2026, when the hardening half became CS1D): the laptop with its doors checked -
   firewall, lock, backup, updates - and one port closed. */
export function CS1D() {
  const door = (x, y, label, ok) => (
    <g key={label}>
      <rect x={x - 40} y={y - 11} width="80" height="22" rx="4" fill={C.bg} stroke={C.lime} strokeWidth="1.5" />
      <T x={x - 7} y={y + 4} fontSize="9" fill={C.ink} textAnchor="middle">{label}</T>
      <path d={`M${x + 22} ${y}l3 4 6-8`} stroke={C.lime} strokeWidth="2" fill="none" />
    </g>
  );
  return (
    <Frame title="A laptop with every door checked">
      <path d="M130 56h100a5 5 0 0 1 5 5v58H125V61a5 5 0 0 1 5-5z" stroke={C.cyan} strokeWidth="1.5" fill="none" />
      <path d="M112 119h136l8 14H104z" stroke={C.cyan} strokeWidth="1.5" fill={C.bg} />
      <rect x="135" y="66" width="90" height="44" rx="2" fill="#0a0f1a" />
      <T x="180" y="92" fontSize="10" fill={C.lime} textAnchor="middle">check: OK</T>
      {door(62, 60, "firewall", true)}
      {door(298, 60, "disk lock", true)}
      {door(62, 150, "backup", true)}
      {door(298, 150, "updates", true)}
      <path d="M102 60h22M258 60h-20M102 150l20-14M258 150l-20-14" stroke={C.line} strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="134" y="144" width="92" height="20" rx="4" fill={C.bg} stroke={C.rose} strokeWidth="1.5" />
      <T x="168" y="158" fontSize="9" fill={C.rose} textAnchor="middle">port 8000</T>
      <line x1="206" y1="149" x2="214" y2="159" stroke={C.rose} strokeWidth="2" /><line x1="214" y1="149" x2="206" y2="159" stroke={C.rose} strokeWidth="2" />
      <T x="180" y="176" fontSize="9" fill={C.soft} textAnchor="middle">no open door</T>
      <Caption text="INSTALLED IS NOT SAFE - CHECKED IS" />
    </Frame>
  );
}

/* LV2: the AI hands over code; the magnifying glass and the tests decide. */
export function LV2() {
  return (
    <Frame title="AI writes the code, the tests check it">
      <rect x="30" y="50" width="48" height="48" rx="8" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      {[0, 1, 2].map((i) => <line key={`a${i}`} x1={42 + i * 12} y1="42" x2={42 + i * 12} y2="50" stroke={C.violet} strokeWidth="2" />)}
      {[0, 1, 2].map((i) => <line key={`b${i}`} x1={42 + i * 12} y1="98" x2={42 + i * 12} y2="106" stroke={C.violet} strokeWidth="2" />)}
      <T x="54" y="78" fontSize="10" fill={C.violet} textAnchor="middle">AI</T>
      <path d="M84 74h36" stroke={C.violet} strokeWidth="2" /><path d="M114 68l8 6-8 6" stroke={C.violet} strokeWidth="2" fill="none" />
      <rect x="128" y="40" width="110" height="68" rx="5" fill="#0a0f1a" stroke={C.line} strokeWidth="1.5" />
      <T x="136" y="56" fontSize="9" fill={C.ink}>def count_vowels(t):</T>
      <T x="136" y="70" fontSize="9" fill={C.soft}>  n = 0</T>
      <T x="136" y="84" fontSize="9" fill={C.soft}>  for ch in t:</T>
      <T x="136" y="98" fontSize="9" fill={C.amber}>    if ch in "aeiou":</T>
      <circle cx="280" cy="66" r="22" fill="none" stroke={C.cyan} strokeWidth="3" />
      <line x1="296" y1="82" x2="316" y2="102" stroke={C.cyan} strokeWidth="5" strokeLinecap="round" />
      <T x="280" y="71" fontSize="12" fill={C.cyan} textAnchor="middle">test</T>
      <T x="40" y="134" fontSize="10" fill={C.rose}>HELLO → 0   bug</T>
      <line x1="40" y1="131" x2="130" y2="131" stroke={C.rose} strokeWidth="1.5" />
      <T x="40" y="152" fontSize="10" fill={C.lime}>HELLO → 2  ✓</T>
      <T x="150" y="152" fontSize="10" fill={C.lime}>"" → 0  ✓</T>
      <T x="240" y="152" fontSize="10" fill={C.lime}>rhythm → 0  ✓</T>
      <T x="40" y="170" fontSize="9" fill={C.soft}>the test found what the AI missed: .lower()</T>
      <Caption text="A DRAFT UNTIL YOU CHECK IT" />
    </Frame>
  );
}

/* M6: 1/3 + 1/4 become 4/12 + 3/12 = 7/12. */
export function M6() {
  const pie = (cx, cy, r, n, shaded, col, thin) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n, a1 = a0 + (2 * Math.PI) / n;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      out.push(<path key={i} d={`M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z`} fill={i < shaded ? col : C.bg} fillOpacity={i < shaded ? 0.85 : 1} stroke={thin ? C.soft : C.ink} strokeWidth={thin ? 0.8 : 1.5} />);
    }
    return out;
  };
  return (
    <Frame title="Adding fractions with a common denominator">
      {pie(60, 52, 28, 3, 1, C.amber)}
      <T x="60" y="94" fontSize="11" fill={C.amber} textAnchor="middle">1/3</T>
      <T x="105" y="58" fontSize="16" fill={C.ink} textAnchor="middle">+</T>
      {pie(150, 52, 28, 4, 1, C.cyan)}
      <T x="150" y="94" fontSize="11" fill={C.cyan} textAnchor="middle">1/4</T>
      <path d="M196 52h30" stroke={C.soft} strokeWidth="2" /><path d="M220 46l8 6-8 6" stroke={C.soft} strokeWidth="2" fill="none" />
      {pie(270, 52, 28, 12, 4, C.amber, true)}
      <T x="270" y="94" fontSize="11" fill={C.amber} textAnchor="middle">4/12</T>
      <T x="315" y="58" fontSize="16" fill={C.ink} textAnchor="middle">+</T>
      {pie(60, 132, 26, 12, 3, C.cyan, true)}
      <T x="60" y="170" fontSize="11" fill={C.cyan} textAnchor="middle">3/12</T>
      <T x="105" y="138" fontSize="16" fill={C.ink} textAnchor="middle">=</T>
      {pie(150, 132, 26, 12, 7, C.lime, true)}
      <T x="150" y="170" fontSize="11" fill={C.lime} textAnchor="middle">7/12</T>
      <T x="270" y="124" fontSize="10" fill={C.soft} textAnchor="middle">same size pieces</T>
      <T x="270" y="140" fontSize="10" fill={C.soft} textAnchor="middle">(twelfths), then</T>
      <T x="270" y="156" fontSize="10" fill={C.soft} textAnchor="middle">just add the tops</T>
      <Caption text="CUT TO THE SAME SIZE, THEN ADD" />
    </Frame>
  );
}

/* M7: a ruler from 3.0 to 3.5 in tenths, and 3.407 split into place-value boxes. */
export function M7() {
  const x0 = 40, x1 = 320;
  const boxes = [["3", "ones", C.ink], [".", "", C.amber], ["4", "tenths", C.cyan], ["0", "100ths", C.cyan], ["7", "1000ths", C.cyan]];
  return (
    <Frame title="Decimals on a ruler and in place-value boxes">
      <rect x={x0 - 8} y="40" width={x1 - x0 + 16} height="30" rx="3" fill="#182538" stroke={C.line} />
      {[...Array(51)].map((_, i) => {
        const x = x0 + ((x1 - x0) * i) / 50;
        const big = i % 10 === 0, mid = i % 5 === 0;
        return <line key={i} x1={x} y1="40" x2={x} y2={big ? 62 : mid ? 54 : 48} stroke={big ? C.ink : C.soft} strokeWidth={big ? 1.5 : 0.8} />;
      })}
      {[0, 1, 2, 3, 4, 5].map((i) => <T key={i} x={x0 + ((x1 - x0) * i) / 5} y="84" fontSize="10" fill={C.soft} textAnchor="middle">3.{i}</T>)}
      <circle cx={x0 + (x1 - x0) * 0.814} cy="40" r="5" fill={C.lime} />
      <T x={x0 + (x1 - x0) * 0.814} y="32" fontSize="10" fill={C.lime} textAnchor="middle">3.407</T>
      {boxes.map(([d, lbl, col], i) => {
        const w = i === 1 ? 20 : 54, x = 40 + [0, 58, 82, 146, 210][i];
        return (
          <g key={i}>
            {i === 1 ? <circle cx={x + 10} cy="122" r="5" fill={C.amber} /> : <rect x={x} y="100" width={w} height="36" rx="4" fill={C.bg} stroke={col} strokeWidth="1.5" />}
            {i !== 1 ? <T x={x + w / 2} y="125" fontSize="18" fill={col} textAnchor="middle">{d}</T> : null}
            <T x={x + w / 2} y="150" fontSize="9" fill={C.soft} textAnchor="middle">{lbl}</T>
          </g>
        );
      })}
      <T x="180" y="168" fontSize="10" fill={C.soft} textAnchor="middle">3 + 4/10 + 0/100 + 7/1000</T>
      <Caption text="THE POINT IS THE MIDDLE OF THE NUMBER" />
    </Frame>
  );
}
