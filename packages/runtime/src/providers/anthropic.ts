import type { ChatMessage, ChatOpts, Provider, RuntimeConfig } from "../types";
import { collectStream, sseEvents } from "./sse";

export function createAnthropicProvider(config: RuntimeConfig): Provider {
  const { apiKey, model, baseUrl } = config;
  const origin = baseUrl ?? "https://api.anthropic.com";
  const url = `${origin}/v1/messages`;

  async function* stream(messages: ChatMessage[], opts?: ChatOpts): AsyncGenerator<string> {
    const { system, conversation } = splitSystem(messages);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        system: system || undefined,
        messages: conversation,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: 512,
        stream: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic ${res.status}: ${redact(body, apiKey)}`);
    }
    for await (const payload of sseEvents(res)) {
      let evt: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.error) throw new Error(`Anthropic error: ${evt.error.message ?? "unknown"}`);
      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
        const text = evt.delta.text;
        if (text) yield text;
      }
    }
  }

  return {
    chatStream: stream,
    async chat(messages, opts) {
      return collectStream(stream(messages, opts));
    },
  };
}

function splitSystem(messages: ChatMessage[]): {
  system: string;
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const systemParts: string[] = [];
  const conversation: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      conversation.push({ role: m.role, content: m.content });
    }
  }
  return { system: systemParts.join("\n\n"), conversation };
}

function redact(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[redacted]");
}
