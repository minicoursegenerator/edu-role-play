export interface Persona {
  name: string;
  role: string;
  background: string;
  goals: string;
  constraints: string;
  speechPatterns: string;
  avatar: string;
}

export interface Objective {
  id: string;
  text: string;
}

export interface Criterion {
  objectiveId: string;
  weight: number;
  text: string;
}

export interface Rubric {
  criteria: Criterion[];
}

export interface Termination {
  turnLimit?: number;
  timeLimitSeconds?: number;
  objectiveCheckEvery?: number;
  manualEnd: boolean;
}

export interface Composition {
  id: string;
  runtimeVersion: string;
  persona: Persona;
  scenario: string;
  objectives: Objective[];
  rubric: Rubric;
  termination: Termination;
  raw: string;
}

export type LintSeverity = "error" | "warning";

export interface LintIssue {
  rule: string;
  severity: LintSeverity;
  message: string;
}
