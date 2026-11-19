/* Her progress, drawn. All server-safe (no hooks) and fed only by server-computed data.
   Charts follow the lab's one rule for colour: cyan is the path and the present, lime is done, amber is the thing to
   look at. Text is always ink. Each chart is one series, so no legend is needed; labels sit on the marks. */

import { LevelMedal } from "./Art";

const C = { cyan: "#22d3ee", deep: "#0e7490", lime: "#a3e635", amber: "#fbbf24", violet: "#a78bfa", ink: "#e8eef8", soft: "#9fb0c7", mute: "#6b7d96", line: "#22304a", line2: "#2c3d5c", bg: "#0f1522" };

/** Level ring: progress from this level's XP to the next, with the level number in the middle. */
export function XpRing({ rw }) {
  const from = rw.level.xp, to = rw.next ? rw.next.xp : rw.level.xp + 1;
  const frac = Math.max(0, Math.min(1, (rw.xp - from) / (to - from)));
  const r = 84, c = 2 * Math.PI * r;
  return (
    <div className="ring" role="img" aria-label={`Level ${rw.level.n}, ${Math.round(frac * 100)} percent of the way to the next level`}>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke={C.line} strokeWidth="12" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={C.cyan} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }} />
        {[...Array(12)].map((_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={100 + 70 * Math.cos(a)} y1={100 + 70 * Math.sin(a)} x2={100 + 66 * Math.cos(a)} y2={100 + 66 * Math.sin(a)} stroke={C.line2} strokeWidth="2" />; })}
      </svg>
      <div className="mid">
        <div>
          <LevelMedal n={rw.level.n} state="current" size={104} label={false} />
          <div className="nm" style={{ marginTop: -6 }}>{rw.level.name}</div>
        </div>
      </div>
    </div>
  );
}

/** The path as a map: modules as nodes on a snaking route, three rows. Passed = lime, current = cyan (glowing), locked = outline. */
export function SkillMap({ progress, curIdx }) {
  const perRow = 5, W = 1000, rowH = 150, pad = 110;
  const rows = Math.ceil(progress.length / perRow);
  const H = rows * rowH + 20;
  const pos = (i) => {
    const row = Math.floor(i / perRow), col = i % perRow;
    const x = pad + (row % 2 === 0 ? col : perRow - 1 - col) * ((W - 2 * pad) / (perRow - 1));
    return [x, 60 + row * rowH];
  };
  const pts = progress.map((_, i) => pos(i));
  let d = "";
  pts.forEach(([x, y], i) => {
    if (i === 0) { d += `M${x} ${y}`; return; }
    const [px, py] = pts[i - 1];
    if (py === y) d += ` L${x} ${y}`;
    else d += ` C${px} ${py + rowH * 0.6} ${x} ${y - rowH * 0.6} ${x} ${y}`; // turn down to the next row
  });
  const doneUpTo = pts[Math.max(0, curIdx)];
  const phaseColor = (p) => ({
    "Computing": C.violet, "General Knowledge": C.amber, "Leverage": C.lime,
    "Mathematics": C.cyan, "Networks": C.cyan, "Security": "#fb7185", "Web": C.violet,
    "AI": C.lime, "Hardware": C.amber, "Systems & Society": C.soft, "Project": C.cyan, "Foundations": C.cyan, "Elective": C.soft,
  }[p] || C.cyan);
  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="map of modules">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path d={d} fill="none" stroke={C.line2} strokeWidth="6" strokeLinecap="round" />
      {/* the walked part of the route, drawn over the grey route up to the current node */}
      {curIdx > 0 && <path d={d} fill="none" stroke={C.lime} strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray={`${(100 * curIdx) / Math.max(1, progress.length - 1)} 100`} opacity="0.9" />}
      {progress.map((p, i) => {
        const [x, y] = pts[i];
        const reveal = p.status !== "locked" || i <= curIdx + 2;
        const col = phaseColor(p.phase);
        const label = reveal ? p.title : "Not yet";
        const above = Math.floor(i / perRow) % 2 === 0 ? (i % 2 === 0) : (i % 2 === 1);
        const ty = above ? y - 34 : y + 44;
        return (
          <g key={p.id}>
            {p.status === "current" && <circle cx={x} cy={y} r="26" fill={C.cyan} opacity="0.18" filter="url(#glow)" />}
            <circle cx={x} cy={y} r={p.status === "current" ? 18 : 14} fill={p.status === "passed" ? C.lime : p.status === "current" ? C.cyan : C.bg} stroke={p.status === "locked" ? C.line2 : p.status === "passed" ? C.lime : C.cyan} strokeWidth="3" />
            {p.status === "passed" && <path d={`M${x - 6} ${y} l4 4 l8 -9`} fill="none" stroke="#0b0f17" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {p.status === "current" && <circle cx={x} cy={y} r="6" fill="#04141a" />}
            {p.status === "locked" && <rect x={x - 4} y={y - 3} width="8" height="7" rx="1.5" fill={C.line2} />}
            <text x={x} y={ty} fontSize="14" textAnchor="middle" fill={p.status === "locked" ? C.mute : C.ink} fontWeight={p.status === "current" ? 700 : 400}>{label.length > 26 ? label.slice(0, 25) + "…" : label}</text>
            <text x={x} y={ty + 16} fontSize="11" textAnchor="middle" fill={col} fontFamily="JetBrains Mono, monospace">{p.id}{p.status === "passed" && p.best_score != null ? ` · ${Math.round(Number(p.best_score) * 100)}%` : ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Streak calendar: the last 8 weeks, one square a day, columns are weeks. Complete sessions light up; Fridays (call day) are dashed. */
export function StreakCalendar({ sessionDays, minutesByDay, today }) {
  const set = new Set(sessionDays || []);
  const mins = Object.fromEntries((minutesByDay || []).map((d) => [d.day, d.minutes]));
  const t = new Date(today + "T00:00:00Z");
  const start = new Date(t.getTime() - (55 + t.getUTCDay()) * 86400000); // 8 columns, Sunday-first
  const cells = [];
  for (let i = 0; i < 56 + t.getUTCDay() + 1; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d > t) break;
    const ymd = d.toISOString().slice(0, 10);
    const m = mins[ymd] || 0;
    const cls = set.has(ymd) ? "s3" : m >= 15 ? "s2" : m > 0 ? "s1" : d.getUTCDay() === 5 ? "fri" : "";
    cells.push(<i key={ymd} className={`${cls}${ymd === today ? " today" : ""}`} title={`${ymd}: ${set.has(ymd) ? "complete session" : m ? `${m} min` : d.getUTCDay() === 5 ? "Friday - call day" : "no work"}`} />);
  }
  return <div className="cal" role="img" aria-label="calendar of complete sessions">{cells}</div>;
}

/** Minutes per day, last 14 days. The 25-minute session line is marked; days that cross it are brighter. */
export function MinuteBars({ minutesByDay, today, cap = 60 }) {
  const max = Math.max(cap, ...minutesByDay.map((d) => d.minutes));
  return (
    <div style={{ position: "relative", paddingBottom: 22 }}>
      <div className="bars" aria-label="minutes per day, last 14 days" role="img">
        {minutesByDay.map((d) => (
          <div key={d.day} className={`${d.minutes >= 25 ? "hit" : ""}${d.day === today ? " today" : ""}`} style={{ height: `${Math.max(2, (d.minutes / max) * 100)}%` }} title={`${d.day}: ${d.minutes} min`}>
            <span>{d.day.slice(8)}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 22 + (25 / max) * 90, borderTop: `1px dashed ${C.amber}`, pointerEvents: "none" }}>
        <span className="small" style={{ position: "absolute", right: 0, top: -16, color: C.amber, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>25 min = a session</span>
      </div>
    </div>
  );
}

/** Rewards road: milestones left to right in the order she will reach them; lit when reached, flagged with the estimate. */
export function RewardsRoad({ forecast }) {
  const items = [...forecast].sort((a, b) => (a.reached ? -1 : b.reached ? 1 : (a.etaDays ?? 9999) - (b.etaDays ?? 9999)));
  const W = Math.max(700, items.length * 124 + 100), H = 170;
  const x = (i) => 80 + i * ((W - 160) / Math.max(1, items.length - 1));
  const firstLocked = items.findIndex((u) => !u.reached);
  return (
    <svg className="road" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="road of rewards">
      <line x1="40" y1="90" x2={W - 40} y2="90" stroke={C.line2} strokeWidth="8" strokeLinecap="round" />
      {firstLocked !== 0 && <line x1="40" y1="90" x2={x(firstLocked < 0 ? items.length - 1 : firstLocked - 1)} y2="90" stroke={C.amber} strokeWidth="8" strokeLinecap="round" />}
      {items.map((u, i) => {
        const cx = x(i);
        const lit = u.reached;
        const short = (u.reward || "").replace(/\s[-:].*$/, "").replace(/:.*$/, "").trim(); // cut at " - " or ":", never inside a hyphenated word
        return (
          <g key={u.id}>
            <line x1={cx} y1="90" x2={cx} y2="52" stroke={lit ? C.amber : C.line2} strokeWidth="2" />
            <path d={`M${cx} 52 h30 l-8 8 l8 8 h-30z`} fill={lit ? C.amber : C.bg} stroke={lit ? C.amber : C.line2} strokeWidth="2" />
            <circle cx={cx} cy="90" r="9" fill={lit ? C.amber : C.bg} stroke={lit ? C.amber : C.line2} strokeWidth="3" />
            {u.claimed && <path d={`M${cx - 4} 90 l3 3 l6 -7`} fill="none" stroke="#0b0f17" strokeWidth="2.5" strokeLinecap="round" />}
            <text x={cx} y="122" fontSize="12" textAnchor="middle" fill={lit ? C.ink : C.soft}>{short.length > 18 ? short.slice(0, 17) + "…" : short}</text>
            <text x={cx} y="140" fontSize="10.5" textAnchor="middle" fill={lit ? C.amber : C.mute} fontFamily="JetBrains Mono, monospace">{u.delivered ? "delivered" : u.claimed ? "claimed" : lit ? "ready - claim it" : u.etaDate ? `~${u.etaDate.slice(5).replace("-", "/")}` : "later"}</text>
            <text x={cx} y="40" fontSize="10.5" textAnchor="middle" fill={C.mute} fontFamily="JetBrains Mono, monospace">{u.kind === "level" ? `L${u.value}` : u.kind === "streak" ? `${u.value}d` : u.value}</text>
          </g>
        );
      })}
    </svg>
  );
}
