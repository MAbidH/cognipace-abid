import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { q } from "../../lib/db";
import { SHORTCUTS, LINUX_SHORTCUTS, ROOM_KEYS } from "../../lib/shortcuts";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import Shell from "../../components/Shell";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

/** Her keyboard cheat-sheet: every move, grouped by where it works, with the ones she has already proved lit up. */
export default async function Keys() {
  if (!(await isStudent())) redirect("/");
  const [learned, rw, mins, osRows] = await Promise.all([
    q(`SELECT DISTINCT shortcut_id FROM typing WHERE shortcut_done AND shortcut_id IS NOT NULL`),
    computeRewards().catch(() => null), minutesToday(),
    q(`SELECT value FROM settings WHERE key='os'`).catch(() => []),
  ]);
  const onLinux = osRows?.[0]?.value === "linux";
  const SHEET = onLinux ? LINUX_SHORTCUTS : SHORTCUTS;
  const cap = dailyCap();
  const have = new Set(learned.map((r) => r.shortcut_id));
  const groups = {};
  // CogniPace's own keys come from ROOM_KEYS on both machines (29 Oct 2026: on Linux this sheet had none, and the
  // room hides its key legend on her 1093-px screen). The ladder's own CogniPace moves are folded into that section.
  for (const s of SHEET) if (s.where !== "CogniPace") (groups[s.where] ||= []).push(s);
  groups.CogniPace = ROOM_KEYS;
  const order = onLinux ? ["CogniPace", "Linux", "Firefox", "Terminal", "nano", "VS Code"] : ["CogniPace", "Windows", "Chrome", "everywhere", "editors", "File Explorer", "Terminal", "VS Code"];
  return (
    <Shell active="/keys" rw={rw} mins={mins} cap={cap}>
      <main className="wrap">
        <div className="eyebrow">keys · your cheat-sheet</div>
        <h1 style={{ marginTop: 4 }}>{SHEET.filter((s) => have.has(s.id)).length} of {SHEET.length} key moves are yours</h1>
        <p className="soft">A programmer's hands stay on the keyboard. One new move every day in your warm-up; the ones you have proved are lit. Print this page (Ctrl+P) and keep it next to the laptop until you don't need it.</p>
        {order.filter((g) => groups[g]).map((g) => (
          <section key={g} style={{ marginTop: 22 }}>
            <h2 style={{ textTransform: g === "CogniPace" ? "none" : "capitalize" }}>{g === "CogniPace" ? "CogniPace's own keys" : g}</h2>
            <div className="grid three">
              {groups[g].map((s) => (
                <div key={s.id} className={`card ${have.has(s.id) ? "lit" : ""}`} style={{ padding: "12px 14px", opacity: have.has(s.id) ? 1 : 0.7 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {s.keys.split(/\s*\/\s*|\s*…\s*/).map((k, i) => <kbd key={i} style={{ fontSize: 15 }}>{k}</kbd>)}
                    {have.has(s.id) && <span className="small" style={{ color: "var(--lime)", marginLeft: "auto" }}>✓ yours</span>}
                  </div>
                  <div className="small" style={{ marginTop: 6 }}>{s.does}</div>
                  {s.tip && <div className="small mute" style={{ marginTop: 4 }}>{s.tip}</div>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </Shell>
  );
}
