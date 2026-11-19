/* Per-module illustrations, part 3: SS2, WEB2, CRYPTO1, CTF1, M10, M11, SS3, CS6, CS7, CS8, LV4. Server-safe, no hooks. */
import { Frame, C, MONO, Caption } from "./base";

const T = (props) => <text fontFamily={MONO} {...props} />;

/* SS2: a ledger page with IN / OUT and a running balance, a coin stack, and the deposit -> loan loop. */
export function SS2() {
  const rows = [["wage", "500", "", "500"], ["rent", "", "200", "300"], ["food", "", "80", "220"], ["gift", "100", "", "320"]];
  return (
    <Frame title="A ledger: every coin written down">
      <rect x="22" y="22" width="176" height="150" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.5" />
      <line x1="22" y1="44" x2="198" y2="44" stroke={C.line} strokeWidth="1.5" />
      <T x="34" y="37" fontSize="9" fill={C.soft}>what</T>
      <T x="88" y="37" fontSize="9" fill={C.lime}>IN</T>
      <T x="126" y="37" fontSize="9" fill={C.rose}>OUT</T>
      <T x="162" y="37" fontSize="9" fill={C.cyan}>balance</T>
      {rows.map(([w, i, o, b], k) => (
        <g key={w}>
          <line x1="22" y1={66 + k * 24} x2="198" y2={66 + k * 24} stroke={C.line} strokeWidth="0.8" strokeOpacity="0.6" />
          <T x="34" y={60 + k * 24} fontSize="10" fill={C.ink}>{w}</T>
          {i && <T x="88" y={60 + k * 24} fontSize="10" fill={C.lime}>{i}</T>}
          {o && <T x="126" y={60 + k * 24} fontSize="10" fill={C.rose}>{o}</T>}
          <T x="186" y={60 + k * 24} fontSize="10" fill={C.cyan} textAnchor="end">{b}</T>
        </g>
      ))}
      <T x="34" y="160" fontSize="9" fill={C.soft}>a ledger never forgets</T>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <ellipse cx="248" cy={150 - k * 7} rx="18" ry="6" fill={C.amber} stroke="#8a6a10" strokeWidth="1" />
        </g>
      ))}
      <ellipse cx="248" cy="129" rx="18" ry="6" fill="#ffd866" stroke="#8a6a10" strokeWidth="1" />
      <T x="248" y="172" fontSize="9" fill={C.soft} textAnchor="middle">coins</T>
      <rect x="218" y="30" width="56" height="26" rx="5" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <T x="246" y="47" fontSize="10" fill={C.cyan} textAnchor="middle">bank</T>
      <rect x="290" y="30" width="56" height="26" rx="5" fill={C.bg} stroke={C.violet} strokeWidth="1.5" />
      <T x="318" y="47" fontSize="9" fill={C.violet} textAnchor="middle">borrower</T>
      <path d="M274 37h16" stroke={C.lime} strokeWidth="1.5" /><path d="M290 37l-5-3v6z" fill={C.lime} />
      <path d="M290 50h-16" stroke={C.amber} strokeWidth="1.5" /><path d="M274 50l5-3v6z" fill={C.amber} />
      <T x="318" y="70" fontSize="8" fill={C.lime} textAnchor="middle">loan out</T>
      <T x="282" y="22" fontSize="8" fill={C.amber} textAnchor="middle">paid back + interest</T>
      <path d="M246 56v18" stroke={C.line} strokeWidth="1.2" strokeDasharray="3 2" />
      <T x="246" y="86" fontSize="8" fill={C.soft} textAnchor="middle">deposit</T>
            <Caption text="THE LEDGER BEHIND EVERYTHING" />
    </Frame>
  );
}

/* WEB2: a browser with a hostile input, a shield in front of the database. */
export function WEB2() {
  return (
    <Frame title="Input is data, not commands">
      <rect x="20" y="26" width="190" height="132" rx="8" fill={C.bg} stroke={C.cyan} strokeWidth="1.5" />
      <rect x="20" y="26" width="190" height="22" rx="8" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      <circle cx="32" cy="37" r="3" fill={C.rose} /><circle cx="42" cy="37" r="3" fill={C.amber} /><circle cx="52" cy="37" r="3" fill={C.lime} />
      <rect x="62" y="30" width="140" height="14" rx="4" fill={C.bg} stroke={C.line} />
      <rect x="67" y="34" width="6" height="6" rx="1" fill="none" stroke={C.lime} strokeWidth="1.2" /><path d="M68 34v-2a2 2 0 0 1 4 0v2" fill="none" stroke={C.lime} strokeWidth="1.2" />
      <T x="78" y="41" fontSize="8" fill={C.soft}>https://faiza.app/login</T>
      <T x="34" y="70" fontSize="9" fill={C.soft}>name</T>
      <rect x="34" y="76" width="160" height="20" rx="4" fill="#161d2c" stroke={C.rose} strokeWidth="1.5" />
      <T x="40" y="90" fontSize="11" fill={C.rose}>{"' OR 1=1 --"}</T>
      <T x="34" y="114" fontSize="9" fill={C.soft}>password</T>
      <rect x="34" y="120" width="160" height="20" rx="4" fill="#161d2c" stroke={C.line} strokeWidth="1.2" />
      <T x="40" y="134" fontSize="11" fill={C.soft}>••••••••</T>
      <rect x="150" y="144" width="44" height="12" rx="3" fill={C.cyan} /><T x="172" y="153" fontSize="8" fill="#04141a" textAnchor="middle" fontWeight="700">Log in</T>
      <path d="M212 92h20" stroke={C.rose} strokeWidth="2" /><path d="M234 92l-6-4v8z" fill={C.rose} />
      <path d="M262 68l22 8v18c0 14-10 24-22 30-12-6-22-16-22-30V76z" fill="#162a2e" stroke={C.lime} strokeWidth="2" />
      <path d="M252 96l7 7 13-14" fill="none" stroke={C.lime} strokeWidth="2.5" strokeLinecap="round" />
      <T x="262" y="138" fontSize="8" fill={C.lime} textAnchor="middle">checked as text</T>
      <path d="M286 92h18" stroke={C.lime} strokeWidth="2" /><path d="M304 92l-6-4v8z" fill={C.lime} />
      <ellipse cx="326" cy="74" rx="18" ry="6" fill="#1b2340" stroke={C.violet} strokeWidth="1.5" />
      <path d="M308 74v36c0 3 8 6 18 6s18-3 18-6V74" fill="#1b2340" stroke={C.violet} strokeWidth="1.5" />
      <ellipse cx="326" cy="92" rx="18" ry="6" fill="none" stroke={C.violet} strokeWidth="1" />
      <T x="326" y="128" fontSize="9" fill={C.violet} textAnchor="middle">database</T>
      <Caption text="INPUT IS DATA, NOT COMMANDS" />
    </Frame>
  );
}

/* CRYPTO1: a hash funnel (one letter changes everything) and a key pair. */
export function CRYPTO1() {
  return (
    <Frame title="Hashes and a key pair">
      <T x="26" y="40" fontSize="12" fill={C.ink}>hello</T>
      <path d="M70 36h18" stroke={C.cyan} strokeWidth="1.5" /><path d="M88 36l-5-3v6z" fill={C.cyan} />
      <path d="M96 24h44l-14 18v12h-16V42z" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      <T x="118" y="37" fontSize="8" fill={C.cyan} textAnchor="middle">hash</T>
      <path d="M144 36h12" stroke={C.cyan} strokeWidth="1.5" /><path d="M156 36l-5-3v6z" fill={C.cyan} />
      <T x="162" y="40" fontSize="10" fill={C.lime}>2cf24dba…</T>
      <T x="26" y="86" fontSize="12" fill={C.ink}>hell<tspan fill={C.rose}>p</tspan></T>
      <path d="M70 82h18" stroke={C.cyan} strokeWidth="1.5" /><path d="M88 82l-5-3v6z" fill={C.cyan} />
      <path d="M96 70h44l-14 18v12h-16V88z" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      <T x="118" y="83" fontSize="8" fill={C.cyan} textAnchor="middle">hash</T>
      <path d="M144 82h12" stroke={C.cyan} strokeWidth="1.5" /><path d="M156 82l-5-3v6z" fill={C.cyan} />
      <T x="162" y="86" fontSize="10" fill={C.rose}>7b1e9a03…</T>
      <T x="26" y="106" fontSize="8" fill={C.soft}>one letter changed: a completely different fingerprint</T>
      <T x="26" y="117" fontSize="8" fill={C.soft}>same text in, always the same hash out. no way back.</T>
      <line x1="26" y1="126" x2="334" y2="126" stroke={C.line} strokeWidth="1" strokeDasharray="4 3" />
      <g transform="translate(40 132)">
        <circle cx="10" cy="10" r="8" fill="none" stroke={C.cyan} strokeWidth="2" />
        <path d="M18 10h26M36 10v6M42 10v6" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" />
        <T x="60" y="14" fontSize="9" fill={C.cyan}>public key - give to anyone</T>
      </g>
      <g transform="translate(40 152)">
        <circle cx="10" cy="10" r="8" fill={C.amber} stroke={C.amber} strokeWidth="2" />
        <path d="M18 10h26M36 10v6M42 10v6" stroke={C.amber} strokeWidth="2.5" strokeLinecap="round" />
        <T x="60" y="14" fontSize="9" fill={C.amber}>private key - only yours</T>
      </g>
      <rect x="252" y="134" width="88" height="30" rx="5" fill="#13203a" stroke={C.violet} strokeWidth="1.5" />
      <T x="296" y="146" fontSize="8" fill={C.violet} textAnchor="middle">lock with one,</T>
      <T x="296" y="157" fontSize="7.5" fill={C.violet} textAnchor="middle">open with the other</T>
      <Caption text="FINGERPRINTS AND KEYS" />
    </Frame>
  );
}

/* CTF1: a locked box with a flag coming out, and three challenge cards. */
export function CTF1() {
  const cards = [["general", "50", true], ["crypto", "100", false], ["web", "150", false]];
  return (
    <Frame title="Capture the flag">
      <rect x="40" y="92" width="90" height="60" rx="6" fill="#13203a" stroke={C.cyan} strokeWidth="2" />
      <rect x="40" y="92" width="90" height="12" rx="6" fill={C.cyan} fillOpacity="0.25" stroke={C.cyan} strokeWidth="2" />
      <rect x="75" y="120" width="20" height="16" rx="3" fill={C.amber} />
      <path d="M79 120v-6a6 6 0 0 1 12 0v6" fill="none" stroke={C.amber} strokeWidth="2.5" />
      <line x1="112" y1="92" x2="112" y2="40" stroke={C.ink} strokeWidth="2.5" />
      <path d="M112 40h56l-10 12 10 12h-56z" fill={C.lime} />
      <T x="140" y="56" fontSize="9" fill="#04141a" textAnchor="middle" fontWeight="700">{"flag{…}"}</T>
      <T x="85" y="170" fontSize="9" fill={C.soft} textAnchor="middle">built to be opened</T>
      {cards.map(([n, p, done], i) => {
        const x = 196 + i * 50;
        return (
          <g key={n}>
            <rect x={x} y="60" width="44" height="76" rx="5" fill={C.bg} stroke={done ? C.lime : C.line} strokeWidth="1.5" />
            <T x={x + 22} y="78" fontSize="9" fill={done ? C.lime : C.ink} textAnchor="middle">{n}</T>
            <T x={x + 22} y="100" fontSize="12" fill={C.amber} textAnchor="middle" fontWeight="700">{p}</T>
            <T x={x + 22} y="112" fontSize="7" fill={C.soft} textAnchor="middle">points</T>
            {done ? <path d={`M${x + 13} 124l6 6 12-12`} fill="none" stroke={C.lime} strokeWidth="2.5" strokeLinecap="round" /> : <circle cx={x + 22} cy="124" r="5" fill="none" stroke={C.line} strokeWidth="1.5" />}
          </g>
        );
      })}
      <T x="268" y="50" fontSize="9" fill={C.soft} textAnchor="middle">challenges</T>
      <T x="268" y="156" fontSize="8" fill={C.soft} textAnchor="middle">one write-up per flag</T>
      <Caption text="SANCTIONED TARGETS ONLY" />
    </Frame>
  );
}

/* M10: the same data drawn twice - an axis from 90 lies, an axis from 0 is honest. */
export function M10() {
  const data = [96, 98, 100, 97];
  const chart = (x0, from, col, label, lie) => {
    const h = 86, y0 = 150;
    const scale = (v) => ((v - from) / (100 - from)) * h;
    return (
      <g>
        <line x1={x0} y1={y0} x2={x0} y2={y0 - h - 6} stroke={C.soft} strokeWidth="1.2" />
        <line x1={x0} y1={y0} x2={x0 + 120} y2={y0} stroke={C.soft} strokeWidth="1.2" />
        <T x={x0 - 4} y={y0 + 3} fontSize="8" fill={C.soft} textAnchor="end">{from}</T>
        <T x={x0 - 4} y={y0 - h + 3} fontSize="8" fill={C.soft} textAnchor="end">100</T>
        {data.map((v, i) => (
          <rect key={i} x={x0 + 10 + i * 28} y={y0 - scale(v)} width="18" height={scale(v)} fill={col} fillOpacity={0.85} />
        ))}
        <T x={x0 + 60} y={y0 + 14} fontSize="8" fill={C.soft} textAnchor="middle">Mon Tue Wed Thu</T>
        <T x={x0 + 60} y="46" fontSize="10" fill={col} textAnchor="middle" fontWeight="700">{label}</T>
        {lie ? <path d={`M${x0 - 2} ${y0 - 10}l4-4 -4-4 4-4`} fill="none" stroke={C.rose} strokeWidth="1.5" /> : null}
      </g>
    );
  };
  return (
    <Frame title="The same numbers, two pictures">
      {chart(40, 90, C.rose, "axis from 90: lies", true)}
      {chart(210, 0, C.lime, "axis from 0: honest", false)}
      <T x="180" y="30" fontSize="9" fill={C.soft} textAnchor="middle">same data: 96 98 100 97</T>
      <Caption text="HOW GRAPHS LIE" />
    </Frame>
  );
}

/* M11: a balance with x + 2 on the left and 7 on the right; solving is undoing. */
export function M11() {
  const w = (x, y, col) => <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="2" fill={col} stroke={C.bg} strokeWidth="1" />;
  return (
    <Frame title="Letters are boxes, solving is undoing">
      <line x1="60" y1="120" x2="240" y2="120" stroke={C.cyan} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 120v30M130 150h40" stroke={C.cyan} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 120v12M240 120v12" stroke={C.line} strokeWidth="2" />
      <rect x="30" y="132" width="60" height="4" rx="2" fill={C.line} />
      <rect x="210" y="132" width="60" height="4" rx="2" fill={C.line} />
      <rect x="40" y="86" width="28" height="28" rx="4" fill="#2a2140" stroke={C.violet} strokeWidth="2" />
      <T x="54" y="106" fontSize="15" fill={C.violet} textAnchor="middle" fontWeight="700">x</T>
      {w(72, 102, C.amber)}{w(72, 88, C.amber)}
      {[0, 1, 2, 3].map((i) => w(214 + i * 14, 102, C.amber))}
      {[0, 1, 2].map((i) => w(221 + i * 14, 88, C.amber))}
      <T x="150" y="112" fontSize="12" fill={C.ink} textAnchor="middle">x + 2 = 7</T>
      <T x="60" y="70" fontSize="9" fill={C.soft} textAnchor="middle">a box + 2 weights</T>
      <T x="240" y="70" fontSize="9" fill={C.soft} textAnchor="middle">7 weights</T>
      <rect x="276" y="56" width="68" height="100" rx="6" fill={C.bg} stroke={C.line} strokeWidth="1.2" />
      <T x="310" y="76" fontSize="10" fill={C.ink} textAnchor="middle">x + 2 = 7</T>
      <path d="M310 82v14" stroke={C.lime} strokeWidth="1.5" /><path d="M310 96l-4-5h8z" fill={C.lime} />
      <T x="310" y="108" fontSize="8" fill={C.lime} textAnchor="middle">undo +2:</T>
      <T x="310" y="119" fontSize="8" fill={C.lime} textAnchor="middle">take 2 off both</T>
      <path d="M310 124v10" stroke={C.lime} strokeWidth="1.5" /><path d="M310 134l-4-5h8z" fill={C.lime} />
      <T x="310" y="150" fontSize="11" fill={C.lime} textAnchor="middle" fontWeight="700">x = 5</T>
      <T x="150" y="170" fontSize="8" fill={C.soft} textAnchor="middle">whatever you do to one side, do to the other</T>
      <Caption text="SOLVING IS UNDOING" />
    </Frame>
  );
}

/* SS3: scales, a rule book, two parties, a judge box, a decision. */
export function SS3() {
  return (
    <Frame title="Disputes end without a fight">
      <line x1="70" y1="48" x2="70" y2="110" stroke={C.cyan} strokeWidth="2.5" />
      <line x1="30" y1="60" x2="110" y2="60" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 60l-10 26h20zM110 60l-10 26h20z" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      <path d="M60 110h20" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" />
      <T x="70" y="128" fontSize="9" fill={C.soft} textAnchor="middle">weighed fairly</T>
      <rect x="28" y="140" width="84" height="30" rx="4" fill="#13203a" stroke={C.amber} strokeWidth="1.5" />
      <line x1="40" y1="140" x2="40" y2="170" stroke={C.amber} strokeWidth="1.2" />
      <T x="76" y="159" fontSize="10" fill={C.amber} textAnchor="middle" fontWeight="700">RULES</T>
      <T x="70" y="36" fontSize="9" fill={C.soft} textAnchor="middle">the law</T>
      <circle cx="160" cy="70" r="9" fill={C.bg} stroke={C.rose} strokeWidth="2" />
      <T x="160" y="94" fontSize="8" fill={C.rose} textAnchor="middle">party A</T>
      <circle cx="160" cy="130" r="9" fill={C.bg} stroke={C.violet} strokeWidth="2" />
      <T x="160" y="152" fontSize="8" fill={C.violet} textAnchor="middle">party B</T>
      <path d="M172 74l34 18M172 126l34-18" stroke={C.line} strokeWidth="1.5" />
      <path d="M206 92l-7 1 3-6zM206 108l-7-1 3 6z" fill={C.line} />
      <rect x="210" y="76" width="62" height="48" rx="6" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      <T x="241" y="96" fontSize="10" fill={C.cyan} textAnchor="middle">court</T>
      <T x="241" y="110" fontSize="8" fill={C.soft} textAnchor="middle">hears both</T>
      <path d="M272 100h28" stroke={C.lime} strokeWidth="2" /><path d="M300 100l-6-4v8z" fill={C.lime} />
      <rect x="302" y="86" width="46" height="28" rx="5" fill={C.bg} stroke={C.lime} strokeWidth="1.5" />
      <T x="325" y="104" fontSize="9" fill={C.lime} textAnchor="middle">decision</T>
      <T x="262" y="168" fontSize="8" fill={C.soft} textAnchor="middle">rules written first, the same for all</T>
      <Caption text="RULES, RIGHTS, A DECISION" />
    </Frame>
  );
}

/* CS6: a list of numbered boxes, a key -> value map, a stack with push/pop. */
export function CS6() {
  const vals = [7, 3, 9, 1, 4];
  return (
    <Frame title="Lists, maps and stacks, and what each costs">
      <T x="24" y="34" fontSize="9" fill={C.soft}>list - boxes in a row</T>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={24 + i * 30} y="42" width="26" height="24" rx="3" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
          <T x={37 + i * 30} y="59" fontSize="11" fill={C.ink} textAnchor="middle">{v}</T>
          <T x={37 + i * 30} y="78" fontSize="8" fill={C.soft} textAnchor="middle">{i}</T>
        </g>
      ))}
      <T x="24" y="96" fontSize="8" fill={C.amber}>find 1: look at each - O(n)</T>
      <T x="24" y="122" fontSize="9" fill={C.soft}>map - key to value</T>
      {[["age", "12"], ["city", "Dhaka"]].map(([k, v], i) => (
        <g key={k}>
          <rect x="24" y={130 + i * 20} width="40" height="16" rx="3" fill="#2a2140" stroke={C.violet} strokeWidth="1.2" />
          <T x="44" y={141 + i * 20} fontSize="9" fill={C.violet} textAnchor="middle">{k}</T>
          <path d={`M66 ${138 + i * 20}h12`} stroke={C.soft} strokeWidth="1.2" /><path d={`M78 ${138 + i * 20}l-4-2.5v5z`} fill={C.soft} />
          <rect x="82" y={130 + i * 20} width="48" height="16" rx="3" fill="#13203a" stroke={C.cyan} strokeWidth="1.2" />
          <T x="106" y={141 + i * 20} fontSize="9" fill={C.ink} textAnchor="middle">{v}</T>
        </g>
      ))}
      <T x="140" y="150" fontSize="8" fill={C.lime}>one jump - O(1)</T>
      <T x="262" y="34" fontSize="9" fill={C.soft} textAnchor="middle">stack - plates</T>
      {[0, 1, 2].map((i) => (
        <rect key={i} x="236" y={132 - i * 18} width="52" height="14" rx="3" fill="#13203a" stroke={C.amber} strokeWidth="1.5" />
      ))}
      <T x="262" y="143" fontSize="8" fill={C.soft} textAnchor="middle">first</T>
      <T x="262" y="107" fontSize="8" fill={C.soft} textAnchor="middle">last</T>
      <line x1="226" y1="150" x2="298" y2="150" stroke={C.line} strokeWidth="2" />
      <path d="M306 60v22" stroke={C.lime} strokeWidth="2" /><path d="M306 82l-4-6h8z" fill={C.lime} />
      <T x="322" y="74" fontSize="8" fill={C.lime}>push</T>
      <path d="M332 100v-22" stroke={C.rose} strokeWidth="2" /><path d="M332 78l-4 6h8z" fill={C.rose} />
      <T x="340" y="96" fontSize="8" fill={C.rose}>pop</T>
      <T x="262" y="166" fontSize="8" fill={C.soft} textAnchor="middle">last in, first out</T>
      <Caption text="EACH SHAPE HAS A COST" />
    </Frame>
  );
}

/* CS7: three processes, each with its own memory column, walls between, one reach blocked. */
export function CS7() {
  const procs = [["editor", C.cyan], ["browser", C.violet], ["python", C.lime]];
  return (
    <Frame title="Processes kept in their own boxes">
      {procs.map(([n, col], i) => {
        const x = 30 + i * 100;
        return (
          <g key={n}>
            <rect x={x} y="34" width="80" height="26" rx="5" fill="#13203a" stroke={col} strokeWidth="1.5" />
            <T x={x + 40} y="51" fontSize="10" fill={col} textAnchor="middle">{n}</T>
            {[0, 1, 2, 3].map((k) => (
              <g key={k}>
                <rect x={x + 10} y={70 + k * 18} width="60" height="14" rx="2" fill={C.bg} stroke={col} strokeWidth="1" strokeOpacity="0.8" />
                <T x={x + 14} y={80 + k * 18} fontSize="7" fill={C.soft}>{`0x${(0x4000 + i * 0x1000 + k * 0x10).toString(16)}`}</T>
              </g>
            ))}
            <T x={x + 40} y="156" fontSize="8" fill={C.soft} textAnchor="middle">its own memory</T>
          </g>
        );
      })}
      <line x1="120" y1="30" x2="120" y2="160" stroke={C.rose} strokeWidth="3" strokeDasharray="6 3" />
      <line x1="220" y1="30" x2="220" y2="160" stroke={C.rose} strokeWidth="3" strokeDasharray="6 3" />
      <path d="M100 95h16" stroke={C.rose} strokeWidth="2" /><path d="M116 95l-6-4v8z" fill={C.rose} />
      <circle cx="120" cy="95" r="7" fill={C.bg} stroke={C.rose} strokeWidth="2" /><path d="M116 91l8 8M124 91l-8 8" stroke={C.rose} strokeWidth="2" />
      <T x="170" y="172" fontSize="8" fill={C.rose} textAnchor="middle">a program reads only its own memory</T>
      <circle cx="334" cy="22" r="11" fill={C.bg} stroke={C.amber} strokeWidth="1.5" />
      <path d="M334 22v-7M334 22l5 3" stroke={C.amber} strokeWidth="1.5" strokeLinecap="round" />
      <T x="334" y="46" fontSize="7" fill={C.amber} textAnchor="middle">turns</T>
      <Caption text="ISOLATION" />
    </Frame>
  );
}

/* CS8: memory cells with hex addresses, a variable, a pointer to it, one cell out of bounds. */
export function CS8() {
  const cells = [...Array(8)].map((_, i) => 0x1000 + i);
  return (
    <Frame title="Pointers are addresses into memory">
      {cells.map((a, i) => {
        const x = 24 + i * 36;
        const isN = i === 3, isP = i === 6;
        return (
          <g key={a}>
            <rect x={x} y="70" width="32" height="34" rx="3" fill={isN ? "#162a2e" : isP ? "#2a2140" : C.bg} stroke={isN ? C.lime : isP ? C.violet : C.cyan} strokeWidth="1.5" />
            <T x={x + 16} y="92" fontSize="10" fill={isN ? C.lime : isP ? C.violet : C.soft} textAnchor="middle">{isN ? "42" : isP ? "0x1003" : "·"}</T>
            <T x={x + 16} y="118" fontSize="7" fill={C.soft} textAnchor="middle">{`0x${a.toString(16)}`}</T>
          </g>
        );
      })}
      <rect x="312" y="70" width="32" height="34" rx="3" fill="#2a1620" stroke={C.rose} strokeWidth="1.5" strokeDasharray="3 2" />
      <T x="328" y="92" fontSize="10" fill={C.rose} textAnchor="middle">?</T>
      <T x="328" y="118" fontSize="7" fill={C.rose} textAnchor="middle">0x1008</T>
      <T x="148" y="60" fontSize="10" fill={C.lime} textAnchor="middle">int n = 42;</T>
      <T x="256" y="60" fontSize="10" fill={C.violet} textAnchor="middle">int *p = &amp;n;</T>
      <path d="M256 128c0 22-50 22-100 10" fill="none" stroke={C.violet} strokeWidth="1.5" />
      <path d="M156 138l6 2-5 4z" fill={C.violet} />
      <T x="206" y="156" fontSize="8" fill={C.violet} textAnchor="middle">p points at n</T>
      <T x="310" y="146" fontSize="8" fill={C.rose} textAnchor="middle">p + 5: off the end</T>
      <T x="310" y="157" fontSize="8" fill={C.rose} textAnchor="middle">nobody stops you</T>
      <T x="24" y="36" fontSize="9" fill={C.soft}>every byte has an address</T>
      <Caption text="WHY SAFE LANGUAGES EXIST" />
    </Frame>
  );
}

/* LV4: an eye over the whole system, a dimmed scroll of instructions, a fast stopwatch. */
export function LV4() {
  return (
    <Frame title="Read the system, not the instructions">
      <path d="M40 48c20-26 60-26 80 0-20 26-60 26-80 0z" fill="none" stroke={C.cyan} strokeWidth="2" />
      <circle cx="80" cy="48" r="9" fill={C.bg} stroke={C.cyan} strokeWidth="2" /><circle cx="80" cy="48" r="4" fill={C.cyan} />
      <rect x="28" y="76" width="104" height="84" rx="6" fill="#13203a" stroke={C.cyan} strokeWidth="1.5" />
      {[[40, 88], [92, 88], [40, 120], [92, 120]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="30" height="16" rx="3" fill={C.bg} stroke={C.lime} strokeWidth="1.2" />
      ))}
      <path d="M70 96h22M55 104v16M107 104v16M70 128h22" stroke={C.lime} strokeWidth="1.2" />
      <path d="M92 96l-4-2.5v5zM55 120l-2.5-4h5zM107 120l-2.5-4h5zM70 128l4-2.5v5z" fill={C.lime} />
      <T x="80" y="152" fontSize="8" fill={C.lime} textAnchor="middle">the whole shape</T>
      <rect x="176" y="30" width="96" height="124" rx="4" fill={C.bg} stroke={C.line} strokeWidth="1.2" />
      {[...Array(8)].map((_, i) => (
        <g key={i}>
          <T x="184" y={48 + i * 14} fontSize="8" fill={C.line}>{i + 1}.</T>
          <rect x="198" y={42 + i * 14} width={40 + ((i * 17) % 26)} height="5" rx="2" fill={C.line} />
        </g>
      ))}
      <T x="224" y="166" fontSize="8" fill={C.soft} textAnchor="middle">step by step by step…</T>
      <circle cx="316" cy="100" r="24" fill={C.bg} stroke={C.amber} strokeWidth="2" />
      <rect x="312" y="68" width="8" height="6" rx="1" fill={C.amber} />
      <path d="M316 100v-14M316 100l8 4" stroke={C.amber} strokeWidth="2" strokeLinecap="round" />
      <T x="316" y="140" fontSize="9" fill={C.amber} textAnchor="middle">00:04</T>
      <T x="316" y="152" fontSize="8" fill={C.soft} textAnchor="middle">seeing is faster</T>
      <Caption text="SEE THE WHOLE, THEN MOVE" />
    </Frame>
  );
}
