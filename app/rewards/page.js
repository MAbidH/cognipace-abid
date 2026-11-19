import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards, LEVELS } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import Shell from "../../components/Shell";
import { BadgeHex, RewardIcon, LevelMedal } from "../../components/Art";
import { XpRing, RewardsRoad } from "../../components/Viz";
import Claim from "./Claim";

export const dynamic = "force-dynamic";

import { fmtDate as fmt } from "../../lib/time";
import { dailyCap } from "../../lib/calendar";

export default async function Rewards() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins] = await Promise.all([computeRewards(), minutesToday()]);
  const cap = dailyCap();
  const earned = rw.badges.filter((b) => b.at), locked = rw.badges.filter((b) => !b.at);
  // Only what she may see: cost and note never leave the server.
  const road = rw.forecast.map(({ id, title, reward, kind, value, reached, claimed, delivered, etaDate }) => ({ id, title, reward, kind, value, reached, claimed, delivered, etaDate }));
  const ordered = [...rw.unlocks].sort((a, b) => {
    const fa = rw.forecast.find((f) => f.id === a.id), fb = rw.forecast.find((f) => f.id === b.id);
    return (a.reached ? -1 : b.reached ? 1 : (fa?.etaDays ?? 9999) - (fb?.etaDays ?? 9999));
  });

  return (
    <Shell active="/rewards" rw={rw} mins={mins} cap={cap}>
      <main className="wrap">
        <section className="hero rise">
          <XpRing rw={rw} />
          <div>
            <div className="eyebrow">your level</div>
            <h1 style={{ marginTop: 4 }}>{rw.level.name}</h1>
            <p className="soft">{rw.xp} XP · {rw.hours} hours of real work · {rw.session.total} complete sessions · best streak {rw.session.maxStreak} days{rw.session.streak > 0 ? ` · current streak ${rw.session.streak}` : ""}.</p>
            {rw.next && <><div className="meter" aria-label="progress to next level"><div style={{ width: `${Math.min(100, Math.round(100 * (rw.xp - rw.level.xp) / (rw.next.xp - rw.level.xp)))}%` }} /></div>
              <div className="small soft">{rw.next.xp - rw.xp} XP to level {rw.next.n}, {rw.next.name}</div></>}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="eyebrow">the ten medals</div>
          <h2 style={{ marginTop: 4 }}>Every level has a face. {rw.next ? `${rw.next.xp - rw.xp} XP and the next one is yours.` : "You hold them all."}</h2>
          <div className="medals">
            {LEVELS.map((l) => {
              const state = l.n < rw.level.n ? "earned" : l.n === rw.level.n ? "current" : "locked";
              return <div key={l.n} className={`medal-card ${state}`} title={state === "locked" ? `${l.xp - rw.xp} XP to go` : state === "current" ? "your level now" : "earned"}>
                <LevelMedal n={l.n} state={state} size={state === "current" ? 108 : 92} />
                <div className="small soft">{state === "locked" ? `${l.xp - rw.xp} XP to go` : state === "current" ? "you are here" : "earned"}</div>
              </div>;
            })}
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div className="eyebrow">the road</div>
          <h2 style={{ marginTop: 4 }}>Rewards from Abid, in the order you will reach them</h2>
          <p className="small soft">Real things, from your brother. Each one arrives when you are ready to use it. The dates are estimates from your own pace - go faster, and they come sooner.</p>
          <div className="card" style={{ padding: "6px 4px", overflowX: "auto" }}><RewardsRoad forecast={road} /></div>
        </section>

        <section className="grid two" style={{ marginTop: 16 }}>
          {ordered.map((u) => {
            const f = rw.forecast.find((x) => x.id === u.id);
            return (
              <div className={`card unlock ${u.reached && !u.claimed ? "amber" : ""}`} key={u.id} style={{ opacity: u.reached || u.claimed ? 1 : 0.85 }}>
                <div className="ico"><RewardIcon kind={u.kind} /></div>
                <div>
                  <div className="eyebrow" style={{ color: "var(--amber)" }}>{u.kind === "level" ? `Level ${u.value}` : u.kind === "streak" ? `${u.value}-day streak` : u.kind === "module" ? `Pass ${u.value}` : u.kind === "start" ? `Start ${u.value}` : "Badge"} · {u.title}</div>
                  <h3 style={{ margin: "4px 0 6px" }}>{u.reward}</h3>
                  {u.details && <p className="small" style={{ margin: "0 0 8px" }}>{u.details}</p>}
                  {u.link && <p className="small" style={{ margin: "0 0 8px" }}><a href={u.link} target="_blank" rel="noopener noreferrer">See it ↗</a></p>}
                  {u.delivered ? <span className="small" style={{ color: "var(--lime)" }}>Delivered ✓ {fmt(u.delivered)}</span>
                    : u.claimed ? <span className="small" style={{ color: "var(--lime)" }}>Claimed ✓ - Abid has been told.</span>
                    : u.reached ? <Claim id={u.id} />
                    : <span className="small soft">{u.hint ? `${u.hint}` : "Not yet - keep going"}{f?.etaDate ? ` · about ${fmt(f.etaDate)}` : ""}.</span>}
                </div>
              </div>
            );
          })}
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="eyebrow">badges</div>
          <h2 style={{ marginTop: 4 }}>{earned.length} of {rw.badges.length} earned</h2>
          <div className="hexes">
            {earned.map((b) => <div className="hex" key={b.id}><BadgeHex id={b.id} earned /><div className="n">{b.name}</div><div className="h">{fmt(b.at)}</div></div>)}
            {locked.map((b) => <div className="hex locked" key={b.id} title={b.how}><BadgeHex id={b.id} /><div className="n">{b.name}</div><div className="h">{b.how}</div></div>)}
          </div>
        </section>

        <section className="card" style={{ marginTop: 28 }}>
          <div className="eyebrow">how xp works</div>
          <p className="small soft" style={{ marginTop: 6 }}>Warm-up 10 (+5 for 95%+ on keybr, +5 for a perfect line, +5 for the vault from memory, +5 for the Python line) · a step 15 · a program 25 · a checkpoint 50 (+25 first try) · a teach-back 30 · a module 100 · a complete session 20 · 7-day streak 50 · 30-day streak 200.</p>
        </section>
      </main>
    </Shell>
  );
}
