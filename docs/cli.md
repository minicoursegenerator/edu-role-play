# CLI

The `edu-role-play` binary is non-interactive by design — agents invoke it on the user's behalf. Full flag reference: [../skills/edu-role-play/cli-reference.md](../skills/edu-role-play/cli-reference.md).

## Commands

- `edu-role-play init <name> [--archetype <id>]`
- `edu-role-play lint <file>`
- `edu-role-play bundle <file> [--proxy-url <url>]`
- `edu-role-play start <file> [--proxy-url <url>]` — lint + bundle + open in the default browser (one step)
- `edu-role-play preview <file> --api-key <k> --account-id <id>` — local dev server; key stays on your machine, never in the HTML

## Typical flow

```bash
edu-role-play init demo --archetype skeptical-buyer
edu-role-play start demo.html
```

Or step-by-step for CI / scripted use:

```bash
edu-role-play lint demo.html
edu-role-play bundle demo.html -o demo.bundled.html
```

Copy `demo.bundled.html` into any HTML host (MCG Freeform Card, static site, etc.).
