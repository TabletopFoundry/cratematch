---
title: Customize the Catalog
sidebar_position: 2
---

# Customize the Catalog

The 65-game catalog is a static TypeScript module. Adding, removing, or editing games is a code change — not a database migration.

## Where games live

`src/lib/catalog/games.ts` exports `GAME_CATALOG: Game[]`. Each entry conforms to the `Game` interface:

```ts
interface Game {
  slug: string;          // unique kebab-case identifier
  title: string;         // display name
  year: number;          // release year
  description: string;   // 1–2 sentence pitch
  themes: string[];      // see ALL_THEMES in catalog/constants.ts
  mechanics: string[];   // see ALL_MECHANICS in catalog/constants.ts
  minPlayers: number;
  maxPlayers: number;
  playTime: number;      // minutes
  complexity: number;    // BGG-style weight, 1.0–5.0
  price: number;         // USD, integer
}
```

## Add a game

1. Open `src/lib/catalog/games.ts`.
2. Append a new entry. Slugs must be unique and kebab-case:

   ```ts
   {
     slug: "spirit-island",
     title: "Spirit Island",
     year: 2017,
     description: "A heavy co-op where ancient spirits defend their island from colonizers.",
     themes: ["fantasy", "nature"],
     mechanics: ["co-operative", "variable-player-powers", "area-control"],
     minPlayers: 1,
     maxPlayers: 4,
     playTime: 120,
     complexity: 4.0,
     price: 70,
   },
   ```

3. Verify the themes and mechanics exist in `ALL_THEMES` and `ALL_MECHANICS` (`src/lib/catalog/constants.ts`). If you need a new one, add it there first.
4. Reset the database to pick up the new game:

   ```bash
   rm data/cratematch.db
   npm run dev
   ```

## Add a new theme or mechanic

```ts
// src/lib/catalog/constants.ts
export const ALL_THEMES = [
  "fantasy",
  "nature",
  "space",
  "horror",
  "social",
  "economics",
  "historical",
  "mythology",         // ← new
] as const;

export const ALL_MECHANICS = [
  "engine-building",
  "worker-placement",
  "deck-building",
  "co-operative",
  "trick-taking",
  "polyomino-placement",  // ← new
  // ...
] as const;
```

The wizard's theme/mechanic pickers iterate these arrays, so new entries show up automatically.

## Edit an existing game

Changes to existing games take effect on the next request *after* the database is reseeded — the catalog rows are copied into the `games` table during seeding. The simplest path:

```bash
# edit src/lib/catalog/games.ts
rm data/cratematch.db
npm run dev
```

If you want to mutate the catalog in place without a reset, you'd need to issue an `UPDATE` against the `games` table — not recommended for normal development.

## Remove a game

Delete the entry from `GAME_CATALOG`. Reset the database. Note that any subscriber whose collection or history references the removed slug will see orphan references — for production, you'd want a migration step that nulls or remaps the slug.

## Quiz games

The 15 games used in the onboarding quiz are listed by slug in `QUIZ_GAME_SLUGS` (`src/lib/catalog/constants.ts`). Every slug here must exist in `GAME_CATALOG`. The order in `QUIZ_GAME_SLUGS` determines quiz order.

## Validate your changes

```bash
npm run type-check
npm run lint
npm run build
```

A missing theme, mistyped mechanic, or duplicate slug will fail type checking or build.
