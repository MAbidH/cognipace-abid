import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import { q } from "../../lib/db";
import Shell from "../../components/Shell";
import { WonderArt } from "../../components/Art";
import NewsRead from "../../components/NewsRead";
import { dailyCap } from "../../lib/calendar";
import { NEWS, NEWS_MADE, newsVideoUrl } from "../../lib/news";

export const dynamic = "force-dynamic";

const fmt = (d) => { try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; } };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

/** THIS WEEK IN THE CYBER WORLD (3 Nov 2026, Abid: "with pictures and videos so that she understands properly"). */
export default async function NewsPage() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins, readRows] = await Promise.all([computeRewards().catch(() => null), minutesToday().catch(() => null), q("SELECT news_id FROM news_read").catch(() => [])]);
  const read = new Set(readRows.map((r) => r.news_id));
  return (
    <Shell active="/news" rw={rw} mins={mins} cap={dailyCap()}>
      <main className="wrap">
        <div className="eyebrow" style={{ color: "var(--cyan)" }}>the cyber world{NEWS_MADE ? ` · updated ${fmt(NEWS_MADE)}` : ""} · {NEWS.filter((n) => read.has(n.id)).length} of {NEWS.length} read</div>
        <h1 style={{ marginTop: 4 }}>This week in the cyber world</h1>
        <p className="soft">Real things that happened - how the door was opened, and how defenders close it. Watch the video, read the story, then think about the question. One or two stories a day is plenty.</p>
        {NEWS.length === 0 && <p className="soft">New stories are on the way.</p>}
        {NEWS.map((n) => {
          const v = n.video && newsVideoUrl(n.video.id);
          return (
            <article key={n.id} className="card newsitem" style={{ marginTop: 16 }}>
              <div className="newshead">
                <div className="newsart"><WonderArt pic={n.pic} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow">{fmt(n.date)}</div>
                  <h2 style={{ margin: "4px 0 6px" }}>{n.title}</h2>
                  <p style={{ margin: 0 }}>{n.what}</p>
                </div>
              </div>
              {v && <div className="media" style={{ marginTop: 12 }}>
                <iframe src={`${v}?playsinline=1&rel=0&modestbranding=1`} title={n.video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
                <div className="small soft" style={{ padding: "6px 10px" }}>{n.video.title}</div>
              </div>}
              {n.how && <p><b>How it happened:</b> {n.how}</p>}
              {n.defence && <p className="hint" style={{ borderLeftColor: "var(--lime)" }}><b>The defence:</b> {n.defence}</p>}
              {n.words?.length > 0 && <p className="small"><b>New words:</b> {n.words.map((w, i) => <span key={i}>{i ? " · " : ""}<b>{w.word}</b> = {w.means}</span>)}</p>}
              {n.think && <p style={{ color: "var(--violet)" }}><b>Think about it:</b> {n.think}</p>}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                <NewsRead id={n.id} read={read.has(n.id)} />
                {n.sources?.length > 0 && <span className="small soft">Where this comes from: {n.sources.slice(0, 3).map((s, i) => <a key={i} href={s} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>{host(s)} ↗</a>)}</span>}
              </div>
            </article>
          );
        })}
        <p className="small soft" style={{ marginTop: 20 }}><a href="/">Back to the map</a></p>
      </main>
    </Shell>
  );
}
