import type { ChatMessage, ChatOpts, Provider, RuntimeConfig } from "../types";
import { collectStream, sseEvents } from "./sse";

// Self-hosted proxy provider used by default bundles. The proxy holds no
// API key — it forwards to Cloudflare Workers AI via the env.AI binding.
// See packages/proxy-worker for the server side.
//
// Contract:
//   POST {baseUrl}/v1/chat
//   non-stream: body { messages, model?, temperature?, maxTokens? } → 200 { text }
//   stream:    Accept: text/event-stream → SSE events of shape { text: <delta> }
//   err:       { error: string, code?: string }
export function createProxyProvider(config: RuntimeConfig): Provider {
  const { model, baseUrl } = config;
  if (!baseUrl) {
    throw new Error("Proxy provider requires baseUrl in the bundled config.");
  }
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/chat`;

  function buildBody(messages: ChatMessage[], opts: ChatOpts | undefined, stream: boolean) {
    const body: Record<string, unknown> = {
      messages,
      temperature: opts?.temperature ?? 0.7,
      maxTokens: 512,
    };
    if (model) body.model = model;
    if (stream) body.stream = true;
    return body;
  }

  async function* streamFn(messages: ChatMessage[], opts?: ChatOpts): AsyncGenerator<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(buildBody(messages, opts, true)),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const errBody = (await res.json()) as { error?: string };
        detail = errBody.error ?? "";
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(`Proxy ${res.status}: ${detail || res.statusText}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/event-stream")) {
      // Older proxy worker that doesn't speak SSE — fall back to JSON body.
      const data = (await res.json()) as { text?: string };
      if (typeof data.text === "string") yield data.text;
      return;
    }
    for await (const payload of sseEvents(res)) {
      let evt: { text?: string; error?: string };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.error) throw new Error(`Proxy stream error: ${evt.error}`);
      if (evt.text) yield evt.text;
    }
  }

  return {
    chatStream: streamFn,
    async chat(messages, opts) {
      return collectStream(streamFn(messages, opts));
    },
  };
}
