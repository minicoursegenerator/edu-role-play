import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { runtimeIifePath } from "../paths.js";
import { recordBundle } from "../registry.js";

interface BundleOptions {
  output?: string;
  provider?: string;
  apiKey?: string;
  accountId?: string;
  model?: string;
  proxyUrl?: string;
  skipLint?: boolean;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export function bundleCommand(file: string, opts: BundleOptions): number {
  const path = resolve(process.cwd(), file);
  const html = readFileSync(path, "utf8");
  const comp = parseComposition(html);

  if (!opts.skipLint) {
    const issues = lint(comp);
    for (const issue of issues) {
      const tag = issue.severity === "error" ? "error" : "warn";
      console.log(`${path}: ${tag} ${issue.rule}: ${issue.message}`);
    }
    if (hasErrors(issues)) {
      console.error("Lint errors — bundle aborted. Pass --skip-lint to force.");
      return 1;
    }
  }

  const provider = opts.provider ?? "cloudflare";
  if (provider !== "cloudflare") {
    console.error(`Unknown provider: ${provider}. Only 'cloudflare' is supported in v1.`);
    return 1;
  }
  const proxyUrl = opts.proxyUrl ?? process.env.EDU_ROLE_PLAY_PROXY_URL ?? "";
  const model = opts.model ?? DEFAULT_MODEL;

  let config: {
    provider: string;
    apiKey: string;
    accountId: string;
    model: string;
    baseUrl?: string;
  };

  if (proxyUrl) {
    // Proxy mode: the Worker holds the Cloudflare token and account ID.
    // Bundle ships neither; runtime calls `${proxyUrl}/ai/run/<model>`.
    config = { provider, apiKey: "", accountId: "", model, baseUrl: proxyUrl };
    console.log(`Bundling with proxy: ${proxyUrl} (Cloudflare key not baked).`);
  } else {
    const apiKey = opts.apiKey ?? process.env.EDU_ROLE_PLAY_API_KEY ?? "";
    const accountId = opts.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
    if (!apiKey) {
      console.error(
        "Missing --api-key (or EDU_ROLE_PLAY_API_KEY env var). Alternatively, set EDU_ROLE_PLAY_PROXY_URL to use a Worker proxy.",
      );
      return 1;
    }
    if (!accountId) {
      console.error("Missing --account-id (or CLOUDFLARE_ACCOUNT_ID env var).");
      return 1;
    }
    config = { provider, apiKey, accountId, model };
  }

  const runtimeJs = readFileSync(runtimeIifePath(), "utf8");
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");

  const injection =
    `<script type="application/json" id="edu-role-play-config">${configJson}</script>\n` +
    `<script>${runtimeJs}</script>\n`;

  let output: string;
  if (/<\/body>/i.test(html)) {
    output = html.replace(/<\/body>/i, `${injection}</body>`);
  } else {
    output = html + "\n" + injection;
  }

  const outPath = resolve(process.cwd(), opts.output ?? path.replace(/\.html$/, ".bundled.html"));
  writeFileSync(outPath, output, "utf8");
  const hash = recordBundle(comp.id || file, path, outPath, output);
  console.log(`Bundled ${path} → ${outPath} (hash ${hash}).`);
  if (!proxyUrl) {
    console.log(
      `Warning: the API key is embedded in source. Use a workspace-scoped key with tight rate limits, or set EDU_ROLE_PLAY_PROXY_URL to route through a Worker proxy.`,
    );
  }
  return 0;
}
