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

No API key required. Bundled role-plays call the Mini Course Generator Cloudflare Workers AI proxy by default. If you'd rather run your own Worker, see [byo-key.md](byo-key.md) and pass `--proxy-url` at bundle time.

## 3. Paste into your course

Open the bundled HTML in a browser to verify it runs. Then paste the contents into an MCG Freeform Card (or any other HTML host).

See also: [composition-format.md](composition-format.md), [byo-key.md](byo-key.md), [cli.md](cli.md).
