import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Is the site up, and which version is live? (9 Oct 2026; commit added 29 Oct 2026.) Never touches the database, so
    an uptime monitor can watch it around the clock for free - the database's compute budget is the scarce thing (Neon
    Free: 100 CU-hours a month). `commit` is the first 12 characters of the git commit Vercel built this deployment
    from (VERCEL_GIT_COMMIT_SHA, set by Vercel itself); push.ps1 waits until it equals the commit it just pushed, so
    "Live and healthy" is never said about the old version. Nothing personal in the reply. */
export function GET() {
  const sha = String(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || null;
  return NextResponse.json({ ok: true, commit: sha, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
