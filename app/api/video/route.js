import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { allModules } from "../../../lib/curriculum";

export const runtime = "nodejs";

/* POST { stepId, url, vote } -> her one-tap verdict on a step video (5 Nov 2026, Faiza: too many videos carry unrelated
   things; some only introduce a product). useful / long / off. Only videos that exist in the curriculum; last vote wins.
   Abid reads the list on /guardian and cuts what did not earn its place. */
const VOTES = new Set(["useful", "long", "off"]);

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const stepId = String(b.stepId || "").slice(0, 40), url = String(b.url || "").slice(0, 200), vote = String(b.vote || "");
    if (!VOTES.has(vote)) return NextResponse.json({ error: "bad request" }, { status: 400 });
    const step = allModules().flatMap((m) => m.steps).find((s) => s.id === stepId);
    if (!step || !(step.media || []).some((md) => md.url === url)) return NextResponse.json({ error: "no such video" }, { status: 400 });
    await q("INSERT INTO video_votes (step_id, url, vote) VALUES ($1,$2,$3) ON CONFLICT (step_id, url) DO UPDATE SET vote = EXCLUDED.vote, at = now()", [stepId, url, vote]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json(safeError(e, "video"), { status: 500 }); }
}
