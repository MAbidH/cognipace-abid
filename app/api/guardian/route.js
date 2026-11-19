import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isGuardian, cookieOpts } from "../../../lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { safeEqual, sameOrigin, sessionValue, verifyTotp, clientIp, safeError, reserveCall, finishCall, logError, budgetPaused } from "../../../lib/guard";
import { q, audit } from "../../../lib/db";
import { allModules } from "../../../lib/curriculum";
import { tutorModel } from "../../../lib/calendar";
import { prepareSteps, refreshProfile, monthSpend, spendRefusal, estPrepareUsd, estProfileUsd } from "../../../lib/knowledge";
import { TEACHING_HANDBOOK } from "../../../lib/teachingHandbook";
import MACHINE from "../../../curriculum/machine.json";
import { exportStream } from "./backup";
import { prepareSheets, PACK_STEPS } from "../../../lib/offline";

export const runtime = "nodejs";
// 30 Oct 2026: "prepare" makes up to six model calls in a row (it stops starting new ones after ~200 s).
export const maxDuration = 300;

/** What the knowledge base needs to call the model (lib/knowledge.js takes it as an argument). The server's own key. */
function kbDeps() {
  return { q, model: tutorModel(), reserveCall, finishCall, logError, budgetPaused, modules: allModules(), handbook: TEACHING_HANDBOOK, machine: MACHINE,
    client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120000, maxRetries: 0 }) };
}

/* Login throttle (29 Oct 2026, fix day). The old lock counted failures from ANY address: 8 bad tries an hour from a
   stranger's script locked Abid out, even with the right password and code. Now:
   - per address: 3 failures in a minute, or 6 in 15 minutes, and THAT address waits (Vercel sets x-forwarded-for
     itself, so a script cannot pick someone else's address);
   - a global backstop for many addresses at once: 30 failures in an hour. With 2FA on, the right password AND the
     right code still get in while the backstop is up (guessing both at once is not a realistic attack); without 2FA
     the backstop holds for everyone - one more reason to turn 2FA on (docs/RUNBOOK.md).
   Every attempt is still delayed 1.5 s on failure and written to the audit table, as before. */
const PER_MIN = 3, PER_15 = 6, GLOBAL_HOUR = 30;
async function throttle(ip) {
  const [r] = await q(`SELECT
      COUNT(*) FILTER (WHERE ip IS NOT DISTINCT FROM $1 AND at > now() - interval '1 minute')::int AS m1,
      COUNT(*) FILTER (WHERE ip IS NOT DISTINCT FROM $1 AND at > now() - interval '15 minutes')::int AS m15,
      COUNT(*)::int AS h1
    FROM audit WHERE action='guardian_login_failed' AND at > now() - interval '1 hour'`, [ip]);
  return { ipLocked: r.m1 >= PER_MIN || r.m15 >= PER_15, globalLocked: r.h1 >= GLOBAL_HOUR };
}

export async function POST(req) {
  try {
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const form = await req.formData();
    const action = String(form.get("action") || "");
    const ip = clientIp(req);
    const back = NextResponse.redirect(new URL("/guardian", req.url), 303);
    const jar = await cookies();

    if (action === "login") {
      const lock = await throttle(ip);
      if (lock.ipLocked) { await audit("unknown", "guardian_login_locked", "this address: too many tries", ip); return back; }
      const pw = String(form.get("password") || "").slice(0, 200);
      const code = String(form.get("code") || "").slice(0, 8);
      const totp = process.env.GUARDIAN_TOTP_SECRET;
      const pwOk = safeEqual(pw, process.env.GUARDIAN_PASSWORD);
      const codeOk = totp ? verifyTotp(totp, code) : true;
      if (lock.globalLocked && !(totp && pwOk && codeOk)) {
        await new Promise((r) => setTimeout(r, 1500));
        // Counted as a failure, so a guess made while the backstop is up still feeds the per-address limit.
        await audit("unknown", "guardian_login_failed", "backstop up: refused", ip);
        return back;
      }
      if (pwOk && codeOk) {
        jar.set("gd", sessionValue("guardian", process.env.GUARDIAN_PASSWORD), cookieOpts(60 * 60 * 24 * 7));
        await audit("guardian", "login", null, ip);
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        await audit("unknown", "guardian_login_failed", totp && pwOk ? "bad 2fa code" : "bad password", ip);
      }
      return back;
    }

    if (!(await isGuardian())) return NextResponse.json({ error: "no" }, { status: 401 });

    if (action === "logout") {
      jar.set("gd", "", cookieOpts(0));
      await audit("guardian", "logout", null, ip);
      return back;
    }
    if (action === "note") {
      const body = String(form.get("body") || "").trim().slice(0, 500);
      if (body) { await q("INSERT INTO notes (author, body) VALUES ('guardian', $1)", [body]); await audit("guardian", "note", body, ip); }
    }
    if (action === "unlock") {
      const id = String(form.get("module_id") || "");
      const order = allModules().map((m) => m.id);
      if (order.includes(id)) {
        // 13 Oct 2026: moving her to an EARLIER module must not mark the old current one as passed (she never did it) -
        // it goes back to locked, untouched. Moving forward keeps the old behaviour (the skipped one counts as passed).
        const [curRow] = await q("SELECT module_id FROM progress WHERE status='current' LIMIT 1");
        const curId = curRow?.module_id;
        if (curId && curId !== id) {
          const backwards = order.indexOf(id) < order.indexOf(curId);
          if (backwards) await q("UPDATE progress SET status='locked', step_index=0, remediation=NULL, started_at=NULL, passed_at=NULL WHERE module_id=$1", [curId]);
          else await q("UPDATE progress SET status='passed' WHERE module_id=$1", [curId]);
        }
        await q(`INSERT INTO progress (module_id, status, started_at, step_index) VALUES ($1,'current',now(),0)
                 ON CONFLICT (module_id) DO UPDATE SET status='current', started_at=now(), step_index=0, remediation=NULL`, [id]);
        await q("INSERT INTO notes (author, body) VALUES ('guardian', $1)", [`Override: set ${id} as current module.`]);
        await audit("guardian", "override", id, ip);
      }
    }
    // Reset a module to locked (13 Oct 2026): for a module wrongly marked passed/current that she has not actually done.
    // Only /guardian may do this, and it is logged. Her completions and events for the module are left alone.
    if (action === "relock") {
      const id = String(form.get("module_id") || "");
      if (allModules().some((m) => m.id === id)) {
        const [row] = await q("SELECT status FROM progress WHERE module_id=$1", [id]);
        if (row && row.status !== "current") {
          await q("UPDATE progress SET status='locked', step_index=0, remediation=NULL, started_at=NULL, passed_at=NULL, best_score=NULL WHERE module_id=$1", [id]);
          await q("INSERT INTO notes (author, body) VALUES ('guardian', $1)", [`Override: reset ${id} to locked (was ${row.status}).`]);
          await audit("guardian", "relock", id, ip);
        }
      }
    }
    // The tutor's knowledge base (30 Oct 2026): teacher notes written ahead of her, and her learner profile. Abid's own
    // action, so her daily call ceiling does not apply - but it is refused if the month would pass his console limit.
    if (action === "prepare" || action === "prepare_redo") {
      const t0 = Date.now();
      const redo = action === "prepare_redo" ? String(form.get("step_id") || "").slice(0, 40) : null;
      const count = redo ? 1 : Math.max(1, Math.min(6, parseInt(String(form.get("count") || "4"), 10) || 4));
      const deps = kbDeps();
      const refusal = spendRefusal(await monthSpend(q, tutorModel), count * estPrepareUsd(deps.model));
      if (refusal) { await audit("guardian", action, refusal, ip); return back; }
      const r = await prepareSteps(deps, { count, stepId: redo, startedAt: t0 });
      await audit("guardian", action, `notes made: ${r.made.join(", ") || "none"}${r.failed.length ? ` · failed: ${r.failed.join(", ")} (see Errors)` : ""}${r.stopped ? ` · stopped: ${r.stopped}` : ""}${!r.considered && !r.stopped ? " · nothing left to prepare in the next 60 steps" : ""} · ${Math.round((Date.now() - t0) / 1000)} s`, ip);
      return back;
    }
    // The offline pack (2 Nov 2026): worksheets for her next steps, for days without internet (lib/offline.js).
    if (action === "offline_prepare") {
      const t0 = Date.now();
      const deps = kbDeps();
      const refusal = spendRefusal(await monthSpend(q, tutorModel), PACK_STEPS * estPrepareUsd(deps.model));
      if (refusal) { await audit("guardian", action, refusal, ip); return back; }
      const r = await prepareSheets(deps, { count: PACK_STEPS, startedAt: t0 });
      await audit("guardian", action, `worksheets made: ${r.made.join(", ") || "none"}${r.failed.length ? ` · failed: ${r.failed.join(", ")} (see Errors)` : ""}${r.stopped ? ` · stopped: ${r.stopped}` : ""} · ${Math.round((Date.now() - t0) / 1000)} s`, ip);
      return back;
    }
    if (action === "profile") {
      const deps = kbDeps();
      const refusal = spendRefusal(await monthSpend(q, tutorModel), estProfileUsd(deps.model));
      if (refusal) { await audit("guardian", "profile", refusal, ip); return back; }
      const r = await refreshProfile(deps);
      await audit("guardian", "profile", r.ok ? `learner profile refreshed (${r.words} words)` : `profile not refreshed: ${r.reason}`, ip);
      return back;
    }
    // 10 Nov 2026: Abid closes a park he fixed with her outside the School (e.g. the Kolibri import). The tutor stops
    // carrying it as an open problem and /guardian stops listing it.
    if (action === "resolve_park") {
      const sid = String(form.get("step_id") || "").slice(0, 40);
      if (/^[A-Z0-9]+-[A-Z0-9]+$/.test(sid) && allModules().some((m) => m.steps.some((s) => s.id === sid))) {
        await q("INSERT INTO notes (author, body, flagged) VALUES ('guardian', $1, false)", [`RESOLVED ${sid} (marked fixed by Abid)`]);
        await audit("guardian", "resolve_park", sid, ip);
      }
    }
    if (action === "clearflags") { await q("UPDATE notes SET flagged=false"); await audit("guardian", "clear_flags", null, ip); }
    if (action === "export") {
      // Full backup (29 Oct 2026): EVERY table, with a format version, streamed (see ./backup.js). It holds her chats -
      // keep it encrypted (docs/RUNBOOK.md), never in the project folder. scripts/restore.mjs loads it into an empty database.
      await audit("guardian", "export", null, ip);
      return new NextResponse(exportStream(q), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="cognipace-backup-${new Date().toISOString().slice(0, 10)}.json"` },
      });
    }
    return back;
  } catch (e) { return NextResponse.json(safeError(e, "guardian"), { status: 500 }); }
}
