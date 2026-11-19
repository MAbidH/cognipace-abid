import { NextResponse } from "next/server";
import { isStudent } from "../../../lib/auth";
import { q } from "../../../lib/db";
import { sameOrigin, safeError, logError } from "../../../lib/guard";
import { todaysDrill, drillAccuracy, DRILL_PASS } from "../../../lib/drills";
import { typingToday, shortcutDay, codeLineToday, recentTyping } from "../../../lib/typing";
import { forDay, matches } from "../../../lib/shortcuts";
import { checkCodeLine, exampleFor } from "../../../lib/codelines";
import { gradeMath, mathTarget, wpmTarget } from "../../../lib/mathdrill";
import { dhakaDayIndex } from "../../../lib/drills";
import { answerReview } from "../../../lib/review";

export const runtime = "nodejs";

/**
 * Part 1 — body { keybr: { site } }: a few minutes on keybr/monkeytype, done or not done (an old client's accuracy is ignored).
 * Part 2 — body { drill: { text, seconds } }: the "all the keys" line, checked here character by character.
 * 29 Oct 2026: the warm-up is optional (~5 minutes) and never gates a lesson; it still earns XP and badges.
 */
export async function POST(req) {
  try {
    if (!(await isStudent())) return NextResponse.json({ error: "not signed in" }, { status: 401 });
    if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    let b; try { b = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }

    // 4 Nov 2026: every warm-up request is a presence beat (the typing row keeps only its LAST time, so the required
    // ~15-minute warm-up counted as almost nothing). keybrOpen: she pressed "Open keybr" - the ten minutes there are
    // credited when she ticks it done (one beat every 4 minutes between the two, at most 15 minutes).
    await q("INSERT INTO beats (kind) VALUES ($1)", [Object.keys(b)[0]?.slice(0, 20) || "warmup"]).catch(() => {});
    if (b.keybrOpen) return NextResponse.json({ ok: true });
    // 9 Nov 2026 (practice spine): one answer to one of today's review questions. Graded in lib/review.js; the ladder moves there.
    if (b.review) {
      const r = await answerReview(Number(b.review.i), String(b.review.value ?? "").slice(0, 100));
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      await q("INSERT INTO beats (kind) VALUES ('review')").catch(() => {});
      return NextResponse.json({ ok: true, ...(await typingToday()), verdict: { ok: r.ok, reveal: r.reveal, hint: r.hint } });
    }

    if (b.keybr) {
      // 5 Nov 2026: the "Open keybr" press is looked for within 45 minutes (a 10-minute keybr plus a distraction passed the
      // old 15-minute window and credited nothing); the credited stretch is still at most 15 minutes from that press. With
      // no press at all (keybr already open in another tab), the ten minutes before the tick are credited.
      await q(`INSERT INTO beats (at, kind) SELECT g, 'keybr-time' FROM (SELECT COALESCE(MAX(at), now() - interval '10 minutes') AS o FROM beats WHERE kind='keybrOpen' AND at > now() - interval '45 minutes') x,
               generate_series(x.o + interval '4 minutes', LEAST(now(), x.o + interval '15 minutes'), interval '4 minutes') g`).catch(() => {});
      // 29 Oct 2026: done / not done only. An accuracy number from an older page is accepted and ignored.
      const site = String(b.keybr.site || "").slice(0, 40);
      await q(`INSERT INTO typing (day, done, site) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, true, $1)
               ON CONFLICT (day) DO UPDATE SET done = true, site = EXCLUDED.site, at = now()`, [site]);
      return NextResponse.json({ ok: true, ...(await typingToday()) });
    }

    if (b.drill) {
      const expected = todaysDrill();
      const typed = String(b.drill.text || "").slice(0, 300);
      const secs = Math.max(2, Math.min(600, Number(b.drill.seconds) || 60));
      const acc = drillAccuracy(expected, typed);
      const wpm = Math.round((expected.length / 5) / (secs / 60));
      if (acc < DRILL_PASS) {
        // Show her where it went wrong, never just "no": the first position that differs.
        let at = 0; while (at < expected.length && expected[at] === typed[at]) at++;
        // Three honest tries and the gate opens anyway (8 Oct 2026: a font bug cost her a whole evening at this box).
        // The warm-up is a warm-up; it must never be the reason a session does not happen. The miss is recorded for Abid.
        const f = await q(`INSERT INTO typing (day, done, drill_fails) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, 1)
                           ON CONFLICT (day) DO UPDATE SET drill_fails = COALESCE(typing.drill_fails,0) + 1, at = now() RETURNING drill_fails`);
        const fails = Number(f[0]?.drill_fails || 1);
        if (fails >= 3 && acc >= 60) {
          // 8 Nov 2026 (audit N3): a waived line keeps no speed - wpm here is the full line's length over her time, so a fast
          // 60% try would count as 1.67x her real speed toward speed badges and the 20-wpm gift.
          await q(`UPDATE typing SET drill_done = true, drill_accuracy = $1, drill_wpm = NULL, drill_line = $2, drill_waived = true, at = now() WHERE day = (now() AT TIME ZONE 'Asia/Dhaka')::date`, [acc, expected]);
          await logError("typing:drill-waived", new Error(`drill line passed through after ${fails} tries at ${acc}% (line: ${expected})`), true);
          return NextResponse.json({ ok: true, waived: true, accuracy: acc, wpm: null, ...(await typingToday()) });
        }
        return NextResponse.json({ ok: false, accuracy: acc, need: DRILL_PASS, at, tries: fails });
      }
      await q(`INSERT INTO typing (day, done, drill_done, drill_accuracy, drill_wpm, drill_line) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1, $2, $3)
               ON CONFLICT (day) DO UPDATE SET drill_done = true, drill_accuracy = GREATEST(COALESCE(typing.drill_accuracy,0), EXCLUDED.drill_accuracy), drill_wpm = EXCLUDED.drill_wpm, drill_line = EXCLUDED.drill_line, at = now()`,
        [acc, wpm, expected]);
      const [{ d: tday }] = await q("SELECT to_char((now() AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS d");
      const hist = await recentTyping(); const wt = wpmTarget(tday, hist);
      return NextResponse.json({ ok: true, accuracy: acc, wpm, wpmTarget: wt, speedHit: wpm >= wt, ...(await typingToday()) });
    }

    // Part 6 - the maths fluency drill (3 Nov 2026, lib/mathdrill.js): 20 quick questions, timed. Graded here from the
    // day number. Done after one honest go (it is practice, not a test); the score and the time are kept for Abid, and
    // she sees what she got wrong with the right answer, so she learns the fact.
    if (b.math) {
      const answers = Array.isArray(b.math.answers) ? b.math.answers.slice(0, 40).map((x) => String(x ?? "").slice(0, 20)) : [];
      const secs = Math.max(5, Math.min(1800, Math.round(Number(b.math.seconds) || 0)));
      // 5 Nov 2026: the set she SAW is graded, not the set of the minute she pressed Check - a set started before Dhaka
      // midnight and sent after it is still today's or yesterday's, never a stranger's questions.
      const nowIdx = dhakaDayIndex(), sentIdx = Number(b.math.dayIndex);
      const g = gradeMath(sentIdx === nowIdx - 1 ? sentIdx : nowIdx, answers);
      const [{ d: today }] = await q("SELECT to_char((now() AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS d");
      const target = mathTarget(today, await recentTyping());
      const hit = g.score >= target.score && secs <= target.seconds;
      await q(`INSERT INTO typing (day, done, math_done, math_score, math_seconds, math_tries, math_hit) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1, $2, 1, $3)
               ON CONFLICT (day) DO UPDATE SET math_done = true, math_tries = typing.math_tries + 1, math_hit = typing.math_hit OR EXCLUDED.math_hit,
                 math_score = GREATEST(COALESCE(typing.math_score, 0), EXCLUDED.math_score),
                 math_seconds = CASE WHEN typing.math_seconds IS NULL OR EXCLUDED.math_score > COALESCE(typing.math_score, 0) OR (EXCLUDED.math_score = typing.math_score AND EXCLUDED.math_seconds < typing.math_seconds) THEN EXCLUDED.math_seconds ELSE typing.math_seconds END, at = now()`, [g.score, secs, hit]);
      return NextResponse.json({ ok: true, score: g.score, total: g.total, seconds: secs, wrong: g.wrong.map(({ q: qq, given, a }) => ({ q: qq, given, a })), target, hit, ...(await typingToday()) });
    }

    // Part 5 - the Python line (Abid, 12 Oct 2026). She runs it in her editor; the server checks the printed output and
    // that the code holds the idea. Three honest misses open the gate (recorded), like the typing line: a warm-up never
    // blocks a session. The program she wrote is kept (code_text) - it is one of her thousand programs.
    if (b.codeline) {
      const line = await codeLineToday();
      if (!line) return NextResponse.json({ error: "not yet" }, { status: 400 });
      const code = String(b.codeline.code || "").slice(0, 2000);
      const output = String(b.codeline.output || "").slice(0, 2000);
      const res = checkCodeLine(line, code, output);
      if (!res.ok) {
        const f = await q(`INSERT INTO typing (day, done, code_fails) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, 1)
                           ON CONFLICT (day) DO UPDATE SET code_fails = COALESCE(typing.code_fails,0) + 1, at = now() RETURNING code_fails`);
        const fails = Number(f[0]?.code_fails || 1);
        const printed = output.replace(/\r/g, "").trim();
        // 28 Oct 2026: a program that stopped on an error (26 Oct: a missing colon) is told so, not "it printed Traceback..."
        const errLine = /Error|Traceback/.test(printed) ? printed.split("\n").filter((l) => /Error/.test(l)).pop() : null;
        const why = res.literal ? "You printed the answer as text. Make Python work it out - the idea is " + line.idea + "." : errLine ? `Python stopped with an error: ${errLine.slice(0, 120)}. Read it - it names what is wrong (a missing colon, a name you did not make, quotes). Fix that one thing and run again.` : !res.outputOk ? (printed ? `Your program printed: ${printed.replace(/\n/g, " ⏎ ")} - it should print exactly: ${line.expect.replace(/\n/g, " ⏎ ")} (only that, no other words).` : `Nothing was printed. A program shows its answer with print(...). It should print exactly: ${line.expect.replace(/\n/g, " ⏎ ")}`) : `The code should use ${line.must.trim()} - that is the idea today (${line.idea}).`;
        const example = fails >= 2 ? exampleFor(line) : null;
        if (fails >= 3) {
          await q(`UPDATE typing SET code_done = true, code_waived = true, code_text = $1, at = now() WHERE day = (now() AT TIME ZONE 'Asia/Dhaka')::date`, [code]);
          await logError("typing:code-waived", new Error(`Python line passed through after ${fails} tries (${line.idea}: ${line.ask})`), true);
          return NextResponse.json({ ok: true, waived: true, why, ...(await typingToday()) });
        }
        return NextResponse.json({ ok: false, why, example, tries: fails });
      }
      await q(`INSERT INTO typing (day, done, code_done, code_text) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1)
               ON CONFLICT (day) DO UPDATE SET code_done = true, code_text = EXCLUDED.code_text, at = now()`, [code]);
      await q("INSERT INTO journal (module_id, step_id, kind, title, body) VALUES ('WARMUP', $1, 'codeline', $2, $3)", [`code:${line.idea}`, line.ask.slice(0, 160), code.slice(0, 2000)]).catch(() => {});
      return NextResponse.json({ ok: true, ...(await typingToday()) });
    }

    if (b.vault) {
      const fromMemory = b.vault.fromMemory === true;
      await q(`INSERT INTO typing (day, done, vault_asked, vault_done) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1)
               ON CONFLICT (day) DO UPDATE SET vault_asked = true, vault_done = EXCLUDED.vault_done, at = now()`, [fromMemory]);
      return NextResponse.json({ ok: true, ...(await typingToday()) });
    }

    // Part 3 - today's key move (and one review). She presses it on her laptop, then types which keys. Verified here.
    if (b.shortcut) {
      // The card picks the move with her os (lib/typing.js); the check must use the same list, or after the Linux switch
      // the card would show a Mint move while the server checked a Windows one (19 Oct 2026).
      const osRows = await q(`SELECT value FROM settings WHERE key='os'`).catch(() => []);
      const sc = forDay(await shortcutDay(), osRows?.[0]?.value === "linux" ? "linux" : "windows");
      const which = b.shortcut.review ? sc.review : sc.today;
      if (!which) return NextResponse.json({ error: "nothing to check" }, { status: 400 });
      const typed = String(b.shortcut.answer || "").slice(0, 60);
      const ok = matches(which, typed);
      if (!ok) {
        // A warm-up never blocks a session (7 Oct 2026 rule) - the key move had no way through. 19 Oct 2026: she was stuck on
        // "Jump one whole word". After three honest tries the move is marked done, what she typed is recorded for Abid,
        // and she is shown the keys. 29 Oct 2026 (review 01 L4): the tries are counted HERE (key_fails / review_fails),
        // not taken from the card; an honest miss (not empty, not "?") counts.
        const failCol = b.shortcut.review ? "review_fails" : "key_fails";
        let tries = 0;
        if (typed.trim() && typed.trim() !== "?") {
          const f = await q(`INSERT INTO typing (day, done, ${failCol}) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, 1)
                             ON CONFLICT (day) DO UPDATE SET ${failCol} = COALESCE(typing.${failCol},0) + 1, at = now() RETURNING ${failCol} AS n`);
          tries = Number(f[0]?.n || 1) - 1; // misses before this one, like the old client count
        }
        if (tries >= 2) {
          const col = b.shortcut.review ? "review_done" : "shortcut_done";
          await q(`INSERT INTO typing (day, done, ${col}, shortcut_id) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1)
                   ON CONFLICT (day) DO UPDATE SET ${col} = true, shortcut_id = COALESCE(typing.shortcut_id, EXCLUDED.shortcut_id), at = now()`, [sc.today.id]);
          await logError("typing:key-waived", new Error(`key move ${which.id} passed through after ${tries + 1} tries; last typed "${typed.slice(0, 40)}" (keys: ${which.keys})`), true);
          return NextResponse.json({ ok: true, waived: true, keys: which.keys, ...(await typingToday()) });
        }
        return NextResponse.json({ ok: false, keys: b.shortcut.reveal ? which.keys : undefined });
      }
      const col = b.shortcut.review ? "review_done" : "shortcut_done";
      await q(`INSERT INTO typing (day, done, ${col}, shortcut_id) VALUES ((now() AT TIME ZONE 'Asia/Dhaka')::date, false, true, $1)
               ON CONFLICT (day) DO UPDATE SET ${col} = true, shortcut_id = COALESCE(typing.shortcut_id, EXCLUDED.shortcut_id), at = now()`, [sc.today.id]);
      return NextResponse.json({ ok: true, keys: which.keys, ...(await typingToday()) });
    }

    return NextResponse.json({ error: "nothing to record" }, { status: 400 });
  } catch (e) { return NextResponse.json(safeError(e, "typing"), { status: 500 }); }
}
