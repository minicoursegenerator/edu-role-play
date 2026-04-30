# CLI

The `edu-role-play` binary is non-interactive by design — agents invoke it on the user's behalf. Full flag reference: [../skills/edu-role-play/cli-reference.md](../skills/edu-role-play/cli-reference.md).

## Commands

- `edu-role-play init <name> [--archetype <id>]`
- `edu-role-play lint <file>`
- `edu-role-play bundle <file> [--model <id>] [--proxy-url <url>]`
- `edu-role-play scorm <file> [--output <path>] [--title <title>] [--model <id>] [--proxy-url <url>]` — package a SCORM 1.2 ZIP for LMS upload
- `edu-role-play start <file> [--model <id>] [--proxy-url <url>]` — lint + bundle + open in the default browser (one step)
- `edu-role-play preview <file> --api-key <k> --account-id <id>` — local dev server; key stays on your machine, never in the HTML

## Proxy setup (one-time)

Bundling requires a deployed proxy Worker. Set up once:

```bash
cd packages/proxy-worker
npx wrangler login
npm run deploy            # prints https://edu-role-play-proxy.<subdomain>.workers.dev
export EDU_ROLE_PLAY_PROXY_URL=https://edu-role-play-proxy.<subdomain>.workers.dev
```

See [../packages/proxy-worker/README.md](../packages/proxy-worker/README.md) for details (custom domain, rate limit tuning, local dev).

## Typical flow

```bash
edu-role-play init demo --archetype skeptical-buyer
edu-role-play start demo.erp
```

Or step-by-step for CI / scripted use:

```bash
edu-role-play lint demo.erp
edu-role-play bundle demo.erp           # writes demo.html
edu-role-play scorm demo.erp -o demo.scorm.zip
```

Copy `demo.html` into any HTML host (static site, LMS HTML widget, etc.).
Upload `demo.scorm.zip` to an LMS as a SCORM 1.2 package.
