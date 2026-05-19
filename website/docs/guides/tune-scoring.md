---
title: Tune the Scoring
sidebar_position: 3
---

# Tune the Scoring

All recommendation weights live as named constants at the top of `src/lib/recommendations.ts`. There is no config file, no environment variable, and no admin UI — tuning is a code change.

This is deliberate. The weights are part of the engine's contract: changing them changes which game ships, and that must go through code review.

## The four constant groups

```ts
// src/lib/recommendations.ts

const LIKED_WEIGHTS: Record<RatingValue, number> = {
  loved: 1,
  liked: 0.65,
  neutral: 0.15,
  disliked: -0.8,
  unplayed: 0,
};

const SIMILARITY_WEIGHTS = {
  themeOverlap: 16,
  mechanicOverlap: 18,
  profileThemeOverlap: 18,
  profileMechanicOverlap: 20,
  playerFit: 10,
  timeFit: 10,
  complexityFit: 12,
} as const;

const SIMILARITY_TOLERANCES = {
  playerCount: 4,
  playTime: 90,
  complexity: 2.2,
} as const;

const FILTER = {
  budgetTolerance: 8,
  playTimeTolerance: 75,
  dislikeSimilarityThreshold: 55,
} as const;

const SCORING = {
  baseCandidateScore: 22,
  supportingTitleThreshold: 16,
  themeOverlapBonus: 10,
  mechanicOverlapBonus: 18,
  // ...
} as const;
```

## Worked example: make complexity dominate

Suppose user testing reveals that subscribers care about complexity fit far more than theme overlap. To shift the engine:

1. Edit `SIMILARITY_WEIGHTS.complexityFit` from `12` to `24`.
2. Edit `SCORING.themeOverlapBonus` from `10` to `6`.
3. Tighten `SIMILARITY_TOLERANCES.complexity` from `2.2` to `1.5` so the bonus drops off faster outside the target weight.

```ts
const SIMILARITY_WEIGHTS = {
  themeOverlap: 16,
  mechanicOverlap: 18,
  profileThemeOverlap: 18,
  profileMechanicOverlap: 20,
  playerFit: 10,
  timeFit: 10,
  complexityFit: 24,   // was 12
} as const;

const SIMILARITY_TOLERANCES = {
  playerCount: 4,
  playTime: 90,
  complexity: 1.5,     // was 2.2
} as const;

const SCORING = {
  // ...
  themeOverlapBonus: 6,  // was 10
} as const;
```

Re-run the dev server. Because the seeded subscriber has a complexity target of 3.2, you should see heavier games rise in the recommendation snapshots and lighter games drop.

## Worked example: looser dislike filtering

If you want disliked games to be a *signal* rather than a *filter* — i.e., to push candidates down rather than remove them entirely — raise the threshold:

```ts
const FILTER = {
  budgetTolerance: 8,
  playTimeTolerance: 75,
  dislikeSimilarityThreshold: 90,  // was 55 — effectively disables the filter
} as const;
```

Disliked games still apply a *negative* `LIKED_WEIGHTS.disliked = -0.8` contribution to the score for similar candidates, so they'll rank lower without disappearing.

## Validating a tuning change

There is no automated regression suite for engine output (yet). The pragmatic loop:

1. Edit the constants.
2. Reseed: `rm data/cratematch.db && npm run dev`.
3. Visit `/box` and inspect the new pick + alternates.
4. Use the SQLite inspector to compare the new `recommendation_snapshots` rows to the previous ones:

   ```bash
   sqlite3 data/cratematch.db \
     "SELECT month_label, game_slug, confidence FROM recommendation_snapshots ORDER BY month_label;"
   ```

5. If you want to verify a specific input/output pair without re-running the wizard, write a one-off Node script that imports `recommendBox` and prints its result.

## Don't change

Two things in `recommendations.ts` should not move without engine-wide thought:

- **`SCORING.baseCandidateScore`** — this is the floor below which a candidate can't realistically rank in the top 3. Moving it changes the meaning of all other weights.
- **`RADAR`** — these weights drive the visualization only, not the picks. Tuning them is a UX change, not a recommendation change.

## When to graduate from constants

When you find yourself wanting per-subscriber weights, A/B comparisons, or learned weights, the constant-based approach has earned its retirement. At that point, factor `recommendations.ts` into a strategy interface and persist the active weight set per subscriber. The MVP is intentionally below that threshold.
