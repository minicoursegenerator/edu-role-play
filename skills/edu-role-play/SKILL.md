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

Wrap the composition in the standard HTML shell below. The `<style>` block and the "not bundled yet" `<div data-erp-fallback>` are **required** — they turn the raw source into a self-explaining page when a user opens it directly in a browser. The runtime wipes the `<edu-role-play>` contents on mount, so these have no effect on the bundled output.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>my-roleplay</title>
    <style>
      edu-role-play > :not([data-erp-fallback]) { display: none; }
      [data-erp-fallback].notice { display: block; font-family: system-ui, sans-serif; max-width: 560px; margin: 60px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafafa; line-height: 1.5; }
      [data-erp-fallback] h2 { margin: 0 0 8px 0; font-size: 18px; }
      [data-erp-fallback] pre { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; font-family: ui-monospace, monospace; font-size: 13px; }
    </style>
  </head>
  <body>
<edu-role-play id="my-roleplay" runtime-version="0.1.0">
  <div class="notice" data-erp-fallback>
    <h2>This role-play isn't bundled yet</h2>
    <p>Open a terminal in this folder and run:</p>
    <pre><code>npx edu-role-play start my-roleplay.html</code></pre>
  </div>
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
  </body>
</html>
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

Each role-play gets its own folder so files don't pile up in the user's working directory.

1. Pick a short kebab-case slug (e.g. `gdpr-sar-audit`). Create the folder: the composition file path is `<slug>/<slug>.html`.
2. Write the composition to `<slug>/<slug>.html`.
3. **You** (the agent) run `npx -y edu-role-play lint <slug>/<slug>.html`. Fix every error. Warnings (e.g. stale `runtime-version`) can stay but prefer to fix.
4. **Do not bundle yourself.** Do not ask the user for an API key.
5. Tell the user, as the final message, these two lines verbatim (substituting the slug):
   ```
   cd <slug>
   npx edu-role-play start <slug>.html
   ```
   `start` bundles against the default Mini Course Generator backend gateway and opens the result in the user's browser.

Only suggest `--gateway-url <…>` if the user *explicitly* asks to route through a different MCG backend (e.g. staging or self-hosted). There is no option to bake an API key into the HTML — keys never ship in source.

## 9. On-demand references

Load only when needed:

- [archetypes.md](archetypes.md) — the 5 v1 archetypes and when to pick each
- [persona-design.md](persona-design.md) — writing strong personas
- [rubric-design.md](rubric-design.md) — observable rubrics and weights
- [objective-patterns.md](objective-patterns.md) — objective phrasing patterns
- [cli-reference.md](cli-reference.md) — `edu-role-play` CLI flags

## Privacy note to surface to the user

Transcripts are not stored. The bundled artifact runs entirely in the learner's browser; inference requests are routed through the Mini Course Generator backend gateway by default (the backend forwards to the underlying LLM provider, currently Cloudflare Workers AI). Learners can override this per-browser via the **Use my own key ▾** link in the role-play footer — see [docs/byo-key.md](../../docs/byo-key.md).
