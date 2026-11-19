import { TZ } from "../../../lib/time";
import { NextResponse } from "next/server";
import { q } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Two questions, two answers (29 Oct 2026, fix day).
   1. GET /api/live - the cheap answer, for an uptime monitor. Inside WARM_WINDOW it looks at the database and says
      {active, ok}; outside it answers {active:false, asleep:true, ok:true} with no query, so a monitor pinging every
      5 minutes does not keep the database awake all night (Neon Free: 100 compute-hours a month, then SUSPENDED).
      The monitor should now watch /api/ping instead (no database at all - docs/RUNBOOK.md); this mode stays for it
      until Abid moves it.
   2. GET /api/live?check=1 - the real answer, for push.ps1 before a deploy. It ALWAYS asks the database, whatever the
      hour (the old version said "asleep" in her winter mornings and the script deployed into her session). Reply:
      {active, minutesAgo, checked:true, ok:true}; on any database error {ok:false} with status 503, which push.ps1
      treats as UNKNOWN and refuses to deploy without -Force.
   Nothing personal either way: one boolean (and, with check=1, minutes since her last action). While /api/live is
   still outside the geo-fence (the firewall exception for the monitor), check=1 answers only from Canada or Bangladesh
   (Vercel's x-vercel-ip-country), like the rest of the site. WARM_WINDOW, e.g. "13:30-22:30" (default), only decides
   when the cheap answer may wake the database; nothing correct depends on it any more. */
function inWarmWindow() {
  const spec = String(process.env.WARM_WINDOW || "13:30-22:30");
  const m = spec.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return true;
  const from = Number(m[1]) * 60 + Number(m[2]), to = Number(m[3]) * 60 + Number(m[4]);
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hour12: false, timeZone: TZ }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value) % 24, mi = Number(parts.find((p) => p.type === "minute")?.value);
  const now = h * 60 + mi;
  return from <= to ? now >= from && now < to : now >= from || now < to;
}

const ALLOWED_COUNTRIES = ["CA", "BD"];

export async function GET(req) {
  const headers = { "Cache-Control": "no-store" };
  const check = new URL(req.url).searchParams.get("check") === "1";
  if (check) {
    const country = req.headers.get("x-vercel-ip-country");
    if (country && !ALLOWED_COUNTRIES.includes(country.toUpperCase())) return NextResponse.json({ ok: false, error: "no" }, { status: 403, headers });
  } else if (!inWarmWindow()) {
    return NextResponse.json({ active: false, asleep: true, ok: true }, { headers });
  }
  try {
    const r = await q(`SELECT GREATEST(
        COALESCE((SELECT MAX(at) FROM chats), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(ended_at) FROM events), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(at) FROM beats), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(at) FROM answers), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(at) FROM typing), 'epoch'::timestamptz),
        COALESCE((SELECT MAX(at) FROM completions), 'epoch'::timestamptz)) AS last`);
    const last = r[0]?.last ? new Date(r[0].last).getTime() : 0;
    const minutesAgo = last ? Math.round((Date.now() - last) / 60000) : null;
    const active = minutesAgo != null && minutesAgo <= 10;
    if (!check) return NextResponse.json({ active, ok: true }, { headers });
    return NextResponse.json({ active, minutesAgo, checked: true, ok: true }, { headers });
  } catch {
    return NextResponse.json({ ok: false, error: "db" }, { status: check ? 503 : 500, headers });
  }
}
