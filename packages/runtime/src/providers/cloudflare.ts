import type { ChatMessage, Provider, RuntimeConfig } from "../types";

export function createCloudflareProvider(config: RuntimeConfig): Provider {
  if (!config.accountId) {
    throw new Error(
      "Cloudflare provider requires accountId. Re-bundle with --account-id.",
    );
  }
  const { accountId, apiKey, model, baseUrl } = config;
  const origin = baseUrl ?? "https://api.cloudflare.com";
  const url = `${origin}/client/v4/accounts/${accountId}/ai/run/${model}`;

  return {
    async chat(messages, opts) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: 512,
        }),
      });
      if (!res.ok) {
        throw new Error(`Cloudflare AI ${res.status}: ${await res.text()}`);
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
