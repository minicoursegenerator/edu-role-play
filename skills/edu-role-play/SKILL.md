---
name: edu-role-play
description: Create interactive AI role-play training activities as self-contained HTML. Use when the user asks to generate a role-play, persona practice, sales simulation, customer conversation drill, compliance scenario, or any learner-vs-AI-character training exercise.
allowed-tools: Read Write Edit Bash(edu-role-play *) Bash(node *) Bash(npx *)
---

# edu-role-play

Generate a single HTML file that learners open to practice a conversation with an AI persona. The runtime drives the chat, detects when objectives are met, and scores the transcript against a rubric at the end. You author the composition; the CLI lints and bundles it.

## 1. Approach

When the user asks for a role-play, your job is to produce a composition HTML that exercises a specific, observable skill. Do not start writing XML until the user has told you (or you have inferred and confirmed) all five pieces of the Pedagogical DNA. If any piece is missing or vague, ask one concise clarifying question at a time.

The shape of every composition:

- One **persona** with goals, constraints, and speech patterns
- One **scenario** that places the learner in role
- 2–4 **observable objectives**
- A **rubric** that scores each objective with a positive-integer weight (sum 1–20)
- **Termination** conditions (always a turn cap; manual-end by default)

## 2. Pedagogical DNA Gate (hard requirement)

Before generating any composition, confirm all five:

1. **Learner role** — who is practicing, and what skill are they building?
2. **Observable objectives** — what concrete actions should the learner take? (If the user says "understand X" or "be aware of Y", push for an observable verb: ask, confirm, quantify, secure, surface, handle.)
3. **Success criteria** — what does a good answer on each objective look like?
4. **Rubric dimensions** — how is each objective weighted relative to the others?
5. **Persona goals + constraints** — what does the AI character want and what can't they budge on?

If the user is vague, ask the smallest next question. Do not invent content that changes the pedagogical intent.

## 3. Composition structure

```html
<edu-role-play id="my-roleplay" runtime-version="0.1.0">
  <edu-persona name="Sarah Chen" role="VP of Operations">
    <background>15 years in logistics. Burned by a CRM migration in 2023.</background>
    <goals>Cut vendor count by 30% before Q4 board review.</goals>
    <constraints>Budget locked until Q3. Won't sign without a peer reference.</constraints>
    <speech-patterns>Direct. Asks for specifics. Interrupts vague claims.</speech-patterns>
  </edu-persona>

  <edu-scenario>
    You are an account executive pitching Acme CRM to Sarah. You have 15 minutes to
    uncover a pain point, quantify its impact, and secure a follow-up meeting.
  </edu-scenario>

  <edu-objective id="discover-pain">Surface at least one current operational pain point Sarah owns.</edu-objective>
  <edu-objective id="quantify-impact">Get Sarah to share a number (dollars, hours, or headcount).</edu-objective>
  <edu-objective id="book-followup">Secure a concrete follow-up meeting (date + attendees).</edu-objective>

  <edu-rubric>
    <criterion objective="discover-pain" weight="3">Full credit: pain is specific, Sarah-owned, and tied to a process.</criterion>
    <criterion objective="quantify-impact" weight="4">Full credit: Sarah volunteers a dollar / hour / headcount number.</criterion>
    <criterion objective="book-followup" weight="3">Full credit: follow-up has a date, owner, and named attendees.</criterion>
  </edu-rubric>

  <edu-termination>
    <turn-limit>20</turn-limit>
    <objective-check-every>3</objective-check-every>
    <manual-end>true</manual-end>
  </edu-termination>
</edu-role-play>
```

## 4. Persona design

See [persona-design.md](persona-design.md). Rules:
- `name` + `role` must be concrete (no "a salesperson").
- `<goals>` state what the persona wants from THIS conversation.
- `<constraints>` are hard limits. They make pushback believable.
- `<speech-patterns>` shape voice. Be specific ("interrupts vague claims") not generic ("assertive").

## 5. Objectives and rubric

See [objective-patterns.md](objective-patterns.md) and [rubric-design.md](rubric-design.md). Rules:
- Every objective is observable in the transcript. Forbidden verbs: *understand, know, feel, appreciate, be aware, familiarize, learn about*.
- Every objective has exactly one matching `<criterion>`.
- Weights are positive integers; the sum must be in [1, 20].
- Criterion text spells out what full credit looks like.

## 6. Termination

Always include `<turn-limit>` (default 20) or `<time-limit>` in seconds. `<manual-end>true</manual-end>` lets the learner stop and get scored. `<objective-check-every>` (default 3) controls how often the runtime checks whether all objectives are met.

## 7. Non-negotiable rules (linter-enforced)

1. Every `<edu-objective>` must be observable — no vague verbs.
2. The rubric must cover every objective id and contain no orphan criteria.
3. Persona must have non-empty `<goals>` and `<constraints>`.
4. Termination must include at least one hard cap (turn-limit or time-limit).
5. The scenario must mention the persona by name and address the learner in the second person.
6. Rubric weights must be positive integers summing to [1, 20].

Failing any of these blocks `bundle`.

## 8. Output checklist

After writing or editing a composition:

1. **You** (the agent) run `node ${CLAUDE_SKILL_DIR}/scripts/validate.mjs <file>` (or `npx -y edu-role-play lint <file>`). Fix every error. Warnings (e.g. stale `runtime-version`) can stay but prefer to fix.
2. **Do not bundle yourself.** Do not ask the user for an API key.
3. Tell the user, as the final message, a single line:
   > Run `npx edu-role-play start <file>` to try the role-play.
   Use the filename (or absolute path) that matches what you wrote. `start` bundles with the default Mini Course Generator proxy and opens the result in the user's browser.

Only suggest `--api-key <…> --account-id <…>` if the user *explicitly* asks to bake in their own Cloudflare key. Only suggest `--proxy-url <…>` if the user *explicitly* asks to route through their own proxy.

## 9. On-demand references

Load only when needed:

- [archetypes.md](archetypes.md) — the 5 v1 archetypes and when to pick each
- [persona-design.md](persona-design.md) — writing strong personas
- [rubric-design.md](rubric-design.md) — observable rubrics and weights
- [objective-patterns.md](objective-patterns.md) — objective phrasing patterns
- [cli-reference.md](cli-reference.md) — `edu-role-play` CLI flags

## Privacy note to surface to the user

Transcripts are not stored. The bundled artifact runs entirely in the learner's browser; inference requests are routed through the Mini Course Generator Workers AI proxy by default (the proxy forwards to Cloudflare Workers AI). Learners can override this per-browser via the **Use my own key ▾** link in the role-play footer — see [docs/byo-key.md](../../docs/byo-key.md).
