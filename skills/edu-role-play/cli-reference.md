# CLI reference

All commands are non-interactive and flag-driven. Users don't type these — their agent does.

## `edu-role-play init <name> [--archetype <id>] [--force]`

Scaffolds `<name>.html` from an archetype (e.g. `skeptical-buyer`) or the blank template. `--force` to overwrite.

## `edu-role-play lint <file>`

Validates the composition. Exits 0 on success, 1 on any error. Warnings do not fail.

## `edu-role-play bundle <file> [-o <out>] [--model <id>] [--proxy-url <url>] [--skip-lint]`

Runs lint (unless `--skip-lint`), then writes a self-contained HTML with the runtime and config inlined. Default output: `<file>.bundled.html`. Model defaults to whatever the proxy picks (`@cf/meta/llama-3.1-8b-instruct`) — pass `--model` only to override.

**No API key is ever baked into the HTML.** The bundle calls `POST {proxy}/v1/chat` on the project's Cloudflare Worker proxy, which forwards to Cloudflare Workers AI through its `env.AI` binding (no token needed). Learners can optionally switch to their own key at runtime via the BYO-key UI (stored in browser localStorage, not in the HTML).

A proxy URL is required at bundle time. Set once via `EDU_ROLE_PLAY_PROXY_URL` (or pass `--proxy-url <url>`). Deploy the Worker with `cd packages/proxy-worker && npm run deploy` — see [../../packages/proxy-worker/README.md](../../packages/proxy-worker/README.md).

Overrides:
- `--model <id>`: force a specific Workers AI model instead of the proxy default.
- `--proxy-url <url>` (or `EDU_ROLE_PLAY_PROXY_URL`): point bundles at a specific Worker (staging, self-hosted, etc.).

## `edu-role-play start <file> [--model <id>] [--proxy-url <url>]`

Bundles the composition (using the same defaults as `bundle`) and opens the resulting `.bundled.html` in the user's default browser. This is the one-shot "try the role-play" command to hand the user.

If `<file>` already ends in `.bundled.html`, skips re-bundling and just opens the file.

## `edu-role-play preview <file> [--port <n>] --api-key <key> --account-id <id>`

Serves the bundled artifact at `http://localhost:<port>/` with a local dev server that proxies Cloudflare calls server-side — the key stays on the user's machine and is never written into the HTML. Does not open a browser (agent-friendly). Ctrl-C to stop.

## Exit codes

- `0` — success
- `1` — lint errors, missing flags, or file-system errors
