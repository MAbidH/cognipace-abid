/* Per-module illustrations, part 4: M12, M13, SS4, CSTINY, AI1, AI2, M14, M15, SS5, M3, GK1. Server-safe, no hooks. */
import { Frame, C, MONO, Caption } from "./base";

const T = (props) => <text fontFamily={MONO} {...props} />;

/* M12: a coordinate grid with y = 2x + 1 and a second line crossing it at (1, 3). */
export function M12() {
  const ox = 120, oy = 96, u = 12; // origin and one unit
  const X = (x) => ox + x * u, Y = (y) => oy - y * u;
  return (
    <Frame title="Two lines crossing on a grid">
      {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} stroke={C.line} strokeWidth="1">
          <line x1={X(i)} y1={Y(-5)} x2={X(i)} y2={Y(5)} />
          <line x1={X(-5)} y1={Y(i)} x2={X(5)} y2={Y(i)} />
        </g>
      ))}
      <line x1={X(-5.6)} y1={oy} x2={X(5.6)} y2={oy} stroke={C.soft} strokeWidth="1.5" />
      <line x1={ox} y1={Y(5.6)} x2={ox} y2={Y(-5.6)} stroke={C.soft} strokeWidth="1.5" />
      <T x={X(5.6) + 4} y={oy + 4} fontSize="9" fill={C.soft}>x</T>
      <T x={ox + 5} y={Y(5.6)} fontSize="9" fill={C.soft}>y</T>
      {/* y = 2x + 1 from x=-3 (y=-5) to x=2 (y=5) */}
      <line x1={X(-3)} y1={Y(-5)} x2={X(2)} y2={Y(5)} stroke={C.cyan} strokeWidth="2.5" />
      {/* y = -x + 4 from x=-1 (y=5) to x=5 (y=-1) */}
      <line x1={X(-1)} y1={Y(5)} x2={X(5)} y2={Y(-1)} stroke={C.amber} strokeWidth="2.5" />
      <circle cx={X(1)} cy={Y(3)} r="7" fill="none" stroke={C.lime} strokeWidth="2" />
      <circle cx={X(1)} cy={Y(3)} r="2.5" fill={C.lime} />
      <T x={X(1) + 10} y={Y(3) - 8} fontSize="10" fill={C.lime} fontWeight="700">(1, 3)</T>
      <rect x="236" y="30" width="110" height="64" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <T x="246" y="50" fontSize="11" fill={C.cyan}>y = 2x + 1</T>
      <T x="246" y="70" fontSize="11" fill={C.amber}>y = -x + 4</T>
      <T x="246" y="88" fontSize="9" fill={C.lime}>both true at (1, 3)</T>
      <T x="246" y="118" fontSize="9" fill={C.soft}>one line = a rule</T>
      <T x="246" y="132" fontSize="9" fill={C.soft}>two lines = two</T>
      <T x="246" y="146" fontSize="9" fill={C.soft}>unknowns, solved</T>
      <Caption text="WHERE TWO RULES AGREE" />
    </Frame>
  );
}

/* M13: a truth table for P AND Q, and the chain P -> Q, P, therefore Q. */
export function M13() {
  const rows = [["T", "T", "T"], ["T", "F", "F"], ["F", "T", "F"], ["F", "F", "F"]];
  const col = (v) => (v === "T" ? C.lime : C.rose);
  return (
    <Frame title="A truth table and a proof chain">
      <rect x="24" y="28" width="150" height="128" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <line x1="24" y1="54" x2="174" y2="54" stroke={C.line} strokeWidth="1.5" />
      <line x1="74" y1="28" x2="74" y2="156" stroke={C.line} strokeWidth="1" />
      <line x1="124" y1="28" x2="124" y2="156" stroke={C.line} strokeWidth="1" />
      <T x="49" y="45" fontSize="11" fill={C.ink} textAnchor="middle" fontWeight="700">P</T>
      <T x="99" y="45" fontSize="11" fill={C.ink} textAnchor="middle" fontWeight="700">Q</T>
      <T x="149" y="45" fontSize="10" fill={C.cyan} textAnchor="middle" fontWeight="700">P and Q</T>
      {rows.map((r, i) => (
        <g key={i}>
          {r.map((v, j) => <T key={j} x={49 + j * 50} y={76 + i * 25} fontSize="12" fill={col(v)} textAnchor="middle" fontWeight="700">{v}</T>)}
        </g>
      ))}
      <T x="99" y="170" fontSize="9" fill={C.soft} textAnchor="middle">true only when both are</T>
      {/* proof chain */}
      <rect x="206" y="34" width="128" height="30" rx="6" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <T x="270" y="54" fontSize="12" fill={C.cyan} textAnchor="middle">P → Q</T>
      <rect x="206" y="76" width="128" height="30" rx="6" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <T x="270" y="96" fontSize="12" fill={C.cyan} textAnchor="middle">P</T>
      <line x1="206" y1="114" x2="334" y2="114" stroke={C.soft} strokeWidth="1.5" />
      <path d="M270 114v10" stroke={C.lime} strokeWidth="2" />
      <path d="M265 120l5 6 5-6" stroke={C.lime} strokeWidth="2" fill="none" />
      <rect x="206" y="128" width="128" height="30" rx="6" fill="#1a2a1e" stroke={C.lime} strokeWidth="2" />
      <T x="270" y="148" fontSize="12" fill={C.lime} textAnchor="middle" fontWeight="700">∴ Q   proved ✓</T>
      <T x="270" y="172" fontSize="9" fill={C.soft} textAnchor="middle">if the rule and P hold, Q must</T>
      <Caption text="KNOWING FOR SURE" />
    </Frame>
  );
}

/* SS4: a crowd of dots becomes bars in a ballot box; a second rule gives another winner. */
export function SS4() {
  const cols = [C.cyan, C.amber, C.rose];
  const dots = [];
  for (let i = 0; i < 30; i++) dots.push({ x: 28 + (i % 6) * 14, y: 36 + Math.floor(i / 6) * 14, c: cols[i < 12 ? 0 : i < 22 ? 1 : 2] });
  return (
    <Frame title="A crowd becomes a decision">
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="4.5" fill={d.c} />)}
      <T x="63" y="124" fontSize="9" fill={C.soft} textAnchor="middle">30 voters</T>
      <path d="M118 70h26" stroke={C.soft} strokeWidth="1.5" />
      <path d="M140 65l6 5-6 5" stroke={C.soft} strokeWidth="1.5" fill="none" />
      {/* ballot box */}
      <rect x="150" y="48" width="60" height="50" rx="4" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      <rect x="166" y="42" width="28" height="6" rx="1" fill={C.ink} />
      <T x="180" y="80" fontSize="9" fill={C.soft} textAnchor="middle">ballots</T>
      <path d="M212 70h22" stroke={C.soft} strokeWidth="1.5" />
      <path d="M230 65l6 5-6 5" stroke={C.soft} strokeWidth="1.5" fill="none" />
      {/* result bars */}
      {[[12, 0], [10, 1], [8, 2]].map(([n, i]) => (
        <g key={i}>
          <rect x="244" y={44 + i * 20} width={n * 7} height="13" rx="2" fill={cols[i]} />
          <T x={248 + n * 7} y={54 + i * 20} fontSize="9" fill={cols[i]}>{n}</T>
        </g>
      ))}
      <T x="244" y="116" fontSize="9" fill={C.lime}>most votes: blue wins</T>
      {/* second rule */}
      <rect x="24" y="134" width="312" height="36" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <T x="32" y="149" fontSize="9" fill={C.soft}>same votes, ranked rule:</T>
      <rect x="32" y="155" width="60" height="8" rx="2" fill={C.cyan} /><rect x="96" y="155" width="90" height="8" rx="2" fill={C.amber} /><rect x="190" y="155" width="34" height="8" rx="2" fill={C.rose} />
      <T x="236" y="163" fontSize="9" fill={C.amber}>amber wins</T>
      <T x="200" y="149" fontSize="9" fill={C.violet}>(red voters' 2nd choice)</T>
      <Caption text="THE RULE CHOOSES TOO" />
    </Frame>
  );
}

/* CSTINY: h e l l _ -> a tiny network -> o 71%; a loss curve going down. */
export function CSTINY() {
  const inp = [60, 90, 120], hid = [48, 76, 104, 132], out = [62, 90, 118];
  return (
    <Frame title="A tiny model predicting the next letter">
      {["h", "e", "l", "l", "_"].map((ch, i) => (
        <g key={i}>
          <rect x={24 + i * 30} y="22" width="26" height="26" rx="4" fill={i === 4 ? "#2a2410" : C.bg} stroke={i === 4 ? C.amber : C.line} strokeWidth={i === 4 ? 2 : 1.5} />
          <T x={37 + i * 30} y="40" fontSize="13" fill={i === 4 ? C.amber : C.ink} textAnchor="middle" fontWeight="700">{ch}</T>
        </g>
      ))}
      <T x="98" y="62" fontSize="9" fill={C.soft} textAnchor="middle">what comes next?</T>
      {/* network */}
      {inp.map((y) => hid.map((hy) => <line key={`${y}-${hy}`} x1="60" y1={y + 30} x2="110" y2={hy + 30} stroke={C.line} strokeWidth="1" />))}
      {hid.map((hy) => out.map((y) => <line key={`${hy}-${y}`} x1="110" y1={hy + 30} x2="160" y2={y + 30} stroke={C.line} strokeWidth="1" />))}
      {inp.map((y) => <circle key={y} cx="60" cy={y + 30} r="5" fill={C.cyan} />)}
      {hid.map((y) => <circle key={y} cx="110" cy={y + 30} r="5" fill={C.violet} />)}
      {out.map((y, i) => <circle key={y} cx="160" cy={y + 30} r="5" fill={i === 1 ? C.lime : C.soft} />)}
      {/* output bars */}
      {[["o", 71, C.lime], ["p", 12, C.soft], ["a", 9, C.soft]].map(([ch, p, col], i) => (
        <g key={ch}>
          <T x="186" y={84 + i * 22} fontSize="11" fill={col} fontWeight={i === 0 ? 700 : 400}>{ch}</T>
          <rect x="200" y={74 + i * 22} width={p * 1.1} height="12" rx="2" fill={col} opacity={i === 0 ? 1 : 0.6} />
          <T x={206 + p * 1.1} y={84 + i * 22} fontSize="9" fill={col}>{p}%</T>
        </g>
      ))}
      {/* loss curve */}
      <rect x="248" y="124" width="92" height="46" rx="4" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <path d="M254 140c10 16 26 24 42 26s26 1 38 2" stroke={C.rose} strokeWidth="2" fill="none" />
      <T x="294" y="136" fontSize="9" fill={C.soft} textAnchor="middle">loss, going down</T>
      <T x="60" y="170" fontSize="9" fill={C.soft} textAnchor="middle">letters in</T>
      <Caption text="IT IS PREDICTING THE NEXT LETTER" />
    </Frame>
  );
}

/* AI1: a plain single-board computer whose chip speaks; offline switch on, cloud crossed. */
export function AI1() {
  return (
    <Frame title="A small computer running its own model">
      <rect x="36" y="70" width="150" height="96" rx="6" fill="#163a2a" stroke={C.lime} strokeWidth="1.5" />
      {[...Array(14)].map((_, i) => <rect key={i} x={46 + i * 9} y="76" width="4" height="8" fill={C.amber} />)}
      <rect x="86" y="100" width="40" height="40" rx="3" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <T x="106" y="124" fontSize="9" fill={C.violet} textAnchor="middle">CPU</T>
      <rect x="140" y="104" width="36" height="22" rx="2" fill={C.bg} stroke={C.soft} strokeWidth="1.5" />
      <T x="158" y="118" fontSize="8" fill={C.soft} textAnchor="middle">ETH</T>
      <rect x="44" y="104" width="30" height="14" rx="2" fill={C.bg} stroke={C.soft} strokeWidth="1.2" />
      <rect x="44" y="124" width="30" height="14" rx="2" fill={C.bg} stroke={C.soft} strokeWidth="1.2" />
      <T x="59" y="114" fontSize="7" fill={C.soft} textAnchor="middle">USB</T>
      <T x="59" y="134" fontSize="7" fill={C.soft} textAnchor="middle">USB</T>
      <rect x="86" y="148" width="60" height="10" rx="2" fill={C.bg} stroke={C.lime} strokeWidth="1.2" />
      <T x="116" y="156" fontSize="7" fill={C.lime} textAnchor="middle">8 GB RAM</T>
      {/* speech bubble from the chip */}
      <path d="M126 96l10-14h-6z" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <rect x="128" y="28" width="150" height="46" rx="8" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <path d="M136 74l-6 12 14-12" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <T x="203" y="47" fontSize="11" fill={C.ink} textAnchor="middle">Hello, I am yours.</T>
      <T x="203" y="64" fontSize="9" fill={C.soft} textAnchor="middle">a few words a second</T>
      {/* offline toggle */}
      <rect x="222" y="100" width="44" height="18" rx="9" fill="#1a2a1e" stroke={C.lime} strokeWidth="2" />
      <circle cx="256" cy="109" r="7" fill={C.lime} />
      <T x="274" y="113" fontSize="10" fill={C.lime}>offline</T>
      {/* cloud crossed */}
      <path d="M232 150c-10 0-14-8-8-14 0-10 14-12 18-6 6-6 20-2 18 8 8 0 8 12-2 12z" fill={C.bg} stroke={C.soft} strokeWidth="1.5" opacity="0.6" />
      <line x1="222" y1="134" x2="262" y2="156" stroke={C.rose} strokeWidth="2" />
      <T x="274" y="146" fontSize="9" fill={C.soft}>cloud: off</T>
      <T x="274" y="158" fontSize="9" fill={C.soft}>(a switch)</T>
      {/* memory file */}
      <path d="M300 64h22l8 8v26h-30z" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
      <path d="M322 64v8h8" stroke={C.amber} strokeWidth="1.5" fill="none" />
      <T x="315" y="86" fontSize="7" fill={C.amber} textAnchor="middle">memory</T>
      <T x="315" y="94" fontSize="7" fill={C.amber} textAnchor="middle">.txt</T>
      <Caption text="YOUR MODEL, ON YOUR MACHINE" />
    </Frame>
  );
}

/* AI2: microphone -> wave -> chip (speech to text) -> "hello" -> chip (text to speech) -> wave -> speaker. */
export function AI2() {
  const wave = (x, col) => <path d={`M${x} 90l4-10 4 20 4-24 4 28 4-20 4 12 4-6`} stroke={col} strokeWidth="2" fill="none" />;
  return (
    <Frame title="Speech in, text, speech out">
      {/* microphone */}
      <rect x="30" y="56" width="18" height="34" rx="9" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      <path d="M24 84a15 15 0 0 0 30 0M39 99v10M31 109h16" stroke={C.ink} strokeWidth="2" fill="none" />
      <T x="39" y="128" fontSize="9" fill={C.soft} textAnchor="middle">mic</T>
      {wave(62, C.cyan)}
      {/* chip 1 */}
      <rect x="104" y="62" width="54" height="40" rx="4" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => <g key={i}><line x1={112 + i * 12} y1="56" x2={112 + i * 12} y2="62" stroke={C.violet} strokeWidth="1.5" /><line x1={112 + i * 12} y1="102" x2={112 + i * 12} y2="108" stroke={C.violet} strokeWidth="1.5" /></g>)}
      <T x="131" y="79" fontSize="8" fill={C.violet} textAnchor="middle">speech</T>
      <T x="131" y="91" fontSize="8" fill={C.violet} textAnchor="middle">→ text</T>
      {/* text */}
      <path d="M160 82h10" stroke={C.soft} strokeWidth="1.5" />
      <rect x="172" y="68" width="48" height="26" rx="5" fill={C.bg} stroke={C.lime} strokeWidth="1.5" />
      <T x="196" y="85" fontSize="11" fill={C.lime} textAnchor="middle">hello</T>
      <path d="M222 82h10" stroke={C.soft} strokeWidth="1.5" />
      {/* chip 2 */}
      <rect x="234" y="62" width="54" height="40" rx="4" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => <g key={i}><line x1={242 + i * 12} y1="56" x2={242 + i * 12} y2="62" stroke={C.violet} strokeWidth="1.5" /><line x1={242 + i * 12} y1="102" x2={242 + i * 12} y2="108" stroke={C.violet} strokeWidth="1.5" /></g>)}
      <T x="261" y="79" fontSize="8" fill={C.violet} textAnchor="middle">text →</T>
      <T x="261" y="91" fontSize="8" fill={C.violet} textAnchor="middle">speech</T>
      {wave(290, C.amber)}
      {/* speaker */}
      <path d="M320 72h6l10-8v36l-10-8h-6z" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      <path d="M340 76a10 10 0 0 1 0 12M344 70a18 18 0 0 1 0 24" stroke={C.ink} strokeWidth="1.5" fill="none" />
      {/* stopwatch under the middle */}
      <circle cx="196" cy="138" r="14" fill={C.bg} stroke={C.amber} strokeWidth="2" />
      <line x1="196" y1="120" x2="196" y2="124" stroke={C.amber} strokeWidth="2" />
      <line x1="196" y1="138" x2="196" y2="129" stroke={C.amber} strokeWidth="2" />
      <line x1="196" y1="138" x2="203" y2="142" stroke={C.amber} strokeWidth="2" />
      <T x="196" y="166" fontSize="10" fill={C.amber} textAnchor="middle">about 2 s - the honest pause</T>
      <T x="120" y="128" fontSize="9" fill={C.soft} textAnchor="middle">the model thinks here</T>
      <Caption text="SPEECH IN, SPEECH OUT" />
    </Frame>
  );
}

/* M14: two dice, a coin tree, and a histogram of dice sums peaking at 7. */
export function M14() {
  const die = (x, y, pips) => (
    <g>
      <rect x={x} y={y} width="34" height="34" rx="6" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      {pips.map(([px, py], i) => <circle key={i} cx={x + 7 + px * 10} cy={y + 7 + py * 10} r="3" fill={C.ink} />)}
    </g>
  );
  const sums = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  return (
    <Frame title="Dice, a coin tree and the sums histogram">
      {die(28, 30, [[0, 0], [1, 1], [2, 2]])}
      {die(70, 30, [[0, 0], [2, 0], [0, 2], [2, 2]])}
      <T x="66" y="80" fontSize="10" fill={C.cyan} textAnchor="middle">3 + 4 = 7</T>
      {/* coin tree */}
      <circle cx="160" cy="34" r="6" fill={C.amber} />
      <line x1="160" y1="40" x2="136" y2="62" stroke={C.line} strokeWidth="1.5" /><line x1="160" y1="40" x2="184" y2="62" stroke={C.line} strokeWidth="1.5" />
      <T x="136" y="74" fontSize="9" fill={C.ink} textAnchor="middle">H ½</T><T x="184" y="74" fontSize="9" fill={C.ink} textAnchor="middle">T ½</T>
      <line x1="136" y1="78" x2="124" y2="94" stroke={C.line} strokeWidth="1.5" /><line x1="136" y1="78" x2="148" y2="94" stroke={C.line} strokeWidth="1.5" />
      <line x1="184" y1="78" x2="172" y2="94" stroke={C.line} strokeWidth="1.5" /><line x1="184" y1="78" x2="196" y2="94" stroke={C.line} strokeWidth="1.5" />
      {["HH", "HT", "TH", "TT"].map((s, i) => <T key={s} x={124 + i * 24} y="106" fontSize="8" fill={C.soft} textAnchor="middle">{s} ¼</T>)}
      <T x="160" y="124" fontSize="9" fill={C.soft} textAnchor="middle">each branch: multiply</T>
      {/* histogram of sums 2..12 */}
      {sums.map((n, i) => (
        <g key={i}>
          <rect x={222 + i * 11} y={110 - n * 12} width="9" height={n * 12} fill={i === 5 ? C.lime : C.cyan} opacity={i === 5 ? 1 : 0.7} />
          <T x={226.5 + i * 11} y="122" fontSize="7" fill={C.soft} textAnchor="middle">{i + 2}</T>
        </g>
      ))}
      <T x="282" y="30" fontSize="9" fill={C.lime} textAnchor="middle">7 is the most common sum</T>
      <T x="282" y="136" fontSize="8" fill={C.soft} textAnchor="middle">ways to make each sum (36 in all)</T>
      <T x="66" y="140" fontSize="9" fill={C.soft} textAnchor="middle">6 of 36 ways</T>
      <T x="66" y="152" fontSize="9" fill={C.soft} textAnchor="middle">give a 7</T>
      <Caption text="THE MATHS OF CHANCE" />
    </Frame>
  );
}

/* M15: a bell curve with the mean, a skewed curve where mean and median differ, and a sample with an outlier. */
export function M15() {
  const pts = [40, 44, 46, 47, 48, 49, 50, 52, 54, 58, 96];
  return (
    <Frame title="Mean, median and an outlier">
      {/* bell */}
      <path d="M24 110c20 0 30-70 56-70s36 70 56 70" stroke={C.cyan} strokeWidth="2" fill="none" />
      <line x1="80" y1="40" x2="80" y2="112" stroke={C.lime} strokeWidth="1.5" strokeDasharray="3 3" />
      <T x="80" y="124" fontSize="9" fill={C.lime} textAnchor="middle">mean = median</T>
      <T x="80" y="30" fontSize="9" fill={C.soft} textAnchor="middle">symmetric</T>
      {/* skewed */}
      <path d="M160 110c8-50 16-70 30-70s14 20 26 40 30 28 60 30" stroke={C.amber} strokeWidth="2" fill="none" />
      <line x1="192" y1="42" x2="192" y2="112" stroke={C.lime} strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="218" y1="70" x2="218" y2="112" stroke={C.rose} strokeWidth="1.5" strokeDasharray="3 3" />
      <T x="186" y="124" fontSize="9" fill={C.lime} textAnchor="middle">median</T>
      <T x="230" y="124" fontSize="9" fill={C.rose} textAnchor="middle">mean</T>
      <T x="236" y="30" fontSize="9" fill={C.soft} textAnchor="middle">skewed: a long tail drags the mean</T>
      {/* sample dots */}
      <line x1="24" y1="156" x2="336" y2="156" stroke={C.line} strokeWidth="1.5" />
      {pts.map((v, i) => <circle key={i} cx={24 + (v - 36) * 5} cy="156" r="4" fill={i === pts.length - 1 ? C.rose : C.cyan} />)}
      <T x="324" y="146" fontSize="9" fill={C.rose} textAnchor="middle">outlier</T>
      <T x="120" y="172" fontSize="10" fill={C.ink} textAnchor="middle">mean 52 · median 48</T>
      <T x="268" y="172" fontSize="9" fill={C.soft} textAnchor="middle">one number moved the mean</T>
      <Caption text="READING EVIDENCE" />
    </Frame>
  );
}

/* SS5: an org chart with money up and targets down; the measured thing is done, the real goal is dim. */
export function SS5() {
  const box = (x, y, w, label, col, fill = C.bg) => (
    <g>
      <rect x={x} y={y} width={w} height="22" rx="4" fill={fill} stroke={col} strokeWidth="1.5" />
      <T x={x + w / 2} y={y + 15} fontSize="9" fill={col} textAnchor="middle">{label}</T>
    </g>
  );
  return (
    <Frame title="An organisation and its incentives">
      {box(130, 24, 70, "owner", C.ink)}
      {box(60, 70, 70, "manager", C.soft)}
      {box(200, 70, 70, "manager", C.soft)}
      {box(24, 118, 62, "worker", C.soft)}
      {box(96, 118, 62, "worker", C.lime, "#1a2a1e")}
      {box(176, 118, 62, "worker", C.soft)}
      {box(248, 118, 62, "worker", C.soft)}
      <g stroke={C.line} strokeWidth="1.5">
        <line x1="165" y1="46" x2="95" y2="70" /><line x1="165" y1="46" x2="235" y2="70" />
        <line x1="95" y1="92" x2="55" y2="118" /><line x1="95" y1="92" x2="127" y2="118" />
        <line x1="235" y1="92" x2="207" y2="118" /><line x1="235" y1="92" x2="279" y2="118" />
      </g>
      {/* money up (left), targets down (right) */}
      <path d="M40 112v-70" stroke={C.amber} strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M36 48l4-8 4 8" stroke={C.amber} strokeWidth="1.5" fill="none" />
      <T x="22" y="36" fontSize="8" fill={C.amber}>money up</T>
      <path d="M340 42v70" stroke={C.cyan} strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M336 106l4 8 4-8" stroke={C.cyan} strokeWidth="1.5" fill="none" />
      <T x="290" y="36" fontSize="8" fill={C.cyan}>targets down</T>
      {/* measured vs real goal */}
      <T x="127" y="156" fontSize="9" fill={C.lime} textAnchor="middle">does the measured thing</T>
      <rect x="196" y="146" width="116" height="16" rx="3" fill={C.bg} stroke={C.line} strokeWidth="1" opacity="0.6" />
      <T x="254" y="157" fontSize="8" fill={C.soft} textAnchor="middle" opacity="0.7">the real goal (dim)</T>
      {/* incentive dial */}
      <path d="M288 100a16 16 0 0 1 32 0" stroke={C.line} strokeWidth="4" fill="none" />
      <line x1="304" y1="100" x2="314" y2="90" stroke={C.amber} strokeWidth="2" />
      <T x="304" y="112" fontSize="7" fill={C.soft} textAnchor="middle">incentive</T>
      <Caption text="YOU GET WHAT YOU MEASURE" />
    </Frame>
  );
}

/* M3: 2,345 as place-value blocks - thousand cubes, hundred flats, ten rods, unit cubes - and the digits coloured. */
export function M3() {
  const cube = (x, y, s, col, key) => (
    <g key={key} stroke={C.bg} strokeWidth="1">
      <path d={`M${x} ${y}l${s} 0 0 ${s} -${s} 0z`} fill={col} />
      <path d={`M${x} ${y}l${s * 0.5} -${s * 0.3} ${s} 0 -${s * 0.5} ${s * 0.3}z`} fill={col} opacity="0.75" />
      <path d={`M${x + s} ${y}l${s * 0.5} -${s * 0.3} 0 ${s} -${s * 0.5} ${s * 0.3}z`} fill={col} opacity="0.5" />
    </g>
  );
  return (
    <Frame title="2,345 built from blocks">
      {/* thousands: two big cubes */}
      {cube(24, 70, 40, C.violet, "k1")}{cube(60, 100, 40, C.violet, "k2")}
      <T x="60" y="160" fontSize="9" fill={C.violet} textAnchor="middle">2 thousands</T>
      {/* hundreds: three flats */}
      {[0, 1, 2].map((i) => <g key={i} stroke={C.bg} strokeWidth="1"><path d={`M${128} ${84 + i * 16}l40 0 20-12 -40 0z`} fill={C.cyan} /><path d={`M${128} ${84 + i * 16}l40 0 0 5 -40 0z`} fill={C.cyan} opacity="0.6" /></g>)}
      <T x="158" y="160" fontSize="9" fill={C.cyan} textAnchor="middle">3 hundreds</T>
      {/* tens: four rods */}
      {[0, 1, 2, 3].map((i) => <g key={i} stroke={C.bg} strokeWidth="1"><rect x={218 + i * 12} y="70" width="8" height="52" fill={C.lime} /><path d={`M${218 + i * 12} 70l4-3 8 0 -4 3z`} fill={C.lime} opacity="0.7" /><path d={`M${226 + i * 12} 70l4-3 0 52 -4 3z`} fill={C.lime} opacity="0.5" /></g>)}
      <T x="240" y="160" fontSize="9" fill={C.lime} textAnchor="middle">4 tens</T>
      {/* ones: five unit cubes */}
      {[0, 1, 2, 3, 4].map((i) => cube(284 + (i % 3) * 14, 100 + Math.floor(i / 3) * 14, 10, C.amber, `u${i}`))}
      <T x="304" y="160" fontSize="9" fill={C.amber} textAnchor="middle">5 ones</T>
      {/* the number */}
      <T x="150" y="40" fontSize="24" fill={C.violet} textAnchor="end" fontWeight="700">2</T>
      <T x="158" y="40" fontSize="24" fill={C.soft} textAnchor="middle" fontWeight="700">,</T>
      <T x="180" y="40" fontSize="24" fill={C.cyan} textAnchor="middle" fontWeight="700">3</T>
      <T x="202" y="40" fontSize="24" fill={C.lime} textAnchor="middle" fontWeight="700">4</T>
      <T x="224" y="40" fontSize="24" fill={C.amber} textAnchor="middle" fontWeight="700">5</T>
      <T x="186" y="56" fontSize="9" fill={C.soft} textAnchor="middle">2000 + 300 + 40 + 5</T>
      <Caption text="EVERY DIGIT HAS A PLACE" />
    </Frame>
  );
}

/* GK1: a globe with three pinned news cards and the four-question checklist. */
export function GK1() {
  const card = (x, y, col) => (
    <g>
      <rect x={x} y={y} width="56" height="34" rx="4" fill={C.bg} stroke={col} strokeWidth="1.5" />
      <rect x={x + 6} y={y + 7} width="40" height="4" rx="1" fill={col} />
      <rect x={x + 6} y={y + 15} width="32" height="3" rx="1" fill={C.line} />
      <rect x={x + 6} y={y + 22} width="36" height="3" rx="1" fill={C.line} />
      <circle cx={x + 50} cy={y} r="3" fill={col} />
    </g>
  );
  return (
    <Frame title="The world and three news cards">
      <circle cx="110" cy="100" r="56" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <ellipse cx="110" cy="100" rx="22" ry="56" fill="none" stroke={C.line} strokeWidth="1.2" />
      <ellipse cx="110" cy="100" rx="44" ry="56" fill="none" stroke={C.line} strokeWidth="1.2" />
      <line x1="54" y1="100" x2="166" y2="100" stroke={C.line} strokeWidth="1.2" />
      <ellipse cx="110" cy="72" rx="48" ry="8" fill="none" stroke={C.line} strokeWidth="1.2" />
      <ellipse cx="110" cy="128" rx="48" ry="8" fill="none" stroke={C.line} strokeWidth="1.2" />
      <circle cx="132" cy="112" r="3.5" fill={C.amber} />
      <circle cx="86" cy="80" r="3.5" fill={C.rose} />
      <circle cx="120" cy="60" r="3.5" fill={C.lime} />
      <line x1="132" y1="112" x2="186" y2="140" stroke={C.amber} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="86" y1="80" x2="30" y2="30" stroke={C.rose} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="120" y1="60" x2="186" y2="30" stroke={C.lime} strokeWidth="1" strokeDasharray="3 3" />
      {card(24, 20, C.rose)}
      {card(186, 20, C.lime)}
      {card(186, 128, C.amber)}
      {/* checklist */}
      {["who", "what", "why", "who says"].map((w, i) => (
        <g key={w}>
          <rect x="258" y={62 + i * 24} width="82" height="18" rx="3" fill={C.bg} stroke={C.cyan} strokeWidth="1.2" />
          <rect x="264" y={67 + i * 24} width="8" height="8" rx="1" fill={i < 2 ? C.lime : C.bg} stroke={C.lime} strokeWidth="1" />
          <T x="280" y={75 + i * 24} fontSize="9" fill={C.ink}>{w}</T>
        </g>
      ))}
      <T x="299" y="56" fontSize="8" fill={C.soft} textAnchor="middle">read every story with</T>
      <Caption text="WHAT IS GOING ON IN THE WORLD" />
    </Frame>
  );
}
