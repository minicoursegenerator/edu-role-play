import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));

// When built: packages/cli/dist/*.js → repo root is ../../..
// When run via tsx: packages/cli/src/*.ts → repo root is ../../..
export const repoRoot = resolve(here, "..", "..", "..");

export function runtimeIifePath(): string {
  const p = resolve(repoRoot, "packages", "runtime", "dist", "runtime.iife.js");
  if (!existsSync(p)) {
    throw new Error(
      `runtime not built at ${p}. Run \`npm run build -w @edu-role-play/runtime\` first.`,
    );
  }
  return p;
}

export function archetypesDir(): string {
  return resolve(repoRoot, "skills", "edu-role-play", "archetypes");
}

export function blankTemplatePath(): string {
  return resolve(repoRoot, "packages", "cli", "templates", "blank.html");
}
