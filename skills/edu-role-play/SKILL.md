---
name: edu-role-play
description: Create interactive AI role-play training activities as self-contained HTML. Use when the user asks to generate a role-play, persona practice, sales simulation, customer conversation drill, compliance scenario, or any learner-vs-AI-character training exercise.
allowed-tools: Read Write Edit Bash(edu-role-play *) Bash(node *)
---

> **Status: scaffold.** This SKILL.md is a placeholder. Full instructions land in Phase 1.

# edu-role-play

Generate self-contained HTML role-play activities. The composition format, runtime, and CLI live in this repo's `packages/` directory.

## Approach (placeholder)

When a user asks for a role-play, gather the following before generating:

1. **Learner role** — who is practicing, what skill are they building
2. **Persona** — who they talk to (goals, constraints, speech patterns)
3. **Scenario** — the context of the conversation
4. **Objectives** — observable outcomes to score
5. **Rubric** — how each objective is weighted and evaluated

## Pedagogical DNA Gate (placeholder)

Do not generate a composition until the above five items are declared. If the user is vague, ask targeted clarifying questions.

## Composition structure (placeholder)

See example compositions in `${CLAUDE_SKILL_DIR}/../../compositions/` (to be populated).

## CLI (placeholder)

- `edu-role-play init <name>`
- `edu-role-play preview`
- `edu-role-play lint`
- `edu-role-play bundle`

## On-demand references (to be populated in Phase 1)

- `archetypes.md` — persona archetype descriptions
- `persona-design.md` — writing strong personas
- `rubric-design.md` — observable rubric patterns
- `objective-patterns.md` — objective phrasing
- `cli-reference.md` — CLI flag reference
