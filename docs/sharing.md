# Sharing role-plays with learners

A role-play bundle (`*.bundled.html`) calls a Cloudflare Worker proxy to talk to an LLM. Learners just open the file — they never see or hold an API key. As the creator, you deploy the Worker once.

## Quick start

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
