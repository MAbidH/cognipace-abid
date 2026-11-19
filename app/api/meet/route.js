import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { computeRewards } from "../../../lib/rewards";
import { MEETINGS, STAGES, getMeet, unlocked } from "../../../lib/meet";

export const runtime = "nodejs";

const pub = (s) => ({ id: s.meeting.id, callName: s.meeting.callName, stage: s.stage, intro: s.intro, questions: s.questions, after: s.after });

/** GET ?id=orpi: where her preparation stands. */
export async function GET(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id") || MEETINGS[0]?.id;
    const s = await getMeet(id);
    if (!s) return NextResponse.json({ error: "no such meeting" }, { status: 404 });
    return NextResponse.json(pub(s));
  } catch (e) { return NextResponse.json(safeError(e, "meet"), { status: 500 }); }
}

/** POST { id, intro } | { id, questions:[3] } | { id, advance:true } | { id, after } - each saves and returns the state. */
export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const m = MEETINGS.find((x) => x.id === String(b.id || ""));
    if (!m) return NextResponse.json({ error: "no such meeting" }, { status: 400 });
    const rw = await computeRewards().catch(() => null);
    if (!unlocked(m, rw)) return NextResponse.json({ error: "not unlocked yet" }, { status: 403 });
    await q("INSERT INTO meet (id) VALUES ($1) ON CONFLICT DO NOTHING", [m.id]);

    if (typeof b.intro === "string") {
      const t = b.intro.trim().slice(0, 700);
      if (t.split(/\s+/).filter(Boolean).length < 12) return NextResponse.json({ error: "Your introduction needs at least twelve words - name, what you have learned, what you are building toward." }, { status: 400 });
      await q("UPDATE meet SET intro=$2, updated_at=now() WHERE id=$1", [m.id, t]);
    }
    if (Array.isArray(b.questions)) {
      const qs = b.questions.slice(0, 3).map((x) => String(x || "").trim().slice(0, 240));
      if (qs.length < 3 || qs.some((x) => x.split(/\s+/).filter(Boolean).length < 4)) return NextResponse.json({ error: "Three questions, each at least four words." }, { status: 400 });
      if (qs.some((x) => !/\?\s*$/.test(x))) return NextResponse.json({ error: "A question ends with a question mark." }, { status: 400 });
      await q("UPDATE meet SET questions=$2, updated_at=now() WHERE id=$1", [m.id, JSON.stringify(qs)]);
    }
    if (typeof b.after === "string") {
      const t = b.after.trim().slice(0, 2000);
      if (t.split(/\s+/).filter(Boolean).length < 40) return NextResponse.json({ error: "A logbook page is at least forty words: what she said, what surprised you, one thing you will do because of it." }, { status: 400 });
      await q("UPDATE meet SET after=$2, stage='done', updated_at=now() WHERE id=$1", [m.id, t]);
      await q("INSERT INTO journal (kind, title, body) VALUES ('note', $1, $2)", [`Meeting: ${m.callName}`, t]).catch(() => {});
    }
    if (b.advance === true) {
      const fresh = await getMeet(m.id);
      const i = STAGES.indexOf(fresh.stage);
      // Each part has a proof before the next opens.
      if (fresh.stage === "intro" && !fresh.intro) return NextResponse.json({ error: "Save your introduction first." }, { status: 400 });
      if (fresh.stage === "questions" && !(fresh.questions || []).every((x) => x && x.length > 3)) return NextResponse.json({ error: "Save your three questions first." }, { status: 400 });
      // 29 Oct 2026 (review 01 L6): Learn and Rehearse open the next part only after the tutor said [PART DONE] in that
      // part (the tutor route stores its raw reply, marker included, in chats ctx 'meet', step_id '<id>:<stage>').
      if (["learn", "rehearse"].includes(fresh.stage)) {
        const said = await q("SELECT 1 FROM chats WHERE ctx='meet' AND role='tutor' AND step_id=$1 AND content LIKE '%[PART DONE]%' LIMIT 1", [`${m.id}:${fresh.stage}`]);
        if (!said.length) return NextResponse.json({ error: "Finish this part with the tutor first." }, { status: 400 });
      }
      if (i >= 0 && i < STAGES.indexOf("ready")) {
        await q("UPDATE meet SET stage=$2, updated_at=now() WHERE id=$1", [m.id, STAGES[i + 1]]);
        if (STAGES[i + 1] === "ready") await q("INSERT INTO journal (kind, title, body) VALUES ('note', $1, $2)", [`Prepared to meet ${m.callName}`, `Introduction:\n${fresh.intro}\n\nQuestions:\n${(fresh.questions || []).map((x, k) => `${k + 1}. ${x}`).join("\n")}`]).catch(() => {});
      }
    }
    return NextResponse.json(pub(await getMeet(m.id)));
  } catch (e) { return NextResponse.json(safeError(e, "meet"), { status: 500 }); }
}
