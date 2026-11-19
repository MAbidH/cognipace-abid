/** Everything the student sees is in their own time zone (curriculum/student.json; Faiza: Asia/Dhaka), whatever the
    server's clock says. */
import { STUDENT } from "./student.js";
export const TZ = STUDENT.timezone;

/* 19 Nov 2026: "today" in the student's zone, computed with Intl (no fixed +6 h). For Asia/Dhaka (no DST) the result is
   identical to the old `now + 6 h` arithmetic; for the second instance it follows St John's clock, DST included. */
const partsCache = new Map();
function dtf(tz) {
  if (!partsCache.has(tz)) partsCache.set(tz, new Intl.DateTimeFormat("en-GB", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" }));
  return partsCache.get(tz);
}
export function localParts(t = Date.now(), tz = TZ) {
  const o = {};
  for (const p of dtf(tz).formatToParts(new Date(t))) o[p.type] = p.value;
  return { ymd: `${o.year}-${o.month}-${o.day}`, hour: Number(o.hour) % 24, minute: Number(o.minute), weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday) };
}
/** YYYY-MM-DD of a timestamp in the student's zone. */
export const localYmd = (t = Date.now()) => localParts(t).ymd;
/** Days since the epoch, counted at the student's midnight (the drill, the Arena parity, the key-move ladder). */
export const localDayIndex = (t = Date.now()) => Math.floor(Date.UTC(...localParts(t).ymd.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0))) / 86400000);
/** Minutes since the student's midnight. */
export const localMinutes = (t = Date.now()) => { const p = localParts(t); return p.hour * 60 + p.minute; };
/** 0 Sun .. 6 Sat in the student's zone. */
export const localWeekday = (t = Date.now()) => localParts(t).weekday;
export const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
export const fmtDateTime = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const dhakaHour = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date()));
