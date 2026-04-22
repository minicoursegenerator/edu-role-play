import type { ChatMessage, CompositionData } from "./types";

export function buildSystemPrompt(comp: CompositionData): string {
  const p = comp.persona;
  return [
    `You are role-playing as ${p.name}${p.role ? `, ${p.role}` : ""}.`,
    p.background ? `Background: ${p.background}` : "",
    p.goals ? `Your goals: ${p.goals}` : "",
    p.constraints ? `Your constraints: ${p.constraints}` : "",
    p.speechPatterns ? `Speech patterns: ${p.speechPatterns}` : "",
    "",
    `Scenario context (from the learner's side): ${comp.scenario}`,
    ...comp.contextBlocks.flatMap((b) => [
      "",
      b.title ? `${b.title}: ${b.body}` : b.body,
    ]),
    "",
    "Rules:",
    "- Stay strictly in character. Do not break the fourth wall.",
    "- Do not reveal you are an AI or coach the learner.",
    "- Respond naturally, 1-4 sentences unless a longer answer is warranted.",
    "- React realistically to weak or strong arguments.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function reinjectSystem(
  comp: CompositionData,
  history: ChatMessage[],
): ChatMessage[] {
  const filtered = history.filter((m) => m.role !== "system");
  return [{ role: "system", content: buildSystemPrompt(comp) }, ...filtered];
}
