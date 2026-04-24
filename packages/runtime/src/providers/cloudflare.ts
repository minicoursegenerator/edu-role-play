import type { Provider, RuntimeConfig } from "../types";

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

  return {
    async chat(messages, opts) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
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
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloudflare AI ${res.status}: ${redact(body, apiKey)}`);
      }
      const data = (await res.json()) as {
        result?: { response?: string };
        success?: boolean;
        errors?: Array<{ message: string }>;
      };
      if (data.success === false) {
        throw new Error(
          `Cloudflare AI error: ${data.errors?.map((e) => e.message).join("; ") ?? "unknown"}`,
        );
      }
      const text = data.result?.response;
      if (typeof text !== "string") {
        throw new Error("Cloudflare AI returned no response text");
      }
      return text.trim();
    },
  };
}

function redact(s: string, key: string): string {
  if (!key) return s;
  return s.split(key).join("[redacted]");
}
