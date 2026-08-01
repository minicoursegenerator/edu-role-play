# Composition format

A composition is a single HTML file with one `<edu-role-play>` root and five child areas: persona, scenario, objectives, rubric, termination.

## Minimal example

```html
<edu-role-play id="my-roleplay" runtime-version="0.1.0">
  <edu-persona name="Sarah Chen" role="VP of Operations">
    <goals>...</goals>
    <constraints>...</constraints>
  </edu-persona>

  <edu-scenario>You are an AE pitching Acme CRM to Sarah...</edu-scenario>

  <edu-objective id="surface-pain">Surface a specific operational pain Sarah owns.</edu-objective>

  <edu-rubric>
    <criterion objective="surface-pain" weight="3">Full credit: pain is specific...</criterion>
  </edu-rubric>

  <edu-termination>
    <turn-limit>20</turn-limit>
    <manual-end>true</manual-end>
  </edu-termination>
</edu-role-play>
```

## Elements

| Element | Required | Notes |
| --- | --- | --- |
| `<edu-role-play id runtime-version>` | yes | `id` is a slug; `runtime-version` should match the installed runtime. |
| `<edu-persona name role>` | yes | `<goals>` and `<constraints>` required. `<background>` and `<speech-patterns>` recommended. |
| `<edu-scenario>` | yes | Must mention persona by name and address the learner in second person. |
| `<edu-objective id detect?>` | ≥1 | Observable verb only. `detect` attribute is AI-facing version with specific examples + counter-examples for more accurate detection. See `objective-patterns.md`. |
| `<edu-rubric>` > `<criterion objective weight>` | 1 per objective | Positive-integer weight; sum in [1, 20]. |
| `<edu-termination>` | yes | Must include `<turn-limit>` or `<time-limit>`. |

### The `detect` attribute on objectives

The visible text between `<edu-objective>` tags is shown to learners in the sidebar. The optional `detect` attribute provides a more specific version for the AI detection system:

```html
<edu-objective id="ask-context"
  detect="Ask about 1st-century context. COUNTS: questions about trade, Roman colony life,
          Jewish-Gentile relations. DOES NOT COUNT: greetings, jokes, pleasantries,
          off-topic chat, self-disclosures, food/drink requests.">
  Ask at least two questions showing awareness of the historical context.
</edu-objective>
```

The `detect` text should include:
- **COUNTS**: concrete examples of what qualifies as progress
- **DOES NOT COUNT**: explicit anti-patterns to prevent false positives
- **Instructions**: "Be strict", "The learner must ASK" when relevant

When `detect` is absent, the visible text is used for both purposes. Always add `detect` for production role-plays.

## Non-negotiable rules

See `skills/edu-role-play/SKILL.md` §7.
