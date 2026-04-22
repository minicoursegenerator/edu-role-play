import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const REGISTRY_PATH = resolve(process.cwd(), ".edu-role-play", "registry.json");

interface RegistryEntry {
  compositionPath: string;
  bundledPath: string;
  hash: string;
  updatedAt: string;
}

interface Registry {
  entries: Record<string, RegistryEntry>;
}

function load(): Registry {
  if (!existsSync(REGISTRY_PATH)) return { entries: {} };
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as Registry;
  } catch {
    return { entries: {} };
  }
}

function save(reg: Registry) {
  mkdirSync(dirname(REGISTRY_PATH), { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2) + "\n", "utf8");
}

export function recordBundle(id: string, compositionPath: string, bundledPath: string, output: string) {
  const hash = createHash("sha256").update(output).digest("hex").slice(0, 16);
  const reg = load();
  reg.entries[id] = {
    compositionPath,
    bundledPath,
    hash,
    updatedAt: new Date().toISOString(),
  };
  save(reg);
  return hash;
}
