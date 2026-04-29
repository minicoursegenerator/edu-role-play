# Sharing role-plays with learners

A role-play bundle (`*.bundled.html`) calls a Cloudflare Worker proxy to talk to an LLM. Learners just open the file — they never see or hold an API key. As the creator, you deploy the Worker once.

There are two ways to deploy depending on whether you have a terminal.

## Track A — terminal (Claude Code, Cursor, Codex, plain shell)

```bash
npx edu-role-play deploy-proxy
```

This walks you through:

1. Choosing a provider — **Workers AI** (free, no key, basic models), **Anthropic** (BYO key, recommended for role-play quality), or **OpenAI** (BYO key).
2. `wrangler login` if you're not already signed in to Cloudflare.
3. Deploying the Worker to your account.
4. Storing your API key as a Worker secret (BYO modes only — never embedded in the bundle).
5. Writing the deployed URL to `~/.edu-role-play/config.json` so future `bundle` calls find it automatically.

After it finishes:

```bash
npx edu-role-play bundle my-roleplay.html      # picks up the proxy URL from config
# share the resulting my-roleplay.bundled.html with learners
```

## Track B — web (claude.ai, no shell)

If you're working with the agent in a browser-only environment, there's no terminal to run `npx`. Use Cloudflare's one-click deploy instead:

1. **Click [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/minicoursegenerator/edu-role-play-proxy).** OAuths into your Cloudflare account, deploys the proxy Worker. Copy the resulting `https://<name>.workers.dev` URL.
2. **Add your API key as a Worker secret.** In the Cloudflare dashboard → that Worker → **Settings → Variables and Secrets → Add variable** → name it `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) → paste the key → mark it **Secret (encrypted)** → save.
3. **Point your bundled HTML at it.** No re-bundle needed — pick one:
   - Edit `<head>` of the bundled file and add: `<meta name="edu-role-play-proxy" content="https://<your-worker>.workers.dev">`
   - Or share the file with a query param: `your-roleplay.bundled.html?erp-proxy=https://<your-worker>.workers.dev`

The agent can do step 3 for you — paste the Worker URL into the chat and it will edit the bundled HTML in place.

## Provider trade-offs

| Provider     | Cost              | Quality for role-play | Setup |
| ------------ | ----------------- | --------------------- | ----- |
| Workers AI   | Free tier (~10k Neurons/day) | OK — Llama-class | Zero keys |
| Anthropic    | Pay per token (your key)     | Best | One paste |
| OpenAI       | Pay per token (your key)     | Good | One paste |

Anthropic is the recommended default for serious role-play scenarios; Workers AI is fine for prototyping and lightweight scenarios.

## Updating later

Re-run `edu-role-play deploy-proxy` any time. It overwrites the Worker (same name) and refreshes the saved URL. To change provider, just re-run and pick a different one — the new secret takes precedence.

To reset, delete `~/.edu-role-play/config.json` or the Worker in the Cloudflare dashboard.

## Non-interactive / CI

```bash
ANTHROPIC_API_KEY=sk-ant-... npx edu-role-play deploy-proxy \
  --provider anthropic --non-interactive
```

## How keys flow

- BYO key: lives only in your Cloudflare account as a Worker secret. The Worker sees it at runtime; the bundled HTML never does.
- Workers AI: there is no key — the `env.AI` binding handles auth.
- Either way, learners' bundles only know the Worker URL.
