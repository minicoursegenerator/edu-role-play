import type { Provider, RuntimeConfig } from "../types";

// MCG gateway provider. The bundled HTML talks to the Mini Course Generator
// backend, which holds all provider keys server-side and picks the underlying
// LLM. Contract:
//   POST {baseUrl}/api/edu-role-play/chat
//   body: { model, messages, temperature?, max_tokens?, bundleId? }
//   200:  { text: string }
//   err:  { error: string }
export function createMcgProvider(config: RuntimeConfig): Provider {
  const { model, baseUrl, bundleId } = config;
  if (!baseUrl) {
    throw new Error("MCG provider requires baseUrl in the bundled config.");
  }
  const url = `${baseUrl.replace(/\/+$/, "")}/api/edu-role-play/chat`;

  return {
    async chat(messages, opts) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bundleId) headers["X-ERP-Bundle-Id"] = bundleId;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: 512,
          bundleId,
        }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const body = (await res.json()) as { error?: string };
          detail = body.error ?? "";
        } catch {
          detail = await res.text().catch(() => "");
        }
        throw new Error(`MCG gateway ${res.status}: ${detail || res.statusText}`);
      }
      const data = (await res.json()) as { text?: string };
      if (typeof data.text !== "string") {
        throw new Error("MCG gateway returned no text field");
      }
      return data.text.trim();
    },
  };
}
