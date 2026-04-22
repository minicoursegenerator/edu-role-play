import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// packages/cli/dist/*.js (published) or packages/cli/src/*.ts (dev via tsx).
// In both cases, templates/ sits one level above at packages/cli/templates/.
const cliPackageRoot = resolve(here, "..");

export function runtimeIifePath(): string {
  // Resolve via the installed @edu-role-play/runtime package. Works both in
  // the monorepo (workspace link) and after `npm install edu-role-play`.
  try {
    const pkgJsonPath = require.resolve("@edu-role-play/runtime/package.json");
    const runtimeRoot = dirname(pkgJsonPath);
    const p = resolve(runtimeRoot, "dist", "runtime.iife.js");
    if (existsSync(p)) return p;
    throw new Error(`runtime IIFE missing at ${p}`);
  } catch (err) {
    throw new Error(
      `Could not resolve @edu-role-play/runtime. Make sure it is installed. (${(err as Error).message})`,
    );
  }
}

export function archetypesDir(): string {
  // Shipped inside the CLI's own templates folder. Populated at build time
  // by scripts/sync-templates.mjs from skills/edu-role-play/archetypes/.
  return resolve(cliPackageRoot, "templates", "archetypes");
}

export function blankTemplatePath(): string {
  return resolve(cliPackageRoot, "templates", "blank.html");
}
