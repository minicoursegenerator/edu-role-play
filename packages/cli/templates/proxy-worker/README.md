# @edu-role-play/proxy-worker

Cloudflare Worker that fronts default `edu-role-play` bundles, so they work without the learner pasting an API key.

## Provider modes

The Worker picks a backend at request time based on which secrets are bound (highest precedence first):

1. `ANTHROPIC_API_KEY` set → calls Anthropic Messages API (default model `claude-haiku-4-5-20251001`).
2. `OPENAI_API_KEY` set → calls OpenAI Chat Completions (default model `gpt-4o-mini`).
3. Neither set → calls Cloudflare Workers AI via `env.AI` (default `@cf/meta/llama-3.1-8b-instruct`).

The Workers AI mode needs no API key, account id, or token — auth is the binding itself. BYO modes hold the creator's key as a Cloudflare Worker secret; learners' bundles never see it.

## Deploy (recommended)

The `edu-role-play` CLI ships a guided deploy:

```bash
npx edu-role-play deploy-proxy
```

It walks you through provider choice, runs `wrangler login` if needed, deploys the Worker, sets the BYO secret if applicable, and writes the URL into `~/.edu-role-play/config.json` so subsequent `bundle` calls pick it up automatically.

## Deploy (manual)

```bash
cd packages/proxy-worker
npx wrangler login
npm run deploy            # prints https://edu-role-play-proxy.<subdomain>.workers.dev

# optional, for BYO providers:
npx wrangler secret put ANTHROPIC_API_KEY     # or OPENAI_API_KEY
```

Optional: attach a custom domain (e.g. `https://erp.<your-domain>`) in the Cloudflare dashboard → Workers & Pages → your worker → Triggers.

## Use from `edu-role-play bundle`

Set the deployed URL once:

```bash
export EDU_ROLE_PLAY_PROXY_URL=https://edu-role-play-proxy.<subdomain>.workers.dev
```

Then bundle as usual:

```bash
npx edu-role-play bundle my-scenario.html
```

The CLI writes `baseUrl` into the runtime config; no API key is embedded in the HTML.

## Endpoint

```
POST /v1/chat
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "..." }],
  "model":   "@cf/meta/llama-3.1-8b-instruct",   // optional
  "temperature": 0.7,                             // optional, clamped 0..2
  "maxTokens": 512                                // optional, capped at 1024
}
```

Response:

```json
{ "text": "..." }
```

Errors are JSON: `{ "error": "...", "code"?: "rate_limited" | "upstream_error" }`.

`OPTIONS *` is answered with CORS preflight headers; any other method/path returns 404.

## Rate limiting

Built-in via Cloudflare's rate-limiting binding (`RL`): **30 requests per IP per 60s**. When the limit triggers, the Worker returns HTTP 429 with `code: "rate_limited"` and the runtime surfaces a "try again shortly" message.

Tune the limit in `wrangler.toml` (`simple = { limit, period }`) and redeploy, or override in the dashboard.

## Local dev

```bash
npm run dev               # http://localhost:8787
```

`wrangler dev` proxies the AI binding to the real Cloudflare API in your account, so calls cost real Neurons. There are no secrets to set.

## Privacy

The Worker does not log request or response bodies — they contain learner transcripts. Standard Workers logs (IP, status, model) are visible in your Cloudflare dashboard unless `logpush` is configured otherwise.
