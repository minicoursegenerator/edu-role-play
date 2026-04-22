import type { ChatMessage, CompositionData, Provider, ScoreResult } from "./types";

function extractJsonObject(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function buildScoringPrompt(comp: CompositionData, history: ChatMessage[]): string {
  const transcript = history
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "LEARNER" : "PERSONA"}: ${m.content}`)
    .join("\n");

  const rubric = comp.rubric
    .map(
      (c) =>
        `- objective "${c.objectiveId}" (weight ${c.weight}): ${c.text}`,
    )
    .join("\n");

  return (
    `Score the learner against the rubric below. For each objective, assign an integer ` +
    `score from 0 to the weight (max = weight, min = 0) and give one concrete improvement tip. ` +
    `Also write a 1-2 sentence overall summary.\n\n` +
    `Rubric:\n${rubric}\n\nTranscript:\n${transcript}\n\n` +
    `Respond with JSON only, shaped exactly:\n` +
    `{"perObjective":[{"id":"<id>","score":<int>,"improvement":"<string>"}],` +
    `"summary":"<string>"}`
  );
}

export async function scoreTranscript(
  provider: Provider,
  comp: CompositionData,
  history: ChatMessage[],
): Promise<ScoreResult> {
  const prompt = buildScoringPrompt(comp, history);
  const messages: ChatMessage[] = [
    { role: "system", content: "You are a strict but fair rubric grader. Output only JSON." },
    { role: "user", content: prompt },
  ];

  let reply = "";
  try {
    reply = await provider.chat(messages, { temperature: 0 });
  } catch (e) {
    reply = "";
  }
  let parsed = extractJsonObject(reply) as
    | { perObjective?: Array<{ id: string; score: number; improvement: string }>; summary?: string }
    | null;

  if (!parsed || !Array.isArray(parsed.perObjective)) {
    // retry once
    try {
      reply = await provider.chat(messages, { temperature: 0 });
      parsed = extractJsonObject(reply) as typeof parsed;
    } catch {
      /* swallow */
    }
  }

  const weights = new Map(comp.rubric.map((c) => [c.objectiveId, c.weight]));
  const maxTotal = comp.rubric.reduce((s, c) => s + c.weight, 0);

  const per = comp.objectives.map((o) => {
    const w = weights.get(o.id) ?? 0;
    const found = parsed?.perObjective?.find((p) => p.id === o.id);
    const rawScore = Number(found?.score);
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(w, Math.round(rawScore))) : 0;
    return {
      id: o.id,
      score,
      maxScore: w,
      improvement: found?.improvement?.trim() || "No feedback returned.",
    };
  });

  const total = per.reduce((s, p) => s + p.score, 0);
  return {
    total,
    maxTotal,
    perObjective: per,
    summary: parsed?.summary?.trim() || "No summary returned.",
  };
}
