---
title: Seed the Demo Data
sidebar_position: 1
---

# Seed the Demo Data

CrateMatch ships with a rich seeded demo so reviewers can see the full subscriber journey without filling out the wizard themselves.

## What gets seeded

When the demo seed runs, the SQLite database is populated with:

- **65 board games** with theme, mechanic, complexity, player count, play time, and price metadata.
- **A demo subscriber** with completed onboarding: 15 quiz ratings, 8 preferred themes, 8 preferred mechanics, on the Collector plan.
- **26 owned games** in the current collection.
- **8 months of crate history** with keep/return decisions, subscriber notes, and post-delivery feedback.
- **49 recommendation snapshots** capturing the monthly pick, alternates, confidence, and explanation payload for every month of history.
- **Edge-case curation examples** — campaign-heavy returns, card-crafting picks, trick-taking co-ops, racing games.

## When the seed runs

| Environment | Default behavior |
|-------------|------------------|
| `NODE_ENV=development` | Demo seed runs on first request that touches the database. |
| `NODE_ENV=production` | **Catalog only**. The demo subscriber is *not* hydrated unless `CRATEMATCH_ENABLE_DEMO_SEED=true`. |

This split exists so a real production deployment doesn't accidentally overwrite live subscriber data on a restart.

## Force a reseed in production

```bash
CRATEMATCH_ENABLE_DEMO_SEED=true npm run build
CRATEMATCH_ENABLE_DEMO_SEED=true npm run start
```

The first request to a server route will create the schema (if missing) and hydrate the full demo subscriber. Subsequent requests are no-ops.

## Reset to a clean slate

```bash
rm data/cratematch.db
npm run dev
```

The schema and 65-game catalog are recreated. In dev, the demo subscriber is also reseeded.

## Inspect the seeded database

The SQLite file is a regular file — open it with any SQLite client:

```bash
sqlite3 data/cratematch.db

sqlite> .tables
sqlite> .schema games
sqlite> SELECT slug, title, complexity, price FROM games ORDER BY complexity DESC LIMIT 5;
sqlite> SELECT month_label, decision, game_slug FROM box_history ORDER BY month_label;
sqlite> SELECT * FROM recommendation_snapshots LIMIT 3;
```

Useful for debugging the engine: you can replay the inputs from a recommendation snapshot and compare the output to what was actually shipped.

## Seed versioning

The seed module checks a `seed_version` row in a `meta` table. When the version changes between releases, the next dev startup wipes and re-hydrates demo data while preserving real subscriber records (none, in this MVP). To force a refresh during development, delete the database file.

## Customizing the seed

The seed source lives in `src/lib/db/seed.ts` (and the catalog itself in `src/lib/catalog/games.ts`). You can:

- Edit `GAME_CATALOG` to add or remove games — see [Customize the Catalog](./customize-catalog.md).
- Adjust the demo subscriber's preferences in the seed module.
- Tweak the 8 months of history to test specific edge cases.

After editing, delete `data/cratematch.db` and restart.
