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
    "- Stay strictly in character in the visible reply. Do not break the fourth wall inside your spoken response.",
    "- Do not reveal you are an AI inside the in-character reply.",
    "- Respond naturally, 1-4 sentences unless a longer answer is warranted.",
    "- React realistically to weak or strong arguments.",
    "",
    "Coaching tips (out-of-character):",
    "- After your in-character reply, if and only if the learner's last message shows a clear, teachable weakness (e.g., generic pitch, no discovery questions, ignoring an objection, weak framing, missed objective), append ONE coaching tip.",
    "- Format the tip on its own line at the very end, EXACTLY as: [TIP: <one short sentence of concrete advice to the learner>]",
    "- The tip is stripped from the visible message by the runtime, so it does not break character for the learner reading the transcript.",
    "- Emit at most one tip per reply. Skip the tip entirely when the learner is doing well or the weakness is minor — do not force a tip every turn.",
    "- Never put the tip inside quotes, inside your in-character reply, or anywhere other than the final line.",
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
