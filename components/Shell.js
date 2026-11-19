/** The top bar every student page shares. Keyboard first: Alt+Shift+1..9 jumps between pages (components/PageKeys.js -
 *  29 Oct 2026: the old accessKey Alt+1..7 switched browser tabs in Firefox on Linux instead). */
import Clock from "./Clock";
import WonderBanner from "./WonderBanner";
import Broken from "./Broken";
import OfflineBanner from "./Offline";
import VersionWatch from "./VersionWatch";
import PageKeys from "./PageKeys";
import { LevelMedal } from "./Art";
import { PAGE_KEYS, keyLabel } from "./keymap";
import { localDayIndex } from "../lib/time";

export default function Shell({ active, rw, mins, cap, children }) {
  // A Wonder every day (Abid, 5 Oct 2026); the Arena every second day. Same parity rule as lib/arena.js, kept
  // dependency-free here because this bar is also rendered inside client components.
  const arenaDay = localDayIndex() % 2 === 0;
  // "My voice" (/voice, 29 Oct 2026) is a permanent link: what she wants to become and learn. Meet stays a map card.
  const links = PAGE_KEYS.filter(([, href]) => href !== "/meet" && (href !== "/arena" || arenaDay));
  return (
    <>
      <header className="topbar">
        <div className="in">
          <a className="brand" href="/" style={{ textDecoration: "none" }}><span className="dot" />COGNIPACE</a>
          {rw && (
            <span className="pill" title="Level and XP" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LevelMedal n={rw.level.n} state="current" size={18} label={false} /> <b>L{rw.level.n}</b> {rw.level.name} · <b className="num">{rw.xp}</b> XP</span>
          )}
          {rw && rw.session?.streak > 0 && <span className="pill" title="Days in a row with a complete session">🔥 <b>{rw.session.streak}</b></span>}
          <Clock />
          {mins != null && cap != null && <span className="pill" title="Minutes of real work today"><b className="num">{mins}</b>/{cap} min</span>}
          <nav className="nav" aria-label="pages">
            {links.map(([k, href, label]) => (
              <a key={href} href={href} className={active === href ? "on" : ""} title={`${label} (${keyLabel(k)})`} aria-keyshortcuts={`Alt+Shift+${k}`}>{label}<span className="key" aria-hidden="true">{k}</span></a>
            ))}
            <span className="navhint" title="Hold Alt and Shift, then press the page's number">Alt+Shift+number</span>
          </nav>
        </div>
        <OfflineBanner />
        <VersionWatch />
      </header>
      <PageKeys />
      <div className="wonderbar-wrap"><WonderBanner active={active} /></div>
      {children}
      <Broken page={active || "/"} />
    </>
  );
}
