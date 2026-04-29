# Bring your own API key

Bundled role-plays ship with **no API key** in the HTML — they hit a Cloudflare Worker proxy (`POST /v1/chat`) by default, which calls Cloudflare Workers AI through the `env.AI` binding (no key on the server either). Learners can start practicing with zero setup. If a learner prefers to use their own key (to get a stronger model, keep usage off someone else's bill, or avoid rate limits), the runtime supports that.

> Author note: to point a bundle at *your own* deployed proxy without re-bundling, add `<meta name="edu-role-play-proxy" content="https://<your-worker>.workers.dev">` to `<head>` (or append `?erp-proxy=…` to the URL). See [sharing.md](sharing.md).

## How a learner switches

1. In the footer of the role-play panel, click **Use my own key ▾**.
2. Pick a provider:
   - **Cloudflare** — needs an API token with `Workers AI → Read` and the Cloudflare account ID.
   - **OpenAI** — needs a standard API key (`sk-…`).
   - **Anthropic** — needs a standard API key (`sk-ant-…`).
3. Paste the key. Optionally override the model (the placeholder shows the default for that provider).
4. Click **Save**. The footer label changes to *"Using your own <provider> key · change"* and every subsequent turn (including end-of-session scoring) goes through the learner's key.
5. To revert to the baked key, reopen the panel and press **Clear**.

## Where the key lives

- The key is written to `localStorage` under `edu-role-play:user-key:v1`.
- It never leaves the browser except to call the provider the learner selected (`api.cloudflare.com` / `api.openai.com` / `api.anthropic.com`).
- Neither the proxy Worker nor the author of the role-play sees it.
- Clearing browser storage for the site removes it. Incognito windows don't persist it.

## Security caveats

- `localStorage` is readable by any script on the same origin. Only enter keys on role-plays from trusted authors.
- Use a **rate-limited, workspace-scoped key** — not a root-account key.
- The key is visible in DevTools. This is intrinsic to client-side inference.

## Provider notes

- **Cloudflare** is the default and cheapest path (free tier available). The account ID is required alongside the token. **Known limitation**: Cloudflare's REST API does not allow direct browser calls, so a learner-supplied Cloudflare key will fail with a CORS error unless the learner routes it through a Worker proxy of their own. The default path works because bundles route through the project's proxy Worker, which uses the AI binding (no key needed). BYO OpenAI and Anthropic don't have this limitation.
- **Anthropic** calls from a browser require the `anthropic-dangerous-direct-browser-access: true` header, which the runtime sets automatically. No CORS proxy needed.
- **OpenAI** works out of the box; expects an organization-scoped key.

## For authors

Authors don't need to do anything to enable this — the BYO UI is always present in bundled role-plays. Bundles route to the project's proxy Worker by default (no key in the HTML); the BYO override is purely client-side.
