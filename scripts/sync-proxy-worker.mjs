#!/usr/bin/env node
// Mirror packages/cli/templates/proxy-worker/ → a target directory (the
// standalone deployable repo). Used to keep the CLI-bundled template and
// the public Deploy-to-Cloudflare repo in sync.
//
// Usage:
//   node scripts/sync-proxy-worker.mjs <target-dir>
//
// The target dir is wiped (except .git) and repopulated. A README with the
// "Deploy to Cloudflare" button is written on top of the template README.

import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const templateDir = join(repoRoot, "packages/cli/templates/proxy-worker");

const targetArg = process.argv[2];
if (!targetArg) {
  console.error("usage: node scripts/sync-proxy-worker.mjs <target-dir>");
  process.exit(1);
}
const target = resolve(targetArg);

if (!existsDir(templateDir)) {
  console.error(`template missing: ${templateDir}`);
  process.exit(1);
}
mkdirSync(target, { recursive: true });

for (const entry of readdirSync(target)) {
  if (entry === ".git") continue;
  rmSync(join(target, entry), { recursive: true, force: true });
}

cpSync(templateDir, target, { recursive: true });

writeFileSync(join(target, "README.md"), buildReadme(), "utf8");

console.log(`synced → ${target}`);
console.log("commit + push to publish.");

function existsDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function buildReadme() {
  const repoUrl = "https://github.com/minicoursegenerator/edu-role-play-proxy";
  return `# edu-role-play-proxy

Cloudflare Worker that fronts \`edu-role-play\` bundles. Learners' bundled HTML calls this Worker; the Worker calls the model. API keys live as Worker secrets — never in the HTML.

## One-click deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${repoUrl})

After deploy, in the Cloudflare dashboard go to your new Worker → **Settings → Variables and Secrets → Add variable** and add **one** of:

- \`ANTHROPIC_API_KEY\` (recommended for role-play quality — Claude holds character better)
- \`OPENAI_API_KEY\`

Mark it as a **Secret** (encrypted). With neither set, the Worker falls back to Cloudflare Workers AI (free, lower quality).

## Point a bundled HTML at this Worker

Two ways, no re-bundle required:

1. Open \`your-roleplay.bundled.html\` and add this to \`<head>\`:
   \`\`\`html
   <meta name="edu-role-play-proxy" content="https://<your-worker>.workers.dev">
   \`\`\`
2. Or share the URL with a query param: \`your-roleplay.bundled.html?erp-proxy=https://<your-worker>.workers.dev\`

## Endpoint

\`\`\`
POST /v1/chat
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "..." }],
  "model":   "@cf/meta/llama-3.1-8b-instruct",   // optional
  "temperature": 0.7,                             // optional, clamped 0..2
  "maxTokens": 512                                // optional, capped at 1024
}
\`\`\`

Response: \`{ "text": "..." }\`. Errors: \`{ "error": "...", "code"?: "rate_limited" | "upstream_error" }\`.

## Provider precedence

Picked at request time:

1. \`ANTHROPIC_API_KEY\` set → Anthropic Messages API (default \`claude-haiku-4-5-20251001\`)
2. \`OPENAI_API_KEY\` set → OpenAI Chat Completions (default \`gpt-4o-mini\`)
3. Neither set → Cloudflare Workers AI via \`env.AI\` (default \`@cf/meta/llama-3.1-8b-instruct\`)

## Rate limiting

Built-in: 30 requests per IP per 60s (\`RL\` binding). Tune in \`wrangler.toml\` and redeploy.

## Privacy

The Worker does not log request or response bodies (they contain learner transcripts). Standard Workers logs (IP, status, model) appear in your Cloudflare dashboard.

## Source

This file is generated from \`packages/cli/templates/proxy-worker/\` in [edu-role-play](https://github.com/minicoursegenerator/edu-role-play) via \`scripts/sync-proxy-worker.mjs\`. Send PRs to that repo.
`;
}
