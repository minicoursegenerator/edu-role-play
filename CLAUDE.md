# edu-role-play

Open-source toolkit for generating interactive AI role-play training activities as self-contained HTML. Agent-first authoring via the Agent Skills open standard; works with Claude Code, Cursor, Gemini CLI, and Codex.

## Layout

- [skills/](skills/) — Claude Code skills (Agent Skills standard). `edu-role-play/SKILL.md` is the main authoring skill.
- [packages/](packages/) — npm packages: `core` (types + linter rules), `runtime` (inlineable chat loop + scoring), `cli` (`edu-role-play` binary).
- [registry/](registry/) — reserved for a future browsable archetype catalog.
- [compositions/](compositions/) — example role-play compositions used in docs and tests.
- [docs/](docs/) — user-facing documentation.
- [scripts/](scripts/) — build and utility scripts.

## Design inspiration

Mirrors the [HyperFrames](https://github.com/heygen-com/hyperframes) packaging: HTML-first composition format with custom elements, self-contained bundled artifacts, agent-invoked CLI, skills under `skills/`, packages under `packages/`.

## Status

Published on npm: `@edu-role-play/core`, `@edu-role-play/runtime`, `edu-role-play` (CLI). Skill installable via `npx skills add minicoursegenerator/edu-role-play`.
