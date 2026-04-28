import type {
  ActivityEvent,
  ChatMessage,
  CompositionData,
  ResultSnapshot,
  ScoreResult,
} from "./types";

export function scorePercent(total: number, maxTotal: number): number {
  if (maxTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((total / maxTotal) * 100)));
}

export function createSessionId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return `erp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createResultSnapshot(args: {
  comp: CompositionData;
  sessionId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  history: ChatMessage[];
  completedObjectives: Set<string>;
  result: ScoreResult;
  events: ActivityEvent[];
}): ResultSnapshot {
  const { comp, result } = args;
  return {
    schemaVersion: 1,
    composition: {
      id: comp.id,
      personaName: comp.persona.name,
      personaRole: comp.persona.role,
      difficulty: comp.difficulty,
      objectives: comp.objectives,
    },
    session: {
      id: args.sessionId,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
      durationSeconds: args.durationSeconds,
      userAgent: navigator.userAgent,
    },
    score: {
      total: result.total,
      maxTotal: result.maxTotal,
      percent: scorePercent(result.total, result.maxTotal),
      status: "completed",
      summary: result.summary,
      perObjective: result.perObjective,
    },
    completedObjectives: Array.from(args.completedObjectives),
    transcript: args.history
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content })),
    events: args.events,
  };
}
