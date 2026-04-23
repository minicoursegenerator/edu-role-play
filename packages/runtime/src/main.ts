import { buildSystemPrompt, reinjectSystem } from "./chat";
import { readCompositionFromDom } from "./composition-reader";
import { detectCompletedObjectives } from "./objective-detector";
import { createAnthropicProvider } from "./providers/anthropic";
import { createCloudflareProvider } from "./providers/cloudflare";
import { createOpenAIProvider } from "./providers/openai";
import { scoreTranscript } from "./scoring";
import type { ChatMessage, Provider, RuntimeConfig } from "./types";
import { UI } from "./ui";
import { DEFAULT_MODELS, readUserKey } from "./user-key";

function readConfig(): RuntimeConfig | null {
  const tag = document.getElementById("edu-role-play-config");
  if (!tag || !tag.textContent) return null;
  try {
    return JSON.parse(tag.textContent) as RuntimeConfig;
  } catch {
    return null;
  }
}

function effectiveConfig(baked: RuntimeConfig): RuntimeConfig {
  const user = readUserKey();
  if (!user) return baked;
  return {
    provider: user.provider,
    apiKey: user.apiKey,
    accountId: user.accountId,
    model: user.model ?? DEFAULT_MODELS[user.provider],
  };
}

function createProvider(config: RuntimeConfig): Provider {
  switch (config.provider) {
    case "cloudflare":
      return createCloudflareProvider(config);
    case "openai":
      return createOpenAIProvider(config);
    case "anthropic":
      return createAnthropicProvider(config);
    default:
      throw new Error(`Unknown provider: ${(config as { provider: string }).provider}`);
  }
}

export async function mount(host?: HTMLElement): Promise<void> {
  const root = host ?? document.querySelector("edu-role-play");
  if (!(root instanceof HTMLElement)) {
    console.error("[edu-role-play] no <edu-role-play> element found");
    return;
  }
  const baked = readConfig();
  if (!baked) {
    root.innerHTML =
      '<div style="font-family:system-ui;padding:16px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029">' +
      "edu-role-play: missing &lt;script id=&quot;edu-role-play-config&quot;&gt;. Did you run <code>edu-role-play bundle</code>?" +
      "</div>";
    return;
  }

  const comp = readCompositionFromDom(root);
  let provider = createProvider(effectiveConfig(baked));
  let history: ChatMessage[] = [];
  let turn = 0;
  let ended = false;
  const turnCap = comp.termination.turnLimit ?? 20;
  const checkEvery = comp.termination.objectiveCheckEvery ?? 3;

  const ui = new UI(root, comp, {
    onSend: async (text) => {
      if (ended) return;
      history.push({ role: "user", content: text });
      turn += 1;
      ui.setTurn(turn, turnCap);
      ui.appendMessage({ role: "user", content: text });
      ui.setBusy(true);
      ui.showTyping(true);
      try {
        const reply = await provider.chat(reinjectSystem(comp, history));
        history.push({ role: "assistant", content: reply });
        ui.showTyping(false);
        ui.appendMessage({ role: "assistant", content: reply });
      } catch (err) {
        ui.showTyping(false);
        ui.showError((err as Error).message);
        ui.setBusy(false);
        return;
      }
      ui.setBusy(false);

      if (turn > 0 && turn % checkEvery === 0) {
        const completed = await detectCompletedObjectives(provider, comp, history);
        ui.setObjectiveStatus(completed);
        const allMet = comp.objectives.every((o) => completed.has(o.id));
        if (allMet) {
          ui.addSystemNote(
            "All objectives appear met. End the conversation when you're ready.",
          );
        }
      }

      if (turn >= turnCap) {
        ui.addSystemNote(`Turn limit (${turnCap}) reached. Wrapping up…`);
        await endSession();
      }
    },
    onEnd: async () => {
      await endSession();
    },
    onHint: async () => {
      try {
        const sys = buildSystemPrompt(comp);
        const recent = history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "LEARNER" : "PERSONA"}: ${m.content}`)
          .join("\n");
        const prompt =
          `You are a silent coach observing a role-play. Do not break character as the persona. ` +
          `Given the role-play context and the recent exchange, suggest ONE concrete next line the LEARNER could say. ` +
          `Reply with a single short sentence including an example phrase in quotes. No preamble.\n\n` +
          `Role-play context:\n${sys}\n\nRecent exchange:\n${recent || "(none yet)"}`;
        const reply = await provider.chat(
          [
            { role: "system", content: "You are a concise coaching assistant. Output one sentence only." },
            { role: "user", content: prompt },
          ],
          { temperature: 0.4 },
        );
        return reply.trim();
      } catch (err) {
        ui.showError(`Hint failed: ${(err as Error).message}`);
        return null;
      }
    },
    onRestart: () => {
      history = [];
      turn = 0;
      ended = false;
      ui.setTurn(0, turnCap);
      ui.resetLog();
    },
    onUserKeyChange: () => {
      provider = createProvider(effectiveConfig(baked));
    },
  });

  async function endSession() {
    if (ended) return;
    ended = true;
    ui.disableInput();
    ui.addSystemNote("Scoring the conversation…");
    try {
      const result = await scoreTranscript(provider, comp, history);
      ui.showResults(result);
    } catch (err) {
      ui.showError(`Scoring failed: ${(err as Error).message}`);
    }
  }
}

// Auto-mount on DOMContentLoaded unless the host opts out.
const AUTO_ATTR = "data-edu-role-play-auto";
function autoMount() {
  const root = document.querySelector("edu-role-play");
  if (!(root instanceof HTMLElement)) return;
  if (root.getAttribute(AUTO_ATTR) === "off") return;
  void mount(root);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
}
