import type { CompositionData, Difficulty } from "./types";

const DIFFICULTIES: Difficulty[] = ["easy", "realistic", "tough"];

function readDifficulty(root: Element): Difficulty {
  const raw = (root.getAttribute("difficulty") ?? "").toLowerCase();
  return (DIFFICULTIES as string[]).includes(raw) ? (raw as Difficulty) : "realistic";
}

function childText(el: Element, tag: string): string {
  const c = el.querySelector(tag);
  return (c?.textContent ?? "").trim();
}

function num(el: Element | null, tag: string): number | undefined {
  if (!el) return undefined;
  const txt = childText(el, tag);
  if (!txt) return undefined;
  const n = Number(txt);
  return Number.isFinite(n) ? n : undefined;
}

export function readCompositionFromDom(root: Element): CompositionData {
  const personaEl = root.querySelector("edu-persona");
  const scenarioEl = root.querySelector("edu-scenario");
  const termEl = root.querySelector("edu-termination");

  return {
    id: root.getAttribute("id") ?? "",
    persona: {
      name: personaEl?.getAttribute("name") ?? "",
      role: personaEl?.getAttribute("role") ?? "",
      background: personaEl ? childText(personaEl, "background") : "",
      goals: personaEl ? childText(personaEl, "goals") : "",
      constraints: personaEl ? childText(personaEl, "constraints") : "",
      speechPatterns: personaEl ? childText(personaEl, "speech-patterns") : "",
      avatar: personaEl?.getAttribute("avatar") ?? "",
    },
    scenario: scenarioEl?.textContent?.trim() ?? "",
    contextBlocks: Array.from(root.querySelectorAll("edu-context")).map((el) => ({
      title: el.getAttribute("title") ?? undefined,
      body: (el.textContent ?? "").trim(),
    })),
    objectives: Array.from(root.querySelectorAll("edu-objective")).map((el) => ({
      id: el.getAttribute("id") ?? "",
      text: (el.textContent ?? "").trim(),
    })),
    rubric: Array.from(root.querySelectorAll("edu-rubric criterion")).map((el) => ({
      objectiveId: el.getAttribute("objective") ?? "",
      weight: Number(el.getAttribute("weight") ?? "0"),
      text: (el.textContent ?? "").trim(),
    })),
    termination: {
      turnLimit: num(termEl, "turn-limit"),
      timeLimitSeconds: num(termEl, "time-limit"),
      objectiveCheckEvery: num(termEl, "objective-check-every"),
      manualEnd: (termEl ? childText(termEl, "manual-end") : "false").toLowerCase() === "true",
    },
    difficulty: readDifficulty(root),
  };
}
