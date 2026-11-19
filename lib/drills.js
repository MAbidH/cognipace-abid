import { localDayIndex } from "./time";
// The daily "all the keys" line (Abid's rule, Oct 2026): typing words is not enough. Every line is shaped like
// code or a shell command so brackets, quotes, pipes, backslashes, symbols and numbers get practised every day.
export const DRILLS = [
  'print("Hello, Faiza!")',
  'x = (3 + 4) * 2 - 1',
  'if a != b: print(a, b)',
  'name = "Dhaka"; print(len(name))',
  'for i in range(0, 10): total += i',
  'path = "C:\\Users\\faiza\\school"',
  'ls -la | grep ".py"',
  'cd ~/school && python hello.py',
  'numbers = [1, 2, 3, 4, 5]',
  'ages = {"Faiza": 12, "Abid": 23}',
  'print(7 % 3, 7 // 3, 7 ** 2)',
  'while n > 0: n -= 1',
  'def area(w, h): return w * h',
  'git add . && git commit -m "first"',
  'email = user + "@" + domain',
  'if x >= 10 and y <= 5: ok = True',
  'cat notes.txt | wc -l',
  'print(f"{name} is {age} years old")',
  'result = int("42") + 8',
  'echo $HOME; pwd; whoami',
  'bits = bin(13)[2:]',
  'secret = shift(text, key=3)',
  'a, b = b, a + b',
  'python3 -m venv .venv',
  "print('single', \"double\")",
  'count = {}; count["x"] = 1',
  'grep -rn "TODO" ~/school',
  'total = sum([2, 4, 6]) / 3',
  'chmod +x run.sh && ./run.sh',
  'assert 46 * 23 == 1058',
  '# my_total = max_value - 1',
  'first_name = "Faiza" # her name',
];

export const DRILL_PASS = 95; // percent, character by character

/** Days since epoch in Dhaka time, so the line changes at her midnight, not UTC's. */
export function dhakaDayIndex(now = Date.now()) {
  return localDayIndex(now);
}

export function todaysDrill(now = Date.now()) {
  return DRILLS[dhakaDayIndex(now) % DRILLS.length];
}

/** Character-level accuracy: every position that differs (or is missing/extra) counts as one mistake. */
export function drillAccuracy(expected, typed) {
  const e = String(expected), t = String(typed);
  const n = Math.max(e.length, t.length);
  let bad = 0;
  for (let i = 0; i < n; i++) if (e[i] !== t[i]) bad++;
  return e.length ? Math.max(0, Math.round(100 * (1 - bad / e.length))) : 0;
}
