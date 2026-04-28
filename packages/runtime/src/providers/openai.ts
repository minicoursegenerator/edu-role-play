import type { ChatMessage, ChatOpts, Provider, RuntimeConfig } from "../types";
import { collectStream, sseEvents } from "./sse";

export function createOpenAIProvider(config: RuntimeConfig): Provider {
  const { apiKey, model, baseUrl } = config;
  const origin = baseUrl ?? "https://api.openai.com";
  const url = `${origin}/v1/chat/completions`;

  async function* stream(messages: ChatMessage[], opts?: ChatOpts): AsyncGenerator<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: 512,
        stream: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI ${res.status}: ${redact(body, apiKey)}`);
    }
    for await (const payload of sseEvents(res)) {
      let evt: {
        choices?: Array<{ delta?: { content?: string } }>;
        error?: { message?: string };
      };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.error) throw new Error(`OpenAI error: ${evt.error.message ?? "unknown"}`);
      const piece = evt.choices?.[0]?.delta?.content;
      if (piece) yield piece;
    }
  }

  return {
    chatStream: stream,
    async chat(messages: ChatMessage[], opts?: ChatOpts) {
      return collectStream(stream(messages, opts));
    },
  };
}

function redact(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[redacted]");
}
