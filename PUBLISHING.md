# Publishing

Three packages get published together, in order, because the CLI depends on the other two at an exact version:

1. `@edu-role-play/core`
2. `@edu-role-play/runtime`
3. `edu-role-play` (the CLI — unscoped so `npx edu-role-play` resolves)

## One-time setup

- Create an npm account and verify email.
- Create the `edu-role-play` org on npm so `@edu-role-play/core` and `@edu-role-play/runtime` can be published under it: https://www.npmjs.com/org/create
- Reserve the unscoped name by publishing `edu-role-play` from this repo (first publish claims it).
- `npm login` on the machine you'll publish from.
- Enable 2FA for publish on the npm account (recommended).

## Release checklist

Bump all three versions in lockstep (same version number keeps the CLI's pinned deps working):

```bash
# from repo root
npm version --workspaces --workspace @edu-role-play/core --workspace @edu-role-play/runtime --workspace edu-role-play <patch|minor|major> --no-git-tag-version
```

Or edit the three `package.json` files by hand and match the versions. Update the CLI's `dependencies` pins to the same version.

Then from the repo root:

```bash
# clean, install, build everything
rm -rf node_modules package-lock.json packages/*/dist
npm install
npm run build -w @edu-role-play/core
npm run build -w @edu-role-play/runtime
npm run build -w edu-role-play

# smoke-test
cd /tmp && rm -rf erp-smoke && mkdir erp-smoke && cd erp-smoke
node <repo>/packages/cli/dist/index.js init demo --archetype skeptical-buyer
node <repo>/packages/cli/dist/index.js lint demo.html
EDU_ROLE_PLAY_API_KEY=test CLOUDFLARE_ACCOUNT_ID=test \
  node <repo>/packages/cli/dist/index.js bundle demo.html

# publish in order (each runs prepublishOnly → clean + build)
cd <repo>
npm publish -w @edu-role-play/core
npm publish -w @edu-role-play/runtime
npm publish -w edu-role-play
```

## Post-publish verification

From a fresh directory outside the repo:

```bash
cd /tmp && mkdir erp-verify && cd erp-verify
npx -y edu-role-play init demo --archetype skeptical-buyer
npx -y edu-role-play lint demo.html
```

Both should succeed without any workspace context.

Also verify the skill flow from scratch:

```bash
cd /tmp && mkdir erp-skill-verify && cd erp-skill-verify
npx skills add minicoursegenerator/edu-role-play -a claude-code
# then in Claude Code: /edu-role-play should be listed, and the agent should
# be able to run `npx edu-role-play lint <file>` without errors
```

## Version policy

Until 1.0, bump all three together on every release. The CLI pins `@edu-role-play/core` and `@edu-role-play/runtime` to exact versions, so shipping a mismatched set will break installs.

## What ships in each tarball

- `@edu-role-play/core` → `dist/` (parser, linter, types)
- `@edu-role-play/runtime` → `dist/runtime.iife.js` (inlined into bundled compositions)
- `edu-role-play` → `dist/` (CLI) + `templates/` (blank + archetypes, synced at build time from `skills/edu-role-play/archetypes/`)
