// Gate (19 Oct 2026): every key move must accept its keys exactly as the card / "Show me" shows them, and refuse nonsense.
import { SHORTCUTS, LINUX_SHORTCUTS, ROOM_KEYS, matches, pickKeys } from "../lib/shortcuts.js";
let bad = 0;
for (const s of [...SHORTCUTS, ...(LINUX_SHORTCUTS || [])]) {
  if (!matches(s, s.keys)) { console.error("REFUSES ITS OWN KEYS:", s.id, "|", s.keys); bad++; }
  for (const a of s.accept) if (!matches(s, a)) { console.error("REFUSES ITS ACCEPT:", s.id, a); bad++; }
  if (matches(s, "") || matches(s, "xyz")) { console.error("ACCEPTS NONSENSE:", s.id); bad++; }
}
// Honest spellings she has actually typed and was refused (19-28 Oct 2026) - every one must pass from now on.
const TYPED = [["lx-snap", "super left/right"], ["lx-snap", "Super Left / Super Right"], ["shift-arrows", "Shift+Right/Left"], ["home-end", "Fn+Home/end"],
  ["ctrl-arrows", "Ctrl + Left Arrow key"], ["lx-super", "windows key"], ["lx-lock", "ctrl alt l"],
  // 29 Oct 2026: the page keys moved to Alt+Shift+digit (Firefox on Linux uses Alt+digit for tabs).
  ["alt-1", "alt shift 2"], ["alt-1", "Shift+Alt+3"], ["alt-1", "Alt+Shift+1 … Alt+Shift+5"]];
const byId = Object.fromEntries([...SHORTCUTS, ...(LINUX_SHORTCUTS || [])].map((s) => [s.id, s]));
for (const [id, typed] of TYPED) { const s = byId[id]; if (!s) { console.error("NO SUCH MOVE in the typed list:", id); bad++; continue; } if (!matches(s, typed)) { console.error("REFUSES AN HONEST SPELLING:", id, "|", typed); bad++; } }
// Every CogniPace key shown on /keys must say where it works.
for (const k of ROOM_KEYS || []) if (!k.keys || !k.does) { console.error("ROOM_KEYS entry incomplete:", k.id); bad++; }
// The old Alt+digit page key must no longer pass (it switches Firefox tabs on her machine).
if (matches(byId["alt-1"], "alt+1")) { console.error("alt-1 still accepts Alt+1 (a Firefox tab key on Linux)"); bad++; }
// The Arena's "Which key?" now follows her machine: it must be able to pick from the Linux ladder.
{
  const r = () => 0.5;
  const got = pickKeys(LINUX_SHORTCUTS, new Set(["lx-term", "lx-lock"]), 8, r);
  if (got.some((s) => !LINUX_SHORTCUTS.includes(s))) { console.error("Arena picked a Windows move for Linux"); bad++; }
  if (!got.find((s) => s.id === "lx-term") || !got.find((s) => s.id === "lx-lock")) { console.error("Arena left out a proved move"); bad++; }
  if (got.length !== 8) { console.error("Arena picked", got.length, "moves, not 8"); bad++; }
}
if (bad) { console.error(`Key moves: ${bad} problem(s).`); process.exit(1); }
console.log(`Key moves: all ${SHORTCUTS.length + (LINUX_SHORTCUTS || []).length} accept what they show.`);
