import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { runtimeIifePath } from "../paths.js";
import { recordBundle } from "../registry.js";

interface BundleOptions {
  output?: string;
  provider?: string;
  model?: string;
  proxyUrl?: string;
  skipLint?: boolean;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
// Mini Course Generator's hosted Workers AI proxy. Used by default so `edu-role-play bundle`
// works out of the box with no API key required. Power users can override with
// --proxy-url / EDU_ROLE_PLAY_PROXY_URL to route through their own Worker.
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
  const explicitProxy = opts.proxyUrl ?? process.env.EDU_ROLE_PLAY_PROXY_URL ?? "";
  const proxyUrl = explicitProxy || DEFAULT_PROXY_URL;

  const config = { provider, apiKey: "", accountId: "", model, baseUrl: proxyUrl };

  if (explicitProxy) {
    console.log(`Bundling with proxy: ${proxyUrl}`);
  } else {
    console.log(
      `Bundling with default Mini Course Generator proxy. Pass --proxy-url to use your own.`,
    );
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
  return 0;
}
