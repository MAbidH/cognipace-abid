import modules from "../curriculum/modules.json";
import { q } from "./db";
import { workedByDay, todayDhaka } from "./presence";

export const PASS_MARK = 0.8;

export function allModules() {
  return modules;
}

export function getModule(id) {
  return modules.find((m) => m.id === id);
}

/** Returns progress rows for every module, creating the first as `current` if nothing exists. */
export async function getProgress() {
  let rows = await q("SELECT * FROM progress");
  if (rows.length === 0) {
    await q(
      "INSERT INTO progress (module_id, status, started_at) VALUES ($1, 'current', now())",
      [modules[0].id]
    );
    rows = await q("SELECT * FROM progress");
  }
  const byId = Object.fromEntries(rows.map((r) => [r.module_id, r]));
  return modules.map((m) => ({
    id: m.id,
    title: m.title,
    phase: m.phase,
    status: byId[m.id]?.status ?? "locked",
    step_index: byId[m.id]?.step_index ?? 0,
    best_score: byId[m.id]?.best_score ?? null,
    remediation: byId[m.id]?.remediation ?? null,
    passed_at: byId[m.id]?.passed_at ?? null,
  }));
}

export async function currentModule() {
  const rows = await q("SELECT * FROM progress WHERE status='current' LIMIT 1");
  if (rows.length === 0) return null;
  return { row: rows[0], module: getModule(rows[0].module_id) };
}

/** Advance the step pointer inside the current module. 29 Oct 2026 (review 01 L10): with fromIndex, the move happens
    only if she is still on that step (two "advance" requests cannot both move her); returns true when it moved. */
export async function advanceStep(moduleId, nextIndex, fromIndex = null) {
  if (fromIndex == null) { await q("UPDATE progress SET step_index=$2 WHERE module_id=$1", [moduleId, nextIndex]); return true; }
  const r = await q("UPDATE progress SET step_index=$2 WHERE module_id=$1 AND step_index=$3 AND status='current' RETURNING 1", [moduleId, nextIndex, fromIndex]);
  return r.length > 0;
}

/** Mark module passed and unlock the next one. Sequence is strict: nothing else changes. */
export async function passModule(moduleId, score) {
  // 29 Oct 2026 (review 01 L10): only the request that really moves the module from current to passed goes on.
  const moved = await q(
    "UPDATE progress SET status='passed', passed_at=now(), best_score=GREATEST(COALESCE(best_score,0),$2), remediation=NULL WHERE module_id=$1 AND status <> 'passed' RETURNING 1",
    [moduleId, score]
  );
  if (!moved.length) return false;
  const i = modules.findIndex((m) => m.id === moduleId);
  const next = modules[i + 1];
  if (next) {
    await q(
      `INSERT INTO progress (module_id, status, started_at) VALUES ($1,'current',now())
       ON CONFLICT (module_id) DO UPDATE SET status='current', started_at=now(), step_index=0`,
      [next.id]
    );
  }
  return true;
}

export async function setRemediation(moduleId, wrongSkills, score) {
  await q(
    "UPDATE progress SET remediation=$2, attempts=attempts+1, best_score=GREATEST(COALESCE(best_score,0),$3) WHERE module_id=$1",
    [moduleId, JSON.stringify(wrongSkills), score]
  );
}

/** Minutes of work today (Dhaka): the larger of the room's clock and server-side presence (lib/presence.js).
    The clock alone missed everything she did outside the School tab - 10 Oct 2026: 20 min counted for ~55 min of chat. */
export async function minutesToday() {
  const [worked, today] = await Promise.all([workedByDay(1), todayDhaka()]);
  return Math.round((worked[today] || 0) / 60000);
}

/** Minutes of work per Dhaka day for the last `days` days, oldest first: [{ day: 'YYYY-MM-DD', minutes }]. */
export async function dailyMinutes(days = 14) {
  const [worked, today] = await Promise.all([workedByDay(days), todayDhaka()]);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(new Date(today + "T00:00:00Z").getTime() - i * 86400000).toISOString().slice(0, 10);
    out.push({ day: d, minutes: Math.round((worked[d] || 0) / 60000) });
  }
  return out;
}
