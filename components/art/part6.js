/* Per-module illustrations, part 6 (29 Oct 2026, fix day): CS1C (redrawn: her own accounts, vault, editor, backup),
   M7B, and the electives VM1A and CS9D. Server-safe, no hooks. */
import { Frame, C, MONO, Caption } from "./base";

const T = (props) => <text fontFamily={MONO} {...props} />;

/* CS1C: a key ring of HER secrets into a vault, the editor window with the AI switched off, and the backup arrow to a
   locked SSD. The machine made hers: accounts, code, copies. */
export function CS1C() {
  return (
    <Frame title="Her machine made hers: a vault, an editor, a locked backup">
      {/* vault */}
      <rect x="22" y="44" width="92" height="82" rx="8" fill={C.bg} stroke={C.amber} strokeWidth="2" />
      <circle cx="68" cy="85" r="18" fill="none" stroke={C.amber} strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={68 + 18 * Math.cos((a * Math.PI) / 180)} y1={85 + 18 * Math.sin((a * Math.PI) / 180)} x2={68 + 24 * Math.cos((a * Math.PI) / 180)} y2={85 + 24 * Math.sin((a * Math.PI) / 180)} stroke={C.amber} strokeWidth="2" />)}
      <circle cx="68" cy="85" r="4" fill={C.amber} />
      <T x="68" y="142" fontSize="9" fill={C.amber} textAnchor="middle">only she knows</T>
      <T x="68" y="36" fontSize="9" fill={C.soft} textAnchor="middle">the vault</T>
      {/* editor */}
      <rect x="134" y="44" width="104" height="82" rx="5" fill="#0a0f1a" stroke={C.cyan} strokeWidth="1.5" />
      <rect x="134" y="44" width="104" height="12" rx="5" fill={C.line} />
      {[0, 1, 2].map((i) => <circle key={i} cx={142 + i * 8} cy="50" r="2.2" fill={C.soft} />)}
      <T x="142" y="72" fontSize="9" fill={C.violet}>print(</T>
      <T x="142" y="84" fontSize="9" fill={C.lime}>  'Hello from</T>
      <T x="142" y="96" fontSize="9" fill={C.lime}>   my Linux')</T>
      <rect x="182" y="104" width="50" height="16" rx="3" fill={C.bg} stroke={C.rose} strokeWidth="1.2" />
      <T x="207" y="115" fontSize="9" fill={C.rose} textAnchor="middle">AI: off</T>
      <T x="186" y="36" fontSize="9" fill={C.soft} textAnchor="middle">the editor</T>
      {/* backup */}
      <rect x="268" y="58" width="70" height="44" rx="6" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      <rect x="292" y="72" width="22" height="16" rx="2" fill="none" stroke={C.lime} strokeWidth="1.5" />
      <path d="M296 72v-5a7 7 0 0 1 14 0v5" fill="none" stroke={C.lime} strokeWidth="1.5" />
      <T x="303" y="116" fontSize="9" fill={C.lime} textAnchor="middle">rsync, Fridays</T>
      <T x="303" y="36" fontSize="9" fill={C.soft} textAnchor="middle">the backup</T>
      <path d="M240 82h22" stroke={C.soft} strokeWidth="1.5" /><path d="M258 77l6 5-6 5" fill="none" stroke={C.soft} strokeWidth="1.5" />
      <T x="180" y="164" fontSize="10" fill={C.ink} textAnchor="middle">her accounts, her code, her copies</T>
      <Caption text="A MACHINE THAT IS REALLY HERS" />
    </Frame>
  );
}

/* M7B: a part of a part - a roti square cut in 3 columns and 2 rows, 1/3 shaded and half of it darker = 1/6; beside it,
   "how many fit": 3/4 of a bar holding six eighths. */
export function M7B() {
  const x0 = 34, y0 = 40, w = 120, h = 96;
  return (
    <Frame title="A part of a part, and how many pieces fit">
      <rect x={x0} y={y0} width={w / 3} height={h} fill={C.amber} fillOpacity="0.35" />
      <rect x={x0} y={y0} width={w / 3} height={h / 2} fill={C.amber} fillOpacity="0.9" />
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={C.ink} strokeWidth="1.5" />
      {[1, 2].map((i) => <line key={i} x1={x0 + (i * w) / 3} y1={y0} x2={x0 + (i * w) / 3} y2={y0 + h} stroke={C.ink} strokeWidth="1.2" />)}
      <line x1={x0} y1={y0 + h / 2} x2={x0 + w} y2={y0 + h / 2} stroke={C.ink} strokeWidth="1.2" strokeDasharray="4 3" />
      <T x={x0 + w / 2} y={y0 - 10} fontSize="10" fill={C.soft} textAnchor="middle">half of a third</T>
      <T x={x0 + w / 2} y={y0 + h + 18} fontSize="12" fill={C.amber} textAnchor="middle">1/2 x 1/3 = 1/6</T>
      {/* how many eighths fit in 3/4 */}
      {[...Array(8)].map((_, i) => <rect key={i} x={196 + i * 18} y="62" width="18" height="26" fill={i < 6 ? C.cyan : C.bg} fillOpacity={i < 6 ? 0.75 : 1} stroke={C.ink} strokeWidth="1" />)}
      {[...Array(6)].map((_, i) => <T key={i} x={205 + i * 18} y="79" fontSize="9" fill="#04141a" textAnchor="middle" fontWeight="700">{i + 1}</T>)}
      <path d="M196 98h108" stroke={C.cyan} strokeWidth="1.5" /><path d="M196 94v8M304 94v8" stroke={C.cyan} strokeWidth="1.5" />
      <T x="250" y="112" fontSize="9" fill={C.cyan} textAnchor="middle">3/4</T>
      <T x="268" y="50" fontSize="10" fill={C.soft} textAnchor="middle">how many 1/8 fit in 3/4?</T>
      <T x="268" y="134" fontSize="12" fill={C.cyan} textAnchor="middle">3/4 ÷ 1/8 = 6</T>
      <T x="268" y="150" fontSize="9" fill={C.soft} textAnchor="middle">= 3/4 x 8/1</T>
      <Caption text="A PART OF A PART, AND HOW MANY FIT" />
    </Frame>
  );
}

/* VM1A (elective): an empty virtual disk filled by hand - ESP and root partitions, the four steps, a bootloader arrow. */
export function VM1A() {
  const steps = ["fdisk", "mkfs", "pacstrap", "bootloader"];
  return (
    <Frame title="Arch built by hand inside a virtual machine">
      <rect x="30" y="34" width="300" height="34" rx="4" fill={C.bg} stroke={C.soft} strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="32" y="36" width="54" height="30" rx="3" fill={C.violet} fillOpacity="0.55" />
      <rect x="88" y="36" width="240" height="30" rx="3" fill={C.cyan} fillOpacity="0.35" />
      <T x="59" y="55" fontSize="9" fill={C.ink} textAnchor="middle">ESP</T>
      <T x="208" y="55" fontSize="9" fill={C.ink} textAnchor="middle">root  /</T>
      <T x="180" y="26" fontSize="9" fill={C.soft} textAnchor="middle">a virtual disk - a file on her laptop</T>
      {steps.map((s, i) => (
        <g key={s}>
          <rect x={30 + i * 78} y="96" width="64" height="26" rx="5" fill={C.bg} stroke={C.lime} strokeWidth="1.5" />
          <T x={62 + i * 78} y="113" fontSize="9" fill={C.lime} textAnchor="middle">{s}</T>
          {i < 3 ? <g><line x1={94 + i * 78} y1="109" x2={106 + i * 78} y2="109" stroke={C.soft} strokeWidth="1.5" /><path d={`M${103 + i * 78} 105l4 4-4 4`} fill="none" stroke={C.soft} strokeWidth="1.5" /></g> : null}
        </g>
      ))}
      <T x="180" y="150" fontSize="10" fill={C.ink} textAnchor="middle">every piece laid down by her, one command at a time</T>
      <Caption text="NOTHING HIDDEN - AN ELECTIVE" />
    </Frame>
  );
}

/* CS9D (elective, from 16): a name in the phone book pointing at GitHub's servers - two records, one page. */
export function CS9D() {
  return (
    <Frame title="A domain name pointing at the site she built">
      <rect x="22" y="70" width="96" height="40" rx="6" fill={C.bg} stroke={C.amber} strokeWidth="2" />
      <T x="70" y="94" fontSize="10" fill={C.amber} textAnchor="middle">her name</T>
      <T x="70" y="60" fontSize="9" fill={C.soft} textAnchor="middle">from 16</T>
      <rect x="146" y="44" width="100" height="92" rx="5" fill="#0a0f1a" stroke={C.cyan} strokeWidth="1.5" />
      <T x="196" y="62" fontSize="9" fill={C.soft} textAnchor="middle">DNS records</T>
      <T x="156" y="84" fontSize="9" fill={C.cyan}>A     185.199...</T>
      <T x="156" y="100" fontSize="9" fill={C.cyan}>A     185.199...</T>
      <T x="156" y="120" fontSize="9" fill={C.violet}>CNAME www</T>
      <rect x="276" y="64" width="64" height="52" rx="5" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      <T x="308" y="88" fontSize="9" fill={C.lime} textAnchor="middle">her site</T>
      <T x="308" y="102" fontSize="9" fill={C.lime} textAnchor="middle">files</T>
      <path d="M118 90h22M246 90h24" stroke={C.soft} strokeWidth="1.5" />
      <path d="M136 86l6 4-6 4M266 86l6 4-6 4" fill="none" stroke={C.soft} strokeWidth="1.5" />
      <T x="180" y="160" fontSize="10" fill={C.ink} textAnchor="middle">a rented name, renewed every year</T>
      <Caption text="A NAME THAT POINTS - AN ELECTIVE" />
    </Frame>
  );
}
