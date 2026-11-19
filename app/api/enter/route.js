import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeEqual, sessionValue, clientIp, studentToken } from "../../../lib/guard";
import { cookieOpts } from "../../../lib/auth";
import { audit } from "../../../lib/db";

export const runtime = "nodejs";

const WINDOW = 10 * 60 * 1000;
const seen = new Map(); // ip -> last audit time
let windowStart = 0, windowCount = 0;
function shouldAudit(ip, now = Date.now()) {
  if (now - windowStart > WINDOW) { windowStart = now; windowCount = 0; if (seen.size > 500) seen.clear(); }
  const key = ip || "?";
  if (windowCount >= 20 || now - (seen.get(key) || 0) < WINDOW) return false;
  seen.set(key, now); windowCount++;
  return true;
}

/** Her link: /?t=TOKEN → here. Sets a session cookie derived from the token; the token itself is never stored. */
export async function GET(req) {
  const t = (new URL(req.url).searchParams.get("t") || "").trim();
  if (safeEqual(t, studentToken())) {
    (await cookies()).set("st", sessionValue("student", studentToken()), cookieOpts(60 * 60 * 24 * 400, "lax"));
    audit("student", "link_used", null, clientIp(req)).catch(() => {});
    // Keep the token in the address so "Add to Home Screen" on the iPad saves a link that re-enters on every launch.
    return NextResponse.redirect(new URL(`/?t=${encodeURIComponent(t)}`, req.url));
  }
  // 29 Oct 2026 (review 01 M4): every bad link used to write an audit row and wake the database (Neon CU-hours).
  // Now at most one row per ip per 10 minutes and 20 per 10 minutes in all, counted in this instance's memory.
  if (shouldAudit(clientIp(req))) audit("unknown", "bad_link_attempt", null, clientIp(req)).catch(() => {});
  return NextResponse.redirect(new URL("/", req.url)); // fixed destination: no open redirect
}
