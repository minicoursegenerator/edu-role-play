import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface UserConfig {
  proxyUrl?: string;
  provider?: "workers-ai" | "anthropic" | "openai";
  deployedAt?: string;
}

export function userConfigPath(): string {
  return join(homedir(), ".edu-role-play", "config.json");
}

export function readUserConfig(): UserConfig {
  const path = userConfigPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as UserConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeUserConfig(partial: UserConfig): void {
  const path = userConfigPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  const merged: UserConfig = { ...readUserConfig(), ...partial };
  writeFileSync(path, JSON.stringify(merged, null, 2), { encoding: "utf8", mode: 0o600 });
}
