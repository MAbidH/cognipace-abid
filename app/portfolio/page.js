import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { q } from "../../lib/db";
import { getProgress, minutesToday } from "../../lib/curriculum";
import { computeRewards } from "../../lib/rewards";
import Shell from "../../components/Shell";
import { fmtDate } from "../../lib/time";
import { ModuleArt } from "../../components/Art";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

/** Her logbook: the record of everything she has built and learned, in one place she can show people. */
export default async function Portfolio() {
  if (!(await isStudent())) redirect("/");
  const name = process.env.STUDENT_NAME || "My";
  const [progress, journal, teach, typing, time, rw, mins] = await Promise.all([
    getProgress(),
    q(`SELECT module_id, step_id, kind, title, body, at FROM journal ORDER BY id DESC LIMIT 300`),
    q(`SELECT module_id, step_id, payload->>'text' AS text, score, started_at FROM events WHERE kind='teach' AND passed ORDER BY id DESC LIMIT 40`),
    q(`SELECT COUNT(*)::int AS days, MAX(accuracy) AS best_keybr, MAX(drill_accuracy) AS best_drill, MAX(drill_wpm) AS best_wpm,
              COUNT(*) FILTER (WHERE day > (now() AT TIME ZONE 'Asia/Dhaka')::date - 7)::int AS week FROM typing`),
    q(`SELECT COALESCE(SUM(active_ms),0)::bigint AS ms, MIN(started_at) AS since FROM events`),
    computeRewards().catch(() => null), minutesToday(),
  ]);
  const cap = dailyCap();
  const passed = progress.filter((p) => p.status === "passed");
  const t = typing[0] || {}, tm = time[0] || {};
  const hours = Math.round(Number(tm.ms || 0) / 3600000 * 10) / 10;
  const since = tm.since ? fmtDate(tm.since) : "";
  const fmt = fmtDate;

  const programs = journal.filter((j) => j.kind === "step" && j.body);
  const notes = journal.filter((j) => j.kind === "note");
  const cans = journal.filter((j) => j.kind === "can");
  return (
    <Shell active="/portfolio" rw={rw} mins={mins} cap={cap}>
    <main className="wrap">
      <div className="eyebrow">logbook · the record</div>
      <h1 style={{ marginTop: 4 }}>{name === "My" ? "My" : `${name}'s`} logbook</h1>
      <p className="soft">Everything here was done by me, step by step, on my own laptop.{since ? ` Started ${since}.` : ""}</p>
      <p><a className="btn primary" href="/api/portfolio">Download my logbook (.md)</a> <span className="small soft" style={{ marginLeft: 8 }}>Save it in your school folder. It is yours, and it is the proof.</span></p>

      <div className="tiles" style={{ marginTop: 16 }}>
        <div className="tile"><div className="v num">{passed.length}<span className="small soft"> / {progress.length}</span></div><div className="l">modules passed</div></div>
        <div className="tile"><div className="v num">{hours}</div><div className="l">hours of real work</div></div>
        <div className="tile"><div className="v num">{programs.length}</div><div className="l">programs written</div></div>
        <div className="tile"><div className="v num">{t.days || 0}</div><div className="l">days of typing ({t.week || 0} this week)</div></div>
        <div className="tile"><div className="v num">{t.best_drill != null ? `${Number(t.best_drill)}%` : "—"}</div><div className="l">best all-the-keys line{t.best_wpm ? ` · ${t.best_wpm} wpm` : ""}</div></div>
      </div>

      <h2 style={{ marginTop: 28 }}>What I can do now</h2>
      {cans.length === 0 ? <p className="small soft">One line arrives here with every step you finish, in your own words.</p>
        : <div className="canwall">{cans.map((c, i) => <span key={c.id ?? i} className="can" title={`${c.step_id} · ${fmt(c.at)}`}>{c.title}</span>)}</div>}

      <h2 style={{ marginTop: 28 }}>Modules I have passed</h2>
      {passed.length === 0 && <p className="soft">The first one is coming.</p>}
      <div className="grid three">
        {passed.map((p) => (
          <div className="card" key={p.id} style={{ padding: 0, overflow: "hidden" }}>
            <ModuleArt id={p.id} phase={p.phase} />
            <div style={{ padding: "10px 14px 12px" }}>
              <div className="eyebrow" style={{ color: "var(--lime)" }}>{p.id} · passed{p.best_score != null ? ` · ${Math.round(Number(p.best_score) * 100)}%` : ""}</div>
              <strong>{p.title}</strong>
              <div className="small soft">{p.passed_at ? fmt(p.passed_at) : ""}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 28 }}>In my own words</h2>
      <p className="small soft">What I wrote after finishing each module, and my teach-it-back explanations.</p>
      <div className="grid two">
        {notes.map((j) => (
          <div className="card" key={j.id ?? j.at}><div className="eyebrow" style={{ color: "var(--amber)" }}>{fmt(j.at)}{j.title ? ` · ${j.title}` : ""}</div><p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{j.body}</p></div>
        ))}
        {teach.map((x, i) => (
          <div className="card" key={`t${i}`}><div className="eyebrow" style={{ color: "var(--violet)" }}>{fmt(x.started_at)} · {x.step_id} · teach-it-back · clarity {Math.round(Number(x.score) * 100)}%</div><p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{x.text}</p></div>
        ))}
      </div>
      {notes.length + teach.length === 0 && <p className="soft">Nothing written yet.</p>}

      <h2 style={{ marginTop: 28 }}>Programs I wrote</h2>
      {programs.map((j) => (
        <div className="card" key={j.at + j.step_id} style={{ marginBottom: 14, padding: 14 }}>
          <div className="termbar"><i /><i /><i /><span style={{ marginLeft: 6 }}>{j.step_id} · {fmt(j.at)}</span><span style={{ marginLeft: "auto" }}>{j.title}</span></div>
          <pre className="output" style={{ margin: 0 }}>{j.body}</pre>
        </div>
      ))}
      {programs.length === 0 && <p className="soft">The first program is coming.</p>}

      <h2 style={{ marginTop: 28 }}>Every step, in order</h2>
      <div className="card" style={{ padding: "6px 14px" }}>
        <table style={{ width: "100%" }}><thead><tr><th className="small soft">When</th><th className="small soft">What</th></tr></thead>
          <tbody>{journal.filter((j) => j.kind !== "note" && j.kind !== "can").map((j, i) => <tr key={i}><td className="small mute mono" style={{ whiteSpace: "nowrap" }}>{fmt(j.at)}</td><td className="small">{j.kind === "module" ? <strong style={{ color: "var(--lime)" }}>{j.title}</strong> : j.kind === "badge" ? <span style={{ color: "var(--amber)" }}>{j.title}</span> : `${j.step_id ? `${j.step_id} · ` : ""}${j.title}`}</td></tr>)}</tbody></table>
      </div>

      <p className="small mute" style={{ marginTop: 28 }}>Press Ctrl+P to print or save this page as a PDF.</p>
    </main>
    </Shell>
  );
}
