// Smoke test (6 Oct 2026; 29 Oct 2026: live commit, signed-out 401s, the tutor model). Run after a deploy:
//   node scripts/smoke.mjs https://the-school-orpin.vercel.app [expected-commit-sha]
// No paid API calls: nothing here reaches the tutor model, and every request is signed out.
import { readFileSync } from "node:fs";

const base = (process.argv[2] || "https://the-school-orpin.vercel.app").replace(/\/$/, "");
const expectSha = (process.argv[3] || "").trim().toLowerCase();

// [path, allowed statuses, optional body check, optional fetch options]. APIs answer 401 when signed out (405 where
// there is no GET). A 500 on a signed-out request means the route crashed before it even checked who is asking.
const post = { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" };
const checks = [
  ["/", [200], (t) => t.includes("COGNIPACE")],
  ["/api/ping", [200], (t) => t.includes('"ok":true')],
  ["/api/live", [200], (t) => t.includes('"ok":true')],
  ["/api/state", [401]], ["/api/state", [401], null, post],
  ["/api/tutor", [401], null, post],
  ["/api/wonder", [401]], ["/api/meet", [401]], ["/api/arena", [401]], ["/api/typing", [401, 405]],
  ["/learn", [200]], ["/wonder", [200]], ["/arena", [200]], ["/keys", [200]], ["/rewards", [200]], ["/portfolio", [200]], ["/meet", [200]], ["/guardian", [200]],
];
// 14 Oct 2026: a server page that throws is rendered by app/error.js ("The school's shelf hiccuped") and can still answer
// 200 - the guardian page did exactly that for a whole morning. So every page must also NOT contain the crash copy.
const CRASH = /shelf hiccuped|A HICCUP|Application error: a server-side exception/i;
let bad = 0;
for (const [path, want, body, opts] of checks) {
  const label = `${opts?.method || "GET"} ${path}`;
  try {
    const r = await fetch(base + path, { redirect: "follow", ...(opts || {}), headers: { "User-Agent": "school-smoke", ...(opts?.headers || {}) } });
    const text = await r.text();
    const statusOk = want.includes(r.status);
    const crashed = !path.startsWith("/api/") && CRASH.test(text);
    if (crashed) console.log(`     ${path} rendered the crash page (app/error.js) - a server component threw`);
    const ok = statusOk && !crashed && (!body || body(text));
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${label} -> ${r.status}${!statusOk ? ` (wanted ${want.join(" or ")})` : ""}${!ok && statusOk ? " (body check failed)" : ""}`);
  } catch (e) { bad++; console.log(`FAIL ${label} -> ${e.message}`); }
}

// Which version is live? /api/ping reports the commit Vercel built (VERCEL_GIT_COMMIT_SHA, first 12 characters).
try {
  const r = await fetch(base + "/api/ping", { headers: { "User-Agent": "school-smoke" } });
  const j = await r.json();
  const live = String(j.commit || "");
  if (expectSha) {
    const ok = live && expectSha.startsWith(live.toLowerCase());
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} live commit ${live || "(not reported)"}${ok ? " = the commit just pushed" : ` - expected ${expectSha.slice(0, 12)}`}`);
  } else {
    console.log(`info live commit ${live || "(not reported)"}`);
  }
} catch (e) { bad++; console.log(`FAIL live commit -> ${e.message}`); }

// The tutor model by Dhaka date (same rule as lib/calendar.js tutorModel(); a dated calendar.json entry overrides the
// Vercel env ANTHROPIC_MODEL). Printed so a planned switch (Opus 5.5 from 1 Nov 2026) is visible the day before.
try {
  const cal = JSON.parse(readFileSync(new URL("../curriculum/calendar.json", import.meta.url), "utf8"));
  const dhaka = (ms) => new Date(ms + 6 * 3600 * 1000).toISOString().slice(0, 10);
  const pick = (d) => (cal.tutorModel || []).find((e) => e.id && (!e.from || e.from <= d) && (!e.to || d <= e.to))?.id;
  const now = Date.now();
  for (const [label, d] of [["today", dhaka(now)], ["tomorrow", dhaka(now + 86400000)]]) {
    const id = pick(d);
    console.log(`info tutor model ${label} (${d}, Dhaka): ${id || "no dated entry - the Vercel env ANTHROPIC_MODEL, else claude-sonnet-5-5"}`);
  }
} catch (e) { console.log(`info tutor model: could not read curriculum/calendar.json (${e.message})`); }

console.log(bad ? `\n${bad} check(s) failed - look before she does.` : "\nAll good.");
process.exit(bad ? 1 : 0);
