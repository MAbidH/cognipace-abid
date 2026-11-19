import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { localYmd } from "../../../lib/time";
import { getProgress } from "../../../lib/curriculum";
import { computeRewards } from "../../../lib/rewards";
import { safeError } from "../../../lib/guard";

export const runtime = "nodejs";

/** Her logbook as a Markdown file she keeps herself (school/logbook.md). Everything the app recorded, in her hands. */
export async function GET() {
  try { return await build(); } catch (e) { return NextResponse.json(safeError(e, "portfolio"), { status: 500 }); } // 29 Oct 2026: failures reach the errors table
}

async function build() {
  if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const name = process.env.STUDENT_NAME || "My";
  const [progress, journal, teach, typing, rw] = await Promise.all([
    getProgress(),
    q("SELECT module_id, step_id, kind, title, body, at FROM journal ORDER BY id"),
    q("SELECT step_id, payload->>'text' AS text, score, started_at FROM events WHERE kind='teach' AND passed ORDER BY id"),
    q("SELECT COUNT(*)::int AS days, MAX(accuracy) AS k, MAX(drill_accuracy) AS d, COUNT(*) FILTER (WHERE vault_done)::int AS v FROM typing"),
    computeRewards().catch(() => null),
  ]);
  const d = (t) => localYmd(new Date(t).getTime()); // student day
  const t = typing[0] || {};
  const L = [];
  L.push(`# ${name === "My" ? "My" : name + "'s"} logbook`, "", `Exported ${d(new Date())} from CogniPace. Everything here was done by me, step by step, on my own laptop.`, "");
  if (rw) L.push(`**Level ${rw.level.n} - ${rw.level.name}** - ${rw.xp} XP - ${rw.hours} hours of real work - best streak ${rw.session.maxStreak} days - badges: ${rw.badges.filter((b) => b.at).map((b) => b.name).join(", ") || "none yet"}`, "");
  L.push(`Typing: ${t.days || 0} days of practice - best keybr ${t.k != null ? Number(t.k) + "%" : "-"} - best all-the-keys line ${t.d != null ? Number(t.d) + "%" : "-"} - vault unlocked from memory ${t.v || 0} days.`, "");
  L.push("## Modules passed", "");
  for (const p of progress.filter((x) => x.status === "passed")) L.push(`- **${p.id}** ${p.title}${p.best_score != null ? ` - ${Math.round(Number(p.best_score) * 100)}%` : ""}${p.passed_at ? ` - ${d(p.passed_at)}` : ""}`);
  L.push("", "## In my own words", "");
  for (const j of journal.filter((x) => x.kind === "note")) L.push(`### ${d(j.at)}${j.title ? " - " + j.title : ""}`, "", j.body, "");
  for (const x of teach) L.push(`### ${d(x.started_at)} - ${x.step_id} - teach-it-back (clarity ${Math.round(Number(x.score) * 100)}%)`, "", x.text, "");
  L.push("## Programs I wrote", "");
  for (const j of journal.filter((x) => x.kind === "step" && x.body)) L.push(`### ${d(j.at)} - ${j.step_id} - ${j.title}`, "", "```python", j.body, "```", "");
  L.push("## Every step, in order", "");
  for (const j of journal.filter((x) => x.kind !== "note")) L.push(`- ${d(j.at)} - ${j.kind === "module" ? "**" + j.title + "**" : j.kind === "badge" || j.kind === "session" || j.kind === "claim" ? j.title : `${j.step_id} - ${j.title}`}`);
  L.push("");
  return new NextResponse(L.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="logbook-${d(new Date())}.md"` },
  });
}
