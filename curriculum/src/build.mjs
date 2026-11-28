import fs from "fs";
// 28 Nov 2026 (Abid): one focus. Career path first (CRA + finance), in order; the tech modules are an optional hobby
// track (module.track = "hobby") he can switch into from the home page at any time and back again (app/api/track).
const career = ["cra1", "ifc1"];
const hobby = ["setup1", "py1", "fin1", "py2", "lnx1", "flip1", "fin2"];
const mods = [];
for (const id of career) mods.push({ ...(await import(`./${id}.mjs`)).default, track: "career" });
for (const id of hobby) mods.push({ ...(await import(`./${id}.mjs`)).default, track: "hobby" });
fs.writeFileSync("modules.json", JSON.stringify(mods, null, 1) + "\n");
console.log(mods.map((m) => `${m.id}:${m.steps.length}:${m.track}`).join(" "), "total", mods.reduce((a, m) => a + m.steps.length, 0));
