import data from "../curriculum/wonders.json";
import { q } from "./db";
import { dhakaDayIndex } from "./drills";

export const WONDERS = data.wonders;
/** Today's wonder (1 Nov 2026). Fixed for the Dhaka day the first time it is shown (wonders_shown), so it is the same
    all day and a NEW one comes tomorrow even if she never pressed "save" (before this, only a saved wonder moved the
    list on, and "why the sky is blue" came back for a week). Order: security stories on even day numbers and the other
    subjects on odd ones (Abid: "things which will increase her interest in hacking"), each in the order written, never
    one already read or already shown; when a strand is used up, the other; when both are, cycle by day.
    A wonder with showOn (a Dhaka date, "YYYY-MM-DD") is fresh news: it comes first on that day, or on the first day
    after it that has no wonder fixed yet (2 Nov 2026: the Binance robbery). */
export function pickWonder(dayIndex, read, shown, today = "") {
  const seen = (w) => read.has(w.id) || shown.has(w.id);
  const due = today && WONDERS.find((w) => w.showOn && w.showOn <= today && !seen(w));
  if (due) return due;
  const sec = WONDERS.filter((w) => w.cat === "security" && !seen(w));
  const rest = WONDERS.filter((w) => w.cat !== "security" && !seen(w));
  const first = dayIndex % 2 === 0 ? sec : rest, second = dayIndex % 2 === 0 ? rest : sec;
  return first[0] || second[0] || WONDERS[dayIndex % WONDERS.length];
}

export async function todaysWonder() {
  const read = new Set((await q("SELECT wonder_id FROM wonders_read")).map((r) => r.wonder_id));
  const todayRow = await q("SELECT wonder_id FROM wonders_read WHERE (at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date LIMIT 1");
  if (todayRow.length) {
    const w = WONDERS.find((x) => x.id === todayRow[0].wonder_id);
    if (w) return { wonder: w, readToday: true, readCount: read.size };
  }
  const shownRows = await q("SELECT day::text AS day, wonder_id FROM wonders_shown");
  const today = (await q("SELECT ((now() AT TIME ZONE 'Asia/Dhaka')::date)::text AS d"))[0].d;
  const mine = shownRows.find((r) => r.day === today);
  const known = mine && WONDERS.find((w) => w.id === mine.wonder_id);
  if (known) return { wonder: known, readToday: false, readCount: read.size };
  const next = pickWonder(dhakaDayIndex(), read, new Set(shownRows.map((r) => r.wonder_id)), today);
  await q("INSERT INTO wonders_shown (day, wonder_id) VALUES ($1::date, $2) ON CONFLICT (day) DO NOTHING", [today, next.id]);
  const [fixed] = await q("SELECT wonder_id FROM wonders_shown WHERE day = $1::date", [today]);
  return { wonder: WONDERS.find((w) => w.id === fixed?.wonder_id) || next, readToday: false, readCount: read.size };
}
