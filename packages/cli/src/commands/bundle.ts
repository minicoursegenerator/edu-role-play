import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { portraitsDir, runtimeIifePath } from "../paths.js";
import { recordBundle } from "../registry.js";

const DEFAULT_AVATAR = "middle-aged-man-friendly";

function inlineAvatar(html: string, avatarId: string): string {
  const id = avatarId.trim() || DEFAULT_AVATAR;
  if (id.startsWith("data:") || id.startsWith("http")) return html;
  const file = resolve(portraitsDir(), `${id}.jpg`);
  if (!existsSync(file)) {
    console.warn(
      `warn: avatar "${id}" not found in built-in portraits — leaving raw avatar attribute.`,
    );
    return html;
  }
  const data = readFileSync(file).toString("base64");
  const dataUrl = `data:image/jpeg;base64,${data}`;
  // Replace avatar="..." (or insert one) on the first <edu-persona ...>
  return html.replace(/<edu-persona\b([^>]*)>/i, (full, attrs: string) => {
    if (/\bavatar=/.test(attrs)) {
      return `<edu-persona${attrs.replace(/avatar="[^"]*"/, `avatar="${dataUrl}"`)}>`;
    }
    return `<edu-persona${attrs} avatar="${dataUrl}">`;
  });
}

export interface BundleOptions {
  output?: string;
  model?: string;
  proxyUrl?: string;
  skipLint?: boolean;
  scorm?: boolean;
}

export function buildBundledHtml(file: string, opts: BundleOptions): {
  path: string;
  id: string;
  output: string;
} | null {
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
      return null;
    }
  }

  const baseUrl = (opts.proxyUrl ?? process.env.EDU_ROLE_PLAY_PROXY_URL ?? "").trim();
  if (!baseUrl) {
    console.error(
      "Bundle requires a proxy URL. Pass --proxy-url <url> or set EDU_ROLE_PLAY_PROXY_URL.\n" +
        "Deploy your own with `cd packages/proxy-worker && npm run deploy` (see packages/proxy-worker/README.md).",
    );
    return null;
  }

  const model = opts.model ?? "";

  const config = {
    provider: "proxy" as const,
    apiKey: "",
    accountId: "",
    model,
    baseUrl,
    bundleId: comp.id || undefined,
    scorm: { enabled: opts.scorm === true, version: "1.2" as const },
  };

  console.log(`Bundling with proxy: ${baseUrl}`);

  const runtimeJs = readFileSync(runtimeIifePath(), "utf8");
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");

  const injection =
    `<script type="application/json" id="edu-role-play-config">${configJson}</script>\n` +
    `<script>${runtimeJs}</script>\n`;

  const htmlWithAvatar = inlineAvatar(html, comp.persona.avatar);

  let output: string;
  if (/<\/body>/i.test(htmlWithAvatar)) {
    output = htmlWithAvatar.replace(/<\/body>/i, `${injection}</body>`);
  } else {
    output = htmlWithAvatar + "\n" + injection;
  }

  return { path, id: comp.id || file, output };
}

export function bundleCommand(file: string, opts: BundleOptions): number {
  const bundled = buildBundledHtml(file, opts);
  if (!bundled) return 1;
  const outPath = resolve(process.cwd(), opts.output ?? bundled.path.replace(/\.html$/, ".bundled.html"));
  writeFileSync(outPath, bundled.output, "utf8");
  const hash = recordBundle(bundled.id, bundled.path, outPath, bundled.output);
  console.log(`Bundled ${bundled.path} → ${outPath} (hash ${hash}).`);
  return 0;
}
