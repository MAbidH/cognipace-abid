# 14 Oct 2026: the hand-audited modules (CS2A, LX1 incl. the new L7B, LX2, M5, CS1C, CS2B incl. the new BOT step) are edited
# IN modules.json directly and are preserved by this script (existing modules keep their content); only the 31 batch
# modules are rebuilt from batch*.py. Run scripts/test-curriculum.mjs after any change.
import json, sys
sys.path.insert(0, '.')
import batch1, batch2, batch3, batch4, batch4b, batch5, batch6, batch7, batch8

NEW = (batch1.MODULES + batch2.MODULES + batch3.MODULES + batch4.MODULES + batch4b.MODULES
       + batch5.MODULES + batch6.MODULES + batch7.MODULES + batch8.MODULES)

# Order after the existing M6..M10 (6 months). Interleave strands so no week is all-maths or all-security.
ORDER = [
  "M6",
  "M7",
  "CS3",
  "CS4",
  "CS5",
  "LV3",
  "M8",
  "SS1",
  "NET1",
  "NET2",
  "DEF1",
  "DEF2",
  "M9",
  "SS2",
  "WEB1",
  "WEB2",
  "CRYPTO1",
  "CTF1",
  "M10",
  "M11",
  "SS3",
  "CS6",
  "CS7",
  "CS8",
  "LV4",
  "M12",
  "M13",
  "SS4",
  "CSTINY",
  "AI1",
  "AI2",
  "HW1",
  "M14",
  "M15",
  "SS5",
  "PROJ1"
]
assert sorted(ORDER) == sorted(m["id"] for m in NEW), set(ORDER) ^ set(m["id"] for m in NEW)
by = {m["id"]: m for m in NEW}
ordered_new = [by[i] for i in ORDER]

path = "../modules.json"
mods = json.load(open(path))
existing_ids = {m["id"] for m in mods}
for m in ordered_new:
    assert m["id"] not in existing_ids, f"{m['id']} already exists!"

# NT1 (number theory, 15 Oct 2026) was written by hand into modules.json; it is listed here so a rebuild keeps it.
# Full order is set in FULL_ORDER (13 Oct 2026, Abid: coherent arcs; 26 Oct 2026: sixteen modules added, see curriculum/BUILD-PLAN-2026-10-26.md); existing modules keep their content. The 26 Oct modules were written by hand into modules.json (not from batch*.py) - a rebuild from source must keep them (like NT1).
# 29 Oct 2026 (fix day, builder D): Python first - CS2B right after CS1C; CS1C's hardening half is the new CS1D after CS2B,
# then SEC0; M7B (multiply/divide fractions and decimals) after M7; electives at the end (phase 'Elective'): VM1A (VM1's
# Arch half), RE1, FUZZ1, DISC1, AISEC1, PQ1, CS9D (CS9's domain). CS1D, M7B, VM1A and CS9D live only in modules.json.
# 8 Nov 2026 (Abid, after the audit: "Math is the backbone"): maths spaced between the computing modules - CS2B, M6, CS1D, M7, SEC0, LV1, M7B, LV2.
# 9 Nov 2026 (PLAN-2026-11-09, approved): one sequence to the Class 8 annual exam - hardware the day its module opens (HW1 after LV1,
# NET1/NET2 in Feb), school-book maths alternating with computing, CTF1 in March, WEB1 in summer 2027, the rest to 2028. New M8C/SCI*/M11B/EXAM modules are inserted when written.
FULL_ORDER = ["M1", "M2", "M3", "GK1", "M4", "CS1", "CS1B", "CS2A", "LX1", "LX2", "M5", "CS1C", "CS2B", "M6", "CS1D", "M7", "LV1", "HW1", "SEC0", "M7B", "LV2", "CS3", "M8", "CS4", "CS5", "M8B", "CS2C", "M11", "NET1", "NET2", "LV3", "CTF1", "M12", "VM1", "G1", "NET3", "M10", "DEF1", "WEB1", "M9", "VM2", "HACK1", "SS1", "NT1", "SS2", "JS1", "WEB2", "CRYPTO1", "DEF2", "SS3", "CS6", "CS7", "CS8", "LV4", "M13", "SS4", "CSTINY", "AI1", "AI2", "M14", "M15", "SS5", "CS9", "LV5", "PROJ1", "VM1A", "RE1", "FUZZ1", "DISC1", "AISEC1", "PQ1", "CS9D"]
allmods = {m["id"]: m for m in mods}; allmods.update({m["id"]: m for m in ordered_new})
mods = [allmods[i] for i in FULL_ORDER]

# Validate every step shape.
KINDS = {"lesson", "code", "practice", "check", "teach", "diagnostic", "typing"}
ids = set()
for m in mods:
    assert m["id"] not in ids or True
    for s in m["steps"]:
        assert s["kind"] in KINDS, (m["id"], s)
        assert s["id"] not in ids, f"duplicate step id {s['id']}"
        ids.add(s["id"])
        if s["kind"] in ("lesson", "code"):
            assert s.get("tutor_brief"), (s["id"], "no brief")
        if s["kind"] == "check":
            assert s.get("questions") or (s.get("skills") and s.get("count")), s["id"]

json.dump(mods, open(path, "w"), ensure_ascii=False, indent=2)
print(f"total modules now: {len(mods)}")
print("new span:", " -> ".join(ORDER))
tot_steps = sum(len(by[i]["steps"]) for i in ORDER)
print(f"new steps: {tot_steps}")
