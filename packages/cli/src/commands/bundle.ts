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
// Mini Course Generator's hosted Workers AI proxy. Used by default so `edu-role-play bundle`
// works out of the box with no API key required. Power users can override with
// --proxy-url / EDU_ROLE_PLAY_PROXY_URL, or bypass entirely with --api-key + --account-id.
const DEFAULT_PROXY_URL = "https://erp-proxy.eren-be8.workers.dev";

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
  const model = opts.model ?? DEFAULT_MODEL;
  const explicitKey = opts.apiKey ?? process.env.EDU_ROLE_PLAY_API_KEY ?? "";
  const explicitProxy = opts.proxyUrl ?? process.env.EDU_ROLE_PLAY_PROXY_URL ?? "";

  let config: {
    provider: string;
    apiKey: string;
    accountId: string;
    model: string;
    baseUrl?: string;
  };

  if (explicitKey) {
    // Direct-Cloudflare mode: user supplied a key, bake it in and skip the proxy.
    const accountId = opts.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
    if (!accountId) {
      console.error("Missing --account-id (or CLOUDFLARE_ACCOUNT_ID env var).");
      return 1;
    }
    config = { provider, apiKey: explicitKey, accountId, model };
  } else {
    // Proxy mode (default). The Worker holds the Cloudflare token.
    const proxyUrl = explicitProxy || DEFAULT_PROXY_URL;
    config = { provider, apiKey: "", accountId: "", model, baseUrl: proxyUrl };
    if (explicitProxy) {
      console.log(`Bundling with proxy: ${proxyUrl} (Cloudflare key not baked).`);
    } else {
      console.log(
        `Bundling with default Mini Course Generator proxy. Pass --api-key + --account-id for a direct-Cloudflare bundle, or --proxy-url to use your own proxy.`,
      );
    }
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
  if (explicitKey) {
    console.log(
      `Warning: the API key is embedded in source. Use a workspace-scoped key with tight rate limits.`,
    );
  }
  return 0;
}
