import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { portraitsDir, runtimeIifePath } from "../paths.js";
import { recordBundle } from "../registry.js";
import { readUserConfig } from "../config.js";

const DEFAULT_AVATAR = "middle-aged-man-friendly";

// Public shared proxy hosted by edu-role-play. Rate-limited and intended for
// trial / iteration. Run `edu-role-play deploy-proxy` for your own before
// sharing or using your own API key.
const DEFAULT_PROXY_URL = "https://erp-proxy.eren-be8.workers.dev";

// Remove the "isn't bundled yet" fallback notice and its scoped CSS from the
// bundled output. The fallback is meant to render only when someone opens the
// raw .erp source — leaving it in the bundled HTML makes it flash before the
// runtime mounts (or persist if the runtime fails to load), making a working
// bundle look broken.
function stripFallback(html: string): string {
  let out = html;
  // Drop the fallback element (with surrounding whitespace).
  out = out.replace(
    /[ \t]*<div\b[^>]*\bdata-erp-fallback\b[^>]*>[\s\S]*?<\/div>[ \t]*\n?/gi,
    "",
  );
  // Drop CSS rules referencing [data-erp-fallback]. We operate only inside
  // <style> blocks and rebuild the body by dropping each top-level rule whose
  // selector contains the attribute (handles both the ":not([data-erp-fallback])"
  // hide-everything rule and the notice-styling rules).
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (match, open: string, body: string, close: string) => {
      const cleaned = stripFallbackRules(body);
      return `${open}${cleaned}${close}`;
    },
  );
  return out;
}

function stripFallbackRules(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const braceOpen = css.indexOf("{", i);
    if (braceOpen === -1) {
      out += css.slice(i);
      break;
    }
    const braceClose = css.indexOf("}", braceOpen + 1);
    if (braceClose === -1) {
      out += css.slice(i);
      break;
    }
    const selector = css.slice(i, braceOpen);
    const rule = css.slice(i, braceClose + 1);
    if (selector.includes("[data-erp-fallback]")) {
      // Skip this rule and any single trailing newline so we don't leave a
      // run of blank lines behind.
      let skip = braceClose + 1;
      if (css[skip] === "\n") skip += 1;
      i = skip;
      continue;
    }
    out += rule;
    i = braceClose + 1;
  }
  return out;
}

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

  const explicit = (
    opts.proxyUrl ??
    process.env.EDU_ROLE_PLAY_PROXY_URL ??
    readUserConfig().proxyUrl ??
    ""
  ).trim();
  const baseUrl = explicit || DEFAULT_PROXY_URL;
  const usingDefault = !explicit;

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

  console.log(`Bundling with proxy: ${baseUrl}${usingDefault ? " (shared default)" : ""}`);
  if (usingDefault) {
    console.log("Run `edu-role-play deploy-proxy` to use your own API key before packaging a SCORM zip.");
  }

  const runtimeJs = readFileSync(runtimeIifePath(), "utf8");
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");

  const injection =
    `<script type="application/json" id="edu-role-play-config">${configJson}</script>\n` +
    `<script>${runtimeJs}</script>\n`;

  const htmlWithAvatar = inlineAvatar(stripFallback(html), comp.persona.avatar);

  let output: string;
  if (/<\/body>/i.test(htmlWithAvatar)) {
    output = htmlWithAvatar.replace(/<\/body>/i, () => `${injection}</body>`);
  } else {
    output = htmlWithAvatar + "\n" + injection;
  }

  return { path, id: comp.id || file, output };
}

export function bundleCommand(file: string, opts: BundleOptions): number {
  const bundled = buildBundledHtml(file, opts);
  if (!bundled) return 1;
  const defaultOut = bundled.path.endsWith(".erp")
    ? bundled.path.replace(/\.erp$/, ".html")
    : bundled.path.replace(/\.html$/, ".bundled.html");
  const outPath = resolve(process.cwd(), opts.output ?? defaultOut);
  writeFileSync(outPath, bundled.output, "utf8");
  const hash = recordBundle(bundled.id, bundled.path, outPath, bundled.output);
  console.log(`Bundled ${bundled.path} → ${outPath} (hash ${hash}).`);
  const rel = relative(process.cwd(), outPath) || outPath;
  console.log("");
  console.log("Open in your browser:");
  console.log(`  open ${rel}`);
  console.log("Or let the CLI open it for you:");
  console.log(`  npx edu-role-play start ${rel}`);
  console.log("Or package for your LMS as a SCORM 1.2 zip:");
  console.log(`  npx edu-role-play scorm ${rel}`);
  return 0;
}
