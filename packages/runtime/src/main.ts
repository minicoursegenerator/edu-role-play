import { buildSystemPrompt, normalizePersonaReply, reinjectSystem } from "./chat";
import { readCompositionFromDom } from "./composition-reader";
import { detectCompletedObjectives } from "./objective-detector";
import { createAnthropicProvider } from "./providers/anthropic";
import { createCloudflareProvider } from "./providers/cloudflare";
import { createOpenAIProvider } from "./providers/openai";
import { createProxyProvider } from "./providers/proxy";
import { createResultSnapshot, createSessionId } from "./results";
import { scoreTranscript } from "./scoring";
import { createScorm12Adapter } from "./scorm";
import { t } from "./locales";
import type { ActivityEvent, ChatMessage, Provider, ResultSnapshot, RuntimeConfig } from "./types";
import { UI } from "./ui";
import { DEFAULT_MODELS, readUserKey } from "./user-key";

function looksLikeNetworkBlock(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message || "";
  return /failed to fetch|networkerror|load failed/i.test(msg);
}

function inSandboxedFrame(): boolean {
  try {
    if (window.top === window.self) return false;
  } catch {
    return true;
  }
  try {
    return window.location.origin === "null" || document.location.ancestorOrigins?.length > 0;
  } catch {
    return true;
  }
}

function explainStartError(err: unknown): string {
  if (looksLikeNetworkBlock(err)) {
    if (inSandboxedFrame()) {
      return "Could not reach the model proxy from this preview frame. Download the HTML and open it in your browser — preview sandboxes block outbound network calls.";
    }
    return "Could not reach the model proxy. Check your internet connection, or if the bundled proxy URL is wrong, re-bundle with --proxy-url <your-worker>.";
  }
  return `Could not start: ${(err as Error).message}`;
}

function readConfig(): RuntimeConfig | null {
  const tag = document.getElementById("edu-role-play-config");
  if (!tag || !tag.textContent) return null;
  try {
    return JSON.parse(tag.textContent) as RuntimeConfig;
  } catch {
    return null;
  }
}

// Lets a deployer re-point a bundled HTML at their own Worker without
// re-running the CLI: ?erp-proxy=https://… wins, then <meta name="edu-role-play-proxy">.
// Only applied when the baked provider is "proxy".
function readProxyOverride(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("erp-proxy");
    if (fromQuery) return fromQuery;
  } catch {
    // ignore (file:// in some sandboxes)
  }
  const meta = document.querySelector('meta[name="edu-role-play-proxy"]');
  const fromMeta = meta?.getAttribute("content");
  return fromMeta && fromMeta.trim() ? fromMeta.trim() : null;
}

function applyProxyOverride(baked: RuntimeConfig): RuntimeConfig {
  if (baked.provider !== "proxy") return baked;
  const override = readProxyOverride();
  if (!override) return baked;
  if (!/^https:\/\//i.test(override)) {
    console.warn(`[edu-role-play] ignoring non-https proxy override: ${override}`);
    return baked;
  }
  return { ...baked, baseUrl: override };
}

function effectiveConfig(baked: RuntimeConfig): RuntimeConfig {
  const user = readUserKey();
  if (!user) return baked;
  return {
    provider: user.provider,
    apiKey: user.apiKey,
    accountId: user.accountId,
    model: user.model ?? DEFAULT_MODELS[user.provider],
    bundleId: baked.bundleId,
    scorm: baked.scorm,
  };
}

function createProvider(config: RuntimeConfig): Provider {
  switch (config.provider) {
    case "proxy":
      return createProxyProvider(config);
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
  let baked = readConfig();
  if (!baked) {
    root.innerHTML =
      '<div style="font-family:system-ui;padding:16px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:8px;color:#842029">' +
      "edu-role-play: missing &lt;script id=&quot;edu-role-play-config&quot;&gt;. Did you run <code>edu-role-play bundle</code>?" +
      "</div>";
    return;
  }

  if (root.parentElement === document.body) {
    const html = document.documentElement;
    const body = document.body;
    html.style.height = "100%";
    body.style.margin = "0";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    root.style.display = "block";
    root.style.height = "100%";
  }

  const comp = readCompositionFromDom(root);
  baked = applyProxyOverride(baked);
  let provider = createProvider(effectiveConfig(baked));
  let history: ChatMessage[] = [];
  let completedObjectives = new Set<string>();
  let resultSnapshot: ResultSnapshot | null = null;
  let turn = 0;
  let ended = false;
  let started = false;
  let finishedScorm = false;
  let sessionId = createSessionId();
  let sessionStartedAt = new Date().toISOString();
  let events: ActivityEvent[] = [];
  const turnCap = comp.termination.turnLimit ?? 20;
  const checkEvery = comp.termination.objectiveCheckEvery ?? 1;
  const scorm = createScorm12Adapter(baked.scorm?.enabled === true && baked.scorm.version === "1.2");
  let ui!: UI;

  function record(type: ActivityEvent["type"], data?: Record<string, unknown>): void {
    events.push({ type, at: new Date().toISOString(), data });
  }

  function finishScorm(): void {
    if (finishedScorm) return;
    finishedScorm = true;
    scorm.finish();
  }

  record("launch", { scormEnabled: baked.scorm?.enabled === true, scormAvailable: scorm.available });
  scorm.initialize();
  scorm.setIncomplete();
  window.addEventListener("beforeunload", finishScorm);

  async function streamAssistantTurn(messages: ChatMessage[]): Promise<string> {
    let raw = "";
    let firstDelta = true;
    for await (const delta of provider.chatStream(messages)) {
      if (firstDelta) {
        ui.showTyping(false);
        firstDelta = false;
      }
      raw += delta;
      ui.appendAssistantDelta(delta);
    }
    if (firstDelta) ui.showTyping(false);
    ui.finishAssistantStream();
    return normalizePersonaReply(raw);
  }

  async function sendOpening() {
    try {
      ui.showTyping(true);
      const openingMessages: ChatMessage[] = [
        { role: "system", content: buildSystemPrompt(comp) },
        {
          role: "user",
          content:
            `[The role-play begins now. You are ${comp.persona.name}${comp.persona.role ? ` (${comp.persona.role})` : ""}, and the LEARNER is the counterpart described in the scenario — never speak as the learner. Open the conversation in character with a natural opening line — 1–3 sentences. Reflect your character's current emotional state and goals from the moment the scenario starts (e.g., if you are furious, frustrated, skeptical, in a hurry, distracted — sound like it). Do NOT introduce yourself using the learner's company or job title. Do NOT break character. Do NOT include a coaching tip on this opening turn.]`,
        },
      ];
      const opener = await streamAssistantTurn(openingMessages);
      history.push({ role: "assistant", content: opener });
      record("roleplay_start");
    } catch (err) {
      ui.showTyping(false);
      ui.showError(explainStartError(err));
    }
  }

  ui = new UI(root, comp, {
    onSend: async (text) => {
      if (ended) return;
      history.push({ role: "user", content: text });
      turn += 1;
      record("turn", { turn, role: "user" });
      ui.setTurn(turn, turnCap);
      ui.appendMessage({ role: "user", content: text });
      ui.setBusy(true);
      ui.showTyping(true);
      try {
        const reply = await streamAssistantTurn(reinjectSystem(comp, history));
        history.push({ role: "assistant", content: reply });
        record("turn", { turn, role: "assistant" });
      } catch (err) {
        record("error", { phase: "reply", message: (err as Error).message });
        ui.showTyping(false);
        ui.showError((err as Error).message);
        ui.setBusy(false);
        return;
      }
      ui.setBusy(false);

      if (turn > 0 && turn % checkEvery === 0) {
        const completed = await detectCompletedObjectives(provider, comp, history);
        completedObjectives = completed;
        record("objective_check", { completed: Array.from(completed) });
        ui.setObjectiveStatus(completed);
        const allMet = comp.objectives.every((o) => completed.has(o.id));
        if (allMet) {
          ui.addSystemNote(t(comp.locale, "allObjectivesMet"));
        }
      }

      if (turn >= turnCap) {
        ui.addSystemNote(t(comp.locale, "turnLimitReached", { n: turnCap }));
        await endSession();
      }
    },
    onEnd: async () => {
      await endSession();
    },
    onHint: async () => {
      try {
        const p = comp.persona;
        const personaDesc = [
          `Name: ${p.name}${p.role ? `, ${p.role}` : ""}`,
          p.background ? `Background: ${p.background}` : "",
          p.goals ? `Their goals: ${p.goals}` : "",
          p.constraints ? `Their constraints: ${p.constraints}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const recent = history
          .slice(-6)
          .map(
            (m) =>
              `${m.role === "user" ? "LEARNER (the person you are coaching)" : `PERSONA (${p.name})`}: ${m.content}`,
          )
          .join("\n");
        const lastPersona = [...history].reverse().find((m) => m.role === "assistant");
        const personaAskedQuestion = !!lastPersona && /\?\s*$|\?\s*["')\]]*\s*$/.test(lastPersona.content.trim());
        const unmetObjectives = comp.objectives
          .filter((o) => !completedObjectives.has(o.id))
          .map((o) => `- ${o.text}`)
          .join("\n");
        const objectivesBlock = unmetObjectives
          ? `Objectives the learner still needs to hit (prioritize these when proactive):\n${unmetObjectives}`
          : `All objectives currently appear met — keep the learner steering toward a clean wrap-up or next step.`;
        const responseRule = personaAskedQuestion
          ? `The persona's last message ends with a question. Your hint MUST be a direct answer to that question from the learner's point of view — not another question back, not a deflection. The learner can briefly add a follow-up, but the core must answer what was asked. Where natural, weave in progress toward an unmet objective from the list below.`
          : `No open question from the persona right now. Suggest a proactive line that advances one of the unmet objectives below — this can include asking a good discovery question when appropriate.`;
        const prompt =
          `You are a silent coach helping THE LEARNER (the human user) navigate a role-play conversation with a fictional PERSONA (played by an AI). ` +
          `You are NOT the persona. Suggest ONE concrete next line THE LEARNER could say.\n\n` +
          `CRITICAL — who is who:\n` +
          `- The PERSONA is ${p.name}${p.role ? `, ${p.role}` : ""}. The persona's goals/background/constraints describe THE PERSONA, not the learner.\n` +
          `- The LEARNER plays the counterpart role described in the scenario below (the scenario addresses the learner directly with "You are…").\n` +
          `- Your suggestion must be a line the LEARNER would say from THEIR role — never a line the PERSONA would say. If the persona is a customer, the learner is the agent/seller/etc., not another customer. Do not suggest questions or framings that only make sense from the persona's side of the table.\n\n` +
          `${responseRule}\n\n` +
          `${objectivesBlock}\n\n` +
          `Output format: a single short sentence of coaching that includes the exact words the learner should say, wrapped in double quotes. No preamble, no explanation after.\n` +
          `Example when answering a question: Answer directly, e.g. "Yes — last quarter we measured it through X, Y, and Z."\n` +
          `Example when proactive: Try asking about their current process, e.g. "Walk me through how your team handles X today."\n\n` +
          `Scenario (describes THE LEARNER's role):\n${comp.scenario}\n\n` +
          `Persona the learner is talking to (this is NOT the learner):\n${personaDesc}\n\n` +
          `Recent exchange:\n${recent || "(none yet — the learner is about to open the conversation)"}`;
        const reply = await provider.chat(
          [
            {
              role: "system",
              content:
                "You are a concise coaching assistant for the LEARNER. You always suggest what the learner should say next from the learner's role (described in the scenario), never what the persona would say. Output one sentence only.",
            },
            { role: "user", content: prompt },
          ],
          { temperature: 0.4 },
        );
        record("hint");
        return reply.trim();
      } catch (err) {
        record("error", { phase: "hint", message: (err as Error).message });
        ui.showError(t(comp.locale, "hintFailed", { message: (err as Error).message }));
        return null;
      }
    },
    onRestart: () => {
      history = [];
      completedObjectives = new Set<string>();
      resultSnapshot = null;
      events = [];
      sessionId = createSessionId();
      sessionStartedAt = new Date().toISOString();
      record("restart");
      record("launch", { restarted: true, scormEnabled: baked.scorm?.enabled === true, scormAvailable: scorm.available });
      turn = 0;
      ended = false;
      ui.setTurn(0, turnCap);
      ui.resetLog();
      ui.setResultsReady(false);
      scorm.setIncomplete();
      void sendOpening();
    },
    onUserKeyChange: () => {
      provider = createProvider(effectiveConfig(baked));
    },
    onDownloadResults: () => {
      if (!resultSnapshot) return null;
      record("result_download");
      resultSnapshot = { ...resultSnapshot, events: [...events] };
      return resultSnapshot;
    },
  });

  async function endSession() {
    if (ended) return;
    ended = true;
    record("finish", { turn });
    ui.disableInput();
    ui.addSystemNote(t(comp.locale, "scoringConversation"));
    try {
      record("scoring");
      const result = await scoreTranscript(provider, comp, history);
      resultSnapshot = createResultSnapshot({
        comp,
        sessionId,
        startedAt: sessionStartedAt,
        completedAt: new Date().toISOString(),
        durationSeconds: ui.getDurationSeconds(),
        history,
        completedObjectives,
        result,
        events,
      });
      record("results_ready", { scorePercent: resultSnapshot.score.percent });
      resultSnapshot = { ...resultSnapshot, events: [...events] };
      scorm.reportResult(resultSnapshot);
      finishScorm();
      ui.setResultsReady(true);
      ui.showResults(result);
    } catch (err) {
      record("error", { phase: "scoring", message: (err as Error).message });
      ui.showError(`Scoring failed: ${(err as Error).message}`);
    } finally {
      ui.showRestartAction();
    }
  }

  record("briefing_start");
  await ui.showBriefing();
  if (!started) {
    started = true;
    void sendOpening();
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
