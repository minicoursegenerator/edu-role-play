import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors, CompositionParseError } from "@edu-role-play/core";

export function lintCommand(file: string): number {
  const path = resolve(process.cwd(), file);
  let html: string;
  try {
    html = readFileSync(path, "utf8");
  } catch (err) {
    console.error(`Cannot read ${path}: ${(err as Error).message}`);
    return 1;
  }

  let comp;
  try {
    comp = parseComposition(html);
  } catch (err) {
    if (err instanceof CompositionParseError) {
      console.error(`${path}: parse error: ${err.message}`);
      return 1;
    }
    throw err;
  }

  const issues = lint(comp);
  if (issues.length === 0) {
    console.log(`${path}: ok`);
    return 0;
  }

  for (const issue of issues) {
    const tag = issue.severity === "error" ? "error" : "warn";
    console.log(`${path}: ${tag} ${issue.rule}: ${issue.message}`);
  }
  return hasErrors(issues) ? 1 : 0;
}
