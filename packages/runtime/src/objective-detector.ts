import type { ChatMessage, CompositionData, Provider } from "./types";
import { ObjectiveState } from "./types";

interface DetectedEntry {
  id: string;
  state: number;
  count?: string;
}

/** Parse lines with optional [evidence] suffix. State defaults to 2. */
function parseEntries(text: string): DetectedEntry[] {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/\s*```/g, "").trim();

  const result: DetectedEntry[] = [];
  for (const line of cleaned.split(/[\n,]+/)) {
    let trimmed = line.replace(/^[-*\d.\s<>]+/, "").trim();
    if (!trimmed) continue;
    // Extract evidence quote in [brackets] (store for quality monitoring)
    let _evidence = "";
    const bracketMatch = trimmed.match(/\[([\s\S]*?)\]/);
    if (bracketMatch) {
      _evidence = bracketMatch[1].trim();
      trimmed = trimmed.replace(/\s*\[[\s\S]*?\]/, "").trim();
    }
    // Try "id: state" format (backward compat)
    const colon = trimmed.lastIndexOf(":");
    if (colon > 0) {
      let id = trimmed.slice(0, colon).trim();
      id = id.replace(/^[^a-zA-Z0-9_]+|[^a-zA-Z0-9_-]+$/g, "");
      let stateRaw = trimmed.slice(colon + 1).trim();
      stateRaw = stateRaw.replace(/^[^\d]+/, "");
      const state = Number(stateRaw);
      if (id && (state >= 0 && state <= 2)) {
        result.push({ id, state: state || 2 });
        continue;
      }
    }
    // Plain ID — state 2
    result.push({ id: trimmed, state: 2 });
  }
  return result;
}

export async function detectCompletedObjectives(
  provider: Provider,
  comp: CompositionData,
  history: ChatMessage[],
): Promise<ObjectiveStatusMap> {
  // Only send learner messages — persona responses can bias the detector
  const transcript = history
    .filter((m) => m.role === "user")
    .map((m) => `LEARNER: ${m.content}`)
    .join("\n");

  // Build rubric reference map: objectiveId → full credit description
  const rubricMap = new Map<string, string>();
  for (const c of comp.rubric) {
    rubricMap.set(c.objectiveId, c.text);
  }

  const objectivesWithRef = comp.objectives
    .map((o) => {
      const ref = rubricMap.get(o.id);
      // Use AI-facing detectText when available, otherwise fall back to human text
      const objText = o.detectText;
      const partialMatch = ref?.match(/[Pp]artial[\s\S]*?\./);
      const zeroMatch = ref?.match(/[Zz]ero[\s\S]*?(?:\.|$)/);
      const negLines: string[] = [];
      if (partialMatch) negLines.push(`  Does NOT count (partial): ${partialMatch[0].replace(/^[Pp]artial/i, "").trim()}`);
      if (zeroMatch) negLines.push(`  Does NOT count (zero): ${zeroMatch[0].replace(/^[Zz]ero/i, "").trim()}`);
      const refLine = ref ? `  Full credit: ${ref}` : "";
      return [`- ${o.id}: ${objText}`, refLine, ...negLines].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const prompt =
    `Only the LEARNER's actual questions or statements count. ` +
    `Greetings, pleasantries, and accepting offered items do NOT count.\n\n` +
    `For each objective below, compare what the learner actually said against ` +
    `both the full credit and the DOES NOT COUNT descriptions. ` +
    `Output the objective ID followed by a brief evidence quote in brackets.\n` +
    `List the ID only if there is real progress toward the full credit standard.\n` +
    `If the learner'\''s contribution matches a "Does NOT count" description, ` +
    `EXCLUDE that objective even if there is some superficial resemblance.\n\n` +
    `Objectives:\n${objectivesWithRef}\n\n` +
    `Conversation:\n${transcript}\n\n` +
    `Return ONLY the IDs with evidence, one per line:\n` +
    `ask-contextual-questions [learner asked about Roman trade]\n` +
    `explore-conversion-experience [learner asked about baptism]`;

  try {
    const reply = await provider.chat(
      [
        { role: "system", content: "You list objective IDs where the learner made progress." },
        { role: "user", content: prompt },
      ],
      { temperature: 0 },
    );
    let entries = parseEntries(reply);
    // Retry once on parse failure with slight temperature variation
    if (entries.length === 0) {
      const retry = await provider.chat(
        [
          { role: "system", content: "You list objective IDs." },
          { role: "user", content: prompt },
        ],
        { temperature: 0.1 },
      );
      entries = parseEntries(retry);
    }
    if (entries.length === 0) return new Map();

    const validIds = new Set(comp.objectives.map((o) => o.id));

    const result: ObjectiveStatusMap = new Map();
    for (const { id, state, count } of entries) {
      if (!validIds.has(id)) continue;
      result.set(id, { state: state as ObjectiveState, evidence: "detected", count });
    }
    return result;
  } catch {
    return new Map();
  }
}
