import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import { todaysWonder, WONDERS } from "../../lib/wonders";
import { q } from "../../lib/db";
import { isArenaDay } from "../../lib/arena";
import Shell from "../../components/Shell";
import { WonderArt } from "../../components/Art";
import WonderRoom from "../../components/WonderRoom";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

/** A Wonder: ten minutes of something true and timeless, told as a story, talked about with the tutor. No test, ever. */
export default async function WonderPage() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins, w] = await Promise.all([computeRewards().catch(() => null), minutesToday(), todaysWonder()]);
  // Today's talk about this wonder, so a reload continues it instead of greeting her again (6 Oct 2026: four "Hi Faiza!" in one morning).
  const history = await q(`SELECT role, content FROM chats WHERE ctx='wonder' AND step_id=$1 AND (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date ORDER BY id`, [w.wonder.id]).catch(() => []);
  const cap = dailyCap();
  const arena = isArenaDay();
  return (
    <Shell active="/wonder" rw={rw} mins={mins} cap={cap}>
      <main className="wrap">
        {arena && <p className="small" style={{ color: "var(--amber)" }}>Today is also a game day - the <a href="/arena" style={{ color: "var(--amber)" }}>Arena</a> is open after your real work.</p>}
        <div className="eyebrow">wonder · {w.wonder.cat} · {w.readCount} of {WONDERS.length} read</div>
        <h1 style={{ marginTop: 4 }}>{w.wonder.title}</h1>
        <div className="grid two" style={{ alignItems: "start" }}>
          <div>
            <div className="art" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 14 }}><WonderArt pic={w.wonder.pic} /></div>
            <div className="card"><p style={{ fontSize: 18, lineHeight: 1.65, margin: 0 }}>{w.wonder.story}</p></div>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="eyebrow" style={{ color: "var(--violet)" }}>also true</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{w.wonder.also.map((a, i) => <li key={i} style={{ margin: "4px 0" }}>{a}</li>)}</ul>
            </div>
            <div className="card amber" style={{ marginTop: 12 }}>
              <div className="eyebrow" style={{ color: "var(--amber)" }}>something to think about - no wrong answer</div>
              <p style={{ margin: "6px 0 0", fontSize: 18 }}>{w.wonder.think}</p>
            </div>
          </div>
          <WonderRoom wonder={{ id: w.wonder.id, title: w.wonder.title, think: w.wonder.think }} readToday={w.readToday} history={history.map((h) => ({ role: h.role === "student" ? "user" : "assistant", content: h.content }))} />
        </div>
      </main>
    </Shell>
  );
}
