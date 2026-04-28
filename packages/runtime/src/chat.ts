import type { ChatMessage, CompositionData } from "./types";

export function buildSystemPrompt(comp: CompositionData): string {
  const p = comp.persona;
  return [
    `You are role-playing as ${p.name}${p.role ? `, ${p.role}` : ""}. This is the ONLY role you play in this conversation.`,
    p.background ? `Background: ${p.background}` : "",
    p.goals ? `Your goals: ${p.goals}` : "",
    p.constraints ? `Your constraints: ${p.constraints}` : "",
    p.speechPatterns ? `Speech patterns: ${p.speechPatterns}` : "",
    "",
    `Scenario context — this describes THE LEARNER's role and situation, NOT yours. The learner is the human user you are talking to. Any "You are..." phrasing inside this scenario refers to THEM, not you. Read it as background on who is talking to you, but do NOT adopt their job title, employer, or perspective:`,
    comp.scenario,
    ...comp.contextBlocks.flatMap((b) => [
      "",
      b.title ? `${b.title}: ${b.body}` : b.body,
    ]),
    "",
    "Rules:",
    `- You are ${p.name}${p.role ? ` (${p.role})` : ""}. Every visible reply must be from this character only.`,
    "- The 'user' messages in this conversation come from THE LEARNER, who is playing the counterpart role described in the scenario above. Never speak as the learner. Never answer your own questions on their behalf. Never adopt their job title, perspective, or goals — even if their message sounds like something you might say.",
    "- If the learner sends a message that sounds like it came from your side of the table (e.g., they ask a question only you would ask, or they speak as if they were you), stay in character and respond as your character naturally would — usually by treating it as a confused or off-topic remark from them, not by switching sides.",
    "- Stay strictly in character in the visible reply. Do not break the fourth wall inside your spoken response.",
    "- Do not reveal you are an AI inside the in-character reply.",
    "- Do not wrap the entire visible reply in quotation marks.",
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

export function normalizePersonaReply(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 2) return trimmed;

  const tipMatch = trimmed.match(/([\s\r\n]*\[TIP:[\s\S]*\]\s*)$/);
  if (tipMatch?.index && tipMatch.index > 0) {
    const visible = trimmed.slice(0, tipMatch.index);
    return `${stripEnclosingQuotes(visible)}${tipMatch[1]}`.trim();
  }

  return stripEnclosingQuotes(trimmed);
}

function stripEnclosingQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 2) return trimmed;
  const pairs: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
  ];

  for (const [open, close] of pairs) {
    if (trimmed.startsWith(open) && trimmed.endsWith(close)) {
      return trimmed.slice(open.length, -close.length).trim();
    }
  }

  return trimmed;
}

export function reinjectSystem(
  comp: CompositionData,
  history: ChatMessage[],
): ChatMessage[] {
  const filtered = history.filter((m) => m.role !== "system");
  return [{ role: "system", content: buildSystemPrompt(comp) }, ...filtered];
}
