# edu-role-play

https://github.com/user-attachments/assets/6cbc1229-82f3-4c5f-84f0-fb085b393784

Generate interactive AI role-play training activities as self-contained HTML. Built for AI coding agents (Claude Code, Cursor, Gemini CLI, Codex) via the [Agent Skills](https://agentskills.io) open standard.

A role-play here means a learner-vs-AI-character drill — sales pitches, customer de-escalation, compliance interviews, manager coaching, clinical intake, anything where a person needs to practice a conversation against a believable counterpart with clear objectives and a rubric. The output is one HTML file you can paste anywhere that accepts HTML.

- **Agent-first authoring.** Describe the scenario in plain language; the skill writes a structured composition, lints it against pedagogical rules, and bundles it.
- **Single-file output.** No build step on the consumer side. Drop the HTML into an LMS, a static site, or a [Mini Course Generator](https://minicoursegenerator.com) Freeform Card.
- **No API keys in the HTML.** Inference goes through a Cloudflare Worker proxy you deploy once.
- **LMS-ready.** Bundle as plain HTML or as a SCORM 1.2 package.
- **Open format.** Compositions are HTML with custom elements (`<edu-role-play>`, `<edu-persona>`, `<edu-objective>`, `<edu-rubric>`, …) — diff-able, version-controllable, hand-editable.

## Why this exists

LLMs can already do role-play, but generic chat doesn't translate into corporate training. Personas drift after 4 turns, output doesn't go to your LMS, and there's no rubric for the learner. edu-role-play closes that gap: structured persona, scored rubric, SCORM export. Open source so you own it. Built on Anthropic's Agent Skills standard, so it works in Claude Code, Cursor, Gemini CLI, or any agent that reads SKILL.md files.

## Table of contents

- [Why this exists](#why-this-exists)
- [Examples](#examples)
- [Install](#install)
- [Quick start](#quick-start)
- [Prompting patterns](#prompting-patterns)
- [How it works](#how-it-works)
- [Composition format](#composition-format)
- [The CLI flow](#the-cli-flow)
- [Inference & sharing](#inference--sharing)
- [Export to SCORM](#export-to-scorm)
- [Repository layout](#repository-layout)
- [FAQ](#faq)
- [Maintainers](#maintainers)
- [License](#license)

## Examples

Live demos you can try in your browser:

- [Manager performance feedback](https://minicoursegenerator.github.io/edu-role-play/demos/performance-feedback.html) — Engineering manager giving difficult feedback to a junior team member
- [Sales objection handling](https://minicoursegenerator.github.io/edu-role-play/demos/sales-objection.html) — Account exec navigating a price objection
- [Customer de-escalation](https://minicoursegenerator.github.io/edu-role-play/demos/customer-deescalation.html) — Support specialist handling an angry customer

Each is a single self-contained HTML file built from the source compositions in [`compositions/`](compositions/). Inference goes through the shared, rate-limited Cloudflare Worker — fine for trying things out, but deploy your own with `npx edu-role-play deploy-proxy` for anything beyond a demo.

## Install

### Option 1: With an AI coding agent (recommended)

Install the edu-role-play skill, then describe the role-play you want:

```bash
npx skills add minicoursegenerator/edu-role-play
```

This teaches your agent (Claude Code, Cursor, Gemini CLI, Codex) how to author pedagogically sound compositions, validate them, and bundle them into self-contained HTML. In Claude Code, the skill registers as a slash command — invoke `/edu-role-play` to start authoring.

Target a specific agent:

```bash
npx skills add minicoursegenerator/edu-role-play -a claude-code
npx skills add minicoursegenerator/edu-role-play -a cursor
```

Install globally (available in every project):

```bash
npx skills add minicoursegenerator/edu-role-play -g
```

### Option 2: Clone the repo

```bash
git clone https://github.com/minicoursegenerator/edu-role-play
cd edu-role-play && npm install && npm run build
```

Then use the CLI directly: `npx edu-role-play <command>`. See [The CLI flow](#the-cli-flow) below.

### Requirements

- Node.js 18+ for the CLI.
- A Cloudflare account if you want to deploy your own inference proxy (free tier is enough for prototyping).
- An Anthropic or OpenAI API key if you want higher-quality models than Cloudflare Workers AI.

## Quick start

In your agent, invoke the skill and describe the role-play you want:

```
Using /edu-role-play, create a role-play where a sales rep practices
pitching our CRM to a skeptical VP of Operations at a mid-market
logistics company.
```

The agent scaffolds the composition, validates it, and bundles it into a single self-contained HTML file. Paste that HTML into a Freeform Card in any [Mini Course Generator](https://minicoursegenerator.com) course — or host it anywhere that accepts HTML.

Working examples to read or remix live in [`compositions/`](compositions/).

## Prompting patterns

**Cold start** — describe from scratch:

> Using /edu-role-play, make a 10-turn compliance auditor role-play focused on GDPR subject access requests, with a pass/fail rubric.

**Warm start** — turn existing context into a role-play:

> Using /edu-role-play, read `sales-playbook.md` and create a role-play for the objection-handling section.

**Iterate** — talk to the agent like an instructional designer:

> Make the persona tougher. She should push back on price twice before engaging.
> Add an objective about uncovering budget authority.
> Bundle it and give me the HTML.

**Tune the rubric** — calibrate scoring after a dry run:

> Re-weight the rubric so "quantify impact" is worth more than "build rapport". Bump the turn limit to 25.

## How it works

A role-play composition is a single HTML file with custom elements declaring the persona, scenario, objectives, and rubric. The runtime (inlined at bundle time) drives a chat loop against a configured LLM, detects objective completion turn-by-turn, and scores the full transcript at the end.

```
author prompt
   │
   ▼
[ agent + skill ]  ──▶  composition (.erp / .html)
                              │
                              ▼
                         [ linter ]   ──── catches missing rubric, vague objectives, …
                              │
                              ▼
                         [ bundler ]  ──── inlines runtime + config
                              │
                              ▼
                  self-contained HTML  ──▶  learner's browser
                                                 │
                                                 ▼
                                          POST {proxy}/v1/chat
                                                 │
                                                 ▼
                                       Cloudflare Worker proxy
                                                 │
                                                 ▼
                                  Workers AI / Anthropic / OpenAI
```

The runtime handles message history, streaming, objective tracking, and end-of-session scoring — all from inside the bundled HTML, with no build step on the consumer side.

## Composition format

```html
<edu-role-play id="sales-pitch-skeptical-buyer" runtime-version="0.1.13">
  <edu-persona name="Sarah Chen" role="VP of Operations">
    <goals>Reduce vendor count by 30% by Q4...</goals>
    <constraints>Budget locked until Q3...</constraints>
    <speech-patterns>Direct; asks for specifics...</speech-patterns>
  </edu-persona>

  <edu-scenario>You are pitching a new CRM to Sarah...</edu-scenario>

  <edu-objective id="discover-pain">Identify a current pain point</edu-objective>
  <edu-objective id="quantify-impact">Get Sarah to share a number</edu-objective>

  <edu-rubric>
    <criterion objective="discover-pain" weight="3">...</criterion>
    <criterion objective="quantify-impact" weight="4">...</criterion>
  </edu-rubric>

  <edu-termination>
    <turn-limit>20</turn-limit>
    <manual-end>true</manual-end>
  </edu-termination>
</edu-role-play>
```

| Element | Required | Notes |
| --- | --- | --- |
| `<edu-role-play id runtime-version>` | yes | `id` is a slug; `runtime-version` matches the installed runtime. |
| `<edu-persona name role>` | yes | `<goals>` and `<constraints>` required; `<background>` and `<speech-patterns>` recommended. |
| `<edu-scenario>` | yes | Mentions the persona by name; addresses the learner in second person. |
| `<edu-objective id>` | ≥1 | Observable verbs only — see [objective patterns](skills/edu-role-play/objective-patterns.md). |
| `<edu-rubric>` > `<criterion objective weight>` | 1 per objective | Positive-integer weight; sum in [1, 20]. |
| `<edu-termination>` | yes | Must include `<turn-limit>` or `<time-limit>`. |

Full reference: [docs/composition-format.md](docs/composition-format.md). Authoring rules the linter enforces: [`skills/edu-role-play/SKILL.md`](skills/edu-role-play/SKILL.md).

## The CLI flow

The full author → share loop, agent or hand-driven:

```bash
# 1. Scaffold a composition from an archetype (or start blank)
npx edu-role-play init my-roleplay --archetype skeptical-buyer

# 2. Validate it against the DNA rules
npx edu-role-play lint my-roleplay.erp

# 3. Iterate locally — runtime inlined, no auto-open
npx edu-role-play preview my-roleplay.erp

# 4. Bundle into a single self-contained HTML
npx edu-role-play bundle my-roleplay.erp

# 5. Open the bundled HTML in your browser to try it
npx edu-role-play start my-roleplay.erp

# 6. (Optional) Package as SCORM 1.2 for an LMS
npx edu-role-play scorm my-roleplay.erp
```

Every command is non-interactive by design so agents can drive it. Full flag reference: [docs/cli.md](docs/cli.md) and [skills/edu-role-play/cli-reference.md](skills/edu-role-play/cli-reference.md).

## Inference & sharing

Bundled role-plays call a Cloudflare Worker proxy (`POST {proxy}/v1/chat`) — no API key ships in the HTML. The Worker can call Cloudflare Workers AI (via the `env.AI` binding, no key needed), Anthropic, or OpenAI. Source lives in [`packages/proxy-worker`](packages/proxy-worker/).

### Deploy your own proxy

The shared public proxy is rate-limited and fine for iteration. Before sharing bundles with learners, deploy your own:

```bash
npx edu-role-play deploy-proxy
```

This guided command stages the proxy-worker template, prompts for provider (`workers-ai` | `anthropic` | `openai`) and key, runs `wrangler deploy`, and writes the resulting URL into your user config so subsequent `bundle`/`start`/`scorm` calls default to it. Override per-bundle with `--proxy-url <url>` or `EDU_ROLE_PLAY_PROXY_URL`.

No terminal? There's a one-click [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/minicoursegenerator/edu-role-play-proxy) path documented in [docs/sharing.md](docs/sharing.md).

### Provider trade-offs

| Provider     | Cost                          | Quality for role-play | Setup |
| ------------ | ----------------------------- | --------------------- | ----- |
| Workers AI   | Free tier (~10k Neurons/day) | OK — Llama-class      | Zero keys |
| Anthropic    | Pay per token (your key)      | Best                  | One paste |
| OpenAI       | Pay per token (your key)      | Good                  | One paste |

## Export to SCORM

Bundle your role-play as SCORM 1.2 to upload to any LMS (Moodle, Canvas, Cornerstone, SAP SuccessFactors, MCG, etc.):

```bash
npx skills bundle YOUR-ROLEPLAY --scorm
```

This produces a `.zip` file. Upload it as a SCORM activity in your LMS. The role-play runs in an iframe, scores get reported via SCORM API, completion tracked in your LMS gradebook.

## Repository layout

- [`skills/`](skills/) — Agent Skills. `edu-role-play/SKILL.md` is the main authoring skill consumed by Claude Code, Cursor, Gemini CLI, Codex.
- [`packages/core`](packages/core/) — TypeScript types and linter rules for compositions.
- [`packages/runtime`](packages/runtime/) — the inlineable chat loop, objective tracker, and rubric scorer that drives the bundled HTML.
- [`packages/cli`](packages/cli/) — the `edu-role-play` binary (init, lint, preview, bundle, start, scorm, deploy-proxy).
- [`packages/proxy-worker`](packages/proxy-worker/) — Cloudflare Worker template that proxies to Workers AI / Anthropic / OpenAI.
- [`compositions/`](compositions/) — example compositions and bundled outputs used in docs and tests.
- [`docs/`](docs/) — user-facing docs ([getting-started](docs/getting-started.md), [composition-format](docs/composition-format.md), [cli](docs/cli.md), [sharing](docs/sharing.md), [scorm](docs/scorm.md), [design-system](docs/design-system.md), [publishing](docs/publishing.md)).
- [`registry/`](registry/) — reserved for a future browsable archetype catalog.
- [`scripts/`](scripts/) — build and utility scripts.

## FAQ

**Does the bundled HTML need an internet connection?**
Yes — it calls your proxy Worker for inference. Everything else (UI, runtime, scoring logic) is inlined and runs offline.

**Where does the API key live?**
On the Worker, as a Cloudflare secret. Never in the HTML, never in the learner's browser.

**Can I edit a composition by hand instead of through an agent?**
Yes. It's plain HTML with custom elements. Run `npx edu-role-play lint <file>` to check it.

**Can I host the HTML on my LMS?**
If the LMS accepts arbitrary HTML, paste it into an HTML widget. For SCORM-only LMSes, use `npx edu-role-play scorm` to package it as SCORM 1.2 — see [docs/scorm.md](docs/scorm.md).

**How is the rubric scored?**
At session end the runtime sends the full transcript plus the rubric to the model and asks for per-criterion scores with rationale. Weights are normalized to a 0–100 score. Source: [`packages/runtime`](packages/runtime/).

**Which models work best?**
Anthropic Claude (Sonnet or Opus) for serious scenarios; Workers AI Llama variants for prototyping. Set the model with `--model` at bundle time.

**Can I version-control compositions?**
Yes — they're text. Diffs are readable; PR review works fine.

## Maintainers

Release checklist (lockstep-version the 3 npm packages): [docs/publishing.md](docs/publishing.md).

Published on npm: [`@edu-role-play/core`](https://www.npmjs.com/package/@edu-role-play/core), [`@edu-role-play/runtime`](https://www.npmjs.com/package/@edu-role-play/runtime), [`edu-role-play`](https://www.npmjs.com/package/edu-role-play) (CLI). Skill installable via `npx skills add minicoursegenerator/edu-role-play`.

## License

MIT. See [LICENSE](LICENSE).
