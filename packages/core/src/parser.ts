import { parse, HTMLElement } from "node-html-parser";
import type {
  Composition,
  Criterion,
  Objective,
  Persona,
  Termination,
} from "./types.js";

export class CompositionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompositionParseError";
  }
}

function childText(el: HTMLElement, tag: string, fallback = ""): string {
  const child = el.querySelector(tag);
  return (child?.textContent ?? fallback).trim();
}

function requireRoot(html: string): HTMLElement {
  const root = parse(html, { lowerCaseTagName: false });
  const node = root.querySelector("edu-role-play");
  if (!node) {
    throw new CompositionParseError("Missing <edu-role-play> root element");
  }
  return node;
}

function parsePersona(root: HTMLElement): Persona {
  const el = root.querySelector("edu-persona");
  if (!el) {
    throw new CompositionParseError("Missing <edu-persona>");
  }
  return {
    name: el.getAttribute("name")?.trim() ?? "",
    role: el.getAttribute("role")?.trim() ?? "",
    background: childText(el, "background"),
    goals: childText(el, "goals"),
    constraints: childText(el, "constraints"),
    speechPatterns: childText(el, "speech-patterns"),
    avatar: el.getAttribute("avatar")?.trim() ?? "",
  };
}

function parseObjectives(root: HTMLElement): Objective[] {
  return root.querySelectorAll("edu-objective").map((el) => ({
    id: el.getAttribute("id")?.trim() ?? "",
    text: el.textContent.trim(),
  }));
}

function parseRubric(root: HTMLElement): Criterion[] {
  const rubric = root.querySelector("edu-rubric");
  if (!rubric) return [];
  return rubric.querySelectorAll("criterion").map((c) => {
    const weightRaw = c.getAttribute("weight")?.trim() ?? "0";
    const weight = Number(weightRaw);
    return {
      objectiveId: c.getAttribute("objective")?.trim() ?? "",
      weight: Number.isFinite(weight) ? weight : NaN,
      text: c.textContent.trim(),
    };
  });
}

function parseTermination(root: HTMLElement): Termination {
  const el = root.querySelector("edu-termination");
  if (!el) {
    return { manualEnd: false };
  }
  const turnText = childText(el, "turn-limit");
  const timeText = childText(el, "time-limit");
  const checkText = childText(el, "objective-check-every");
  const manualText = childText(el, "manual-end", "false").toLowerCase();
  const result: Termination = { manualEnd: manualText === "true" };
  if (turnText) {
    const n = Number(turnText);
    if (Number.isFinite(n)) result.turnLimit = n;
  }
  if (timeText) {
    const n = Number(timeText);
    if (Number.isFinite(n)) result.timeLimitSeconds = n;
  }
  if (checkText) {
    const n = Number(checkText);
    if (Number.isFinite(n)) result.objectiveCheckEvery = n;
  }
  return result;
}

export function parseComposition(html: string): Composition {
  const root = requireRoot(html);
  const scenarioEl = root.querySelector("edu-scenario");
  return {
    id: root.getAttribute("id")?.trim() ?? "",
    runtimeVersion: root.getAttribute("runtime-version")?.trim() ?? "",
    persona: parsePersona(root),
    scenario: scenarioEl?.textContent.trim() ?? "",
    objectives: parseObjectives(root),
    rubric: { criteria: parseRubric(root) },
    termination: parseTermination(root),
    raw: html,
  };
}
