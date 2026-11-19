import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError, newId } from "../../../lib/guard";
import { buildArena, publicRounds, scoreRound, isArenaDay, ARENA_MINUTES } from "../../../lib/arena";

export const runtime = "nodejs";

/** GET: today's arena (started or not). POST {start:true} | {id, round, answers, seconds} | {id, finish:true}. All scoring here. */
export async function GET() {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    const rows = await q("SELECT id, rounds, results, score, done FROM arena WHERE day = (now() AT TIME ZONE 'Asia/Dhaka')::date ORDER BY id DESC LIMIT 1");
    const best = await q("SELECT MAX(score)::int AS best, COUNT(DISTINCT day) FILTER (WHERE done)::int AS days FROM arena");
    const r = rows[0];
    return NextResponse.json({ arenaDay: isArenaDay(), minutes: ARENA_MINUTES, best: best[0]?.best || 0, days: best[0]?.days || 0,
      today: r ? { id: r.id, rounds: publicRounds(r.rounds), results: r.results || {}, score: r.score, done: r.done } : null });
  } catch (e) { return NextResponse.json(safeError(e, "arena"), { status: 500 }); }
}

export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }

    // 29 Oct 2026 (review 01 H3): the Arena opens only on a game day, and only ONE game a day: once today's game is
    // finished, start returns it (done:true) instead of a new one. XP and badges count game days (lib/rewards.js).
    if (b.start) {
      if (!isArenaDay()) return NextResponse.json({ error: "not a game day" }, { status: 400 });
      const open = await q("SELECT id, rounds, results, score, done FROM arena WHERE day = (now() AT TIME ZONE 'Asia/Dhaka')::date ORDER BY done ASC, started_at DESC LIMIT 1");
      if (open.length) return NextResponse.json({ id: open[0].id, rounds: publicRounds(open[0].rounds), results: open[0].results || {}, done: !!open[0].done, score: open[0].score });
      const rounds = await buildArena();
      const id = newId();
      await q("INSERT INTO arena (id, day, rounds, results, score) VALUES ($1, (now() AT TIME ZONE 'Asia/Dhaka')::date, $2, '{}', 0)", [id, JSON.stringify(rounds)]);
      return NextResponse.json({ id, rounds: publicRounds(rounds), results: {} });
    }

    const rows = await q("SELECT * FROM arena WHERE id=$1 AND NOT done", [String(b.id || "").slice(0, 64)]);
    if (!rows.length) return NextResponse.json({ error: "no such arena" }, { status: 400 });
    const a = rows[0];

    if (b.round) {
      const round = a.rounds.find((r) => r.id === String(b.round));
      if (!round) return NextResponse.json({ error: "no such round" }, { status: 400 });
      const results = a.results || {};
      if (results[round.id]) return NextResponse.json({ error: "already played" }, { status: 400 });
      const s = scoreRound(round, b.answers, Number(b.seconds) || round.seconds);
      results[round.id] = { points: s.points, max: s.max, bonus: s.bonus, seconds: Math.round(Number(b.seconds) || round.seconds) };
      const score = Object.values(results).reduce((t, r) => t + r.points, 0);
      await q("UPDATE arena SET results=$2, score=$3 WHERE id=$1", [a.id, JSON.stringify(results), score]);
      return NextResponse.json({ ok: true, result: results[round.id], detail: s.detail, score });
    }

    if (b.finish) {
      const score = Object.values(a.results || {}).reduce((t, r) => t + r.points, 0);
      const played = Object.keys(a.results || {}).length;
      if (played < 1) return NextResponse.json({ error: "play a round first" }, { status: 400 });
      // Claimed atomically: two finish calls cannot both write the journal line.
      const fin = await q("UPDATE arena SET done=true, score=$2, finished_at=now() WHERE id=$1 AND NOT done RETURNING id", [a.id, score]);
      if (!fin.length) return NextResponse.json({ error: "no such arena" }, { status: 400 });
      await q("INSERT INTO journal (kind, title, body) VALUES ('arena', $1, $2)", [`Arena: ${score} points`, `${played} rounds`]).catch(() => {});
      const best = await q("SELECT MAX(score)::int AS best FROM arena WHERE done");
      return NextResponse.json({ ok: true, score, best: best[0]?.best || score, newBest: score >= (best[0]?.best || 0) });
    }
    return NextResponse.json({ error: "nothing to do" }, { status: 400 });
  } catch (e) { return NextResponse.json(safeError(e, "arena"), { status: 500 }); }
}
