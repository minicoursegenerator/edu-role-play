import { reinjectSystem } from "./chat";
import { readCompositionFromDom } from "./composition-reader";
import { detectCompletedObjectives } from "./objective-detector";
import { createCloudflareProvider } from "./providers/cloudflare";
import { scoreTranscript } from "./scoring";
import type { ChatMessage, CompositionData, Provider, RuntimeConfig } from "./types";
import { UI } from "./ui";

function readConfig(): RuntimeConfig | null {
  const tag = document.getElementById("edu-role-play-config");
  if (!tag || !tag.textContent) return null;
  try {
    return JSON.parse(tag.textContent) as RuntimeConfig;
  } catch {
    return null;
  }
}

function createProvider(config: RuntimeConfig): Provider {
  switch (config.provider) {
    case "cloudflare":
      return createCloudflareProvider(config);
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
  const config = readConfig();
  if (!config) {
    root.innerHTML =
      '<div style="font-family:system-ui;padding:16px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029">' +
      "edu-role-play: missing &lt;script id=&quot;edu-role-play-config&quot;&gt;. Did you run <code>edu-role-play bundle</code>?" +
      "</div>";
    return;
  }

  const comp = readCompositionFromDom(root);
  const provider = createProvider(config);
  const history: ChatMessage[] = [];
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
