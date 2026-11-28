"use client";
/* School maths on paper (25 Nov 2026, MATHS-PLAN item 5): the map card. Winter days 25 minutes, term days 20, from her
   school maths book with a pencil; then she photographs the page (the iPad camera opens straight from the button) and
   the tutor checks three answers and asks one "how did you get this?" question. Never a gate; one hand-in a day is the
   habit. The photo is shrunk in the browser (1280 px, JPEG) before it is sent - cheap and quick on Dhaka internet. */
import { useEffect, useRef, useState } from "react";

const shrink = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, 1280 / img.width, 1280 / img.height);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
    } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
  img.src = url;
});

const post = async (body) => {
  const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "paper", ...body }) });
  let j = null; try { j = await r.json(); } catch {}
  return j || { error: "No answer from the school. Try again in a minute." };
};

export default function PaperCard() {
  const [st, setSt] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [why, setWhy] = useState("");
  const [reply, setReply] = useState(null);
  const [err, setErr] = useState("");
  const file = useRef(null);
  const load = () => fetch("/api/paper", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && !j.error) setSt(j); }).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!st || !st.show) return null;

  const handIn = async (f) => {
    if (!f || busy) return;
    setErr(""); setBusy(true);
    try {
      const image = await shrink(f);
      const j = await post({ image, note });
      if (j.error) setErr(j.error);
      else if (j.unreadable) setErr(j.unreadable);
      else if (j.limited) setErr(j.text || "Not now.");
      else { setRes(j); setSt((s) => ({ ...s, today: { id: j.id, pages: j.pages, right: j.right, wrong: j.wrong, question: j.question, answered: false, praise: j.praise, checked: j.checked } })); }
    } catch { setErr("That picture could not be read. Take the photo again - closer, in good light."); }
    setBusy(false);
    if (file.current) file.current.value = "";
  };
  const explain = async () => {
    if (busy || !st.today) return;
    setErr(""); setBusy(true);
    const j = await post({ answerFor: st.today.id, text: why });
    setBusy(false);
    if (j.error) { setErr(j.error); return; }
    setReply(j);
    setSt((s) => ({ ...s, today: { ...s.today, answered: true } }));
  };

  const today = st.today;
  return (
    <section className="card rise" style={{ marginTop: 14, borderColor: "rgba(163, 230, 53, 0.35)" }}>
      <div className="eyebrow">maths on paper · every school day</div>
      <h3 style={{ margin: "2px 0" }}>{st.minutes} minutes from your school maths book - then hand in the page</h3>
      {!today && (
        <>
          <p className="small soft" style={{ margin: "4px 0 8px" }}>Pencil, paper, your book. When the {st.minutes} minutes are up, take a photo of the page (the iPad camera is fine - open this page on the iPad and tap the button). The tutor checks three answers and asks you one question about how you did it.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input className="big-input" style={{ fontSize: 15, maxWidth: 320 }} placeholder="Which chapter or page? (optional)" value={note} onChange={(e) => setNote(e.target.value.slice(0, 160))} />
            <input ref={file} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handIn(e.target.files?.[0])} />
            <button className="btn primary" disabled={busy} onClick={() => file.current?.click()}>{busy ? "Checking the page..." : "📷 Hand in the page"}</button>
          </div>
        </>
      )}
      {today && (
        <div style={{ marginTop: 6 }}>
          <p style={{ margin: "4px 0" }}><b>Handed in today</b>{today.pages ? ` - ${today.pages} page${today.pages === 1 ? "" : "s"}` : ""}: <b style={{ color: "var(--lime)" }}>{today.right} right</b>{today.wrong ? <>, <b>{today.wrong} to look at again</b></> : null} of the three checked.</p>
          {(res?.praise || today.praise) && <p className="small" style={{ margin: "2px 0" }}>{res?.praise || today.praise}</p>}
          {(res?.checked || today.checked || []).length > 0 && <ul className="small" style={{ margin: "4px 0 8px" }}>{(res?.checked || today.checked).map((c, i) => <li key={i}>{c.problem}: you wrote <b>{c.her_answer}</b>{c.right ? <span style={{ color: "var(--lime)" }}> ✓</span> : <> - the answer is <b>{c.correct}</b></>}{c.note ? <span className="soft"> ({c.note})</span> : null}</li>)}</ul>}
          {!today.answered && (
            <>
              <p style={{ margin: "6px 0 4px" }}><b>One question:</b> {today.question}</p>
              <textarea className="big-input" style={{ fontSize: 15, minHeight: 70, width: "100%" }} placeholder="Tell me the steps, in your own words (Bangla words are fine)" value={why} onChange={(e) => setWhy(e.target.value.slice(0, 1500))} />
              <div style={{ marginTop: 6 }}><button className="btn primary" disabled={busy || why.trim().split(/\s+/).length < 3} onClick={explain}>{busy ? "Reading..." : "Send my steps"}</button></div>
            </>
          )}
          {today.answered && <p className="small" style={{ margin: "4px 0", color: "var(--lime)" }}>{reply?.reply || today.verdict || "Your steps are in. Done for today."}</p>}
          {today.answered && !busy && (
            <p className="small soft" style={{ margin: "6px 0 0" }}>Another page today? <input ref={file} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { setRes(null); setReply(null); setWhy(""); handIn(e.target.files?.[0]); }} /><button className="btn quiet" onClick={() => file.current?.click()}>📷 Hand in another</button></p>
          )}
        </div>
      )}
      {err && <p className="hint" style={{ marginTop: 8 }}>{err}</p>}
    </section>
  );
}
