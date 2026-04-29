// The runtime only ships with the self-hosted Worker proxy provider —
// the proxy calls Cloudflare Workers AI through its binding so no key
// ships in the HTML.
export type ProviderId = "proxy";

export interface RuntimeConfig {
  provider: ProviderId;
  apiKey: string;
  accountId?: string;
  // Empty string means "let the proxy pick its default".
  model: string;
  baseUrl?: string;
  bundleId?: string;
  scorm?: {
    enabled: boolean;
    version: "1.2";
  };
}

export interface PersonaData {
  name: string;
  role: string;
  background: string;
  goals: string;
  constraints: string;
  speechPatterns: string;
  avatar: string;
}

export interface ObjectiveData {
  id: string;
  text: string;
}

export interface CriterionData {
  objectiveId: string;
  weight: number;
  text: string;
}

export interface TerminationData {
  turnLimit?: number;
  timeLimitSeconds?: number;
  objectiveCheckEvery?: number;
  manualEnd: boolean;
}

export interface ContextBlock {
  title?: string;
  body: string;
}

export type Difficulty = "easy" | "realistic" | "tough";

export interface CompositionData {
  id: string;
  persona: PersonaData;
  scenario: string;
  contextBlocks: ContextBlock[];
  objectives: ObjectiveData[];
  rubric: CriterionData[];
  termination: TerminationData;
  difficulty: Difficulty;
  /** BCP-47-ish base code, e.g. "en", "tr". Drives UI chrome translations. */
  locale: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOpts {
  temperature?: number;
}

export interface Provider {
  chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string>;
  chatStream(messages: ChatMessage[], opts?: ChatOpts): AsyncIterable<string>;
}

export interface ScoreResult {
  total: number;
  maxTotal: number;
  perObjective: Array<{ id: string; score: number; maxScore: number; improvement: string }>;
  summary: string;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  content: string;
}

export interface ActivityEvent {
  type:
    | "launch"
    | "briefing_start"
    | "roleplay_start"
    | "turn"
    | "hint"
    | "objective_check"
    | "finish"
    | "scoring"
    | "results_ready"
    | "result_download"
    | "restart"
    | "error";
  at: string;
  data?: Record<string, unknown>;
}

export interface ResultSnapshot {
  schemaVersion: 1;
  composition: {
    id: string;
    personaName: string;
    personaRole: string;
    difficulty: Difficulty;
    objectives: ObjectiveData[];
  };
  session: {
    id: string;
    startedAt: string;
    completedAt: string;
    durationSeconds: number;
    userAgent: string;
  };
  score: {
    total: number;
    maxTotal: number;
    percent: number;
    status: "completed";
    summary: string;
    perObjective: ScoreResult["perObjective"];
  };
  completedObjectives: string[];
  transcript: TranscriptEntry[];
  events: ActivityEvent[];
}
