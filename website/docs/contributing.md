---
title: Contributing
---

# Contributing

Contributions are welcome. This page covers everything you need to land a clean PR.

## Quick setup

```bash
git clone https://github.com/TabletopFoundry/cratematch
cd cratematch
npm install
npm run dev
```

Verify with `curl http://localhost:3000/api/health`. If `database.gameCount` is `65`, you're set.

## Before you push

```bash
npm run check-all
```

This runs `type-check`, `lint`, and `build` in sequence. CI runs the same command. If it fails locally, the PR will fail.

## Code style

The full style guide lives in [CONTRIBUTING.md](https://github.com/TabletopFoundry/cratematch/blob/main/CONTRIBUTING.md) in the repo. The short version:

- **TypeScript strict mode is non-negotiable.** No `any`.
- **Interfaces for domain objects** — see `src/lib/types.ts`.
- **Path aliases**: `@/components/...`, `@/lib/...`.
- **Tailwind only** — no custom CSS outside `globals.css`.
- **Design tokens**: `orange-*` accent, `stone-*` neutrals, `rounded-[2rem]` cards.
- **kebab-case filenames**: `taste-radar-chart.tsx`, `server-data.ts`.
- **App Router only**: pages in `src/app/`, components in `src/components/`.
- **Server components fetch data directly.** No `useEffect` for data loading.
- **`"use client"`** only when a component needs interactivity or browser APIs.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add per-subscriber theme weights
fix: prevent duplicate collection entries on rapid clicks
docs: clarify CRATEMATCH_ENABLE_DEMO_SEED behavior
refactor: extract radar data builder from wizard
```

## PR checklist

- [ ] Branch from `main`: `git checkout -b feat/your-feature`.
- [ ] One feature or fix per PR. Keep it focused.
- [ ] `npm run check-all` passes locally.
- [ ] If you changed engine constants, include a snapshot comparison in the PR description.
- [ ] If you added a new theme or mechanic, confirm it's in `ALL_THEMES` / `ALL_MECHANICS`.
- [ ] Update the docs (`website/docs/`) if behavior changed.
- [ ] PR description explains *what changed*, *why*, and *how to test*.

## Where to make changes

| Want to change | Edit |
|----------------|------|
| Which game gets recommended | `src/lib/recommendations.ts` — see [Tune the Scoring](./guides/tune-scoring.md). |
| The game catalog | `src/lib/catalog/games.ts` — see [Customize the Catalog](./guides/customize-catalog.md). |
| Plan pricing or features | `src/lib/catalog/plans.ts`. |
| The onboarding wizard | `src/components/onboarding-wizard.tsx`. |
| API behavior | `src/app/api/*/route.ts` + `src/lib/server-data.ts`. |
| Schema | `src/lib/db/` (and bump `seed_version` in `meta`). |
| Documentation | `website/docs/`. |

## Reporting bugs

Open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Output of `curl -s http://localhost:3000/api/health` if the issue might be data-related
- Node and npm versions (`node --version`, `npm --version`)
- OS

## Suggesting features

Open a discussion before opening a PR if the change is large (engine logic, schema, multi-subscriber support, etc.). Smaller changes — a new theme, a documentation fix, a UI polish — go straight to a PR.

## Code of Conduct

By participating in this project you agree to a respectful and inclusive community. Be kind. Disagree on substance, not on people. Maintainers reserve the right to remove abusive comments or contributions.

## License

By contributing, you agree your contributions will be licensed under the [MIT License](https://github.com/TabletopFoundry/cratematch/blob/main/LICENSE).
