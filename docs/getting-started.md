# Getting started

You don't invoke the CLI directly — your agent does. But under the hood, every role-play goes through the same four steps.

## 1. Install

```bash
npx skills add minicoursegenerator/edu-role-play
```

(Or clone this repo and `npm install`.)

## 2. Get a Cloudflare Workers AI key

1. Create a Cloudflare account, get an API token with **Workers AI** permission.
2. Note your account id.
3. Export both:

```bash
export EDU_ROLE_PLAY_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
```

Use a workspace-scoped key with tight rate limits. It will be baked into every bundled artifact and visible in source.

## 3. Talk to your agent

```
Using /edu-role-play, create a role-play where a sales rep practices
pitching Acme CRM to a skeptical VP of Operations at a mid-market 3PL.
```

The agent gathers the Pedagogical DNA (learner role, objectives, success criteria, rubric, persona), writes the composition, runs the linter, and hands you a bundled HTML.

## 4. Paste into your course

Open the bundled HTML in a browser to verify it runs. Then paste the contents into an MCG Freeform Card (or any other HTML host).

See also: [composition-format.md](composition-format.md), [byo-key.md](byo-key.md), [cli.md](cli.md).
