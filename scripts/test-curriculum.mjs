// Curriculum structure test (14 Oct 2026). Every module and step in curriculum/modules.json must be well-formed, so a
// broken edit can never reach her: unique ids, step ids prefixed by their module, known kinds, a brief on every lesson
// and code step, a valid checkpoint, a prompt on every teach-back, links only to https:// or /api/, a gift on every
// module from CS1B on, and the install-week keys (time_box, machine) only with valid values. push.ps1 runs it.
import fs from "fs";
const mods = JSON.parse(fs.readFileSync(new URL("../curriculum/modules.json", import.meta.url)));
const machine = JSON.parse(fs.readFileSync(new URL("../curriculum/machine.json", import.meta.url)));
// 19 Nov 2026: the second instance (curriculum/student.json mode "adult") has its own curriculum - the checks that are
// about Faiza's position, her install week and her module pictures (ModuleArt falls back by phase) apply only to hers.
const student = JSON.parse(fs.readFileSync(new URL("../curriculum/student.json", import.meta.url)));
const adult = student.mode === "adult";
const KINDS = new Set(["lesson", "code", "practice", "check", "teach", "diagnostic", "typing"]);
const NO_GIFT_OK = new Set(["M1", "M2", "M3", "GK1", "M4", "CS1", "M6", "M7", "M8", "M9", "M10"]); // written before the gift rule
const probs = []; const ids = new Set();
for (const m of mods) {
  if (ids.has(m.id)) probs.push(`duplicate module ${m.id}`); ids.add(m.id);
  if (!Array.isArray(m.steps) || !m.steps.length) { probs.push(`${m.id}: no steps`); continue; }
  if (!m.gift && !NO_GIFT_OK.has(m.id)) probs.push(`${m.id}: no gift`);
  if (m.steps[m.steps.length - 1].kind !== "teach") probs.push(`${m.id}: last step is not the teach-back`);
  for (const s of m.steps) {
    if (ids.has(s.id)) probs.push(`duplicate step ${s.id}`); ids.add(s.id);
    if (!s.id.startsWith(m.id + "-")) probs.push(`${s.id}: not prefixed by ${m.id}-`);
    if (!KINDS.has(s.kind)) probs.push(`${s.id}: unknown kind ${s.kind}`);
    if ((s.kind === "lesson" || s.kind === "code") && !s.tutor_brief) probs.push(`${s.id}: no tutor_brief`);
    if (s.kind === "code" && !s.starter) probs.push(`${s.id}: code step without starter`);
    if (s.kind === "check" && !(s.questions?.length || (s.skills?.length && s.count))) probs.push(`${s.id}: check without questions or skills+count`);
    if (s.kind === "teach" && !s.prompt) probs.push(`${s.id}: teach without prompt`);
    for (const l of s.links || []) if (!/^(https:\/\/|\/api\/)/.test(l.url || "") || !l.label) probs.push(`${s.id}: bad link ${JSON.stringify(l)}`);
    if (s.time_box != null && !(Number(s.time_box) >= 20 && Number(s.time_box) <= 120)) probs.push(`${s.id}: time_box ${s.time_box} out of range 20-120`);
    if (s.machine != null && !machine[s.machine]?.has) probs.push(`${s.id}: machine '${s.machine}' is not a block in machine.json`);
    if (s.max_turns != null && !(Number(s.max_turns) >= 0)) probs.push(`${s.id}: bad max_turns`);
  }
}
// 29 Oct 2026: a sign-up page offered its paid plans, she chose one, and the brief had no word about money - she ended
// on a card form at 13. Any step that sends her to a sign-up/registration page must tell the tutor the money rule.
for (const m of mods) for (const st of m.steps) {
  const signup = (st.links || []).some((l) => /signup|register|sign-up/i.test(l.url || ""));
  if (signup && !/card number|costs money|never type a card|no price/i.test(st.tutor_brief || "")) probs.push(`${st.id}: has a sign-up link but the brief has no money/card rule (she must be told to pick the free plan and never type a card)`);
}

// 29 Oct 2026 (fix day): her position. She is at CS1C step index 4 (CS1C-A2C); a reorder must never move anything at or
// before it. Update this list only when she has moved on AND the guardian page's step_index reminders are checked.
const CS1C_PREFIX = ["CS1C-A1", "CS1C-A1B", "CS1C-A2", "CS1C-A2B", "CS1C-A2C"];
const cs1c = mods.find((m) => m.id === "CS1C");
if (!adult) if (!cs1c || cs1c.steps.slice(0, CS1C_PREFIX.length).map((s) => s.id).join() !== CS1C_PREFIX.join()) probs.push(`CS1C steps 0-4 must stay ${CS1C_PREFIX.join(", ")} (her position)`);
const BEFORE = ["M1", "M2", "M3", "GK1", "M4", "CS1", "CS1B", "CS2A", "LX1", "LX2", "M5", "CS1C"];
if (!adult) if (mods.slice(0, BEFORE.length).map((m) => m.id).join() !== BEFORE.join()) probs.push(`the modules before and at her position must stay in order: ${BEFORE.join(" ")}`);
// Electives sit at the end, after every core module.
const firstElective = mods.findIndex((m) => m.phase === "Elective");
if (firstElective >= 0 && mods.slice(firstElective).some((m) => m.phase !== "Elective")) probs.push("a core module comes after an elective - electives go at the end");
// One picture per module (HISTORY 20 Oct 2026): every module id has a drawing in components/Art.js BY_ID - read as text,
// no JSX import: the explicit BY_ID keys plus every `export function <ID>` in components/art/*.js that BY_ID spreads.
{
  const art = fs.readFileSync(new URL("../components/Art.js", import.meta.url), "utf8");
  const by = art.match(/const BY_ID = \{([^}]*)\}/);
  if (!by) probs.push("components/Art.js: BY_ID not found"); else {
    const have = new Set(by[1].split(",").map((x) => x.trim()).filter((x) => x && !x.startsWith("...")).map((x) => x.split(":")[0].trim()));
    for (const spread of by[1].match(/\.\.\.(P\d+)/g) || []) {
      const imp = art.match(new RegExp(`import \\* as ${spread.slice(3)} from "\\./art/(part\\d+)"`));
      if (!imp) { probs.push(`components/Art.js: ${spread} is not imported`); continue; }
      const src = fs.readFileSync(new URL(`../components/art/${imp[1]}.js`, import.meta.url), "utf8");
      for (const fn of src.matchAll(/export function ([A-Z][A-Z0-9]*)\(/g)) have.add(fn[1]);
    }
    if (!adult) for (const m of mods) if (!have.has(m.id)) probs.push(`${m.id}: no picture in components/Art.js BY_ID (draw one in components/art/partN.js)`);
  }
}

// install week: the os flip key must exist and carry the fresh-Mint facts
const l7b = mods.find((m) => m.id === "LX1")?.steps.find((s) => s.id === "LX1-L7B");
if (adult) { /* no install week in the second instance */ } else if (!l7b) probs.push("LX1-L7B missing - app/api/tutor/route.js flips settings.os on it"); else if (l7b.machine !== "linux_fresh") probs.push("LX1-L7B must run on machine 'linux_fresh'");
// 9 Nov 2026: rewards.json - every unlock well-formed, every module/start id a real module, ids unique, no cost/note leak keys misspelt.
{
  const rw = JSON.parse(fs.readFileSync(new URL("../curriculum/rewards.json", import.meta.url)));
  const RK = new Set(["level", "streak", "module", "badge", "start"]); const seen = new Set(); const modIds = new Set(mods.map((m) => m.id));
  for (const u of rw.unlocks || []) {
    if (!u.id || seen.has(u.id)) probs.push(`rewards: duplicate or missing id ${u.id}`); seen.add(u.id);
    if (!RK.has(u.kind)) probs.push(`rewards ${u.id}: unknown kind ${u.kind}`);
    if ((u.kind === "module" || u.kind === "start") && !modIds.has(u.value)) probs.push(`rewards ${u.id}: ${u.value} is not a module`);
    if ((u.kind === "level" || u.kind === "streak") && !(Number(u.value) > 0)) probs.push(`rewards ${u.id}: bad value ${u.value}`);
    if (!u.title || !u.reward || !u.details) probs.push(`rewards ${u.id}: needs title, reward and details`);
    if (u.link && !/^https:\/\//.test(u.link)) probs.push(`rewards ${u.id}: link must be https`);
    if (u.delivered && !/^\d{4}-\d{2}-\d{2}$/.test(String(u.delivered))) probs.push(`rewards ${u.id}: delivered must be YYYY-MM-DD`);
  }
}
console.log(probs.length ? probs.join("\n") + `\n${probs.length} problem(s) in curriculum/modules.json` : `Curriculum: ${mods.length} modules, ${mods.reduce((n, m) => n + m.steps.length, 0)} steps, all well-formed.`);
process.exit(probs.length ? 1 : 0);
