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
| `<edu-objective id>` | ≥1 | Observable verb only. See `objective-patterns.md`. |
| `<edu-rubric>` > `<criterion objective weight>` | 1 per objective | Positive-integer weight; sum in [1, 20]. |
| `<edu-termination>` | yes | Must include `<turn-limit>` or `<time-limit>`. |

## Non-negotiable rules

See `skills/edu-role-play/SKILL.md` §7.
