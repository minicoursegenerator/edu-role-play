# @edu-role-play/worker-proxy

Cloudflare Worker that sits in front of Workers AI for bundled role-plays. Lets the bundled HTML call a CORS-enabled origin instead of `api.cloudflare.com` (which doesn't allow browser-direct calls) and keeps the Cloudflare token on the server side so it never ships in HTML source.

## Deploy

```bash
cd packages/worker-proxy
npx wrangler login
npm run secret:token      # paste a Cloudflare token with Workers AI → Read
npm run secret:account    # paste the Cloudflare account ID
npm run deploy            # prints https://erp-proxy.<subdomain>.workers.dev
```

Optional: attach a custom domain like `https://erp-proxy.minicoursegenerator.com` in the Cloudflare dashboard → Workers & Pages → your worker → Triggers.

## Use from `edu-role-play bundle`

Set the deployed URL once:

```bash
export EDU_ROLE_PLAY_PROXY_URL=https://erp-proxy.minicoursegenerator.com
```

Then bundle as usual — the CLI detects the env var, writes `baseUrl` into the runtime config, and **omits** the Cloudflare key from the HTML:

```bash
npx edu-role-play bundle my-scenario.html
```

No `--api-key` or `--account-id` needed when the proxy is set.

## Endpoint

- `POST /ai/run/<model>` → forwards to `https://api.cloudflare.com/client/v4/accounts/<id>/ai/run/<model>`
- `OPTIONS *` → CORS preflight
- Any other method/path → 404

Body is passed through verbatim. Response is streamed back with `Access-Control-Allow-Origin: *`.

## Rate limiting

Built in via Cloudflare's rate-limiting binding (`RL`): **30 requests per IP per 60s**. Tune in `wrangler.toml` or in the dashboard after deploy.

## Local dev

```bash
echo 'CF_API_TOKEN=<token>' > .dev.vars
echo 'CF_ACCOUNT_ID=<account>' >> .dev.vars
npm run dev                # http://localhost:8787
```

`.dev.vars` is gitignored — never commit it.

## Privacy

The Worker does not log request bodies. Request metadata (IP, model, status) is visible in the standard Cloudflare Workers logs unless `logpush` is disabled.
