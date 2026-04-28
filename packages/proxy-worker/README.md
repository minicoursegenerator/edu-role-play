# @edu-role-play/proxy-worker

Cloudflare Worker that fronts default `edu-role-play` bundles, so they work without the learner pasting an API key.

The Worker calls Cloudflare Workers AI through the `env.AI` binding — there is **no API key, account id, or token** to manage. Authentication is the binding itself. The free Workers AI tier (~10k Neurons/day) covers a few hundred role-play sessions; the free Workers tier (100k requests/day) covers the proxy traffic itself.

Bring-your-own (BYO) keys still work entirely client-side via localStorage and bypass this Worker — they call OpenAI/Anthropic/Cloudflare directly.

## Deploy

```bash
cd packages/proxy-worker
npx wrangler login
npm run deploy            # prints https://edu-role-play-proxy.<subdomain>.workers.dev
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
