import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError, logError } from "../../../lib/guard";
import { WONDERS, todaysWonder } from "../../../lib/wonders";

export const runtime = "nodejs";

/** GET: today's wonder for the banner - title and whether it is already in her logbook. */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const w = await todaysWonder();
    return NextResponse.json({ id: w.wonder.id, title: w.wonder.title, cat: w.wonder.cat, readToday: w.readToday });
  } catch (e) { return NextResponse.json(safeError(e, "wonder"), { status: 500 }); }
}

/** POST { read: id }: she has read today's wonder. No test - the record is for her logbook and the Wonderer badge. */
export async function POST(req) {
  try {
    // 16 Oct 2026: every refusal is logged (where she can see it on the guardian page), because a silent 4xx looked like "the button does nothing".
    if (!(await isStudent())) { logError("wonder:save", new Error("not signed in (student cookie missing on POST)"), true); return NextResponse.json({ error: "not signed in - open CogniPace from your own link again" }, { status: 401 }); }
    if (!sameOrigin(req)) { logError("wonder:save", new Error(`origin check failed: sec-fetch-site=${req.headers.get("sec-fetch-site")} origin=${req.headers.get("origin")} host=${req.headers.get("x-forwarded-host") || req.headers.get("host")}`), true); return NextResponse.json({ error: "the request did not look like it came from the CogniPace page" }, { status: 403 }); }
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    // 29 Oct 2026 (review 01 L7): only today's wonder can be saved (one a day, +5 XP each), not any id on the list.
    const tw = await todaysWonder();
    const w = WONDERS.find((x) => x.id === String(b.read || "") && x.id === tw.wonder?.id);
    if (!w) { logError("wonder:save", new Error(`no such wonder: ${String(b.read).slice(0, 60)}`), true); return NextResponse.json({ error: "this wonder is not on today's list - reload the page" }, { status: 400 }); }
    const fresh = await q("INSERT INTO wonders_read (wonder_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING wonder_id", [w.id]);
    if (fresh.length) await q("INSERT INTO journal (kind, title, body) VALUES ('wonder', $1, $2)", [`Wonder: ${w.title}`, w.cat]).catch((e) => logError("wonder:journal", e, false));
    else logError("wonder:save", new Error(`already recorded: ${w.id} (saved before, so nothing new - the page should move on tomorrow)`), false);
    return NextResponse.json({ ok: true, already: !fresh.length });
  } catch (e) { return NextResponse.json(safeError(e, "wonder"), { status: 500 }); }
}
