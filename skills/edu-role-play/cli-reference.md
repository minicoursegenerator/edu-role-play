# CLI reference

All commands are non-interactive and flag-driven. Users don't type these — their agent does.

## `edu-role-play init <name> [--archetype <id>] [--force]`

Scaffolds `<name>.html` from an archetype (e.g. `skeptical-buyer`) or the blank template. `--force` to overwrite.

## `edu-role-play lint <file>`

Validates the composition. Exits 0 on success, 1 on any error. Warnings do not fail.

## `edu-role-play bundle <file> [-o <out>] [--model <id>] [--proxy-url <url>] [--api-key <key> --account-id <id>] [--skip-lint]`

Runs lint (unless `--skip-lint`), then writes a self-contained HTML with the runtime and config inlined. Default output: `<file>.bundled.html`. Default model: `@cf/meta/llama-3.1-8b-instruct`.

**By default** (no flags, no env vars) the bundle routes inference through the hosted Mini Course Generator Workers AI proxy — no API key needed, and no key is baked into the HTML. This is the path to use 99% of the time.

Overrides:
- `--proxy-url <url>` (or `EDU_ROLE_PLAY_PROXY_URL`): route through your own Worker proxy instead of the MCG default.
- `--api-key <key> --account-id <id>` (or `EDU_ROLE_PLAY_API_KEY` + `CLOUDFLARE_ACCOUNT_ID`): skip the proxy and bake a Cloudflare key directly into the HTML. The key will be visible in the artifact's source; use a workspace-scoped, rate-limited key.

## `edu-role-play preview <file> [--port <n>] --api-key <key> --account-id <id>`

Serves the bundled artifact at `http://localhost:<port>/`. Does not open a browser (agent-friendly). Ctrl-C to stop.

## Exit codes

- `0` — success
- `1` — lint errors, missing flags, or file-system errors
