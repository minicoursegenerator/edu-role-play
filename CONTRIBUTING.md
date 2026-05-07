# Contributing to edu-role-play

Thanks for considering a contribution. This project is an open-source toolkit for authoring AI role-play training activities as self-contained HTML, and PRs from outside the core team are welcome.

## What's in scope

- Bug fixes in the CLI, runtime, core types, or linter rules.
- New example compositions and archetypes under [`compositions/`](compositions/).
- Documentation improvements in [`README.md`](README.md) and [`docs/`](docs/).
- New linter rules that enforce pedagogical quality in compositions.
- Runtime improvements (objective tracking, scoring, streaming, accessibility).
- Proxy worker improvements in [`packages/proxy-worker`](packages/proxy-worker/).

## What's out of scope (for now)

- Large architectural rewrites without a prior issue discussion.
- New top-level skills beyond `edu-role-play` — those will land as separate repos following the [Agent Skills](https://agentskills.io) standard.

## Before you start

For anything beyond a typo or a small bug fix, open an [issue](https://github.com/minicoursegenerator/edu-role-play/issues) first so we can align on the approach. Check the [roadmap](README.md#roadmap) and existing issues to avoid duplicating work.

## Dev setup

```bash
git clone https://github.com/minicoursegenerator/edu-role-play
cd edu-role-play && npm install && npm run build
```

Node.js 18+ is required. The CLI binary is available as `node packages/cli/dist/index.js` (or `npx edu-role-play` once the workspace is built).

## Repo layout

See [Repository layout](README.md#repository-layout) in the README.

## Making a change

1. Branch from `main`.
2. Build the package(s) you touched (`npm run build -w <package>`).
3. If you changed the linter, runtime, or core types, smoke-test by bundling one of the [`compositions/`](compositions/) examples and opening it in a browser.
4. If you touched a composition, run `npx edu-role-play lint <file>` and make sure it passes.
5. Keep the diff focused on one logical change.

## Adding a composition or archetype

Compositions must follow the authoring rules in [`skills/edu-role-play/SKILL.md`](skills/edu-role-play/SKILL.md) and the format reference in [`docs/composition-format.md`](docs/composition-format.md). Lint must pass before the PR is ready for review.

## Commit and PR conventions

- Short, imperative commit subjects. Match the existing `git log` style — e.g. `docs:`, `cli 0.1.x:`, `runtime:`, `core:`.
- One logical change per PR.
- In the PR description, lead with the user-facing effect ("learners now see…", "the linter now catches…") rather than the implementation detail.
- Reference the issue the PR closes when applicable.

## Releasing

Releases are cut by maintainers. The lockstep release process for the three npm packages is documented in [docs/publishing.md](docs/publishing.md).

## License

By contributing, you agree that your contributions are licensed under the repo's [MIT license](LICENSE).

## Conduct

Be respectful and assume good intent. Disagreement is fine; personal attacks are not.

## Contact

Open an [issue](https://github.com/minicoursegenerator/edu-role-play/issues) for bugs, feature requests, or questions. For other channels, see [Maintainers](README.md#maintainers).
