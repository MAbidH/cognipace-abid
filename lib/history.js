/* The conversation the tutor sees is built on the SERVER from the chats table (29 Oct 2026, review 01 H1: the browser's
   messages array was trusted, assistant turns included, so a crafted array could close steps). Only her newest message
   comes from the browser. Pure; tested in scripts/test-server.mjs.

   Cost (review 03 M2): the window moves in CHUNKS, so its first message stays the same for many turns and the prompt
   cache on the history (a cache_control breakpoint on the last stored message) keeps hitting. Old drawings are replaced
   by a short marker - the model does not need the SVG it drew an hour ago. */

export const OPENER = "Hello! I'm here for this step.";
// 31 Oct 2026 (Abid: "the tutor is reading everything and burning tokens"): 40 msgs x 3000 chars (~15k tokens a turn)
// cut to 16 x 1200 (~5k worst case). Older turns are summarised by the step itself: the brief, open parks and her notes.
export const MAX_MSGS = 16, CHUNK = 6, MAX_USER = 1000, MAX_TUTOR = 1200;
// 8 Nov 2026: a numbered manual is 1.5-2.5k characters, so at 1,200 the tutor could not see its own step 6 on the next
// turn ("tell me the step number" broke; it re-asked about a download she had finished). Its LAST TWO messages are kept
// up to MAX_TUTOR_RECENT; older ones stay short. Only the tail changes from turn to turn, so the cached prefix holds.
export const MAX_TUTOR_RECENT = 3500;

const squash = (role, text, recent = false) => String(text || "")
  .replace(/```svg[\s\S]*?```/g, "[a drawing I made]")
  .replace(/```svg[\s\S]*$/, "[a drawing I made]")
  .slice(0, role === "assistant" ? (recent ? MAX_TUTOR_RECENT : MAX_TUTOR) : MAX_USER);

/** rows: [{role:'student'|'tutor', content}] oldest first. newest: her new message (string) or null.
    Returns { messages, stableCount } - messages strictly alternate and start with a user turn; the first stableCount
    of them come from the database (cache breakpoint goes on messages[stableCount-1]). */
export function buildHistory(rows, newest) {
  const roleOf = (r) => (r.role === "student" || r.role === "user" ? "user" : "assistant");
  const tutorIdx = (rows || []).map((r, i) => (roleOf(r) === "assistant" ? i : -1)).filter((i) => i >= 0);
  const recent = new Set(tutorIdx.slice(-2));
  let list = (rows || []).map((r, i) => ({ role: roleOf(r), content: squash(roleOf(r), r.content, recent.has(i)) }));
  if (list.length > MAX_MSGS) {
    const start = Math.ceil((list.length - MAX_MSGS) / CHUNK) * CHUNK;
    list = list.slice(start);
  }
  const out = [];
  const push = (m) => {
    if (!m.content) m = { ...m, content: "(nothing)" };
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1] = { role: m.role, content: (out[out.length - 1].content + "\n\n" + m.content).slice(0, (m.role === "assistant" ? MAX_TUTOR_RECENT : MAX_USER) * 2) };
    else out.push({ ...m });
  };
  for (const m of list) push(m);
  if (out.length && out[0].role === "assistant") out.unshift({ role: "user", content: OPENER });
  const stableCount = out.length;
  const text = String(newest || "").slice(0, MAX_USER) || OPENER;
  if (out.length && out[out.length - 1].role === "user") {
    // The last stored turn is hers with no reply (a failed call): her new words join it, so it is not stable.
    out[out.length - 1] = { role: "user", content: (out[out.length - 1].content + "\n\n" + text).slice(0, MAX_USER * 2) };
    return { messages: out, stableCount: stableCount - 1 };
  }
  out.push({ role: "user", content: text });
  return { messages: out, stableCount };
}

/** Her newest message from a request body: body.text (preferred), else the last user turn of body.messages. */
export function newestFromBody(body) {
  if (typeof body?.text === "string") return body.text.slice(0, MAX_USER);
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i]?.role !== "assistant") return String(msgs[i]?.content ?? "").slice(0, MAX_USER);
  return "";
}

/** Put a cache breakpoint on message i (the last stable one). Mutates a copy; content becomes a block array. */
export function withCacheBreakpoint(messages, i) {
  if (i < 0 || i >= messages.length) return messages;
  return messages.map((m, k) => (k !== i ? m : { role: m.role, content: Array.isArray(m.content) ? m.content.map((c, j, a) => (j === a.length - 1 ? { ...c, cache_control: { type: "ephemeral" } } : c)) : [{ type: "text", text: m.content, cache_control: { type: "ephemeral" } }] }));
}
