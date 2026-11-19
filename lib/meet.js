/* Meetings with real people (Abid, 5 Oct 2026): a small project around a real call. Server only. */
import data from "../curriculum/meetings.json";
import { q } from "./db";

export const MEETINGS = data.meetings;
export const STAGES = ["learn", "intro", "questions", "rehearse", "ready", "done"];
export const STAGE_TITLES = { learn: "Learn three things", intro: "Write your introduction", questions: "Write three real questions", rehearse: "Rehearse the call", ready: "Ready for the call", done: "Logbook page written" };

export function unlocked(m, rewards) {
  if (!m.unlock) return true;
  if (m.unlock.kind === "level") return (rewards?.level?.n || 0) >= m.unlock.value;
  if (m.unlock.kind === "streak") return (rewards?.session?.maxStreak || 0) >= m.unlock.value;
  if (m.unlock.kind === "module") return !!rewards?.unlocks?.some((u) => u.kind === "module" && u.value === m.unlock.value && u.reached);
  return false;
}

export async function getMeet(id) {
  const m = MEETINGS.find((x) => x.id === id);
  if (!m) return null;
  const rows = await q("SELECT stage, intro, questions, after FROM meet WHERE id=$1", [id]);
  const r = rows[0] || { stage: "learn", intro: null, questions: null, after: null };
  return { meeting: m, stage: r.stage, intro: r.intro || "", questions: Array.isArray(r.questions) ? r.questions : ["", "", ""], after: r.after || "" };
}

/** Plain words for a lock. */
export function unlockText(m) {
  if (!m.unlock) return "open";
  if (m.unlock.kind === "level") return `Level ${m.unlock.value}`;
  if (m.unlock.kind === "streak") return `a ${m.unlock.value}-day streak`;
  if (m.unlock.kind === "module") return `passing ${m.unlock.value}`;
  return "later";
}

/** The one meeting that needs attention now: unlocked and not done. */
export async function activeMeeting(rewards) {
  for (const m of MEETINGS) {
    if (!unlocked(m, rewards)) continue;
    const s = await getMeet(m.id);
    if (s.stage !== "done") return s;
  }
  return null;
}
