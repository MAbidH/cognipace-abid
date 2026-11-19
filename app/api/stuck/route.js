import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";

export const runtime = "nodejs";

/** POST { page, what } - her own "something is broken" report (8 Oct 2026). Recorded as an error she saw and as a tutor
    note, so the guardian page shows it in red and the tutor knows at the next reply. Never fails loudly. */
export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const page = String(b.page || "").slice(0, 80);
    const what = String(b.what || "").trim().slice(0, 400);
    if (b.crash) {
      // A page crashed while the server was building it (app/error.js caught it). Recorded as an error she saw; no tutor
      // note, because the next reply would otherwise apologise for something she may already have forgotten.
      await q("INSERT INTO errors (where_, message, seen_by_her) VALUES ($1,$2,true)", ["crash:" + page, what || "page crashed while loading"]).catch(() => {});
      return NextResponse.json({ ok: true });
    }
    await q("INSERT INTO errors (where_, message, seen_by_her) VALUES ($1,$2,true)", ["her-report:" + page, what || "(no words - she pressed the button)"]).catch(() => {});
    await q("INSERT INTO notes (author, body, flagged) VALUES ('tutor', $1, true)", [`Faiza pressed "something is broken" on ${page}: ${what || "no details"}. Not her fault until proven otherwise - check the Errors list.`]).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json(safeError(e, "stuck"), { status: 500 }); }
}
