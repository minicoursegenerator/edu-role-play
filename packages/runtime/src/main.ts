import { buildSystemPrompt, normalizePersonaReply, reinjectSystem } from "./chat";
import { readCompositionFromDom } from "./composition-reader";
import { detectCompletedObjectives } from "./objective-detector";
import { createProxyProvider } from "./providers/proxy";
import { createResultSnapshot, createSessionId } from "./results";
import { scoreTranscript } from "./scoring";
import { createScorm12Adapter } from "./scorm";
import { t } from "./locales";
import type { ActivityEvent, ChatMessage, Provider, ResultSnapshot, RuntimeConfig } from "./types";
import { ObjectiveState, type ObjectiveStatusMap } from "./types";
import { UI } from "./ui";

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

function createProvider(config: RuntimeConfig): Provider {
  return createProxyProvider(config);
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
  const provider = createProvider(baked);
  let history: ChatMessage[] = [];
  let completedObjectives = new Map() as ObjectiveStatusMap;
  let debugMode = false;
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

      // Debug mode: system introspection commands
      const debugMatch = text.match(/^Debug:\s*(.*)/is);
      if (debugMatch) {
        const query = debugMatch[1].trim();
        if (!query) return;

        ui.appendMessage({ role: "user", content: text });

        // Debug: state — show current detection state
        if (/^state|^detected/i.test(query)) {
          const lines = Array.from(completedObjectives.entries()).map(([id, s]) => {
            const st = s.state === ObjectiveState.Complete ? "GREEN" : s.state === ObjectiveState.Partial ? "YELLOW" : "GREY";
            return `${id}: ${st}${s.count ? ` (${s.count})` : ""}`;
          });
          ui.addSystemNote(`🔧 Detection state:\n${lines.join("\n") || "(none detected)"}\nTurn: ${turn}/${turnCap}`);
          return;
        }

        // Debug: filter "text" — test what the code filter would decide
        const filterMatch = query.match(/^filter\s+"([^"]+)"|^filter\s+'([^']+)'/i);
        if (filterMatch) {
          const testText = filterMatch[1] || filterMatch[2];
          const wc = testText.split(/\s+/).filter(Boolean).length;
          const len = testText.length;
          const isPleasantry = /^(hi|hello|hey|how are you|how do you do|nice to meet|good to see|greetings|thanks|thank you|good|nice|ok|okay|yes|no|sure|please|lol|haha|ahoy|yo|sup|cheers|bye|goodbye|see ya|cya)[\s.!?,]*$/i.test(testText);
          const hasQ = /[?]/.test(testText) || /^(what|how|why|who|where|when|do|did|can|could|would|will|is|are|was|were|have|has)\s/i.test(testText);
          const hasTW = /(paul|lydia|baptis|convert|belie|christ|jesus|synagogue|roman|jew|gentil|pray|worship|trade|purple|dye|cloth|thyatira|philippi|spirit|church|community|letter|gospel|apostle|god|faith|messiah|river|gangites|preach|teacher|crucif|resurrect)/i.test(testText);
          const isNonsense = wc >= 3 && !hasQ && len < 50 && !hasTW;
          const substantive = wc >= 3 && len > 10 && !isPleasantry && !isNonsense;
          ui.addSystemNote(`🔧 Filter check: "${testText}" — ${wc} words, ${len} chars\npleasantry=${isPleasantry} question=${hasQ} topic=${hasTW} → ${substantive ? "PASSES" : "BLOCKED"}`);
          return;
        }

        // Debug: detect "text" — run actual detection on sample text
        const detectMatch = query.match(/^detect\s+"([^"]+)"|^detect\s+'([^']+)'/i);
        if (detectMatch) {
          const testText = detectMatch[1] || detectMatch[2];
          const wc = testText.split(/\s+/).filter(Boolean).length;
          const len = testText.length;
          // Run code filter
          const isPleasantry = /^(hi|hello|hey|how are you|how do you do|nice to meet|good to see|greetings|thanks|thank you|good|nice|ok|okay|yes|no|sure|please|lol|haha|ahoy|yo|sup|cheers|bye|goodbye|see ya|cya)[\s.!?,]*$/i.test(testText);
          const hasQ = /[?]/.test(testText) || /^(what|how|why|who|where|when|do|did|can|could|would|will|is|are|was|were|have|has)\s/i.test(testText);
          const hasTW = /(paul|lydia|baptis|convert|belie|christ|jesus|synagogue|roman|jew|gentil|pray|worship|trade|purple|dye|cloth|thyatira|philippi|spirit|church|community|letter|gospel|apostle|god|faith|messiah|river|gangites|preach|teacher|crucif|resurrect)/i.test(testText);
          const isNonsense = wc >= 3 && !hasQ && len < 50 && !hasTW;
          const blocked = wc < 3 || len <= 10 || isPleasantry || isNonsense;

          if (blocked) {
            const reasons = [];
            if (wc < 3) reasons.push("less than 3 words");
            if (len <= 10) reasons.push("too short");
            if (isPleasantry) reasons.push("pleasantry match");
            if (isNonsense) reasons.push("nonsense match");
            ui.addSystemNote(`🔧 Detect "${testText}": BLOCKED by code filter (${reasons.join(", ")}) — LLM not called`);
          } else {
            // Call the actual detector with a synthetic history
            try {
              const synthHistory: ChatMessage[] = [
                ...history.slice(-2), // last 2 messages for minimal context
                { role: "user", content: testText },
              ];
              // We need to import detectCompletedObjectives — it's already imported at top
              const result = await detectCompletedObjectives(provider, comp, synthHistory);
              if (result.size === 0) {
                ui.addSystemNote(`🔧 Detect "${testText}": PASSES filter → LLM returned NO objectives detected`);
              } else {
                const lines = Array.from(result.entries()).map(([id, s]) =>
                  `${id} (state ${s.state === 2 ? "GREEN" : "YELLOW"})${s.count ? ` scores=[${s.count}]` : ""}`
                );
                ui.addSystemNote(`🔧 Detect "${testText}": PASSES filter → DETECTED:\n${lines.join("\n")}`);
              }
            } catch (err) {
              ui.addSystemNote(`🔧 Detect "${testText}": PASSES filter → LLM call ERROR: ${(err as Error).message}`);
            }
          }
          return;
        }

        // Debug: on / off — toggle auto-debug output
        if (/^on$/i.test(query)) {
          debugMode = true;
          ui.addSystemNote("🔧 Debug mode ON — filter and detection results will be shown automatically");
          return;
        }
        if (/^off$/i.test(query)) {
          debugMode = false;
          ui.addSystemNote("🔧 Debug mode OFF");
          return;
        }

        // Debug: anything else — show filter analysis, then ask LLM with full context
        let filterAnalysis = "";
        const quotedMatch = query.match(/"([^"]+)"|'([^']+)'/);
        if (quotedMatch) {
          const quoted = quotedMatch[1] || quotedMatch[2];
          const wc = quoted.split(/\s+/).filter(Boolean).length;
          const len = quoted.length;
          const pleasant = /^(hi|hello|hey|how are you|how do you do|nice to meet|good to see|greetings|thanks|thank you|good|nice|ok|okay|yes|no|sure|please|lol|haha|ahoy|yo|sup|cheers|bye|goodbye|see ya|cya)[\s.!?,]*$/i.test(quoted);
          const hasQ = /[?]/.test(quoted) || /^(what|how|why|who|where|when|do|did|can|could|would|will|is|are|was|were|have|has)\s/i.test(quoted);
          const hasTW = /(paul|lydia|baptis|convert|belie|christ|jesus|synagogue|roman|jew|gentil|pray|worship|trade|purple|dye|cloth|thyatira|philippi|spirit|church|community|letter|gospel|apostle|god|faith|messiah|river|gangites|preach|teacher|crucif|resurrect)/i.test(quoted);
          const nonsense = wc >= 3 && !hasQ && len < 50 && !hasTW;
          const blocked = wc < 3 || len <= 10 || pleasant || nonsense;
          if (blocked) {
            const reasons: string[] = [];
            if (wc < 3) reasons.push(`${wc} words < 3`);
            if (len <= 10) reasons.push("too short");
            if (pleasant) reasons.push("pure pleasantry");
            if (nonsense) reasons.push("no question, no topic word, under 40 chars");
            filterAnalysis = `Code filter: BLOCKED (${reasons.join(", ")}). The message was never sent to the LLM for evaluation.`;
          } else {
            filterAnalysis = `Code filter: PASSED (${wc} words, ${len} chars). Message was sent to LLM for evaluation.`;
          }
          ui.addSystemNote(`🔧 Filter: ${filterAnalysis}`);
        }

        // Now send the user's question to the LLM with full debug context
        ui.appendMessage({ role: "user", content: text });
        ui.setBusy(true);
        ui.showTyping(true);

        // Build comprehensive debug context
        const detectTexts = comp.objectives.map(o =>
          `- ${o.id} (${completedObjectives.get(o.id)?.state === 2 ? "GREEN" : completedObjectives.get(o.id)?.state === 1 ? "YELLOW" : "GREY"}): ${o.detectText}`
        ).join("\n");
        const rubricText = comp.rubric.map(c =>
          `- ${c.objectiveId} (weight ${c.weight}): ${c.text}`
        ).join("\n");
        const recentHistory = history.filter(m => m.role !== "system").slice(-6).map(m =>
          `${m.role === "user" ? "LEARNER" : "PERSONA"}: ${m.content.slice(0, 200)}`
        ).join("\n");
        const convHistory = history.filter(m => m.role === "user").slice(-4).map(m =>
          `LEARNER: ${m.content.slice(0, 200)}`
        ).join("\n");

        const debugPrompt = `You are a debug assistant analyzing an edu-role-play detection system. The system uses a code-level filter, then sends learner messages to an LLM detector with AI-facing objective text.

Current detection state:
${comp.objectives.map(o => `- ${o.id}: ${completedObjectives.get(o.id)?.state === 2 ? "GREEN" : completedObjectives.get(o.id)?.state === 1 ? "YELLOW" : "GREY"}`).join("\n")}

AI-facing objective texts (what the detector LLM sees):
${detectTexts}

Rubric (used by final scorer):
${rubricText}

${filterAnalysis ? `Filter analysis for quoted text:\n${filterAnalysis}\n` : ""}

Recent learner messages (only these are sent to the detector):
${convHistory || "(no learner messages yet)"}

Full recent conversation (for context):
${recentHistory || "(no history yet)"}

The user's question is: ${query}

Answer specifically — analyze why the detection system made the decision it did, referencing the actual objective texts and filter logic. Be concise but thorough.`;

        try {
          const reply = await provider.chat(
            [
              { role: "system", content: "You are a debug assistant for an edu-role-play objective detection system. Analyze the situation using the provided system state and objective texts. Answer specifically, referencing objective IDs and filter rules. Be concise." },
              { role: "user", content: debugPrompt },
            ],
            { temperature: 0.3 },
          );
          ui.showTyping(false);
          ui.addSystemNote(`🔧 Debug analysis:\n${reply}`);
        } catch (err) {
          ui.showTyping(false);
          ui.showError(`Debug error: ${(err as Error).message}`);
        }
        ui.setBusy(false);
        return;
      }

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

      // Skip detection on non-substantive messages (greetings, pleasantries)
      const trimmed = text.trim();
      const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
      // Pure pleasantries and social niceties (nothing substantive)
      const isPleasantry = /^(hi|hello|hey|how are you|how do you do|nice to meet|good to see|greetings|thanks|thank you|good|nice|ok|okay|yes|no|sure|please|lol|haha|ahoy|yo|sup|cheers|bye|goodbye|see ya|cya)[\s.!?,]*$/i.test(trimmed);
      // Generic nonsense detector — catches role-play-breaking messages
      // without enumerating specific words. A message is nonsense if it's
      // short, doesn't ask a question, and lacks any substantive content.
      const hasQuestion = /[?]/.test(trimmed) || /^(what|how|why|who|where|when|do|did|can|could|would|will|is|are|was|were|have|has)\s/i.test(trimmed);
      const isNonsense = wordCount >= 3 && !hasQuestion && trimmed.length < 50 && !/(paul|lydia|baptis|convert|belie|christ|jesus|synagogue|roman|jew|gentil|pray|worship|trade|purple|dye|cloth|thyatira|philippi|spirit|church|community|letter|gospel|apostle|god|faith|messiah|river|gangites|preach|teacher|crucif|resurrect)/i.test(trimmed);
      // Need at least 3 words AND enough length to be substantive AND not nonsense
      const isSubstantive = wordCount >= 3 && trimmed.length > 10 && !isPleasantry && !isNonsense;

      // Auto-debug: comprehensive pipeline trace
      if (debugMode) {
        const reasons: string[] = [];
        if (wordCount < 3) reasons.push(`words=${wordCount}`);
        if (trimmed.length <= 10) reasons.push(`chars=${trimmed.length}≤10`);
        if (isPleasantry) reasons.push("pleasantry=yes");
        if (isNonsense) reasons.push("nonsense=yes");
        const filterResult = isSubstantive ? "PASSED" : `BLOCKED (${reasons.join(", ")})`;
        if (!isSubstantive) {
          const contentPreview = trimmed.length > 40 ? trimmed.slice(0, 40) + "..." : trimmed;
          ui.addSystemNote(`⚙ [turn ${turn}] Filter: "${contentPreview}" → ${filterResult}`);
        }
      }

      if (turn > 0 && turn % checkEvery === 0 && isSubstantive) {
        let trace = `⚙ [turn ${turn}] Filter: PASSED\n`;
        trace += `  Input (${trimmed.length} chars, ${wordCount} words): "${trimmed.length > 60 ? trimmed.slice(0,60)+"..." : trimmed}"\n`;

        if (debugMode) ui.addSystemNote(trace);
        const before = new Map(completedObjectives);
        const latest = await detectCompletedObjectives(provider, comp, history);

        if (debugMode) {
          let detTrace = `  LLM returned: ${latest.size} objective(s)\n`;
          for (const [id, s] of latest) {
            const aiText = comp.objectives.find(o => o.id === id)?.detectText || comp.objectives.find(o => o.id === id)?.text || id;
            const preview = aiText.length > 80 ? aiText.slice(0, 80) + "..." : aiText;
            detTrace += `    ${id}: state=${s.state === 2 ? "COMPLETE" : "PARTIAL"}${s.count ? ` scores=[${s.count}]` : ""}\n`;
            detTrace += `      AI objective: "${preview}"\n`;
          }
          ui.addSystemNote(detTrace);
        }
        // Merge: first detection → yellow, re-detected → green
        for (const [id] of latest) {
          const prev = completedObjectives.get(id);
          if (!prev) {
            completedObjectives.set(id, { state: ObjectiveState.Partial });
          } else if (prev.state === ObjectiveState.Partial) {
            completedObjectives.set(id, { state: ObjectiveState.Complete });
          }
        }
        record("objective_check", { completed: Array.from(completedObjectives.keys()) });
        ui.setObjectiveStatus(completedObjectives);

        // Show merge result in debug mode
        if (debugMode) {
          const changes: string[] = [];
          for (const [id, s] of completedObjectives) {
            const b = before.get(id);
            const bSt = b ? (b.state === 2 ? "GREEN" : b.state === 1 ? "YELLOW" : "GREY") : "NONE";
            const aSt = s.state === 2 ? "GREEN" : s.state === 1 ? "YELLOW" : "GREY";
            if (bSt !== aSt) changes.push(`${id}: ${bSt} → ${aSt}`);
          }
          if (changes.length > 0) {
            ui.addSystemNote(`  Merge: ${changes.join(", ")}`);
          } else {
            ui.addSystemNote(`  Merge: no state changes`);
          }
        }

        const allMet = comp.objectives.every((o) => {
          const s = completedObjectives.get(o.id);
          return s && s.state === ObjectiveState.Complete;
        });
        if (allMet) {
          ui.addSystemNote(t(comp.locale, "allObjectivesMet"));
          window.setTimeout(() => {
            void endSession();
          }, 1000);
          return;
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
      completedObjectives = new Map() as ObjectiveStatusMap;
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
      const result = await scoreTranscript(provider, comp, history, completedObjectives);
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
