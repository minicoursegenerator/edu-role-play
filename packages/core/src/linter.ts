import type { Composition, LintIssue } from "./types.js";

export const CURRENT_RUNTIME_VERSION = "0.1.0";

const VAGUE_VERBS = [
  "understand",
  "know",
  "feel",
  "appreciate",
  "be aware",
  "learn about",
  "familiarize",
];

function err(rule: string, message: string): LintIssue {
  return { rule, severity: "error", message };
}

function warn(rule: string, message: string): LintIssue {
  return { rule, severity: "warning", message };
}

export function lint(comp: Composition): LintIssue[] {
  const issues: LintIssue[] = [];

  if (!comp.id) issues.push(err("root-id", "<edu-role-play> missing id attribute"));

  // Rule 1: observable objectives
  for (const o of comp.objectives) {
    if (!o.id) {
      issues.push(err("objective-id", `Objective missing id: "${o.text.slice(0, 40)}"`));
      continue;
    }
    const lower = o.text.toLowerCase();
    const hit = VAGUE_VERBS.find((v) =>
      new RegExp(`\\b${v.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`).test(lower),
    );
    if (hit) {
      issues.push(
        err(
          "objective-observable",
          `Objective "${o.id}" uses vague verb "${hit}"; prefer observable actions (ask, state, confirm, secure, quantify).`,
        ),
      );
    }
  }

  // Rule 2: rubric covers every objective and vice versa
  const objectiveIds = new Set(comp.objectives.map((o) => o.id).filter(Boolean));
  const criterionIds = new Set(
    comp.rubric.criteria.map((c) => c.objectiveId).filter(Boolean),
  );
  for (const id of objectiveIds) {
    if (!criterionIds.has(id)) {
      issues.push(err("rubric-coverage", `Objective "${id}" has no matching <criterion>.`));
    }
  }
  for (const id of criterionIds) {
    if (!objectiveIds.has(id)) {
      issues.push(
        err("rubric-orphan", `<criterion objective="${id}"> does not match any objective.`),
      );
    }
  }

  // Rule 3: persona goals + constraints populated
  if (!comp.persona.name) issues.push(err("persona-name", "<edu-persona> missing name attribute"));
  if (!comp.persona.goals) issues.push(err("persona-goals", "<edu-persona> missing <goals>"));
  if (!comp.persona.constraints)
    issues.push(err("persona-constraints", "<edu-persona> missing <constraints>"));

  // Rule 4: termination hard cap
  if (comp.termination.turnLimit == null && comp.termination.timeLimitSeconds == null) {
    issues.push(
      err(
        "termination-hard-cap",
        "<edu-termination> must include <turn-limit> or <time-limit>.",
      ),
    );
  }

  // Rule 5: scenario references persona and uses second person
  if (!comp.scenario) {
    issues.push(err("scenario-missing", "<edu-scenario> is empty."));
  } else {
    if (
      comp.persona.name &&
      !comp.scenario.toLowerCase().includes(comp.persona.name.toLowerCase())
    ) {
      issues.push(
        err(
          "scenario-persona-ref",
          `<edu-scenario> does not mention persona "${comp.persona.name}".`,
        ),
      );
    }
    if (!/\byou\b|\byour\b/i.test(comp.scenario)) {
      issues.push(
        err("scenario-second-person", "<edu-scenario> should address the learner (use \"you\" / \"your\")."),
      );
    }
  }

  // Rule 6: rubric weights positive integers, sum in [1, 20]
  let weightSum = 0;
  for (const c of comp.rubric.criteria) {
    if (!Number.isFinite(c.weight) || c.weight <= 0 || !Number.isInteger(c.weight)) {
      issues.push(
        err(
          "rubric-weight-positive-int",
          `<criterion objective="${c.objectiveId}"> weight must be a positive integer (got ${c.weight}).`,
        ),
      );
    } else {
      weightSum += c.weight;
    }
  }
  if (comp.rubric.criteria.length > 0 && (weightSum < 1 || weightSum > 20)) {
    issues.push(
      err(
        "rubric-weight-sum",
        `Rubric weights must sum within [1, 20] (got ${weightSum}).`,
      ),
    );
  }

  // Warn: runtime-version staleness
  if (!comp.runtimeVersion) {
    issues.push(warn("runtime-version", "<edu-role-play> missing runtime-version attribute."));
  } else if (comp.runtimeVersion !== CURRENT_RUNTIME_VERSION) {
    issues.push(
      warn(
        "runtime-version-stale",
        `runtime-version="${comp.runtimeVersion}" differs from current ${CURRENT_RUNTIME_VERSION}; re-bundle to pick up fixes.`,
      ),
    );
  }

  return issues;
}

export function hasErrors(issues: LintIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
