// edu-role-play default proxy.
//
// Default bundles POST chat turns here so they work without the user
// supplying an API key. The Worker calls Cloudflare Workers AI through the
// env.AI binding, so no token or account id is held anywhere — auth is the
// binding itself. Per-IP rate limiting protects the daily Worker quota.
//
// Endpoint:
//   POST /v1/chat
//   { messages: [{role,content}, ...], model?: string,
//     temperature?: number, maxTokens?: number }
//   → 200 { text: string }
//   → 4xx/5xx { error: string, code?: string }
//
// Request bodies are never logged — they contain learner transcripts.

interface AiRunResult {
  response?: string;
}

interface Env {
  AI: { run: (model: string, input: unknown) => Promise<AiRunResult> };
  RL: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
}

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_TOKENS_CAP = 1024;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(status: number, body: unknown): Response {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages?: unknown;
  model?: unknown;
  temperature?: unknown;
  maxTokens?: unknown;
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const out: ChatMessage[] = [];
  for (const m of value) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "system" && role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    out.push({ role, content });
  }
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/v1/chat") {
      return json(404, { error: "not found" });
    }

    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const rl = await env.RL.limit({ key: ip });
    if (!rl.success) {
      return json(429, { error: "rate limit exceeded, try again shortly", code: "rate_limited" });
    }

    let body: ChatRequest;
    try {
      body = (await request.json()) as ChatRequest;
    } catch {
      return json(400, { error: "invalid json body" });
    }

    const messages = parseMessages(body.messages);
    if (!messages) {
      return json(400, { error: "messages must be a non-empty array of {role, content}" });
    }

    const model = typeof body.model === "string" && body.model ? body.model : DEFAULT_MODEL;
    const temperature =
      typeof body.temperature === "number" && Number.isFinite(body.temperature)
        ? Math.max(0, Math.min(2, body.temperature))
        : 0.7;
    const requestedMax =
      typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)
        ? Math.floor(body.maxTokens)
        : 512;
    const maxTokens = Math.max(16, Math.min(MAX_TOKENS_CAP, requestedMax));

    try {
      const result = await env.AI.run(model, { messages, temperature, max_tokens: maxTokens });
      const text = typeof result.response === "string" ? result.response.trim() : "";
      if (!text) return json(502, { error: "upstream returned empty response" });
      return json(200, { text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return json(502, { error: `upstream error: ${message}`, code: "upstream_error" });
    }
  },
};
