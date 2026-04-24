import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { runtimeIifePath } from "../paths.js";
import { recordBundle } from "../registry.js";

interface BundleOptions {
  output?: string;
  model?: string;
  gatewayUrl?: string;
  skipLint?: boolean;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
// Mini Course Generator backend gateway. Bundled HTML posts to
// `${GATEWAY_URL}/api/edu-role-play/chat`; the backend holds the provider key.
// Override with --gateway-url / EDU_ROLE_PLAY_GATEWAY_URL (e.g. staging).
const DEFAULT_GATEWAY_URL = "https://gateway.minicoursegenerator.com";

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

  const model = opts.model ?? DEFAULT_MODEL;
  const explicitGateway = opts.gatewayUrl ?? process.env.EDU_ROLE_PLAY_GATEWAY_URL ?? "";
  const baseUrl = explicitGateway || DEFAULT_GATEWAY_URL;

  const config = {
    provider: "mcg" as const,
    apiKey: "",
    accountId: "",
    model,
    baseUrl,
    bundleId: comp.id || undefined,
  };

  if (explicitGateway) {
    console.log(`Bundling with gateway: ${baseUrl}`);
  } else {
    console.log(
      `Bundling with Mini Course Generator gateway. Pass --gateway-url to use a different backend.`,
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
