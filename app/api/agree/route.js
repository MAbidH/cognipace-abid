import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { AGREEMENT_VERSION, cleanAgreement, MIN_WORDS } from "../../../lib/agreement";

export const runtime = "nodejs";

/* Her winter school agreement (3 Nov 2026, lib/agreement.js). GET -> { signed, at }. POST { words } -> signed. */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const [r] = await q("SELECT at, her_words FROM agreement WHERE version=$1 ORDER BY id DESC LIMIT 1", [AGREEMENT_VERSION]);
    return NextResponse.json({ version: AGREEMENT_VERSION, signed: !!r, at: r?.at || null, words: r?.her_words || "" });
  } catch (e) { return NextResponse.json(safeError(e, "agree"), { status: 500 }); }
}

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const words = cleanAgreement(b.words);
    if (!words) return NextResponse.json({ error: `Write it in your own words - at least ${MIN_WORDS} words.` }, { status: 400 });
    const [r] = await q("INSERT INTO agreement (version, her_words) VALUES ($1,$2) RETURNING at", [AGREEMENT_VERSION, words]);
    await q("INSERT INTO journal (kind, title, body) VALUES ('agreement', 'Signed: my winter school', $1)", [words]).catch(() => {});
    return NextResponse.json({ ok: true, signed: true, at: r.at });
  } catch (e) { return NextResponse.json(safeError(e, "agree"), { status: 500 }); }
}
