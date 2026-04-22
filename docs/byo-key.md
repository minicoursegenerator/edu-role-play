# Bring-your-own-key

The bundled artifact calls the LLM provider directly from the learner's browser. The API key is baked into the artifact at `bundle` time.

## What that means

- **The key is visible in page source.** Anyone who opens the artifact can read it.
- **Rotating the key = re-bundle + re-paste.** Everywhere the old artifact lives, it will stop working.
- **Rate-limit the key.** Use a Cloudflare Workers AI token scoped to this workspace, with a tight daily rate limit. If the key leaks, caps limit the blast radius.

## Provider

v1 supports Cloudflare Workers AI. Default model: `@cf/meta/llama-3.1-8b-instruct`.

Pass `--api-key` and `--account-id` at bundle time (or set `EDU_ROLE_PLAY_API_KEY` and `CLOUDFLARE_ACCOUNT_ID`). Override model with `--model @cf/<vendor>/<model>`.

## MCG Freeform Card caveat

If the Freeform Card sanitizes `<script>` tags or blocks cross-origin `fetch` to Cloudflare, the bundled artifact will not execute. Verify early: paste a known-good bundle and open the card. If scripts are stripped, file a follow-up to add an iframe-embed fallback or an MCG-side allowlist before relying on this path in production.
