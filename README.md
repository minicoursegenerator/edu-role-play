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

Then use the CLI directly: `npx edu-role-play <command>`. See [The CLI flow](#the-cli-flow) below.

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

## The CLI flow

The full author → share loop, agent or hand-driven:

```bash
# 1. Scaffold a composition from an archetype (or start blank)
npx edu-role-play init my-roleplay --archetype skeptical-buyer

# 2. Validate it against the DNA rules
npx edu-role-play lint my-roleplay.html

# 3. Iterate locally — runtime inlined, no auto-open
npx edu-role-play preview my-roleplay.html

# 4. Bundle into a single self-contained HTML
npx edu-role-play bundle my-roleplay.html

# 5. Open the bundled HTML in your browser to try it
npx edu-role-play start my-roleplay.html

# 6. (Optional) Package as SCORM 1.2 for an LMS
npx edu-role-play scorm my-roleplay.html
```

### Deploy your own proxy (for sharing)

The shared public proxy is rate-limited and fine for iteration. Before sharing bundles with learners, deploy your own Cloudflare Worker:

```bash
npx edu-role-play deploy-proxy
```

This guided command stages the proxy-worker template, prompts for provider (`workers-ai` | `anthropic` | `openai`) and key, and runs `wrangler deploy` for you. It then writes the resulting URL into your user config so subsequent `bundle`/`start`/`scorm` calls default to it. Override per-bundle with `--proxy-url <url>` or `EDU_ROLE_PLAY_PROXY_URL`.

## Inference

Bundled role-plays call a Cloudflare Worker proxy (`POST {proxy}/v1/chat`) — no API key ships in the HTML. The Worker can call Cloudflare Workers AI (via the `env.AI` binding, no key needed), Anthropic, or OpenAI. Source lives in [`packages/proxy-worker`](packages/proxy-worker/); the easiest deploy path is `edu-role-play deploy-proxy` (above).

Learners can optionally switch to their own Cloudflare, OpenAI, or Anthropic key at runtime via the footer — stored in `localStorage`, never in the HTML source. See [docs/byo-key.md](docs/byo-key.md).

## Maintainers

Release checklist (lockstep-version the 3 npm packages): [docs/publishing.md](docs/publishing.md).

## License

MIT. See [LICENSE](LICENSE).
