import { redirect } from "next/navigation";
import { isStudent } from "../lib/auth";
import { getProgress, currentModule, minutesToday, dailyMinutes } from "../lib/curriculum";
import { computeRewards } from "../lib/rewards";
import { q } from "../lib/db";
import { dhakaHour, TZ } from "../lib/time";
import Shell from "../components/Shell";
import { ModuleArt } from "../components/Art";
import { XpRing, SkillMap, StreakCalendar, MinuteBars } from "../components/Viz";
import { isArenaDay } from "../lib/arena";
import { todaysWonder } from "../lib/wonders";
import { MEETINGS, unlocked, getMeet, unlockText, activeMeeting } from "../lib/meet";
import { todaysGoal } from "../lib/goal";
import { dailyCap, birthday } from "../lib/calendar";
import { typingToday } from "../lib/typing";
import { warmupDone } from "../components/warmup";
import { keyLabel } from "../components/keymap";
import VoiceCard from "../components/VoiceCard";
import OfflineCard from "../components/OfflineCard";
import AgreeCard from "../components/AgreeCard";
import PaperCard from "../components/PaperCard";
import PuzzleCard from "../components/PuzzleCard";
import { NEWS } from "../lib/news";

export const dynamic = "force-dynamic";

export default async function Home(props) {
  const searchParams = await props.searchParams;
  // Continue is a plain <a>, not next/link, on purpose: a full document navigation always works.
  // A client-side route change breaks silently if the page was loaded from an older deployment
  // (her laptop keeps the web app open for hours; we deploy during the day), and the tap does nothing.
  // Her link is /?t=TOKEN. If she already has a session cookie, show the map (the token stays in the
  // address so a home-screen icon keeps it). Otherwise enter first.
  const entered = await isStudent();
  if (!entered && searchParams?.t) redirect(`/api/enter?t=${encodeURIComponent(searchParams.t)}`);
  if (!entered) {
    return (
      <main className="wrap narrow" style={{ paddingTop: 80 }}>
        <div className="brand" style={{ fontSize: 22 }}><span className="dot" />COGNIPACE</div>
        <p className="soft" style={{ marginTop: 12 }}>This door opens with your link. Ask Abid to send it again.</p>
      </main>
    );
  }

  const [progress, cur, mins, rw, byDay, wonder, arenaRows] = await Promise.all([getProgress(), currentModule(), minutesToday(), computeRewards().catch(() => null), dailyMinutes(14).catch(() => []), todaysWonder().catch(() => null), q("SELECT MAX(score)::int AS best FROM arena WHERE done").catch(() => [{ best: 0 }])]);
  const cans = await q("SELECT title, module_id, at FROM journal WHERE kind='can' ORDER BY id DESC LIMIT 60").catch(() => []);
  // The warm-up is optional now (29 Oct 2026): a card on the map while today's parts are not done. Never a gate.
  const typing = await typingToday().catch(() => null);
  const warmOffered = !!typing && (process.env.TYPING_GATE === "1" || typing.optional) && !typing.installDay && !warmupDone(typing);
  const arena = isArenaDay();
  const goal = cur ? await todaysGoal(cur, rw).catch(() => null) : null;
  const meet = await (async () => { const act = await activeMeeting(rw).catch(() => null); const m = act?.meeting || MEETINGS.find((x) => !unlocked(x, rw)) || null; if (!m) return null; const open = unlocked(m, rw); const st = open ? await getMeet(m.id).catch(() => null) : null; return { m, open, stage: st?.stage }; })();
  const arenaBest = arenaRows[0]?.best || 0;
  const cap = dailyCap();
  const bday = birthday();
  const name = process.env.STUDENT_NAME || "";
  const curIdx = progress.findIndex((p) => p.status === "current");
  const hour = dhakaHour();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const left = Math.max(0, cap - mins);
  const step = cur ? cur.module.steps[cur.row.step_index] : null;
  const passed = progress.filter((p) => p.status === "passed").length;
  const today = rw?.session?.today || byDay[byDay.length - 1]?.day;
  const waiting = rw?.unlocks?.filter((u) => u.reached && !u.claimed) || [];

  return (
    <Shell active="/" rw={rw} mins={mins} cap={cap}>
      <main className="wrap">
        {/* ---- Her birthday (Abid, 9 Oct 2026): the school celebrates, with her own numbers - real things, not noise. ---- */}
        {bday.today && rw && (
          <section className="card bday rise" style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ color: "var(--amber)" }}>today · {bday.age ? `you are ${bday.age}` : "your birthday"}</div>
            <h2 style={{ marginTop: 4 }}>Happy birthday, {name || "Faiza"}.</h2>
            <p className="soft" style={{ marginTop: 6 }}>Everyone at the school is glad you were born. Here is what you have built since you started, all of it real:</p>
            <div className="tiles" style={{ marginTop: 10 }}>
              <div className="tile"><div className="v num">{rw.hours}</div><div className="l">hours of real work</div></div>
              <div className="tile"><div className="v num">{rw.session?.total ?? "—"}</div><div className="l">complete sessions</div></div>
              <div className="tile"><div className="v num">{passed}</div><div className="l">modules passed</div></div>
              <div className="tile"><div className="v num">{cans.length}</div><div className="l">things you can do now</div></div>
              <div className="tile"><div className="v num">{rw.badges.filter((b) => b.at).length}</div><div className="l">badges</div></div>
            </div>
            {bday.age === 13 && <p className="small" style={{ marginTop: 10, color: "var(--amber)" }}>Thirteen means something here: from today the e-mail address and the vault you set up are yours, in your own name. That lesson is waiting on the path.</p>}
            <p className="small soft" style={{ marginTop: 8 }}>Today is a working day like any other on the path, by your own choice - and the streak is safe whatever happens.</p>
          </section>
        )}
        {/* ---- Instruments: level ring, the numbers, and today's mission ---- */}
        <section className="hero rise">
          {rw ? <XpRing rw={rw} /> : <div />}
          <div>
            <div className="eyebrow">{greet}{name ? `, ${name}` : ""}</div>
            <h1 style={{ marginTop: 4 }}>{cur ? (left > 0 ? `${left} minutes of building left today.` : "Today's work is done.") : "Every module so far is finished."}</h1>
            {rw && (
              <div className="tiles" style={{ marginTop: 12 }}>
                <div className="tile"><div className="v num">{rw.xp}</div><div className="l">XP{rw.next ? ` · ${rw.next.xp - rw.xp} to ${rw.next.name}` : ""}</div></div>
                <div className="tile"><div className="v num">{rw.session.streak}<span className="small soft"> / best {rw.session.maxStreak}</span></div><div className="l">day streak{rw.session.done ? " · today ✓" : ""}</div></div>
                <div className="tile"><div className="v num">{passed}<span className="small soft"> / {progress.length}</span></div><div className="l">modules passed</div></div>
                <div className="tile"><div className="v num">{rw.hours}</div><div className="l">hours of real work</div></div>
                <div className="tile"><div className="v num">{rw.badges.filter((b) => b.at).length}<span className="small soft"> / {rw.badges.length}</span></div><div className="l">badges</div></div>
              </div>
            )}
            {waiting.length > 0 && <p className="small" style={{ marginTop: 10, color: "var(--amber)" }}>A reward is waiting for you: {waiting[0].reward}. <a href="/rewards" style={{ color: "var(--amber)" }}>Claim it →</a></p>}
          </div>
        </section>

        {/* ---- Today's mission card ---- */}
        {cur && (
          <section className="card lit rise mission" style={{ marginTop: 20 }}>
            <div>
              <div className="eyebrow">now · {cur.module.id} · {cur.module.phase}</div>
              <h2 style={{ marginTop: 4 }}>{cur.module.title}</h2>
              <p className="soft">{cur.module.hook}</p>
              <div className="steps" aria-hidden="true">{cur.module.steps.map((s, i) => <i key={s.id} className={i < cur.row.step_index ? "done" : i === cur.row.step_index ? "now" : ""} />)}</div>
              {step && <p className="small">Next up: <strong>{step.title}</strong>{cur.row.remediation ? " (fixing what you missed)" : ""} · step {cur.row.step_index + 1} of {cur.module.steps.length}
                {goal?.next && <span style={{ color: "var(--cyan)" }}> · bring about <b>{goal.next.minutes} minutes</b></span>}</p>}
              {goal?.exam && <p className="small" style={{ color: "var(--amber)" }}>Exam time at school. Here, only {goal.examMinutes} minutes a day: the warm-up, your Python line and the Wonder. Your streak is safe. Your exams come first - the path waits for you.</p>}
              {goal && goal.steps.length > 0 && (
                <p className="small" style={{ color: goal.allDone ? "var(--lime)" : "var(--amber)" }}>
                  {goal.allDone ? "Today's goal is done." : <>Today, finish at least: {goal.steps.filter((s) => !s.done).map((s) => `${s.title} (~${s.minutes} min)`).join(", ")} - about {goal.remainingMinutes} minutes in all.</>}
                  {goal.sooner && !goal.allDone && <span className="soft"> Keep this pace and your next reward ({goal.sooner.reward.replace(/\s[-:]\s.*$/, "").replace(/[.:]$/, "").trim()}) comes in about {goal.sooner.now} days, not {goal.sooner.was}.</span>}
                </p>
              )}
              {cur.module.gift && <p className="small" style={{ color: "var(--amber)" }}><b>At the end of this module you make something for {cur.module.gift.for}:</b> {cur.module.gift.what}</p>}
              {cur.module.read?.url && <p className="small"><a href={cur.module.read.url} target="_blank" rel="noopener noreferrer">{cur.module.read.title}</a> ↗</p>}
              {left > 0
                ? <a className="btn primary" href="/learn" title={`Continue (${keyLabel(2)} from any page)`}>Continue <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>{keyLabel(2)}</kbd></a>
                : <span className="btn" aria-disabled="true" style={{ opacity: 0.45 }}>Back tomorrow</span>}
            </div>
            <div className="art" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}><ModuleArt id={cur.module.id} phase={cur.module.phase} /></div>
          </section>
        )}

        {/* ---- The optional warm-up (29 Oct 2026): ~5 minutes, +XP, never a gate ---- */}
        {warmOffered && (
          <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(34, 211, 238, 0.35)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow">every day · first · +XP</div><h3 style={{ margin: "2px 0" }}>Daily warm-up - about 15 minutes, both hands, eyes on the screen</h3><p className="small soft" style={{ margin: 0 }}>Six minutes of typing{typing.codeEnabled ? ", your Python line" : ""}, two review questions and quick maths - then your lesson opens. The key move is an extra.</p></div>
            <a className="btn" href="/learn?warmup=1">Warm up</a>
          </section>
        )}
        {/* ---- Her voice (29 Oct 2026): shown when /api/voice says it is time to ask again ---- */}
        <VoiceCard />
        {/* ---- Her winter school agreement (3 Nov 2026) ---- */}
        <AgreeCard />
        {/* ---- School maths on paper, checked from a photo (25 Nov 2026) ---- */}
        <PaperCard />
        {/* ---- The Saturday puzzle set (25 Nov 2026) ---- */}
        <PuzzleCard />
        {/* ---- The offline pack (2 Nov 2026): worksheets for days without internet ---- */}
        <OfflineCard />

        {/* ---- A real call with a real engineer (Abid, 5 Oct 2026): locked until Level 5, then prepared here ---- */}
        {meet && (
          <section className="card rise" style={{ marginTop: 14, borderColor: meet.open ? "rgba(163, 230, 53, 0.5)" : "var(--line)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: meet.open ? "var(--lime)" : "var(--ink-mute)" }}>{meet.open ? (meet.stage === "ready" ? "ready for the call" : meet.stage === "done" ? "call done" : "get ready for your call") : `opens at ${unlockText(meet.m)}`}</div><h3 style={{ margin: "2px 0" }}>Meet {meet.m.callName} - {meet.m.id === "sifat" ? "an air force engineer" : "a real engineer"}, on a video call</h3><p className="small soft" style={{ margin: 0 }}>{meet.open ? "Learn three things about her work, write your introduction and three real questions, rehearse with the tutor." : `Your reward for ${unlockText(meet.m)}: twenty minutes with someone who does this for a living. You will prepare first.`}</p></div>
            <a className={meet.open ? "btn primary" : "btn"} href={`/meet?id=${meet.m.id}`}>{meet.open ? "Prepare" : "See who"} <kbd style={{ background: meet.open ? "rgba(0,0,0,0.2)" : undefined, color: meet.open ? "#04141a" : undefined, borderColor: "transparent" }}>{keyLabel(9)}</kbd></a>
          </section>
        )}

        {/* ---- Today's extra ten minutes: a Wonder every day; the Arena (games) every second day ---- */}
        {wonder && (
          <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(167, 139, 250, 0.5)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: "var(--violet)" }}>today's wonder · {wonder.wonder.cat}</div><h3 style={{ margin: "2px 0" }}>{wonder.wonder.title}</h3><p className="small soft" style={{ margin: 0 }}>Ten minutes of something true that never changes. No test - just knowing it.{wonder.readToday ? " Read today ✓" : ""}</p></div>
            <a className="btn primary" href="/wonder">{wonder.readToday ? "Read again" : "Read"} <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>{keyLabel(6)}</kbd></a>
          </section>
        )}
        {/* ---- This week in the cyber world (3 Nov 2026): real stories with pictures and videos ---- */}
        {NEWS.length > 0 && (
          <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(34, 211, 238, 0.5)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: "var(--cyan)" }}>the cyber world · {NEWS.length} stories</div><h3 style={{ margin: "2px 0" }}>{NEWS[0].title}</h3><p className="small soft" style={{ margin: 0 }}>What really happened this month - with a video, how the door was opened, and how defenders close it.</p></div>
            <a className="btn primary" href="/news">Watch and read</a>
          </section>
        )}
        {arena && (
          <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(251, 191, 36, 0.5)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}><div className="eyebrow" style={{ color: "var(--amber)" }}>game day</div><h3 style={{ margin: "2px 0" }}>The Arena is open</h3><p className="small soft" style={{ margin: 0 }}>Ten minutes, six rounds, after your real work: quiz, lamps, keys, bugs, pictures, one line. Best so far: {arenaBest}.</p></div>
            <a className="btn primary" href="/arena">Play <kbd style={{ background: "rgba(0,0,0,0.2)", color: "#04141a", borderColor: "transparent" }}>{keyLabel(7)}</kbd></a>
          </section>
        )}

        {/* ---- What I can do now (6 Oct 2026): capabilities in her own words, one per finished step ---- */}
        <section style={{ marginTop: 26 }}>
          <div className="eyebrow" style={{ color: "var(--lime)" }}>what I can do now · {cans.length}</div>
          <h2 style={{ marginTop: 4 }}>Things you could not do a month ago</h2>
          {cans.length === 0
            ? <p className="small soft">Every step you finish adds one line here, in your own words. The first one arrives with your next finished step.</p>
            : <div className="canwall">{cans.map((c, i) => <span key={i} className="can" title={`${c.module_id} · ${new Date(c.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ })}`}>{c.title}</span>)}</div>}
        </section>

        {/* ---- The map ---- */}
        <section style={{ marginTop: 26 }}>
          <div className="eyebrow">the map</div>
          <h2 style={{ marginTop: 4 }}>Where you are on the path</h2>
          <div className="card mapwrap" style={{ padding: "10px 6px" }}><SkillMap progress={progress} curIdx={curIdx} /></div>
          <p className="small mute" style={{ marginTop: 8 }}>Green = passed · cyan = you are here · grey = locked until you get there. Cyan labels are maths, violet is computing, amber is general knowledge.</p>
        </section>

        {/* ---- Streak and minutes ---- */}
        {rw && (
          <section className="grid two" style={{ marginTop: 20 }}>
            <div className="card">
              <div className="eyebrow">sessions · last 8 weeks</div>
              <p className="small soft" style={{ margin: "4px 0 12px" }}>A square lights up fully when a day has 25 minutes of real work and a finished step - or 50 minutes of real work on a big step, even if it did not finish that day. Fridays (call day) and exam days never break a streak, and one missed day a week is forgiven.</p>
              <StreakCalendar sessionDays={rw.sessionDays} minutesByDay={byDay} today={today} />
              <p className="small mute" style={{ marginTop: 10 }}>{rw.session.total} complete sessions · best streak {rw.session.maxStreak} days</p>
            </div>
            <div className="card">
              <div className="eyebrow">minutes · last 14 days</div>
              <p className="small soft" style={{ margin: "4px 0 12px" }}>Real minutes, counted only while you are working. Today: {mins} of {cap}.</p>
              <MinuteBars minutesByDay={byDay} today={today} cap={cap} />
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}
