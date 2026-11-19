/* The page keys, shared by the top bar (server or client), PageKeys (client) and /keys. Plain module, no "use client",
   so a server component can read the list as data. See PageKeys.js for why Alt+Shift+digit (29 Oct 2026). */
export const PAGE_KEYS = [
  ["1", "/", "Map"],
  ["2", "/learn", "Room"],
  ["3", "/rewards", "Rewards"],
  ["4", "/portfolio", "Logbook"],
  ["5", "/keys", "Keys"],
  ["6", "/wonder", "Wonder"],
  ["7", "/arena", "Arena"],
  ["8", "/voice", "My voice"],
  ["9", "/meet", "Meet"],
];
export const keyLabel = (n) => `Alt+Shift+${n}`;
export const keyFor = (href) => PAGE_KEYS.find(([, h]) => h === href)?.[0] || null;
