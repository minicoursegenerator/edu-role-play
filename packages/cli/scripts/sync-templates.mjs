#!/usr/bin/env node
// Copies archetype templates from skills/edu-role-play/archetypes/ into
// packages/cli/templates/archetypes/ so they ship with the published CLI tarball.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(here, "..");
const repoRoot = resolve(cliRoot, "..", "..");
const src = resolve(repoRoot, "skills", "edu-role-play", "archetypes");
const dest = resolve(cliRoot, "templates", "archetypes");

mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith(".html"));
for (const f of files) {
  copyFileSync(resolve(src, f), resolve(dest, f));
}
console.log(`synced ${files.length} archetypes → templates/archetypes/`);
