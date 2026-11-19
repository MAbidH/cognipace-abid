/* Per-module illustrations, part 2: CS3, CS4, CS5, LV3, M8, SS1, NET1, NET2, DEF2, M9, NT1. Server-safe, no hooks. */
import { Frame, C, MONO, Caption } from "./base";

const T = (props) => <text fontFamily={MONO} {...props} />;

/* CS3: a file tree beside an ls -l line with the rwx triads boxed. */
export function CS3() {
  const tree = [["home/", 0, C.soft], ["faiza/", 1, C.soft], ["school/", 2, C.cyan], ["programs/", 3, C.cyan], ["notes/", 3, C.cyan], ["README.md", 3, C.lime]];
  const triads = [["rw-", "owner", C.lime], ["r--", "group", C.cyan], ["r--", "other", C.soft]];
  return (
    <Frame title="A file tree and its permission bits">
      {tree.map(([n, d, col], i) => (
        <g key={n}>
          {d > 0 ? <path d={`M${30 + d * 14 - 9} ${40 + i * 18 - 14}v14h5`} stroke={C.line} strokeWidth="1.5" fill="none" /> : null}
          <T x={30 + d * 14} y={44 + i * 18} fontSize="10" fill={col}>{n}</T>
        </g>
      ))}
      <rect x="150" y="52" width="196" height="30" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <T x="160" y="71" fontSize="11" fill={C.soft}>-</T>
      {triads.map(([bits, who, col], i) => (
        <g key={who}>
          <rect x={169 + i * 36} y="57" width="32" height="20" rx="3" fill={C.bg} stroke={col} strokeWidth="1.5" />
          <T x={185 + i * 36} y="71" fontSize="11" fill={col} textAnchor="middle">{bits}</T>
          <line x1={185 + i * 36} y1="82" x2={185 + i * 36} y2={100 + i * 16} stroke={col} strokeWidth="1" strokeDasharray="2 2" />
          <T x={185 + i * 36} y={112 + i * 16} fontSize="9" fill={col} textAnchor="middle">{who}</T>
        </g>
      ))}
      <T x="282" y="71" fontSize="10" fill={C.lime}>README.md</T>
      <T x="150" y="160" fontSize="9" fill={C.soft}>r read · w write · x run</T>
      <T x="150" y="40" fontSize="9" fill={C.soft} letterSpacing="1">ls -l</T>
      <Caption text="FILES, AND WHO MAY TOUCH THEM" />
    </Frame>
  );
}

/* CS4: a pipeline of three commands with data flowing through the pipes, and a small clock for cron. */
export function CS4() {
  const boxes = [["cat log", C.cyan], ["grep ERROR", C.amber], ["sort", C.lime]];
  return (
    <Frame title="Three commands joined by pipes">
      {boxes.map(([cmd, col], i) => {
        const x = 24 + i * 108;
        return (
          <g key={cmd}>
            <rect x={x} y="74" width="84" height="36" rx="6" fill={C.bg} stroke={col} strokeWidth="2" />
            <T x={x + 42} y="97" fontSize="11" fill={col} textAnchor="middle">{cmd}</T>
            {i < 2 ? (
              <g>
                <rect x={x + 84} y="86" width="24" height="12" rx="2" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
                <T x={x + 96} y="96" fontSize="11" fill={C.soft} textAnchor="middle">|</T>
                <circle cx={x + 90} cy="92" r="2" fill={col} />
                <circle cx={x + 102} cy="92" r="2" fill={col} />
              </g>
            ) : null}
          </g>
        );
      })}
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={30 + i * 11} cy="60" r="2.5" fill={i % 2 ? C.rose : C.cyan} />)}
      <T x="108" y="63" fontSize="9" fill={C.soft}>6 lines in</T>
      <path d="M324 92h16" stroke={C.lime} strokeWidth="2" />
      <path d="M336 86l6 6-6 6" stroke={C.lime} strokeWidth="2" fill="none" />
      <T x="334" y="136" fontSize="10" fill={C.lime} textAnchor="end">3 ERROR lines, sorted</T>
      {[0, 1, 2].map((i) => <circle key={i} cx={312 + i * 11} cy="146" r="2.5" fill={C.rose} />)}
      <circle cx="54" cy="150" r="16" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <path d="M54 150V139M54 150l8 5" stroke={C.violet} strokeWidth="2" strokeLinecap="round" />
      <T x="78" y="147" fontSize="9" fill={C.violet}>cron</T>
      <T x="78" y="158" fontSize="9" fill={C.soft}>every Friday 18:00</T>
      <Caption text="SMALL TOOLS, JOINED BY PIPES" />
    </Frame>
  );
}

/* CS5: a commit graph on main, a branch that forks and merges back, and a remote the work is pushed to. */
export function CS5() {
  const main = [["a1f3", 50], ["7c2e", 100], ["b904", 150], ["e5d1", 200], ["0fa7", 250]];
  return (
    <Frame title="A commit graph with a branch and a remote">
      <line x1="50" y1="120" x2="250" y2="120" stroke={C.cyan} strokeWidth="2" />
      <path d="M100 120c20-40 60-40 100 0" stroke={C.violet} strokeWidth="2" fill="none" />
      <circle cx="150" cy="90" r="7" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <T x="150" y="76" fontSize="9" fill={C.violet} textAnchor="middle">fix-typo</T>
      {main.map(([h, x], i) => (
        <g key={h}>
          <circle cx={x} cy="120" r="7" fill={i === 4 ? C.lime : C.bg} stroke={i === 4 ? C.lime : C.cyan} strokeWidth="2" />
          <T x={x} y="144" fontSize="9" fill={C.soft} textAnchor="middle">{h}</T>
        </g>
      ))}
      <T x="50" y="164" fontSize="9" fill={C.cyan}>main</T>
      <T x="250" y="164" fontSize="9" fill={C.lime} textAnchor="middle">HEAD</T>
      <path d="M262 120h40" stroke={C.lime} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M296 114l8 6-8 6" stroke={C.lime} strokeWidth="2" fill="none" />
      <T x="279" y="112" fontSize="9" fill={C.lime} textAnchor="middle">push</T>
      <path d="M306 128a12 12 0 0 1 4-23 16 16 0 0 1 30-3 11 11 0 0 1 6 21z" fill={C.bg} stroke={C.soft} strokeWidth="1.5" />
      <T x="326" y="120" fontSize="9" fill={C.soft} textAnchor="middle">remote</T>
      <T x="30" y="40" fontSize="10" fill={C.soft}>one commit = one remembered change</T>
      <Caption text="A FOLDER THAT REMEMBERS EVERY CHANGE" />
    </Frame>
  );
}

/* LV3: the exact error pasted into a search bar, and the first result lit. */
export function LV3() {
  const results = [["docs.python.org - Modules", true], ["forum - same error, 2024", false], ["blog - pip install x", false]];
  return (
    <Frame title="Searching with the exact error text">
      <rect x="24" y="36" width="312" height="30" rx="15" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <circle cx="44" cy="51" r="6" fill="none" stroke={C.cyan} strokeWidth="2" />
      <path d="M48 55l6 6" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" />
      <T x="62" y="55" fontSize="9.5" fill={C.ink}>"ModuleNotFoundError: No module named 'x'"</T>
      {results.map(([r, lit], i) => (
        <g key={r}>
          <rect x="24" y={84 + i * 28} width="312" height="22" rx="4" fill={lit ? "#13262c" : C.bg} stroke={lit ? C.lime : C.line} strokeWidth={lit ? 2 : 1} />
          <T x="36" y={99 + i * 28} fontSize="10" fill={lit ? C.lime : C.soft}>{r}</T>
          {lit ? <T x="324" y={99 + i * 28} fontSize="10" fill={C.lime} textAnchor="end">read this</T> : null}
        </g>
      ))}
      <T x="24" y="172" fontSize="9" fill={C.amber}>the quotes mean: these exact words, in this order</T>
      <Caption text="QUOTE THE ERROR" />
    </Frame>
  );
}

/* M8: a hundred-square with 35 cells shaded, and a price tag with the discount worked out. */
export function M8() {
  const cells = [];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) cells.push([r, c, r * 10 + c < 35]);
  return (
    <Frame title="35 of 100 squares shaded, and a price tag">
      {cells.map(([r, c, on]) => <rect key={`${r}-${c}`} x={30 + c * 12} y={28 + r * 12} width="11" height="11" fill={on ? C.lime : C.bg} stroke={on ? C.lime : C.line} strokeWidth="1" />)}
      <T x="90" y="162" fontSize="11" fill={C.lime} textAnchor="middle">35 out of 100 = 35%</T>
      <path d="M190 60h100l24 24v60H190z" fill={C.bg} stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="206" cy="76" r="4" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
      <T x="222" y="88" fontSize="12" fill={C.soft} textDecoration="line-through">Tk 200</T>
      <T x="222" y="108" fontSize="12" fill={C.rose}>-35% = Tk 70 off</T>
      <T x="222" y="130" fontSize="13" fill={C.lime} fontWeight="700">Tk 130</T>
      <T x="262" y="166" fontSize="9" fill={C.soft} textAnchor="middle">35 for every 100 → 70 of 200</T>
      <Caption text="PERCENT MEANS 'FOR EVERY HUNDRED'" />
    </Frame>
  );
}

/* SS1: people -> taxes -> the state's machine -> services back. */
export function SS1() {
  const gear = (cx, cy, r, col) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI) / 3;
        return <line key={i} x1={cx + r * Math.cos(a)} y1={cy + r * Math.sin(a)} x2={cx + (r + 5) * Math.cos(a)} y2={cy + (r + 5) * Math.sin(a)} stroke={col} strokeWidth="3" />;
      })}
      <circle cx={cx} cy={cy} r={r / 3} fill={col} />
    </g>
  );
  const services = ["roads", "schools", "police"];
  return (
    <Frame title="People, taxes, the state's machine, and services back">
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={40 + (i % 3) * 18} cy={84 + Math.floor(i / 3) * 20} r="6" fill={C.bg} stroke={C.cyan} strokeWidth="2" />)}
      <T x="58" y="134" fontSize="9" fill={C.cyan} textAnchor="middle">people</T>
      <path d="M100 86h50" stroke={C.amber} strokeWidth="2" />
      <path d="M144 80l8 6-8 6" stroke={C.amber} strokeWidth="2" fill="none" />
      <T x="124" y="78" fontSize="9" fill={C.amber} textAnchor="middle">taxes</T>
      <rect x="160" y="52" width="100" height="78" rx="4" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      <rect x="160" y="52" width="100" height="10" fill={C.line} />
      <line x1="210" y1="52" x2="210" y2="34" stroke={C.soft} strokeWidth="2" />
      <rect x="210" y="34" width="18" height="10" fill={C.soft} />
      {gear(190, 98, 12, C.violet)}
      {gear(226, 108, 10, C.violet)}
      <T x="210" y="146" fontSize="9" fill={C.ink} textAnchor="middle">the state</T>
      {services.map((s, i) => (
        <g key={s}>
          <path d={`M262 ${70 + i * 24}h40`} stroke={C.lime} strokeWidth="2" />
          <path d={`M296 ${64 + i * 24}l8 6-8 6`} stroke={C.lime} strokeWidth="2" fill="none" />
          <T x="308" y={74 + i * 24} fontSize="9" fill={C.lime}>{s}</T>
        </g>
      ))}
      <path d="M300 140c0 20-180 30-240 10" stroke={C.line} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      <T x="180" y="166" fontSize="9" fill={C.soft} textAnchor="middle">services come back to the people</T>
      <Caption text="THE MACHINE BEHIND THE FLAG" />
    </Frame>
  );
}

/* NET1: an envelope with addresses, a building with numbered doors (ports), and the DNS phone book. */
export function NET1() {
  const doors = [["22", C.violet], ["80", C.cyan], ["443", C.lime]];
  return (
    <Frame title="An envelope, numbered doors, and a phone book">
      <rect x="22" y="44" width="130" height="78" rx="4" fill={C.bg} stroke={C.cyan} strokeWidth="2" />
      <path d="M22 44l65 44 65-44" stroke={C.cyan} strokeWidth="2" fill="none" />
      <T x="30" y="104" fontSize="8.5" fill={C.soft}>from 192.168.0.12</T>
      <T x="30" y="116" fontSize="8.5" fill={C.ink}>to   142.250.x.x</T>
      <path d="M156 84h26" stroke={C.soft} strokeWidth="2" />
      <path d="M178 78l8 6-8 6" stroke={C.soft} strokeWidth="2" fill="none" />
      <rect x="192" y="30" width="110" height="92" fill={C.bg} stroke={C.ink} strokeWidth="2" />
      <path d="M186 30h122l-6-10H192z" fill={C.line} />
      {doors.map(([p, col], i) => (
        <g key={p}>
          <rect x={202 + i * 34} y="82" width="24" height="40" fill={C.bg} stroke={col} strokeWidth="2" />
          <circle cx={221 + i * 34} cy="104" r="1.8" fill={col} />
          <T x={214 + i * 34} y="76" fontSize="9" fill={col} textAnchor="middle">{p}</T>
        </g>
      ))}
      <T x="247" y="52" fontSize="9" fill={C.soft} textAnchor="middle">one computer</T>
      <T x="247" y="64" fontSize="9" fill={C.soft} textAnchor="middle">many doors (ports)</T>
      <rect x="22" y="138" width="316" height="30" rx="4" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
      <T x="32" y="157" fontSize="10" fill={C.amber}>DNS  google.com  →  142.250.x.x</T>
      <T x="326" y="157" fontSize="9" fill={C.soft} textAnchor="end">phone book</T>
      <Caption text="ADDRESS, DOOR, NAME" />
    </Frame>
  );
}

/* NET2: a plain single-board computer wired to a laptop that runs ssh. */
export function NET2() {
  return (
    <Frame title="A small board wired to a laptop">
      <rect x="40" y="60" width="110" height="80" rx="6" fill="#143324" stroke={C.lime} strokeWidth="2" />
      <rect x="76" y="86" width="30" height="30" rx="2" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <T x="91" y="105" fontSize="8" fill={C.violet} textAnchor="middle">CPU</T>
      {[...Array(10)].map((_, i) => <rect key={i} x={48 + i * 9} y="64" width="4" height="8" fill={C.amber} />)}
      <rect x="120" y="100" width="24" height="18" rx="2" fill={C.bg} stroke={C.soft} strokeWidth="1.5" />
      <circle cx="56" cy="128" r="4" fill={C.lime} />
      <circle cx="56" cy="128" r="8" fill={C.lime} opacity="0.25" />
      <T x="66" y="131" fontSize="8" fill={C.lime}>serving</T>
      <T x="95" y="156" fontSize="9" fill={C.soft} textAnchor="middle">the Pi · 192.168.0.20</T>
      <path d="M144 109h76" stroke={C.cyan} strokeWidth="2.5" />
      <circle cx="182" cy="109" r="3" fill={C.cyan} />
      <T x="182" y="98" fontSize="8" fill={C.cyan} textAnchor="middle">ethernet</T>
      <path d="M232 52h100a4 4 0 0 1 4 4v62H228V56a4 4 0 0 1 4-4z" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <path d="M214 118h136l10 14H204z" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <rect x="236" y="60" width="92" height="52" fill="#0a0f18" />
      <T x="242" y="76" fontSize="8" fill={C.lime}>$ ssh faiza@pi</T>
      <T x="242" y="90" fontSize="8" fill={C.soft}>faiza@pi:~$</T>
      <rect x="296" y="83" width="5" height="9" fill={C.ink} />
      <T x="282" y="156" fontSize="9" fill={C.soft} textAnchor="middle">her laptop</T>
      <Caption text="HER OWN SERVER, ON HER OWN DESK" />
    </Frame>
  );
}

/* DEF2: a log in time order with the one line that matters, and the answer that follows. */
export function DEF2() {
  const lines = [
    ["02:14:03", "sshd: Accepted key for faiza", C.soft],
    ["02:14:40", "sshd: Failed password from 203.0.113.9", C.rose],
    ["02:14:41", "sshd: Failed password from 203.0.113.9", C.rose],
    ["02:14:43", "fail2ban: Ban 203.0.113.9", C.lime],
    ["02:15:10", "sshd: Connection closed 203.0.113.9", C.soft],
  ];
  return (
    <Frame title="Log lines in order, with the incident and the ban">
      <rect x="24" y="26" width="312" height="118" rx="6" fill="#0a0f18" stroke={C.line} strokeWidth="1.5" />
      {lines.map(([t, msg, col], i) => (
        <g key={t}>
          <T x="34" y={46 + i * 22} fontSize="9" fill={C.cyan}>{t}</T>
          <T x="96" y={46 + i * 22} fontSize="9" fill={col}>{msg}</T>
          {col === C.rose ? <rect x="28" y={35 + i * 22} width="304" height="16" fill={C.rose} opacity="0.08" /> : null}
        </g>
      ))}
      <line x1="34" y1="156" x2="326" y2="156" stroke={C.soft} strokeWidth="2" />
      <path d="M320 150l8 6-8 6" stroke={C.soft} strokeWidth="2" fill="none" />
      {[34, 106, 178, 250].map((x, i) => <circle key={x} cx={x} cy="156" r="4" fill={i === 1 || i === 2 ? C.rose : i === 3 ? C.lime : C.soft} />)}
      <T x="34" y="171" fontSize="9" fill={C.soft}>first</T>
      <T x="250" y="171" fontSize="9" fill={C.lime} textAnchor="middle">banned</T>
      <T x="326" y="171" fontSize="9" fill={C.soft} textAnchor="end">time →</T>
      <Caption text="WHAT HAPPENED, IN ORDER" />
    </Frame>
  );
}

/* M9: a balance with 2 cubes against 3, and a map scale bar. */
export function M9() {
  const cube = (x, y, col) => (
    <g key={`${x}-${y}`} stroke={C.bg} strokeWidth="1">
      <path d={`M${x} ${y}l10-6 10 6-10 6z`} fill={col} />
      <path d={`M${x} ${y}l10 6v12l-10-6z`} fill={col} opacity="0.7" />
      <path d={`M${x + 10} ${y + 6}l10-6v12l-10 6z`} fill={col} opacity="0.5" />
    </g>
  );
  return (
    <Frame title="A balance with 2 cubes against 3, and a map scale">
      <line x1="60" y1="98" x2="200" y2="82" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M130 90l-10 40h20z" fill={C.line} />
      <circle cx="130" cy="90" r="4" fill={C.cyan} />
      <path d="M50 118h30M65 98v20" stroke={C.cyan} strokeWidth="2" />
      <path d="M185 100h30M200 82v18" stroke={C.cyan} strokeWidth="2" />
      {cube(50, 80, C.amber)}{cube(66, 80, C.amber)}
      {cube(186, 64, C.lime)}{cube(202, 64, C.lime)}{cube(194, 48, C.lime)}
      <T x="65" y="146" fontSize="11" fill={C.amber} textAnchor="middle">2</T>
      <T x="130" y="146" fontSize="11" fill={C.soft} textAnchor="middle">:</T>
      <T x="200" y="146" fontSize="11" fill={C.lime} textAnchor="middle">3</T>
      <T x="132" y="164" fontSize="9" fill={C.soft} textAnchor="middle">for every 2 of these, 3 of those</T>
      <rect x="250" y="60" width="80" height="60" rx="4" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <path d="M254 110c20-30 40-10 72-40" stroke={C.cyan} strokeWidth="1.5" fill="none" />
      <rect x="258" y="130" width="30" height="6" fill={C.ink} />
      <rect x="288" y="130" width="30" height="6" fill={C.bg} stroke={C.ink} strokeWidth="1" />
      <T x="258" y="150" fontSize="9" fill={C.soft}>0</T>
      <T x="318" y="150" fontSize="9" fill={C.soft} textAnchor="end">4 km</T>
      <T x="290" y="164" fontSize="9" fill={C.cyan} textAnchor="middle">1 cm = 2 km</T>
      <Caption text="RATIO: THE SAME SHAPE, ANY SIZE" />
    </Frame>
  );
}

/* NT1: the sieve 1..30 with primes lit, and a lock whose secret is p times q. */
export function NT1() {
  const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  const cells = [...Array(30)].map((_, i) => i + 1);
  return (
    <Frame title="The sieve of primes and a lock built from two of them">
      {cells.map((n) => {
        const c = (n - 1) % 10, r = Math.floor((n - 1) / 10);
        const p = primes.has(n);
        return (
          <g key={n}>
            <rect x={24 + c * 22} y={36 + r * 24} width="20" height="22" rx="3" fill={p ? "#2a2410" : C.bg} stroke={p ? C.amber : C.line} strokeWidth={p ? 1.5 : 1} />
            <T x={34 + c * 22} y={51 + r * 24} fontSize="9.5" fill={p ? C.amber : C.line} textAnchor="middle" fontWeight={p ? 700 : 400}>{n}</T>
          </g>
        );
      })}
      <T x="24" y="124" fontSize="9" fill={C.amber}>primes stay lit, multiples go dark</T>
      <rect x="268" y="80" width="64" height="52" rx="6" fill={C.bg} stroke={C.lime} strokeWidth="2" />
      <path d="M284 80V62a16 16 0 0 1 32 0v18" stroke={C.lime} strokeWidth="3" fill="none" />
      <T x="300" y="104" fontSize="11" fill={C.lime} textAnchor="middle">p · q</T>
      <circle cx="300" cy="118" r="3" fill={C.lime} />
      <T x="300" y="150" fontSize="9" fill={C.soft} textAnchor="middle">easy to multiply,</T>
      <T x="300" y="162" fontSize="9" fill={C.soft} textAnchor="middle">hard to split</T>
      <Caption text="THE MATHS INSIDE THE LOCK" />
    </Frame>
  );
}
