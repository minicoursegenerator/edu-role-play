// Provider strategies for the edu-role-play proxy Worker.
//
// Selection (highest precedence first):
//   ANTHROPIC_API_KEY secret → callAnthropic / streamAnthropic
//   OPENAI_API_KEY secret    → callOpenAi    / streamOpenAi
//   else                     → callWorkersAi / streamWorkersAi (env.AI binding)
//
// Non-streaming variants return a normalized string. Streaming variants
// return an AsyncIterable<string> of incremental text deltas — the index
// handler re-emits these as SSE `data: {"text": "<delta>"}` events.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderInput {
  messages: ChatMessage[];
  model?: string;
  temperature: number;
  maxTokens: number;
}

export interface WorkersAiBinding {
  run: (
    model: string,
    input: unknown,
  ) => Promise<{ response?: string } | ReadableStream<Uint8Array>>;
}

const DEFAULT_WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export async function callWorkersAi(ai: WorkersAiBinding, input: ProviderInput): Promise<string> {
  const model = input.model || DEFAULT_WORKERS_AI_MODEL;
  const result = await ai.run(model, {
    messages: input.messages,
    temperature: input.temperature,
    max_tokens: input.maxTokens,
  });
  if (result instanceof ReadableStream) return "";
  return typeof result.response === "string" ? result.response.trim() : "";
}

export async function callAnthropic(apiKey: string, input: ProviderInput): Promise<string> {
  const { system, messages } = splitSystem(input.messages);
  const body: Record<string, unknown> = {
    model: input.model || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`anthropic ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
  const block = data.content?.find((c) => c.type === "text");
  return typeof block?.text === "string" ? block.text.trim() : "";
}

export async function callOpenAi(apiKey: string, input: ProviderInput): Promise<string> {
  const body = {
    model: input.model || DEFAULT_OPENAI_MODEL,
    messages: input.messages,
    temperature: input.temperature,
    max_tokens: input.maxTokens,
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`openai ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  return typeof text === "string" ? text.trim() : "";
}

export async function* streamAnthropic(
  apiKey: string,
  input: ProviderInput,
): AsyncGenerator<string> {
  const { system, messages } = splitSystem(input.messages);
  const body: Record<string, unknown> = {
    model: input.model || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    messages,
    stream: true,
  };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`anthropic ${res.status}: ${detail.slice(0, 200)}`);
  }
  for await (const payload of sseLines(res.body)) {
    let evt: {
      type?: string;
      delta?: { type?: string; text?: string };
      error?: { message?: string };
    };
    try {
      evt = JSON.parse(payload);
    } catch {
      continue;
    }
    if (evt.error) throw new Error(`anthropic stream: ${evt.error.message ?? "unknown"}`);
    if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
      const t = evt.delta.text;
      if (t) yield t;
    }
  }
}

export async function* streamOpenAi(apiKey: string, input: ProviderInput): AsyncGenerator<string> {
  const body = {
    model: input.model || DEFAULT_OPENAI_MODEL,
    messages: input.messages,
    temperature: input.temperature,
    max_tokens: input.maxTokens,
    stream: true,
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`openai ${res.status}: ${detail.slice(0, 200)}`);
  }
  for await (const payload of sseLines(res.body)) {
    if (payload === "[DONE]") return;
    let evt: { choices?: Array<{ delta?: { content?: string } }> };
    try {
      evt = JSON.parse(payload);
    } catch {
      continue;
    }
    const delta = evt.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta) yield delta;
  }
}

export async function* streamWorkersAi(
  ai: WorkersAiBinding,
  input: ProviderInput,
): AsyncGenerator<string> {
  const model = input.model || DEFAULT_WORKERS_AI_MODEL;
  const result = await ai.run(model, {
    messages: input.messages,
    temperature: input.temperature,
    max_tokens: input.maxTokens,
    stream: true,
  });
  if (!(result instanceof ReadableStream)) {
    if (result && typeof result.response === "string" && result.response) {
      yield result.response;
    }
    return;
  }
  for await (const payload of sseLines(result)) {
    if (payload === "[DONE]") return;
    let evt: { response?: string };
    try {
      evt = JSON.parse(payload);
    } catch {
      continue;
    }
    if (typeof evt.response === "string" && evt.response) yield evt.response;
  }
}

function splitSystem(messages: ChatMessage[]): {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const conv = messages
    .filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, messages: conv };
}

async function* sseLines(body: ReadableStream<Uint8Array> | null): AsyncGenerator<string> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trimStart();
        if (!payload) continue;
        yield payload;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
