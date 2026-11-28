/* Switch the current module (28 Nov 2026, Abid's instance only): the adult picks what he works on - the career path or
   the optional hobby track - and can come back. The module he leaves keeps its step (status 'locked', step_index kept);
   nothing he passed changes. Faiza's instance answers 404: her sequence stays strict and only /guardian moves it. */
import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError } from "../../../lib/guard";
import { allModules } from "../../../lib/curriculum";
import { isAdult } from "../../../lib/student";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (!isAdult()) return NextResponse.json({ error: "not available" }, { status: 404 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    const id = String(b?.module_id || "").slice(0, 20);
    if (!allModules().some((m) => m.id === id)) return NextResponse.json({ error: "no such module" }, { status: 400 });
    const [row] = await q("SELECT status FROM progress WHERE module_id=$1", [id]);
    if (row?.status === "passed") return NextResponse.json({ error: "already passed" }, { status: 400 });
    if (row?.status === "current") return NextResponse.json({ ok: true });
    await q("UPDATE progress SET status='locked' WHERE status='current'");
    await q(`INSERT INTO progress (module_id, status, started_at, step_index) VALUES ($1,'current',now(),0)
             ON CONFLICT (module_id) DO UPDATE SET status='current', started_at=COALESCE(progress.started_at, now())`, [id]);
    await q("INSERT INTO notes (author, body) VALUES ('student', $1)", [`Switched: ${id} is now the current module.`]).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(safeError(e, "track"), { status: 500 });
  }
}
