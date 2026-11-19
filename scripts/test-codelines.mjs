// Test for the daily Python line (14 Oct 2026). For every line in lib/codelines.js a known-correct solution (written as
// she would write it) must PASS the server check, and the two classic cheats must still be refused. Found on 14 Oct: the
// if/if-else lines rejected a correct answer (the printed word is a literal by nature). push.ps1 runs this before a commit.
//   node scripts/test-codelines.mjs
import { CODE_LINES, checkCodeLine } from "../lib/codelines.js";
import fs from "fs";
import { spawnSync } from "child_process";
// 28 Oct 2026: every line carries `needs` (a real module id that must be passed first) and `eg` (its own worked example,
// same shape as the ask). The examples are RUN with python3 when it is available - an example that prints something
// else would teach her the wrong shape (she copies them, as 24-28 Oct showed).
const MODULES = JSON.parse(fs.readFileSync(new URL("../curriculum/modules.json", import.meta.url)));
const MODULE_IDS = new Set(MODULES.map((m) => m.id));
// 19 Nov 2026: the second instance maps the bank's module ids onto its own curriculum (student.json codeLineModules);
// a `needs` is valid there when its mapped id is a module. Faiza's instance has no map, so nothing changes for hers.
const STUDENT = JSON.parse(fs.readFileSync(new URL("../curriculum/student.json", import.meta.url)));
const ALIAS = STUDENT.codeLineModules || null;
const needsOk = (id) => !!id && (ALIAS ? !(id in ALIAS) || MODULE_IDS.has(ALIAS[id]) : MODULE_IDS.has(id)); // unmapped = left out of that instance
// 28 Oct 2026: both len() lines were gated to CS2A, whose own `taught` list says len() is NOT taught there - that was
// the 24 Oct waiver. A line's idea must not sit on its module's not-taught list.
const NOT_TAUGHT = {};
for (const m of MODULES) {
  const after = String(m.taught || "").split(/never (?:use|ask)\s*:/i)[1];
  if (after) NOT_TAUGHT[m.id] = after.split(/[,.]/).map((x) => x.trim().toLowerCase().replace(/\(\)$/, "").replace(/\($/, "")).filter(Boolean);
}
const havePy = spawnSync("python3", ["--version"]).status === 0;
const SOLUTIONS = [
 {
  "code": "print('Hello, Faiza')",
  "output": "Hello, Faiza\n"
 },
 {
  "code": "print(7 * 8)",
  "output": "56\n"
 },
 {
  "code": "age = 12\nprint(age)",
  "output": "12\n"
 },
 {
  "code": "print(100 - 37)",
  "output": "63\n"
 },
 {
  "code": "city = 'Dhaka'\nprint(city)",
  "output": "Dhaka\n"
 },
 {
  "code": "print(2 ** 10)",
  "output": "1024\n"
 },
 {
  "code": "name = 'Faiza'\nprint(len(name))",
  "output": "5\n"
 },
 {
  "code": "print(17 % 5)",
  "output": "2\n"
 },
 {
  "code": "x = 5\nif x > 3:\n    print('big')",
  "output": "big\n"
 },
 {
  "code": "x = 2\nif x > 3:\n    print('big')\nelse:\n    print('small')",
  "output": "small\n"
 },
 {
  "code": "print('hi' * 3)",
  "output": "hihihi\n"
 },
 {
  "code": "first = 'Fa'\nsecond = 'iza'\nprint(first + second)",
  "output": "Faiza\n"
 },
 {
  "code": "for i in range(3):\n    print(i)",
  "output": "0\n1\n2\n"
 },
 {
  "code": "total = 0\nfor i in range(5):\n    total = total + i\nprint(total)",
  "output": "10\n"
 },
 {
  "code": "fruits = ['mango', 'apple']\nprint(fruits[0])",
  "output": "mango\n"
 },
 {
  "code": "nums = [3, 9, 4]\nprint(len(nums))",
  "output": "3\n"
 },
 {
  "code": "nums = [3, 9, 4]\nprint(max(nums))",
  "output": "9\n"
 },
 {
  "code": "print(int('12') + 1)",
  "output": "13\n"
 },
 {
  "code": "print(type(3.5))",
  "output": "<class 'float'>\n"
 },
 {
  "code": "word = 'security'\nprint(word.upper())",
  "output": "SECURITY\n"
 },
 {
  "code": "def double(n):\n    return n * 2\nprint(double(21))",
  "output": "42\n"
 },
 {
  "code": "def greet(name):\n    return 'Hi ' + name\nprint(greet('Abid'))",
  "output": "Hi Abid\n"
 },
 {
  "code": "n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1",
  "output": "3\n2\n1\n"
 },
 {
  "code": "print(sum([1, 2, 3]))",
  "output": "6\n"
 },
 {
  "code": "print(10 / 4)",
  "output": "2.5\n"
 },
 {
  "code": "print(10 // 4)",
  "output": "2\n"
 },
 {
  "code": "ok = 7 > 3\nprint(ok)",
  "output": "True\n"
 },
 {
  "code": "print('a' in 'Faiza')",
  "output": "True\n"
 },
 {
  "code": "letters = ['x', 'y']\nletters.append('z')\nprint(letters)",
  "output": "['x', 'y', 'z']\n"
 },
 {
  "code": "s = 'abc'\nprint(s[::-1])",
  "output": "cba\n"
 },
 {
  "code": "print('ab' * 3 + '!')",
  "output": "ababab!\n"
 },
 {
  "code": "for c in 'hi':\n    print(c)",
  "output": "h\ni\n"
 },
 {
  "code": "def is_even(n):\n    return n % 2 == 0\nprint(is_even(10))",
  "output": "True\n"
 },
 {
  "code": "n = 'twelve'\nprint(n.isdigit())",
  "output": "False\n"
 },
 {
  "code": "print(chr(ord('a') + 1))",
  "output": "b\n"
 },
 {
  "code": "count = 0\nfor c in 'security':\n    if c in 'aeiou':\n        count = count + 1\nprint(count)",
  "output": "3\n"
 },
 {
  "code": "nums = [5, 1, 4]\nprint(sorted(nums))",
  "output": "[1, 4, 5]\n"
 },
 {
  "code": "print(['a', 'b', 'c'][-1])",
  "output": "c\n"
 },
 {
  "code": "def area(w, h):\n    return w * h\nprint(area(3, 4))",
  "output": "12\n"
 },
 {
  "code": "age = 13\nprint(f\"I am {age}\")",
  "output": "I am 13\n"
 },
 {
  "code": "def safe_int(s):\n    return int(s) if s.isdigit() else 0\nprint(safe_int('x'))",
  "output": "0\n"
 },
 {
  "code": "print('security'[0:3])",
  "output": "sec\n"
 },
 {
  "code": "print([n * n for n in [1, 2, 3]])",
  "output": "[1, 4, 9]\n"
 },
 {
  "code": "print(len('hello world'))",
  "output": "11\n"
 },
 {
  "code": "ages = {'Faiza': 13}\nprint(ages['Faiza'])",
  "output": "13\n"
 }
];
let bad = 0;
if (SOLUTIONS.length !== CODE_LINES.length) { console.log(`FAIL: ${CODE_LINES.length} lines but ${SOLUTIONS.length} solutions - add a solution for each new line`); bad++; }
CODE_LINES.forEach((l, i) => { const s = SOLUTIONS[i]; if (!s) return; const r = checkCodeLine(l, s.code, s.output);
  if (!r.ok) { bad++; console.log(`FAIL line #${i + 1} (${l.idea}): a correct solution was rejected - outputOk=${r.outputOk} hasIdea=${r.hasIdea} literal=${r.literal}`); } });
CODE_LINES.forEach((l, i) => {
  if (!needsOk(l.needs)) { bad++; console.log(`FAIL line #${i + 1}: needs '${l.needs}' is not a module id`); }
  const notList = NOT_TAUGHT[l.needs] || [];
  const mustNorm = String(l.must).trim().toLowerCase().replace(/\(\)$/, "").replace(/\($/, "");
  if (notList.includes(mustNorm)) { bad++; console.log(`FAIL line #${i + 1}: needs '${l.needs}', but ${l.must} is on that module's NOT-taught list`); }
  if (!l.eg || !l.eg.includes("\n→ ")) { bad++; console.log(`FAIL line #${i + 1}: no worked example (eg) with a → line`); return; }
  if (!havePy) return;
  const code = l.eg.split("\n").filter((x) => !x.startsWith("→")).join("\n");
  const want = l.eg.split("\n").filter((x) => x.startsWith("→")).map((x) => x.slice(1).trim().replace(/\s{3,}\(.*\)$/, "")).join("\n");
  const r = spawnSync("python3", ["-I", "-c", code], { encoding: "utf8" });
  const got = ((r.stdout || "") + (r.stderr || "")).trim();
  if (got !== want) { bad++; console.log(`FAIL line #${i + 1}: the example prints [${got}] but says [${want}]`); }
});
if (!havePy) console.log("(python3 not found - the examples were not run)");
const cheats = [[1, "print(\"56\")", "56\n"], [10, "print(\"hihihi\")", "hihihi\n"]];
for (const [i, code, out] of cheats) if (checkCodeLine(CODE_LINES[i], code, out).ok) { bad++; console.log(`FAIL line #${i + 1}: the literal cheat ${code} passed`); }
console.log(bad ? `${bad} problem(s) in the Python line` : `Python line: all ${CODE_LINES.length} lines pass, cheats refused.`);
process.exit(bad ? 1 : 0);
