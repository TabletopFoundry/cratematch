---
title: Configuration
sidebar_position: 2
---

# Configuration

CrateMatch reads two environment variables. Everything else is in-repo TypeScript.

## Environment variables

### `CRATEMATCH_ENABLE_DEMO_SEED`

- **Type:** boolean (`true` / unset)
- **Default:** `true` in `NODE_ENV=development`, unset elsewhere.

When `true`, the seed module hydrates the demo subscriber (15 quiz ratings, 26-game collection, 8 months of crate history, 49 recommendation snapshots) on first DB connection.

When unset in production, the catalog and schema are still created — but the demo subscriber slot remains blank so a real onboarding flow can populate it without overwriting anything.

```bash
# Force the demo subscriber into a production build
CRATEMATCH_ENABLE_DEMO_SEED=true npm run build
CRATEMATCH_ENABLE_DEMO_SEED=true npm run start
```

### `CRATEMATCH_DB_PATH`

- **Type:** filesystem path
- **Default:** `./data/cratematch.db` (relative to the project root)

Override the SQLite file location. Use this for containerized deployments where the database needs to live on a mounted volume:

```bash
CRATEMATCH_DB_PATH=/var/lib/cratematch/cratematch.db npm run start
```

The parent directory must exist and be writable by the Node process.

## In-repo configuration

The constants that *aren't* environment-driven, because changing them changes product behavior and must go through code review:

| File | What it configures |
|------|--------------------|
| `src/lib/recommendations.ts` | Scoring weights, tolerances, filters. See [Tune the Scoring](../guides/tune-scoring.md). |
| `src/lib/catalog/games.ts` | The 65-game catalog. See [Customize the Catalog](../guides/customize-catalog.md). |
| `src/lib/catalog/plans.ts` | The three subscription tier definitions (name, price, budget, features). |
| `src/lib/catalog/constants.ts` | `ALL_THEMES`, `ALL_MECHANICS`, `QUIZ_GAME_SLUGS`. |
| `src/lib/catalog/content.ts` | Marketing copy: testimonials, FAQ entries, community mock posts. |
| `next.config.ts` | Next.js build configuration. |

## Next.js configuration

`next.config.ts` is intentionally minimal. The notable bits:

- The `serverExternalPackages` array includes `better-sqlite3` so Next doesn't try to bundle native bindings.
- TypeScript strict mode is enforced via `tsconfig.json`.

Do not change `serverExternalPackages` without a test that confirms the DB connection still opens in a production build.

## Plan definitions

```ts
// src/lib/catalog/plans.ts (excerpt)
discovery:  { price: "$34.99", budget: 35,  /* ... */ },
explorer:   { price: "$54.99", budget: 55,  /* ... */ },
collector:  { price: "$79.99", budget: 80,  /* ... */ },
```

The `budget` field is what actually constrains the recommendation engine (`price ≤ budget + 8`). Changing the display price without changing the budget is safe; changing the budget shifts which games can be recommended at that tier.
