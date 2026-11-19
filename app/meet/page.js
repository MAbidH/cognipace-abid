import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import { MEETINGS, getMeet, unlocked, unlockText, activeMeeting } from "../../lib/meet";
import Shell from "../../components/Shell";
import MeetRoom from "../../components/MeetRoom";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

/** Meeting a real person: who they are, three things to know, then preparation with the tutor. */
export default async function MeetPage({ searchParams }) {
  if (!(await isStudent())) redirect("/");
  const [rw, mins] = await Promise.all([computeRewards().catch(() => null), minutesToday()]);
  const cap = dailyCap();
  const sp = (await searchParams) || {};
  const act = await activeMeeting(rw).catch(() => null);
  const m = MEETINGS.find((x) => x.id === sp.id) || act?.meeting || MEETINGS.find((x) => !unlocked(x, rw)) || MEETINGS[0];
  const open = unlocked(m, rw);
  const st = open ? await getMeet(m.id) : null;
  return (
    <Shell active="/meet" rw={rw} mins={mins} cap={cap}>
      <main className="wrap">
        {MEETINGS.length > 1 && <div className="small" style={{ marginBottom: 8 }}>{MEETINGS.map((x) => <a key={x.id} href={`/meet?id=${x.id}`} className="pill" style={{ marginRight: 8, borderColor: x.id === m.id ? "var(--cyan)" : undefined }}>{x.callName}{unlocked(x, rw) ? "" : ` · ${unlockText(x)}`}</a>)}</div>}
        <div className="eyebrow">a real call · {m.field}</div>
        <h1 style={{ marginTop: 4 }}>Meet {m.callName}</h1>
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0 }}>{m.who}</p>
          <p className="small soft" style={{ marginTop: 8 }}>{m.how}</p>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--cyan)" }}>the twenty minutes</div>
              <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{(m.plan || []).map((x, i) => <li key={i} style={{ margin: "3px 0" }}>{x}</li>)}</ul>
            </div>
            <div>
              <div className="eyebrow" style={{ color: "var(--amber)" }}>lines you will say out loud</div>
              <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{(m.manners || []).map((x, i) => <li key={i} style={{ margin: "3px 0" }}>{x}</li>)}</ul>
              <p className="small soft" style={{ marginTop: 6 }}>On the call you are never silent. If you did not understand, you ask. If you are asked, you answer with a reason.</p>
            </div>
          </div>
        </div>
        {!open ? (
          <div className="card amber">
            <div className="eyebrow" style={{ color: "var(--amber)" }}>opens at {unlockText(m)}</div>
            <p style={{ margin: "6px 0 0" }}>This call is your reward for {unlockText(m)}. {m.unlock.kind === "level" && rw?.next ? `${rw.next.xp - rw.xp} XP to go.` : m.unlock.kind === "streak" && rw ? `Your best streak so far: ${rw.session.maxStreak} days.` : ""} When you get there, you will prepare here with the tutor: learn three things about her work, write your introduction, write three real questions, and rehearse.</p>
            <div className="grid" style={{ marginTop: 12 }}>
              {m.learn.map((l, i) => <div key={i} className="card" style={{ padding: "12px 14px" }}><div className="small" style={{ color: "var(--cyan)" }}>{l.title}</div><p className="small soft" style={{ margin: "4px 0 0" }}>{l.text}</p></div>)}
            </div>
          </div>
        ) : (
          <MeetRoom initial={{ id: st.meeting.id, callName: st.meeting.callName, stage: st.stage, intro: st.intro, questions: st.questions, after: st.after }} />
        )}
      </main>
    </Shell>
  );
}
