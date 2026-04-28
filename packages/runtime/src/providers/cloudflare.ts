import type { ChatMessage, ChatOpts, Provider, RuntimeConfig } from "../types";
import { collectStream, sseEvents } from "./sse";

export function createCloudflareProvider(config: RuntimeConfig): Provider {
  const { accountId, apiKey, model, baseUrl } = config;
  // Proxy mode: the Worker holds the token + account id. Bundled config has
  // empty apiKey and accountId; calls go to `${baseUrl}/ai/run/<model>` with
  // no Authorization header (the Worker adds its own).
  const proxyMode = !accountId && !apiKey && !!baseUrl;

  if (!proxyMode && !accountId) {
    throw new Error(
      "Cloudflare provider requires an account ID. Supply one via the BYO-key UI.",
    );
  }

  const origin = baseUrl ?? "https://api.cloudflare.com";
  const url = proxyMode
    ? `${origin.replace(/\/+$/, "")}/ai/run/${model}`
    : `${origin}/client/v4/accounts/${accountId}/ai/run/${model}`;

  async function* stream(messages: ChatMessage[], opts?: ChatOpts): AsyncGenerator<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (!proxyMode) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: 512,
        stream: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Cloudflare AI ${res.status}: ${redact(body, apiKey)}`);
    }
    for await (const payload of sseEvents(res)) {
      let evt: { response?: string; errors?: Array<{ message: string }> };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.errors?.length) {
        throw new Error(`Cloudflare AI error: ${evt.errors.map((e) => e.message).join("; ")}`);
      }
      if (evt.response) yield evt.response;
    }
  }

  return {
    chatStream: stream,
    async chat(messages, opts) {
      return collectStream(stream(messages, opts));
    },
  };
}

function redact(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[redacted]");
}
