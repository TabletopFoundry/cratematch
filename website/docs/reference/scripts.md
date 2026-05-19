---
title: npm Scripts
sidebar_position: 4
---

# npm Scripts

Every script in `package.json`, what it does, and when to use it.

| Script | Command | When to run |
|--------|---------|-------------|
| `npm run dev` | `next dev` | Local development. Hot reload, dev-only seed, dev error overlay. |
| `npm run build` | `next build` | Production build. Required before `npm run start`. |
| `npm run start` | `next start` | Serve the production build on port 3000. |
| `npm run lint` | `eslint` | Lint the codebase. Must pass in CI. |
| `npm run lint:fix` | `eslint --fix` | Auto-fix lint errors where safe. |
| `npm run type-check` | `tsc --noEmit` | Pure type check, no emit. Faster than `build` for catching type errors. |
| `npm run check-all` | `npm run type-check && npm run lint && npm run build` | The full CI gate. Run this before pushing. |

## Recommended workflow

```bash
# During development
npm run dev

# Before committing
npm run type-check
npm run lint

# Before opening a PR
npm run check-all
```

`check-all` is the single command that should pass for a green PR.

## CI integration

A minimal GitHub Actions workflow that mirrors `check-all`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check-all
```

`npm ci` is used in CI rather than `npm install` because it's faster and enforces the lockfile.

## What no script does

There is intentionally **no `test` script** in the MVP — there is no automated test suite. Adding one is on the roadmap. If you contribute tests, add a `test` script that runs them and wire it into `check-all`.

There is no `migrate` script. Schema changes happen in `src/lib/db/` and are picked up the next time the database is reseeded (delete `data/cratematch.db`).
