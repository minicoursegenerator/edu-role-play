import type { UserKeyConfig, UserProviderId } from "./types";

const STORAGE_KEY = "edu-role-play:user-key:v1";
const VALID_PROVIDERS: UserProviderId[] = ["cloudflare", "openai", "anthropic"];

export function readUserKey(): UserKeyConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserKeyConfig>;
    if (
      !parsed ||
      typeof parsed.apiKey !== "string" ||
      !parsed.apiKey ||
      typeof parsed.provider !== "string" ||
      !VALID_PROVIDERS.includes(parsed.provider as ProviderId)
    ) {
      return null;
    }
    return {
      provider: parsed.provider as UserProviderId,
      apiKey: parsed.apiKey,
      accountId: typeof parsed.accountId === "string" ? parsed.accountId : undefined,
      model: typeof parsed.model === "string" && parsed.model ? parsed.model : undefined,
    };
  } catch {
    return null;
  }
}

export function writeUserKey(cfg: UserKeyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // storage unavailable (private mode, quota); silently fail — caller
    // still has the in-memory override via onUserKeyChange.
  }
}

export function clearUserKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const DEFAULT_MODELS: Record<UserProviderId, string> = {
  cloudflare: "@cf/meta/llama-3.1-8b-instruct",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};
