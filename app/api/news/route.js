import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { NEWS } from "../../../lib/news";

export const runtime = "nodejs";

/* POST { id } -> a cyber news story read (3 Nov 2026). Each story counts once. */
export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
    const id = String(b.id || "").slice(0, 80);
    if (!NEWS.some((n) => n.id === id)) return NextResponse.json({ error: "no such story" }, { status: 400 });
    await q("INSERT INTO news_read (news_id) VALUES ($1) ON CONFLICT DO NOTHING", [id]);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json(safeError(e, "news"), { status: 500 }); }
}
