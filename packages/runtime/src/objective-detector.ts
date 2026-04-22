import type { ChatMessage, CompositionData, Provider } from "./types";

function extractJsonArray(text: string): unknown {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function detectCompletedObjectives(
  provider: Provider,
  comp: CompositionData,
  history: ChatMessage[],
): Promise<Set<string>> {
  const transcript = history
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "LEARNER" : "PERSONA"}: ${m.content}`)
    .join("\n");
  const objectiveList = comp.objectives
    .map((o) => `- ${o.id}: ${o.text}`)
    .join("\n");

  const prompt =
    `Given this conversation transcript and objective list, return a JSON array of ` +
    `objective ids that are clearly satisfied by observable evidence in the transcript. ` +
    `Return only the JSON array, no prose.\n\n` +
    `Objectives:\n${objectiveList}\n\nTranscript:\n${transcript}\n\nJSON:`;

  try {
    const reply = await provider.chat(
      [
        { role: "system", content: "You are an observation grader. Output only JSON." },
        { role: "user", content: prompt },
      ],
      { temperature: 0 },
    );
    const arr = extractJsonArray(reply);
    if (!Array.isArray(arr)) return new Set();
    return new Set(
      arr.filter((v): v is string => typeof v === "string" && v.length > 0),
    );
  } catch {
    return new Set();
  }
}
