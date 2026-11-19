/* Keyboard mastery (Abid, 4 Oct 2026: "she didn't know Ctrl+T or which key is Win - she needs to be a master").
   One new key move every day in the warm-up, plus one from earlier days to keep it alive. Verified on the server:
   she presses it on her laptop, then types which keys she pressed. The full list is her cheat-sheet at /keys. */

export const SHORTCUTS = [
  // Week 1: the keys themselves and Chrome
  { id: "win", what: "The Start menu is the panel that pops up from the bottom-left corner of the screen. It is the front door to everything on the laptop: every program, every setting. You open it with the Win key (or by clicking the Windows logo on the bar at the bottom), and the moment it is open you can just start typing a name.", keys: "Win", does: "Open the Start menu, then just type what you want (an app, a setting) and press Enter", where: "Windows", accept: ["win", "windows"], tip: "The Win key has the Windows logo on it, bottom-left, between Ctrl and Alt." },
  { id: "ctrl-t", what: "A tab is one web page inside the browser window. The row of little boxes along the top of Chrome - one per page - are the tabs. A new tab is a fresh, empty page next to the ones you already have open.", keys: "Ctrl+T", does: "Open a new tab", where: "Chrome", accept: ["ctrl+t"] },
  { id: "ctrl-l", what: "The address bar is the long white box at the very top of Chrome where the web address (like the-school-orpin.vercel.app) is written. Typing there and pressing Enter takes you to a page.", keys: "Ctrl+L", does: "Jump to the address bar, ready to type a web address", where: "Chrome", accept: ["ctrl+l"] },
  { id: "ctrl-w", what: "Closing a tab removes just that one page; the other tabs stay.", keys: "Ctrl+W", does: "Close the current tab", where: "Chrome", accept: ["ctrl+w"] },
  { id: "ctrl-tab", what: "When you have several tabs open, this moves you to the one on the right, one at a time.", keys: "Ctrl+Tab", does: "Go to the next tab", where: "Chrome", accept: ["ctrl+tab"] },
  { id: "alt-tab", what: "A window is one program's box on the screen - Chrome is one window, Task Manager is another. Alt+Tab flips between them without touching the mouse.", keys: "Alt+Tab", does: "Switch to the other open window (hold Alt, tap Tab to pick)", where: "Windows", accept: ["alt+tab"] },
  { id: "ctrl-shift-t", what: "Chrome remembers the tabs you closed. This brings the last one back, exactly as it was.", keys: "Ctrl+Shift+T", does: "Bring back the tab you just closed", where: "Chrome", accept: ["ctrl+shift+t"] },
  // Week 2: text, the moves every programmer makes a thousand times a day
  { id: "ctrl-c", what: "Selected means highlighted - you drag over text with the mouse, or hold Shift and use the arrow keys. Copy puts a copy of it on the clipboard, an invisible shelf, so you can paste it somewhere else.", keys: "Ctrl+C", does: "Copy what is selected", where: "everywhere", accept: ["ctrl+c"] },
  { id: "ctrl-v", what: "Paste puts whatever is on the clipboard (the last thing you copied) where the cursor is.", keys: "Ctrl+V", does: "Paste", where: "everywhere", accept: ["ctrl+v"] },
  { id: "ctrl-x", what: "Cut is copy plus delete: the text goes to the clipboard and disappears from where it was, ready to paste somewhere else.", keys: "Ctrl+X", does: "Cut (copy and remove)", where: "everywhere", accept: ["ctrl+x"] },
  { id: "ctrl-z", what: "Undo takes back the last thing you did - a deleted word, a wrong paste. Press it again to go further back.", keys: "Ctrl+Z", does: "Undo the last change", where: "everywhere", accept: ["ctrl+z"] },
  { id: "ctrl-y", what: "Redo is the opposite of undo: if you undid too much, this puts it back.", keys: "Ctrl+Y", does: "Redo what you just undid", where: "everywhere", accept: ["ctrl+y", "ctrl+shift+z"] },
  { id: "ctrl-a", what: "Select all highlights everything in the box or page you are in, so you can copy or delete all of it at once.", keys: "Ctrl+A", does: "Select everything", where: "everywhere", accept: ["ctrl+a"] },
  { id: "ctrl-s", what: "Save writes what is on the screen to the file on the disk. Until you save, your changes live only in memory and vanish if the program closes.", keys: "Ctrl+S", does: "Save the file", where: "editors", accept: ["ctrl+s"] },
  // Week 3: moving through text without the mouse
  { id: "home-end", what: "The cursor is the blinking line where your typing goes. Home sends it to the beginning of the line, End to the end.", keys: "Home / End", does: "Jump to the start / end of the line", where: "everywhere", accept: ["home", "end", "home/end", "home+end"] },
  { id: "ctrl-arrows", what: "Holding Ctrl makes the arrow keys jump a whole word at a time instead of one letter.", keys: "Ctrl+←/→", does: "Jump one whole word left or right", where: "everywhere", accept: ["ctrl+left", "ctrl+right", "ctrl+arrow", "ctrl+arrows", "ctrl+←", "ctrl+→"] },
  { id: "shift-arrows", what: "Holding Shift while moving the cursor highlights (selects) the text you move over.", keys: "Shift+←/→", does: "Select text one character at a time (add Ctrl to select whole words)", where: "everywhere", accept: ["shift+left", "shift+right", "shift+arrow", "shift+arrows", "shift+←", "shift+→"] },
  { id: "ctrl-backspace", what: "Backspace deletes one letter; with Ctrl it deletes the whole word before the cursor.", keys: "Ctrl+Backspace", does: "Delete the whole word before the cursor", where: "everywhere", accept: ["ctrl+backspace"] },
  { id: "ctrl-f", what: "Find opens a small search box: type a word and it highlights every place that word appears on the page.", keys: "Ctrl+F", does: "Find a word on the page or in a file", where: "everywhere", accept: ["ctrl+f"] },
  { id: "f2", what: "In File Explorer (the program that shows your folders and files), select a file, press F2, and its name becomes editable.", keys: "F2", does: "Rename the selected file", where: "File Explorer", accept: ["f2"] },
  { id: "tab-shift-tab", what: "A form is a page with several boxes to fill in. Tab moves the cursor to the next box; Shift+Tab moves back.", keys: "Tab / Shift+Tab", does: "Move to the next / previous box in a form", where: "everywhere", accept: ["tab", "shift+tab", "tab/shift+tab"] },
  // Week 4: Windows itself
  { id: "win-d", what: "The desktop is the background screen with the icons, behind all the windows. Win+D hides every window so you can see it.", keys: "Win+D", does: "Show the desktop (press again to bring everything back)", where: "Windows", accept: ["win+d"] },
  { id: "win-e", what: "File Explorer is the program that shows your folders and files - Desktop, Documents, Downloads, your school folder.", keys: "Win+E", does: "Open File Explorer", where: "Windows", accept: ["win+e"] },
  { id: "win-i", what: "Settings is where you change how Windows works: Wi-Fi, display, accounts, updates.", keys: "Win+I", does: "Open Settings", where: "Windows", accept: ["win+i"] },
  { id: "win-l", what: "Lock means the screen goes to the sign-in page; nothing closes, but nobody can use the laptop until you type your PIN.", keys: "Win+L", does: "Lock the laptop (do this every time you walk away)", where: "Windows", accept: ["win+l"] },
  { id: "alt-f4", what: "This closes the whole program that is in front - all its tabs or documents - not just one tab.", keys: "Alt+F4", does: "Close the current program", where: "Windows", accept: ["alt+f4"] },
  { id: "win-arrows", what: "Snapping makes a window fill exactly half the screen, so you can have two things side by side, like CogniPace and a terminal.", keys: "Win+←/→", does: "Snap the window to the left / right half of the screen", where: "Windows", accept: ["win+left", "win+right", "win+arrow", "win+arrows", "win+←", "win+→"] },
  { id: "ctrl-shift-esc", what: "Task Manager is the window that shows everything running and how busy the CPU, memory and disk are - the one you used in CS1B-L0.", keys: "Ctrl+Shift+Esc", does: "Open Task Manager straight away", where: "Windows", accept: ["ctrl+shift+esc", "ctrl+shift+escape"] },
  { id: "win-shift-s", what: "The screen goes dim and you drag a box over the part you want; the picture goes to the clipboard, ready to paste into your logbook.", keys: "Win+Shift+S", does: "Take a screenshot of part of the screen (for your logbook)", where: "Windows", accept: ["win+shift+s"] },
  { id: "win-v", what: "The clipboard normally keeps only the last thing you copied. Clipboard history shows the last several, so you can paste an older one.", keys: "Win+V", does: "Open clipboard history: everything you copied recently", where: "Windows", accept: ["win+v"] },
  // Week 5: browser power and the school itself
  { id: "f5", what: "Reload asks the website for the page again, fresh. Use it when a page looks old or stuck.", keys: "F5", does: "Reload the page (Ctrl+F5 reloads ignoring the cache)", where: "Chrome", accept: ["f5", "ctrl+r"] },
  { id: "ctrl-shift-n", what: "An Incognito window is a Chrome window that forgets everything when you close it - no history, no saved sign-ins. Good for testing a link.", keys: "Ctrl+Shift+N", does: "Open an Incognito window", where: "Chrome", accept: ["ctrl+shift+n"] },
  { id: "ctrl-plus", what: "Zoom makes the page bigger or smaller without changing the website itself.", keys: "Ctrl + / Ctrl -", does: "Zoom the page in / out (Ctrl+0 resets)", where: "Chrome", accept: ["ctrl++", "ctrl+-", "ctrl+plus", "ctrl+minus", "ctrl+=", "ctrl+0"] },
  { id: "esc", what: "Escape is the top-left key. It means 'cancel' almost everywhere: close a pop-up, stop a search, leave full screen.", keys: "Esc", does: "Cancel, close a pop-up, leave full screen", where: "everywhere", accept: ["esc", "escape"] },
  { id: "ctrl-enter", what: "In CogniPace's Python editor, this runs your program. In the chat, it finishes a step once the tutor has opened it.", keys: "Ctrl+Enter", does: "Run your program in CogniPace's editor; finish a step", where: "CogniPace", accept: ["ctrl+enter"] },
  { id: "ctrl-slash", what: "Pressing this in the room sends 'explain again, more simply' to the tutor.", keys: "Ctrl+/", does: "Ask the tutor to explain again, more simply", where: "CogniPace", accept: ["ctrl+/"] },
  { id: "ctrl-d", what: "Pressing this in the room asks the tutor to draw the idea it just explained.", keys: "Ctrl+D", does: "Ask the tutor to draw it", where: "CogniPace", accept: ["ctrl+d"] },
  // 29 Oct 2026: was Alt+1..5 - in Firefox on Linux Alt+digit (and Ctrl+digit) switch browser TABS. Now Alt+Shift+digit.
  { id: "alt-1", what: "Alt and Shift together, plus a number, jump to that page of CogniPace without the mouse.", keys: "Alt+Shift+1 … Alt+Shift+5", does: "Jump between CogniPace's pages: Map, Room, Rewards, Logbook, Keys", where: "CogniPace", accept: ["alt+shift+1", "alt+shift+2", "alt+shift+3", "alt+shift+4", "alt+shift+5"] },
  // Week 6: terminal and editor habits she will need in CS3/CS4
  { id: "win-terminal", what: "A terminal is a window where you type commands as text instead of clicking - the way programmers and Linux work. You will live in it from CS3.", keys: "Win, type terminal, Enter", does: "Open a terminal", where: "Windows", accept: ["win", "win+terminal", "win,terminal,enter"] },
  { id: "ctrl-shift-c", what: "Inside a terminal, plain Ctrl+C means 'stop the running program', so copy and paste get Shift added.", keys: "Ctrl+Shift+C / Ctrl+Shift+V", does: "Copy / paste inside a terminal (plain Ctrl+C stops a program there)", where: "Terminal", accept: ["ctrl+shift+c", "ctrl+shift+v"] },
  { id: "ctrl-grave", what: "The ` key is top-left, under Esc. In VS Code it opens a terminal panel at the bottom of the editor.", keys: "Ctrl+`", does: "Open the terminal panel inside VS Code", where: "VS Code", accept: ["ctrl+`"] },
  { id: "ctrl-p", what: "VS Code's quick open: start typing a file's name and press Enter to open it, no clicking through folders.", keys: "Ctrl+P", does: "Open any file by typing its name", where: "VS Code", accept: ["ctrl+p"] },
  { id: "ctrl-shift-p", what: "The command palette lists every command VS Code has. Type a few letters of what you want to do and pick it.", keys: "Ctrl+Shift+P", does: "The command palette: every VS Code command, by name", where: "VS Code", accept: ["ctrl+shift+p", "f1"] },
];

/* Linux Mint (Cinnamon) key moves (Abid, 12 Oct 2026): after the switch (os=linux, from LX1-L7B) the warm-up teaches
   THESE, not Win+I. Super is the Windows-logo key. The ladder covers the desktop, the terminal, the editor and the
   browser - everything she now lives in. */
export const LINUX_SHORTCUTS = [
  { id: "lx-super", what: "Super is the key with the Windows logo, bottom-left between Ctrl and Alt. On Linux Mint it opens the menu; start typing an app's name and press Enter.", keys: "Super", does: "Open the menu, then type an app's name and Enter", where: "Linux", accept: ["super", "win", "windows", "meta"] },
  { id: "lx-term", what: "The terminal is where you type commands. On Mint this combination opens one from anywhere.", keys: "Ctrl+Alt+T", does: "Open a terminal", where: "Linux", accept: ["ctrl+alt+t"] },
  { id: "lx-lock", what: "Lock the screen when you walk away - nothing closes, but your password is needed to return.", keys: "Ctrl+Alt+L", does: "Lock the screen", where: "Linux", accept: ["ctrl+alt+l"] },
  { id: "lx-files", what: "The file manager (Files/Nemo) shows your folders, like File Explorer did on Windows.", keys: "Super+E", does: "Open the file manager", where: "Linux", accept: ["super+e", "win+e"] },
  { id: "lx-alt-tab", what: "Switch between open windows without the mouse: hold Alt, tap Tab.", keys: "Alt+Tab", does: "Switch windows", where: "Linux", accept: ["alt+tab"] },
  { id: "lx-close", what: "Close the current window, all of it.", keys: "Alt+F4", does: "Close the window", where: "Linux", accept: ["alt+f4"] },
  { id: "lx-snap", what: "Snap the window to the left or right half of the screen - for editor-and-terminal side by side.", keys: "Super+Left / Super+Right", does: "Snap the window left / right", where: "Linux", accept: ["super+left", "super+right", "win+left", "win+right"] },
  { id: "lx-workspace", what: "A workspace is a whole extra screen. Mint holds several; this moves between them.", keys: "Ctrl+Alt+Left / Right", does: "Move between workspaces", where: "Linux", accept: ["ctrl+alt+left", "ctrl+alt+right"] },
  { id: "lx-term-copy", what: "Inside a terminal, plain Ctrl+C stops the running program - so copy and paste add Shift.", keys: "Ctrl+Shift+C / Ctrl+Shift+V", does: "Copy / paste inside a terminal", where: "Terminal", accept: ["ctrl+shift+c", "ctrl+shift+v"] },
  { id: "lx-term-clear", what: "Clear the terminal screen (the scrollback stays; it just tidies the view).", keys: "Ctrl+L", does: "Clear the terminal screen", where: "Terminal", accept: ["ctrl+l"] },
  { id: "lx-term-search", what: "Search your command history backwards: press this, type part of a command, it finds it.", keys: "Ctrl+R", does: "Search command history", where: "Terminal", accept: ["ctrl+r"] },
  { id: "lx-term-cancel", what: "Stop whatever is running in the terminal right now.", keys: "Ctrl+C", does: "Stop the running command", where: "Terminal", accept: ["ctrl+c"] },
  { id: "lx-nano-save", what: "In the nano editor, this saves (it says 'Write Out'); then Enter to confirm the name.", keys: "Ctrl+O", does: "Save in nano", where: "nano", accept: ["ctrl+o"] },
  { id: "lx-nano-exit", what: "Leave the nano editor.", keys: "Ctrl+X", does: "Exit nano", where: "nano", accept: ["ctrl+x"] },
  { id: "lx-vscode-term", what: "In VS Code, open a terminal panel at the bottom with the backtick key (top-left, under Esc).", keys: "Ctrl+`", does: "Open the terminal panel in VS Code", where: "VS Code", accept: ["ctrl+`", "ctrl+grave"] },
  { id: "lx-vscode-open", what: "VS Code quick-open: type a file's name and Enter, no clicking through folders.", keys: "Ctrl+P", does: "Open any file by name in VS Code", where: "VS Code", accept: ["ctrl+p"] },
  { id: "lx-vscode-palette", what: "The command palette: every VS Code command by name.", keys: "Ctrl+Shift+P", does: "The VS Code command palette", where: "VS Code", accept: ["ctrl+shift+p"] },
  // 23 Oct 2026: her IdeaPad has no Print key - Firefox's own screenshot tool is the move she always has.
  { id: "lx-screenshot", what: "Take a picture of part of the page in Firefox (to show the tutor): drag a box, then Copy.", keys: "Ctrl+Shift+S", does: "Screenshot part of the page in Firefox", where: "Firefox", accept: ["ctrl+shift+s"] },
];

/* CogniPace's own keys (29 Oct 2026, review L3/M4): shown on /keys for BOTH machines (on Linux the sheet had none, and
   the room hides its key legend below 1280 px). NOT part of the daily ladder - adding them there would shift which move
   falls on which day. Checked against Firefox on Linux: Alt+1..9 and Ctrl+1..9 switch tabs there (so pages use
   Alt+Shift+digit); Ctrl+Alt+arrows are Mint's workspaces (unused here); Ctrl+D (bookmark), Ctrl+B (bookmarks sidebar),
   Ctrl+L (address bar) and Ctrl+Shift+K (Web Console) are Firefox keys but not reserved ones, so the page takes them
   first while CogniPace has focus; Ctrl+Shift+Y (Firefox downloads) is not used by CogniPace. Ids shared with the ladder
   (ctrl-enter, ctrl-slash, ctrl-d, alt-1) light up on /keys when she has proved them. */
export const ROOM_KEYS = [
  { id: "alt-1", keys: "Alt+Shift+1 … Alt+Shift+9", does: "Pages: 1 Map, 2 Room, 3 Rewards, 4 Logbook, 5 Keys, 6 Wonder, 7 Arena, 8 My voice, 9 Meet", where: "CogniPace" },
  { id: "cp-recess", keys: "Alt+R", does: "Recess - your place is saved", where: "CogniPace" },
  { id: "cp-enter", keys: "Enter / Shift+Enter", does: "Send your message / a new line in the message", where: "CogniPace" },
  { id: "ctrl-enter", keys: "Ctrl+Enter", does: "Finish the step (once the tutor opens it); in the editor: run your program; on My voice: save", where: "CogniPace" },
  { id: "ctrl-slash", keys: "Ctrl+/", does: "Explain that again, more simply", where: "CogniPace" },
  { id: "cp-why", keys: "Ctrl+?", does: "Why am I doing this? (Ctrl+Shift+/)", where: "CogniPace" },
  { id: "ctrl-d", keys: "Ctrl+D", does: "Ask the tutor to draw it", where: "CogniPace" },
  { id: "cp-bangla", keys: "Ctrl+B", does: "Say it in Bangla first, then English", where: "CogniPace" },
  { id: "cp-stop", keys: "Esc", does: "In the editor: stop a program that is running (it also stops by itself after 10 seconds)", where: "CogniPace" },
  { id: "cp-lines", keys: "Ctrl+L / Alt+↑ / Alt+↓ / Ctrl+Shift+K", does: "In the editor: select the line / move it up / move it down / delete it", where: "CogniPace" },
];

/** Normalise what she typed: "Control + t", "ctrl t", "CTRL+T" all become "ctrl+t". Order of modifiers does not matter. */
export function normKeys(s) {
  let t = String(s || "").toLowerCase().trim()
    .replace(/control/g, "ctrl").replace(/windows\s*key|windows|win\s*key|winkey/g, "win").replace(/command|cmd/g, "ctrl")
    .replace(/escape/g, "esc").replace(/return/g, "enter").replace(/\bleft arrow\b|←/g, "left").replace(/\bright arrow\b|→/g, "right")
    .replace(/\b(the|keys?|buttons?|press|pressed|hold|holding|together|then)\b/g, " ").replace(/\barrows?\s+(left|right|up|down)\b/g, "$1")
    .replace(/\s*\+\s*/g, "+").replace(/\s+and\s+/g, "+").replace(/[\s,]+/g, "+").replace(/\++/g, "+").replace(/^\+|\+$/g, "");
  const parts = t.split("+").filter(Boolean);
  const mods = ["ctrl", "alt", "shift", "win", "super"];
  const sorted = [...parts.filter((p) => mods.includes(p)).sort((a, b) => mods.indexOf(a) - mods.indexOf(b)), ...parts.filter((p) => !mods.includes(p))];
  return sorted.join("+");
}

/** The keys exactly as the card and "Show me" display them must always pass (19 Oct 2026: Faiza typed "Ctrl+←/→" as shown
    and was told no - twelve moves had this bug). "Ctrl+←/→" -> ctrl+left, ctrl+right, and the whole string; "Home / End" -> home, end. */
function shownForms(keys) {
  const raw = String(keys || "");
  const out = new Set([normKeys(raw)]);
  const alts = raw.split(/\s*\/\s*|\s+…\s+/).filter(Boolean);
  const first = alts[0] || "";
  const prefix = first.includes("+") ? first.slice(0, first.lastIndexOf("+") + 1) : "";
  for (const a of alts) { out.add(normKeys(a)); if (prefix && !a.includes("+")) out.add(normKeys(prefix + a)); }
  return out;
}

/* 20 Oct 2026: she typed "Shift+Right/Left" for Shift+←/→ and "Fn+Home/end" for Home / End - both refused, both waived
   after three tries. A typed "a/b" passes when every part passes (the modifier carried), and a leading Fn+ is ignored:
   on her IdeaPad Home/End/PgUp/PgDn live on the arrow keys behind Fn, so "Fn+Home" IS pressing Home. */
function oneMatches(shortcut, n) {
  return shortcut.accept.some((a) => normKeys(a) === n) || shownForms(shortcut.keys).has(n);
}
export function matches(shortcut, typed) {
  const raw = String(typed || "").replace(/\bfn\s*\+\s*/gi, "");
  const n = normKeys(raw);
  if (!n) return false;
  if (oneMatches(shortcut, n)) return true;
  const alts = raw.split(/\s*\/\s*/).filter(Boolean);
  if (alts.length < 2) return false;
  // 28 Oct 2026: "super left/right" was refused - the modifier was only carried when the first part had a "+", and she
  // typed a space. The prefix now comes from the NORMALISED first part ("super left" -> "super+left" -> "super+").
  const nf = normKeys(alts[0]);
  const prefix = nf.includes("+") ? nf.slice(0, nf.lastIndexOf("+") + 1) : "";
  return alts.every((a) => { const k = normKeys(a); const kp = normKeys(prefix + a); return (k && oneMatches(shortcut, k)) || (prefix && !k.includes("+") && kp && oneMatches(shortcut, kp)); });
}

/** Today's new move and one review from earlier days, by day index (Dhaka). Day 0 = the first day of the gate. */
export function forDay(dayIndex, os = "windows") {
  const i = Math.max(0, dayIndex);
  const list = os === "linux" ? LINUX_SHORTCUTS : SHORTCUTS;
  const today = list[i % list.length];
  const back = i === 0 ? null : list[Math.max(0, i - 1 - (i % 3)) % list.length]; // one from 1-3 days ago
  return { today, review: back && back.id !== today.id ? back : null };
}

/** The Arena's "Which key?" moves (29 Oct 2026): from HER ladder (list = the os's ladder), the ones she has proved first,
 *  topped up from the start of the ladder, never far ahead. `shuffle(arr, n, rnd)` picks n at random. */
export function pickKeys(list, proved, n, rnd, shuffle) {
  const take = shuffle || ((arr, k) => arr.slice(0, k));
  const usable = list.filter((s) => !/,/.test(s.keys)); // "Win, type terminal, Enter" is a sequence, not one press
  const mine = usable.filter((s) => proved.has(s.id));
  const early = usable.filter((s) => !proved.has(s.id)).slice(0, Math.max(0, n - mine.length) + 2);
  return [...take(mine, Math.min(n, mine.length), rnd), ...take(early, Math.max(0, n - mine.length), rnd)].slice(0, n);
}

/** What the browser may see: never the accepted answers. */
export const pub = (s) => (s ? { id: s.id, does: s.does, where: s.where, what: s.what || null, tip: s.tip || null, first: s.keys.split(/[+ ]/)[0] } : null);
