import type { Composition, LintIssue } from "./types.js";

export const CURRENT_RUNTIME_VERSION = "0.1.0";

// Per-locale vague verbs. The objective-observable rule fires when an objective
// uses one of these. Locales not in the map fall back to English.
const VAGUE_VERBS_BY_LOCALE: Record<string, string[]> = {
  en: ["understand", "understands", "understanding", "know", "knows", "knowing", "feel", "feels", "feeling", "appreciate", "appreciates", "be aware", "aware of", "learn about", "learns about", "familiarize", "familiarise"],
  es: ["entender", "entiende", "comprender", "comprende", "saber", "sabe", "sentir", "siente", "apreciar", "aprecia", "ser consciente", "estar consciente", "familiarizarse", "conocer"],
  fr: ["comprendre", "comprend", "savoir", "sait", "ressentir", "ressent", "apprécier", "apprecie", "être conscient", "se familiariser", "connaître", "connait"],
  de: ["verstehen", "versteht", "wissen", "weiß", "fühlen", "fühlt", "schätzen", "schätzt", "bewusst sein", "sich bewusst", "kennenlernen", "vertraut machen"],
  pt: ["entender", "entende", "compreender", "compreende", "saber", "sabe", "sentir", "sente", "apreciar", "aprecia", "estar ciente", "familiarizar", "conhecer"],
  it: ["capire", "capisce", "comprendere", "comprende", "sapere", "sa", "sentire", "sente", "apprezzare", "apprezza", "essere consapevole", "familiarizzare", "conoscere"],
  tr: ["anlamak", "anlar", "anlasın", "bilmek", "bilir", "bilsin", "hissetmek", "hisseder", "takdir etmek", "takdir eder", "farkında olmak", "farkında olsun", "öğrenmek hakkında", "aşina olmak", "aşina olsun"],
  ja: ["理解する", "理解", "知る", "感じる", "感じ取る", "把握する", "意識する", "馴染む"],
  zh: ["理解", "了解", "知道", "感受", "感觉", "欣赏", "意识到", "熟悉"],
  ar: ["يفهم", "فهم", "يعرف", "معرفة", "يشعر", "شعور", "يقدر", "تقدير", "يدرك", "إدراك", "يتعرف", "تعرف"],
};

// Per-locale second-person markers. The scenario-second-person rule fires when
// none of these appear in the scenario. English uses pronouns; many languages
// rely on verb endings, so the pattern lists common forms. Locales not in the
// map skip the check (warn-only via WARN_ONLY_SECOND_PERSON_LOCALES below).
const SECOND_PERSON_BY_LOCALE: Record<string, RegExp> = {
  en: /\byou\b|\byour\b|\byou're\b|\byourself\b/i,
  es: /\btú\b|\busted\b|\btu\b|\btus\b|\bsus\b|\bte\b/i,
  fr: /\btu\b|\btoi\b|\bvous\b|\bton\b|\bta\b|\btes\b|\bvotre\b|\bvos\b/i,
  de: /\bdu\b|\bdich\b|\bdir\b|\bdein(e|en|er|es)?\b|\bsie\b|\bihnen\b|\bihr(e|en|er|es)?\b/i,
  pt: /\btu\b|\bvocê\b|\bvoce\b|\bteu\b|\btua\b|\bseu\b|\bsua\b|\bte\b/i,
  it: /\btu\b|\blei\b|\btuo\b|\btua\b|\btuoi\b|\btue\b|\bti\b/i,
  tr: /\bsen\b|\bsiz\b|\bsana\b|\bsize\b|\bseni\b|\bsizi\b|\bsenin\b|\bsizin\b|(sın|sin|sun|sün|siniz|sınız|sunuz|sünüz|yorsun|yorsunuz)\b/i,
  ar: /\bأنت\b|\bأنتَ\b|\bأنتِ\b|\bأنتم\b|\bك\b/,
};

// For locales where second-person detection via regex is unreliable (CJK
// languages without spaces / pronoun-drop), downgrade scenario-second-person
// from error to warning instead of skipping silently.
const WARN_ONLY_SECOND_PERSON_LOCALES = new Set(["ja", "zh"]);

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
  const locale = (comp.locale || "en").toLowerCase();
  const vagueVerbs = VAGUE_VERBS_BY_LOCALE[locale] ?? VAGUE_VERBS_BY_LOCALE.en;
  // Languages without word boundaries on whitespace (CJK) need substring matching.
  const usesWordBoundaries = !["ja", "zh"].includes(locale);
  for (const o of comp.objectives) {
    if (!o.id) {
      issues.push(err("objective-id", `Objective missing id: "${o.text.slice(0, 40)}"`));
      continue;
    }
    const lower = o.text.toLowerCase();
    const hit = vagueVerbs.find((v) => {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = usesWordBoundaries
        ? new RegExp(`\\b${escaped}\\b`, "u")
        : new RegExp(escaped, "u");
      return re.test(lower);
    });
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
    const secondPerson = SECOND_PERSON_BY_LOCALE[locale];
    const isWarnOnly = WARN_ONLY_SECOND_PERSON_LOCALES.has(locale);
    if (secondPerson && !secondPerson.test(comp.scenario)) {
      const issue =
        isWarnOnly
          ? warn("scenario-second-person", "<edu-scenario> should address the learner directly (locale-specific second-person check is best-effort).")
          : err("scenario-second-person", "<edu-scenario> should address the learner (use second-person forms appropriate to the locale).");
      issues.push(issue);
    } else if (!secondPerson && isWarnOnly) {
      issues.push(
        warn(
          "scenario-second-person",
          `<edu-scenario>: second-person check skipped for locale "${locale}".`,
        ),
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
