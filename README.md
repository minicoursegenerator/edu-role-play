# edu-role-play

Generate interactive AI role-play training activities as self-contained HTML. Built for AI coding agents (Claude Code, Cursor, Gemini CLI, Codex) via the [Agent Skills](https://agentskills.io) open standard.

Inspired by [HyperFrames](https://github.com/heygen-com/hyperframes): HTML-first composition format, agent-first authoring, self-contained artifacts that run anywhere.

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

Then use `npx edu-role-play init|lint|bundle|preview` directly.

## Quick start

In your agent, invoke the skill and describe the role-play you want:

```
Using /edu-role-play, create a role-play where a sales rep practices
pitching our CRM to a skeptical VP of Operations at a mid-market
logistics company.
```

The agent scaffolds the composition, validates it, and bundles it into a single self-contained HTML file. Paste that HTML into a Freeform Card in any [Mini Course Generator](https://minicoursegenerator.com) course — or host it anywhere that accepts HTML.

## Prompting patterns

**Cold start** — describe from scratch:

> Using /edu-role-play, make a 10-turn compliance auditor role-play focused on GDPR subject access requests, with a pass/fail rubric.

**Warm start** — turn existing context into a role-play:

> Using /edu-role-play, read `sales-playbook.md` and create a role-play for the objection-handling section.

**Iterate** — talk to the agent like an instructional designer:

> Make the persona tougher. She should push back on price twice before engaging.
> Add an objective about uncovering budget authority.
> Bundle it and give me the HTML.

## How it works

A role-play composition is a single HTML file with custom elements declaring the persona, scenario, objectives, and rubric. The runtime (inlined at bundle time) drives a chat loop against a configured LLM, detects objective completion, and scores the full transcript at the end.

```html
<edu-role-play id="sales-pitch-skeptical-buyer" runtime-version="0.1.0">
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

## Inference

Bundled role-plays call the Mini Course Generator backend gateway (`gateway.minicoursegenerator.com`) by default — no API key shipped in the HTML, nothing for the author to configure. The backend holds the provider key and applies rate limits. Point bundles at a different backend with `--gateway-url`.

Learners can optionally switch to their own Cloudflare, OpenAI, or Anthropic key at runtime via the footer — stored in `localStorage`, never in the HTML source. See [docs/byo-key.md](docs/byo-key.md).

## Status

Early development. See [docs/](docs/) for current capabilities.

## Maintainers

Release checklist (lockstep-version the 3 npm packages): [docs/publishing.md](docs/publishing.md).

## License

MIT. See [LICENSE](LICENSE).
