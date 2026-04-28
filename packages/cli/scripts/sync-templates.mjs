#!/usr/bin/env node
// Copies templates from the monorepo into packages/cli/templates/ so they
// ship with the published CLI tarball.
//   - skills/edu-role-play/archetypes/*.html → templates/archetypes/
//   - packages/proxy-worker/{src,wrangler.toml,package.json,tsconfig.json,README.md}
//     → templates/proxy-worker/  (used by `edu-role-play deploy-proxy`)
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(here, "..");
const repoRoot = resolve(cliRoot, "..", "..");

function copyTree(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    const s = resolve(srcDir, name);
    const d = resolve(destDir, name);
    if (statSync(s).isDirectory()) copyTree(s, d);
    else copyFileSync(s, d);
  }
}

// Archetypes
{
  const src = resolve(repoRoot, "skills", "edu-role-play", "archetypes");
  const dest = resolve(cliRoot, "templates", "archetypes");
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src).filter((f) => f.endsWith(".html"));
  for (const f of files) copyFileSync(resolve(src, f), resolve(dest, f));
  console.log(`synced ${files.length} archetypes → templates/archetypes/`);
}

// Proxy worker (for `edu-role-play deploy-proxy`)
{
  const proxySrc = resolve(repoRoot, "packages", "proxy-worker");
  const proxyDest = resolve(cliRoot, "templates", "proxy-worker");
  mkdirSync(proxyDest, { recursive: true });
  copyTree(resolve(proxySrc, "src"), resolve(proxyDest, "src"));
  for (const f of ["wrangler.toml", "tsconfig.json", "README.md"]) {
    const s = resolve(proxySrc, f);
    try {
      copyFileSync(s, resolve(proxyDest, f));
    } catch {
      // tsconfig.json or README.md may not exist; skip silently.
    }
  }
  // package.json: emit a slimmed copy without monorepo-only fields.
  const pkg = JSON.parse(
    // eslint-disable-next-line no-undef
    (await import("node:fs")).readFileSync(resolve(proxySrc, "package.json"), "utf8"),
  );
  const slim = {
    name: pkg.name,
    version: pkg.version,
    private: true,
    type: "module",
    scripts: { deploy: "wrangler deploy", dev: "wrangler dev" },
    devDependencies: pkg.devDependencies,
  };
  // eslint-disable-next-line no-undef
  (await import("node:fs")).writeFileSync(
    resolve(proxyDest, "package.json"),
    JSON.stringify(slim, null, 2),
  );
  console.log(`synced proxy-worker → templates/proxy-worker/`);
}
