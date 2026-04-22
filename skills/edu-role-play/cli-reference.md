# CLI reference

All commands are non-interactive and flag-driven. Users don't type these — their agent does.

## `edu-role-play init <name> [--archetype <id>] [--force]`

Scaffolds `<name>.html` from an archetype (e.g. `skeptical-buyer`) or the blank template. `--force` to overwrite.

## `edu-role-play lint <file>`

Validates the composition. Exits 0 on success, 1 on any error. Warnings do not fail.

## `edu-role-play bundle <file> [-o <out>] --api-key <key> --account-id <id> [--model <id>] [--skip-lint]`

Runs lint (unless `--skip-lint`), then writes a self-contained HTML with the runtime and config inlined. Default output: `<file>.bundled.html`. Default model: `@cf/meta/llama-3.1-8b-instruct`.

Env fallbacks: `EDU_ROLE_PLAY_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`.

## `edu-role-play preview <file> [--port <n>] --api-key <key> --account-id <id>`

Serves the bundled artifact at `http://localhost:<port>/`. Does not open a browser (agent-friendly). Ctrl-C to stop.

## Exit codes

- `0` — success
- `1` — lint errors, missing flags, or file-system errors
