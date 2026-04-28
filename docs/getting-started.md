# Getting started

You don't invoke the CLI directly — your agent does. But under the hood, every role-play goes through the same three steps.

## 1. Install

```bash
npx skills add minicoursegenerator/edu-role-play
```

(Or clone this repo and `npm install`.)

## 2. Talk to your agent

```
Using /edu-role-play, create a role-play where a sales rep practices
pitching Acme CRM to a skeptical VP of Operations at a mid-market 3PL.
```

The agent gathers the Pedagogical DNA (learner role, objectives, success criteria, rubric, persona), writes the composition, runs the linter, and hands you a bundled HTML.

No API key in the HTML. Bundled role-plays call a Cloudflare Worker proxy you deploy once (free tier — see [../packages/proxy-worker/README.md](../packages/proxy-worker/README.md)). The Worker forwards to Cloudflare Workers AI via the `env.AI` binding, so there's no key to manage server-side either. Point bundles at the deployed Worker with `--proxy-url <url>` or `EDU_ROLE_PLAY_PROXY_URL`.

## 3. Paste into your course

Open the bundled HTML in a browser to verify it runs. Then paste the contents into any HTML host (static site, LMS HTML widget, etc.).

See also: [composition-format.md](composition-format.md), [byo-key.md](byo-key.md), [cli.md](cli.md).
