import type { ChatMessage, Provider, RuntimeConfig } from "../types";

export function createAnthropicProvider(config: RuntimeConfig): Provider {
  const { apiKey, model, baseUrl } = config;
  const origin = baseUrl ?? "https://api.anthropic.com";
  const url = `${origin}/v1/messages`;

  return {
    async chat(messages, opts) {
      const { system, conversation } = splitSystem(messages);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          system: system || undefined,
          messages: conversation,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: 512,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic ${res.status}: ${redact(body, apiKey)}`);
      }
      const data = (await res.json()) as {
        content?: Array<{ type?: string; text?: string }>;
        error?: { message?: string };
      };
      if (data.error) {
        throw new Error(`Anthropic error: ${data.error.message ?? "unknown"}`);
      }
      const text = data.content?.find((b) => b.type === "text")?.text;
      if (typeof text !== "string") {
        throw new Error("Anthropic returned no response text");
      }
      return text.trim();
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
