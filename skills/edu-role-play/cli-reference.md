# CLI reference

All commands are non-interactive and flag-driven. Users don't type these — their agent does.

## `edu-role-play init <name> [--archetype <id>] [--force]`

Scaffolds `<name>.html` from an archetype (e.g. `skeptical-buyer`) or the blank template. `--force` to overwrite.

## `edu-role-play lint <file>`

Validates the composition. Exits 0 on success, 1 on any error. Warnings do not fail.

## `edu-role-play bundle <file> [-o <out>] [--model <id>] [--proxy-url <url>] [--skip-lint]`

Runs lint (unless `--skip-lint`), then writes a self-contained HTML with the runtime and config inlined. Default output: `<file>.bundled.html`. Default model: `@cf/meta/llama-3.1-8b-instruct`.

**No API key is ever baked into the HTML.** The bundle routes inference through a Cloudflare Workers AI proxy — the hosted Mini Course Generator one by default. Learners can optionally switch to their own key at runtime via the BYO-key UI (stored in browser localStorage, not in the HTML).

Overrides:
- `--proxy-url <url>` (or `EDU_ROLE_PLAY_PROXY_URL`): route through your own Worker proxy instead of the MCG default.

## `edu-role-play start <file> [--proxy-url <url>]`

Bundles the composition (using the same defaults as `bundle`) and opens the resulting `.bundled.html` in the user's default browser. This is the one-shot "try the role-play" command to hand the user.

If `<file>` already ends in `.bundled.html`, skips re-bundling and just opens the file.

## `edu-role-play preview <file> [--port <n>] --api-key <key> --account-id <id>`

Serves the bundled artifact at `http://localhost:<port>/` with a local dev server that proxies Cloudflare calls server-side — the key stays on the user's machine and is never written into the HTML. Does not open a browser (agent-friendly). Ctrl-C to stop.

## Exit codes

- `0` — success
- `1` — lint errors, missing flags, or file-system errors
