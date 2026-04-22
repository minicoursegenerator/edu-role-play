#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors, CompositionParseError } from "@edu-role-play/core";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: validate.mjs <composition.html> [more.html ...]");
  process.exit(2);
}

let anyError = false;
for (const file of files) {
  const path = resolve(process.cwd(), file);
  let html;
  try {
    html = readFileSync(path, "utf8");
  } catch (err) {
    console.error(`${path}: cannot read: ${err.message}`);
    anyError = true;
    continue;
  }
  let comp;
  try {
    comp = parseComposition(html);
  } catch (err) {
    if (err instanceof CompositionParseError) {
      console.error(`${path}: parse error: ${err.message}`);
      anyError = true;
      continue;
    }
    throw err;
  }
  const issues = lint(comp);
  if (issues.length === 0) {
    console.log(`${path}: ok`);
    continue;
  }
  for (const issue of issues) {
    const tag = issue.severity === "error" ? "error" : "warn";
    console.log(`${path}: ${tag} ${issue.rule}: ${issue.message}`);
  }
  if (hasErrors(issues)) anyError = true;
}

process.exit(anyError ? 1 : 0);
