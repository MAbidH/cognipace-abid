/* The model client (19 Nov 2026). Faiza's instance talks to Anthropic through the official SDK, exactly as before.
   The second instance (cognipace-abid) can point at any OpenAI-compatible endpoint instead - NVIDIA's free NIM APIs
   (https://integrate.api.nvidia.com/v1) - with the SAME surface the routes use: client.messages.create(params, opts)
   returning { content: [{type:'text', text}], usage, stop_reason }, and client.messages.stream(params) returning an
   async iterable of { type:'content_block_delta', delta:{type:'text_delta', text} } events with .finalMessage().
   Env: LLM_PROVIDER = "anthropic" (default) | "openai" (any OpenAI-compatible /chat/completions);
        LLM_BASE_URL (openai only; e.g. https://integrate.api.nvidia.com/v1); LLM_API_KEY (openai only; falls back to
        ANTHROPIC_API_KEY so one env name works for either). The model id still comes from calendar.json tutorModel.
   cache_control blocks and image blocks are translated; a model without vision simply errors on a screenshot turn
   and the tutor route reports it like any other API error. */
import Anthropic from "@anthropic-ai/sdk";

/* ---------- translation Anthropic Messages -> OpenAI chat.completions ---------- */
const textOfBlocks = (c) => (typeof c === "string" ? c : (c || []).filter((b) => b.type === "text").map((b) => b.text).join("\n\n"));

function toOpenAIContent(content) {
  if (typeof content === "string") return content;
  const parts = [];
  for (const b of content || []) {
    if (b.type === "text") parts.push({ type: "text", text: b.text });
    else if (b.type === "image" && b.source?.type === "base64") parts.push({ type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } });
  }
  return parts.every((p) => p.type === "text") ? parts.map((p) => p.text).join("\n\n") : parts;
}

export function toOpenAIParams(params) {
  const messages = [];
  const sys = textOfBlocks(params.system);
  if (sys) messages.push({ role: "system", content: sys });
  for (const m of params.messages || []) messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: toOpenAIContent(m.content) });
  const out = { model: params.model, messages, max_tokens: params.max_tokens || 1024, temperature: params.temperature ?? 0.4 };
  if (params.stop_sequences?.length) out.stop = params.stop_sequences;
  return out;
}

const stopReason = (fr) => (fr === "length" ? "max_tokens" : fr === "stop" || fr == null ? "end_turn" : String(fr));
const usageOf = (u) => ({ input_tokens: Number(u?.prompt_tokens) || 0, output_tokens: Number(u?.completion_tokens) || 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });

class ApiError extends Error {
  constructor(status, body) { super(`${status} ${String(body || "").slice(0, 300)}`); this.status = status; }
}

class OpenAICompatible {
  constructor(cfg) { this.cfg = cfg; this.messages = { create: (p, o) => this.create(p, o), stream: (p, o) => this.stream(p, o) }; }

  async fetch(body, opts = {}, stream = false) {
    const timeout = opts.timeout || this.cfg.timeout, retries = opts.maxRetries ?? this.cfg.maxRetries;
    let last;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeout);
      try {
        const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
          method: "POST", signal: ctl.signal,
          headers: { "content-type": "application/json", accept: stream ? "text/event-stream" : "application/json", authorization: `Bearer ${this.cfg.apiKey}` },
          body: JSON.stringify({ ...body, stream }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const e = new ApiError(res.status, text);
          if ((res.status === 429 || res.status >= 500) && attempt < retries) { last = e; await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); continue; }
          throw e;
        }
        return res;
      } catch (e) {
        if (e instanceof ApiError) throw e;
        last = e; if (attempt >= retries) throw e;
      } finally { clearTimeout(timer); }
    }
    throw last;
  }

  async create(params, opts) {
    const res = await this.fetch(toOpenAIParams(params), opts, false);
    const j = await res.json();
    const ch = j.choices?.[0] || {};
    const text = ch.message?.content ?? "";
    return { id: j.id, model: j.model || params.model, role: "assistant", content: [{ type: "text", text: typeof text === "string" ? text : textOfBlocks(text) }], stop_reason: stopReason(ch.finish_reason), usage: usageOf(j.usage) };
  }

  stream(params, opts) {
    const self = this;
    let text = "", finish = null, usage = null, model = params.model;
    let done, fail; const finalP = new Promise((r, j) => { done = r; fail = j; });
    const iter = (async function* () {
      try {
        const res = await self.fetch(toOpenAIParams(params), opts, true);
        const reader = res.body.getReader(); const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            let j; try { j = JSON.parse(data); } catch { continue; }
            if (j.model) model = j.model;
            if (j.usage) usage = j.usage;
            const ch = j.choices?.[0];
            const delta = ch?.delta?.content;
            if (ch?.finish_reason) finish = ch.finish_reason;
            if (typeof delta === "string" && delta) { text += delta; yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: delta } }; }
          }
        }
        done({ id: null, model, role: "assistant", content: [{ type: "text", text }], stop_reason: stopReason(finish), usage: usageOf(usage) });
      } catch (e) { fail(e); throw e; }
    })();
    iter.finalMessage = () => finalP;
    return iter;
  }
}

export const PROVIDER = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

export function makeClient({ timeout = 45000, maxRetries = 1 } = {}) {
  if (PROVIDER !== "openai") return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout, maxRetries });
  return new OpenAICompatible({
    baseUrl: (process.env.LLM_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, ""),
    apiKey: process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "",
    timeout, maxRetries,
  });
}
