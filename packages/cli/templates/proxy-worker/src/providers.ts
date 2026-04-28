// Provider strategies for the edu-role-play proxy Worker.
//
// Selection (highest precedence first):
//   ANTHROPIC_API_KEY secret → callAnthropic
//   OPENAI_API_KEY secret    → callOpenAI
//   else                     → callWorkersAI (env.AI binding)
//
// All three return a normalized { text } so the runtime side does not change.

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
  run: (model: string, input: unknown) => Promise<{ response?: string }>;
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
  return typeof result.response === "string" ? result.response.trim() : "";
}

export async function callAnthropic(apiKey: string, input: ProviderInput): Promise<string> {
  // Anthropic wants `system` as a top-level field, not a message role.
  const system = input.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const messages = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

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
