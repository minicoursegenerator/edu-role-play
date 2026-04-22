import type { Provider, RuntimeConfig } from "../types";

export function createOpenAIProvider(config: RuntimeConfig): Provider {
  const { apiKey, model, baseUrl } = config;
  const origin = baseUrl ?? "https://api.openai.com";
  const url = `${origin}/v1/chat/completions`;

  return {
    async chat(messages, opts) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: 512,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI ${res.status}: ${redact(body, apiKey)}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };
      if (data.error) {
        throw new Error(`OpenAI error: ${data.error.message ?? "unknown"}`);
      }
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new Error("OpenAI returned no response text");
      }
      return text.trim();
    },
  };
}

function redact(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[redacted]");
}
