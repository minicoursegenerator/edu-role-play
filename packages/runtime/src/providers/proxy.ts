import type { Provider, RuntimeConfig } from "../types";

// Self-hosted proxy provider used by default bundles. The proxy holds no
// API key — it forwards to Cloudflare Workers AI via the env.AI binding.
// See packages/proxy-worker for the server side.
//
// Contract:
//   POST {baseUrl}/v1/chat
//   body:    { messages, model?, temperature?, maxTokens? }
//   200:     { text: string }
//   err:     { error: string, code?: string }
export function createProxyProvider(config: RuntimeConfig): Provider {
  const { model, baseUrl } = config;
  if (!baseUrl) {
    throw new Error("Proxy provider requires baseUrl in the bundled config.");
  }
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/chat`;

  return {
    async chat(messages, opts) {
      const body: Record<string, unknown> = {
        messages,
        temperature: opts?.temperature ?? 0.7,
        maxTokens: 512,
      };
      if (model) body.model = model; // empty string ⇒ proxy default
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      const data = (await res.json()) as { text?: string };
      if (typeof data.text !== "string") {
        throw new Error("Proxy returned no text field");
      }
      return data.text.trim();
    },
  };
}
