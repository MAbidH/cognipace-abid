import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { VOICE_FIELDS, voiceDue, cleanVoice } from "../../../lib/voice";

export const runtime = "nodejs";

/* HER VOICE (29 Oct 2026, review 06: "ask Faiza what she wants"). What she wants to be, to learn, what she enjoys,
   what is hard, what she wishes Abid knew - in her words, each optional, at least one. Abid reads it on /guardian;
   the tutor sees a one-line summary (HER OWN GOALS) and never promises a change to the path. */

const shape = (r) => r ? { at: r.at, ...Object.fromEntries(VOICE_FIELDS.map((k) => [k, r[k] || ""])) } : null;

/** GET -> { latest, history: [{at, ...}], due } ; due = never answered, or the last answer is over 30 days old. */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const rows = await q(`SELECT at, ${VOICE_FIELDS.join(", ")} FROM voice ORDER BY id DESC LIMIT 12`);
    return NextResponse.json({ latest: shape(rows[0]), history: rows.map(shape), due: voiceDue(rows[0]?.at) });
  } catch (e) { return NextResponse.json(safeError(e, "voice"), { status: 500 }); }
}

/** POST { want_to_be?, want_to_learn?, enjoys?, finds_hard?, wish_for_abid? } (each <= 600 chars, at least one). */
export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const v = cleanVoice(b);
    if (!v) return NextResponse.json({ error: "Write at least one answer - any one is fine." }, { status: 400 });
    const [row] = await q(`INSERT INTO voice (${VOICE_FIELDS.join(", ")}) VALUES ($1,$2,$3,$4,$5) RETURNING at, ${VOICE_FIELDS.join(", ")}`, VOICE_FIELDS.map((k) => v[k] || null));
    await q("INSERT INTO journal (kind, title, body) VALUES ('voice', 'She said what she wants', $1)",
      [VOICE_FIELDS.filter((k) => v[k]).map((k) => `${k.replace(/_/g, " ")}: ${v[k]}`).join("\n").slice(0, 3000)]).catch(() => {});
    return NextResponse.json({ ok: true, latest: shape(row), due: false });
  } catch (e) { return NextResponse.json(safeError(e, "voice"), { status: 500 }); }
}
