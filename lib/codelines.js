/* The Python line (Abid, 12 Oct 2026: "code every day, like typing"). Warm-up Part 5, from the day CS2A begins:
   one tiny program a day, written and RUN in her editor, checked on the server by its printed output. Three years of
   this is a thousand programs. Each line names the idea it practises so the ladder climbs with CS2A/CS2B; it cycles
   when it runs out - a repeat a month later is spaced review, not a bug. Safe to import on server and client (no DB).
   RULES for new lines: one printed line of output; no input(); no randomness; the ask names the exact output shape;
   an idea that no module has taught yet by the day it falls on must be explained inside the ask itself (dicts, f-strings - 14 Oct 2026). */

export const CODE_LINES = [
  { ask: "Make Python print the words Hello, Faiza", expect: "Hello, Faiza", must: "print", idea: "print", needs: "CS2A", eg: "print(\"Good morning, Abid\")\n→ Good morning, Abid" },
  { ask: "Make Python work out 7 times 8 and print the answer (only the number)", expect: "56", must: "*", idea: "arithmetic", needs: "CS2A", eg: "print(6 * 9)\n→ 54      (Python works it out; no other words)" },
  { ask: "Put the number 12 in a variable called age, then print age", expect: "12", must: "age", idea: "variables", needs: "CS2A", eg: "size = 40\nprint(size)\n→ 40" },
  { ask: "Print 100 minus 37 (only the number)", expect: "63", must: "-", idea: "arithmetic", needs: "CS2A", eg: "print(50 - 8)\n→ 42" },
  { ask: "Put your city in a variable called city, then print the word Dhaka using the variable", expect: "Dhaka", must: "city", idea: "variables", needs: "CS2A", eg: "colour = \"blue\"\nprint(colour)\n→ blue      (the box first, then print the box - no quotes around colour)" },
  { ask: "Print 2 to the power of 10 (only the number) - the ** sign means power", expect: "1024", must: "**", idea: "arithmetic", needs: "M8B", eg: "print(2 ** 3)\n→ 8" },
  { ask: "Make a variable name = 'Faiza' and print how many letters it has. len(name) counts the letters of a piece of text - so print(len(name)) prints the count.", expect: "5", must: "len(", idea: "strings", needs: "CS2B", eg: "word = \"cat\"\nprint(len(word))\n→ 3" },
  { ask: "Print the remainder when 17 is divided by 5 (the % sign gives the remainder)", expect: "2", must: "%", idea: "modulo", needs: "CS2B", eg: "print(10 % 3)\n→ 1" },
  { ask: "Make a variable x = 5. If x is bigger than 3, print big", expect: "big", must: "if ", idea: "if", literalOk: true, needs: "CS2A", eg: "n = 9\nif n > 5:\n    print(\"yes\")\n→ yes" },
  { ask: "Make a variable x = 2. If x is bigger than 3 print big, else print small", expect: "small", must: "else", idea: "if-else", literalOk: true, needs: "CS2A", eg: "n = 1\nif n > 5:\n    print(\"yes\")\nelse:\n    print(\"no\")\n→ no" },
  { ask: "Print the word hi three times on ONE line using * on the string (so: hihihi)", expect: "hihihi", must: "*", idea: "strings", needs: "CS2A", eg: "print(\"ab\" * 2)\n→ abab      (a string times a number repeats it)" },
  { ask: "Join two strings: first = 'Fa' and second = 'iza', print them joined (Faiza)", expect: "Faiza", must: "+", idea: "strings", needs: "CS2A", eg: "a = \"ca\"\nb = \"t\"\nprint(a + b)\n→ cat      (+ joins two strings)" },
  { ask: "Print the numbers 0 1 2 each on its own line using a for loop with range(3)", expect: "0\n1\n2", must: "for ", idea: "loops", needs: "CS2A", eg: "for i in range(2):\n    print(i)\n→ 0\n→ 1      (the colon at the end of the for line, then 4 spaces)" },
  { ask: "Use a for loop over range(5) to add up 0+1+2+3+4 into a variable total, then print total", expect: "10", must: "for ", idea: "loops", needs: "CS2A", eg: "total = 0\nfor i in range(3):\n    total = total + i\nprint(total)\n→ 3      (0 + 1 + 2; print is OUTSIDE the loop)" },
  { ask: "Make a list fruits = ['mango', 'apple'] and print the first one", expect: "mango", must: "[0]", idea: "lists", needs: "CS2B", eg: "pets = [\"cat\", \"dog\"]\nprint(pets[0])\n→ cat      ([0] is the FIRST box)" },
  { ask: "Make a list nums = [3, 9, 4] and print how many items it has", expect: "3", must: "len(", idea: "lists", needs: "CS2B", eg: "pets = [\"cat\", \"dog\"]\nprint(len(pets))\n→ 2" },
  { ask: "Make a list nums = [3, 9, 4] and print the biggest number with max()", expect: "9", must: "max(", idea: "lists", needs: "CS2B", eg: "nums = [4, 8, 1]\nprint(max(nums))\n→ 8" },
  { ask: "Turn the text '12' into a number with int() and add 1, then print it", expect: "13", must: "int(", idea: "types", needs: "CS2A", eg: "print(int(\"5\") + 1)\n→ 6" },
  { ask: "Print the type of 3.5 - the output must be exactly <class 'float'>", expect: "<class 'float'>", must: "type(", idea: "types", needs: "LV2", eg: "print(type(7))\n→ <class 'int'>" },
  { ask: "Make a variable word = 'security' and print it in CAPITAL letters with .upper()", expect: "SECURITY", must: ".upper()", idea: "strings", needs: "CS2B", eg: "word = \"cat\"\nprint(word.upper())\n→ CAT" },
  { ask: "Make a function called double(n) that returns n times 2, then print double(21)", expect: "42", must: "def ", idea: "functions", needs: "CS2B", eg: "def triple(n):\n    return n * 3\nprint(triple(5))\n→ 15" },
  { ask: "Make a function greet(name) that returns 'Hi ' + name, then print greet('Abid')", expect: "Hi Abid", must: "def ", idea: "functions", needs: "CS2B", eg: "def hello(name):\n    return \"Hello \" + name\nprint(hello(\"Faiza\"))\n→ Hello Faiza" },
  { ask: "Use a while loop: start at n = 3, print n and take 1 away each time, stop at 0 (prints 3 2 1 on separate lines)", expect: "3\n2\n1", must: "while ", idea: "while", needs: "CS2A", eg: "n = 2\nwhile n > 0:\n    print(n)\n    n = n - 1\n→ 2\n→ 1" },
  { ask: "Make a list [1, 2, 3] and print the sum of it with sum()", expect: "6", must: "sum(", idea: "lists", needs: "M10", eg: "print(sum([4, 5]))\n→ 9" },
  { ask: "Print 10 divided by 4 (Python gives a decimal: 2.5)", expect: "2.5", must: "/", idea: "arithmetic", needs: "CS2A", eg: "print(9 / 2)\n→ 4.5" },
  { ask: "Print 10 divided by 4 with the // sign (whole number only)", expect: "2", must: "//", idea: "arithmetic", needs: "CS2B", eg: "print(9 // 2)\n→ 4" },
  { ask: "Make a variable ok = 7 > 3 and print ok (Python prints True)", expect: "True", must: ">", idea: "booleans", needs: "CS2A", eg: "big = 9 > 4\nprint(big)\n→ True" },
  { ask: "Check whether 'a' is in the word 'Faiza' with the in keyword, and print the result", expect: "True", must: " in ", idea: "strings", needs: "CS3", eg: "print(\"c\" in \"cat\")\n→ True" },
  { ask: "Make a list letters = ['x', 'y'] and add 'z' with .append, then print the list", expect: "['x', 'y', 'z']", must: ".append(", idea: "lists", needs: "CS2B", eg: "pets = [\"cat\"]\npets.append(\"dog\")\nprint(pets)\n→ ['cat', 'dog']" },
  { ask: "Make a variable s = 'abc' and print it backwards using s[::-1]", expect: "cba", must: "[::-1]", idea: "strings", needs: "CS2C", eg: "t = \"xyz\"\nprint(t[::-1])\n→ zyx" },
  { ask: "Print 'ab' repeated 3 times followed by a '!' on one line (ababab!)", expect: "ababab!", must: "*", idea: "strings", needs: "CS2A", eg: "print(\"ha\" * 2 + \"?\")\n→ haha?" },
  { ask: "Use a for loop to print each letter of 'hi' on its own line", expect: "h\ni", must: "for ", idea: "loops", needs: "CS2B", eg: "for ch in \"ok\":\n    print(ch)\n→ o\n→ k" },
  { ask: "Make a function is_even(n) that returns n % 2 == 0, then print is_even(10)", expect: "True", must: "%", idea: "functions", needs: "CS2B", eg: "def is_odd(n):\n    return n % 2 == 1\nprint(is_odd(7))\n→ True" },
  { ask: "Make a variable n = 'twelve'. Print whether it is only digits with n.isdigit()", expect: "False", must: ".isdigit()", idea: "input checks", needs: "CS2C", eg: "print(\"42\".isdigit())\n→ True" },
  { ask: "Print the letters of 'Faiza' shifted: print the character after 'a' in the alphabet using chr(ord('a') + 1)", expect: "b", must: "ord(", idea: "ciphers", needs: "CS2B", eg: "print(chr(ord(\"c\") + 1))\n→ d" },
  { ask: "Count the vowels in 'security' with a loop and print the count", expect: "3", must: "for ", idea: "loops", needs: "CS2B", eg: "count = 0\nfor ch in \"banana\":\n    if ch == \"a\":\n        count = count + 1\nprint(count)\n→ 3" },
  { ask: "Make a list nums = [5, 1, 4] and print it sorted with sorted()", expect: "[1, 4, 5]", must: "sorted(", idea: "lists", needs: "M10", eg: "print(sorted([3, 1, 2]))\n→ [1, 2, 3]" },
  { ask: "Print the last item of the list ['a', 'b', 'c'] using index -1", expect: "c", must: "[-1]", idea: "lists", needs: "M11", eg: "print([\"x\", \"y\", \"z\"][-1])\n→ z" },
  { ask: "Make a function area(w, h) that returns w times h, then print area(3, 4)", expect: "12", must: "def ", idea: "functions", needs: "CS2B", eg: "def add(a, b):\n    return a + b\nprint(add(2, 3))\n→ 5" },
  { ask: "Make age = 13, then print I am 13 with an f-string: write f before the quotes and put the variable in curly brackets, like print(f\"I am {age}\")", expect: "I am 13", must: "f\"", idea: "f-strings", alt: "f'", needs: "CS2C", eg: "name = \"Abid\"\nprint(f\"Hi {name}\")\n→ Hi Abid" },
  { ask: "Make a function safe_int(s) that returns int(s) if s.isdigit() else 0, then print safe_int('x')", expect: "0", must: ".isdigit()", idea: "input checks", needs: "CS2C", eg: "def safe_int(s):\n    if s.isdigit():\n        return int(s)\n    return 0\nprint(safe_int(\"7\"))\n→ 7" },
  { ask: "Print the first 3 letters of 'security' using a slice [0:3]", expect: "sec", must: "[0:3]", idea: "strings", needs: "CS2C", eg: "print(\"python\"[0:2])\n→ py" },
  { ask: "Make a list of the squares of 1, 2, 3 with a loop or a comprehension and print it", expect: "[1, 4, 9]", must: "*", idea: "loops", needs: "CS2B", eg: "out = []\nfor n in [2, 3]:\n    out.append(n * n)\nprint(out)\n→ [4, 9]" },
  { ask: "Print the number of characters in the string 'hello world' (spaces count)", expect: "11", must: "len(", idea: "strings", needs: "CS2B", eg: "print(len(\"hi there\"))\n→ 8" },
  { ask: "A dictionary is a list with NAMES instead of numbers for its boxes: ages = {'Faiza': 13} makes one box named 'Faiza' holding 13. Make it, then print ages['Faiza']", expect: "13", must: "{", idea: "dicts", needs: "CS2C", eg: "heights = {\"Abid\": 170}\nprint(heights[\"Abid\"])\n→ 170" },
];

/* 28 Oct 2026: the line is picked from the lines whose idea a PASSED module has taught (`needs`), so a list or a
   function never falls on a day before CS2B taught it (28 Oct: 'lists' fell on CS1C day two and was waived). The set of
   passed modules is read as of the start of the Dhaka day, so the line cannot change under her within a day. */
/* 19 Nov 2026 (second instance): student.json may map this bank's module ids to its own curriculum
   (codeLineModules, e.g. {"CS2A": "PY1", "CS2B": "PY2"}); lines that need a module with no mapping are left out.
   Lines about Faiza herself are dropped when the student is someone else - the bank stays as written for her. */
const personal = (l) => /Faiza|'Fa'|Dhaka/.test(l.ask + " " + l.expect);
export function eligibleCodeLines(passed, student = null) {
  const set = passed instanceof Set ? passed : new Set(passed || []);
  const alias = student?.codeLineModules || null;
  const needOk = (l) => !l.needs || (alias ? (alias[l.needs] ? set.has(alias[l.needs]) : false) : set.has(l.needs));
  const ok = CODE_LINES.filter((l) => needOk(l) && (!student || student.name === "Faiza" || !personal(l)));
  return ok.length ? ok : CODE_LINES.slice(0, 1);
}
export function todaysCodeLine(dayIndex, passed, student = null) {
  const list = passed ? eligibleCodeLines(passed, student) : CODE_LINES;
  return list[((dayIndex % list.length) + list.length) % list.length];
}

/** Server check: the printed output must match exactly (whitespace at the ends ignored) and the code must contain
    the idea being practised, so that print("56") does not pass the multiplication line. */
export function checkCodeLine(line, code, output) {
  const out = String(output ?? "").replace(/\r/g, "").trim();
  const src = String(code ?? "");
  const hasIdea = src.includes(line.must) || !!(line.alt && src.includes(line.alt));
  const outputOk = out === line.expect;
  // print("56") style: the expected output typed straight into print, with no computation.
  // literalOk (14 Oct 2026): on a decision line the printed word can only be a literal - print('big') IS the answer.
  // Without this flag a correct if/else failed three times and was waived. Set it on any line whose output is a word.
  const literal = !line.literalOk && new RegExp("print\\(\\s*['\"]" + line.expect.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\n/g, "\\\\n") + "['\"]\\s*\\)").test(src) && line.must !== "print";
  return { ok: !!(outputOk && hasIdea && !literal), outputOk, hasIdea, literal };
}

/* Two wrong, then teach (18 Oct 2026). Her five waived lines (14-18 Oct) were all the same miss: she wrote the answer as
   words - "Hello, Faiza" with no print, print("my age is", 12), print("city", dhaka) - so the output never matched.
   The checker was right; the ask never showed her the shape. After the second miss the server sends a worked example
   of the SAME idea with DIFFERENT values, so she copies the shape, not the answer. */
const EXAMPLES = {
  print: 'print("Good morning, Abid")\n→ Good morning, Abid',
  arithmetic: 'print(6 * 7)\n→ 42      (Python works it out; no other words)',
  variables: 'colour = "blue"\nprint(colour)\n→ blue      (the box first, then print the box - no quotes around colour)',
  if: 'n = 9\nif n > 5:\n    print("yes")\n→ yes',
  "if-else": 'n = 1\nif n > 5:\n    print("yes")\nelse:\n    print("no")\n→ no',
  strings: 'word = "cat"\nprint(len(word))\n→ 3',
  loops: 'for i in range(2):\n    print(i)\n→ 0\n→ 1',
  lists: 'pets = ["cat", "dog"]\nprint(pets[1])\n→ dog',
  types: 'print(int("7") + 1)\n→ 8',
  functions: 'def triple(n):\n    return n * 3\nprint(triple(5))\n→ 15',
  while: 'n = 2\nwhile n > 0:\n    print(n)\n    n = n - 1\n→ 2\n→ 1',
  booleans: 'big = 9 > 4\nprint(big)\n→ True',
  modulo: 'print(10 % 3)\n→ 1',
  "input checks": 'print("42".isdigit())\n→ True',
  ciphers: 'print(chr(ord("c") + 1))\n→ d',
  "f-strings": 'name = "Abid"\nprint(f"Hi {name}")\n→ Hi Abid',
  dicts: 'heights = {"Abid": 170}\nprint(heights["Abid"])\n→ 170',
};
/* 28 Oct 2026: she copied the generic example instead of solving the ask (24-28 Oct: four waived lines were the
   example's shape with the example's values - 'word = "hi"; print(len(word))' for the join line, 'pets' for 'fruits').
   Every line now carries its OWN example (eg): the same shape as the ask, different values. The idea-level one is the fallback. */
export function exampleFor(line) { return line?.eg || EXAMPLES[line?.idea] || null; }
