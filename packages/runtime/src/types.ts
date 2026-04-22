export type ProviderId = "cloudflare" | "openai" | "anthropic";

export interface RuntimeConfig {
  provider: ProviderId;
  apiKey: string;
  accountId?: string;
  model: string;
  baseUrl?: string;
}

export interface UserKeyConfig {
  provider: ProviderId;
  apiKey: string;
  accountId?: string;
  model?: string;
}

export interface PersonaData {
  name: string;
  role: string;
  background: string;
  goals: string;
  constraints: string;
  speechPatterns: string;
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

export interface CompositionData {
  id: string;
  persona: PersonaData;
  scenario: string;
  contextBlocks: ContextBlock[];
  objectives: ObjectiveData[];
  rubric: CriterionData[];
  termination: TerminationData;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Provider {
  chat(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string>;
}

export interface ScoreResult {
  total: number;
  maxTotal: number;
  perObjective: Array<{ id: string; score: number; maxScore: number; improvement: string }>;
  summary: string;
}
