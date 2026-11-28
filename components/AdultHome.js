/* Abid's home page (28 Nov 2026): one focus, short and direct. What he is on, one button to continue, his path in two
   lists (career first; the hobby track optional, switchable both ways) and what he can do now. No XP, streaks, badges,
   rewards, warm-ups, wonders, arena or news - those are Faiza's school. Only rendered when student.json mode is adult. */
import Shell from "./Shell";
import TrackSwitch from "./TrackSwitch";
import { allModules, getProgress, currentModule, minutesToday, dailyMinutes } from "../lib/curriculum";
import { q } from "../lib/db";
import { STUDENT } from "../lib/student";
import { dhakaHour } from "../lib/time";

function Row({ m, p, isCur }) {
  const steps = m.steps.length;
  const state = p.status === "passed" ? "done ✓"
    : isCur ? `now · step ${p.step_index + 1} of ${steps}`
    : p.step_index > 0 ? `paused at step ${p.step_index + 1} of ${steps}`
    : `${steps} steps`;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{m.id} · {m.title}</div>
        <div className="small soft">{state}</div>
      </div>
      {p.status !== "passed" && !isCur && <TrackSwitch id={m.id} />}
    </div>
  );
}

export default async function AdultHome() {
  const [progress, cur, mins, week] = await Promise.all([getProgress(), currentModule(), minutesToday(), dailyMinutes(7).catch(() => [])]);
  const cans = await q("SELECT title FROM journal WHERE kind='can' ORDER BY id DESC LIMIT 12").catch(() => []);
  const byId = Object.fromEntries(progress.map((p) => [p.id, p]));
  const mods = allModules();
  const career = mods.filter((m) => m.track !== "hobby");
  const hobby = mods.filter((m) => m.track === "hobby");
  const weekMin = week.reduce((a, d) => a + (d.minutes || 0), 0);
  const step = cur ? cur.module.steps[cur.row.step_index] : null;
  const hour = dhakaHour();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <Shell active="/" rw={null} mins={mins} cap={null}>
      <main className="wrap narrow">
        <section className="card lit rise" style={{ marginTop: 20 }}>
          <div className="eyebrow">{greet}, {STUDENT.name} · {weekMin} min this week</div>
          {cur ? (
            <>
              <h2 style={{ marginTop: 6 }}>{cur.module.title}</h2>
              {step && <p className="soft" style={{ marginTop: 4 }}>Next: <strong>{step.title}</strong> · step {cur.row.step_index + 1} of {cur.module.steps.length} · about 30 minutes</p>}
              {cur.module.read?.url && <p className="small"><a href={cur.module.read.url} target="_blank" rel="noopener noreferrer">{cur.module.read.title}</a> ↗</p>}
              <a className="btn primary" href="/learn">Continue</a>
            </>
          ) : <h2 style={{ marginTop: 6 }}>Pick a module below to start.</h2>}
        </section>

        <section className="card rise" style={{ marginTop: 16 }}>
          <div className="eyebrow">career path · in order</div>
          <p className="small soft" style={{ margin: "4px 0 6px" }}>CRA and finance. This is the focus.</p>
          {career.map((m) => <Row key={m.id} m={m} p={byId[m.id] || { status: "locked", step_index: 0 }} isCur={cur?.module.id === m.id} />)}
        </section>

        <section className="card rise" style={{ marginTop: 16 }}>
          <div className="eyebrow">hobby track · optional</div>
          <p className="small soft" style={{ margin: "4px 0 6px" }}>Tech and security, when you feel like it. Switching keeps your place in both.</p>
          {hobby.map((m) => <Row key={m.id} m={m} p={byId[m.id] || { status: "locked", step_index: 0 }} isCur={cur?.module.id === m.id} />)}
        </section>

        {cans.length > 0 && (
          <section className="card rise" style={{ marginTop: 16 }}>
            <div className="eyebrow">what you can do now</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{cans.map((c, i) => <li key={i} className="small">{c.title}</li>)}</ul>
          </section>
        )}
      </main>
    </Shell>
  );
}
