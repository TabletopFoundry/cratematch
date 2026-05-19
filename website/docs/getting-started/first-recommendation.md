---
title: Your First Recommendation
sidebar_position: 3
---

# Your First Recommendation

This walks through the full happy path: onboarding a new subscriber, picking a plan, and getting a personalized monthly box with explanations.

## 1. Start the app

```bash
npm run dev
```

If you've already explored the seeded demo subscriber, start from a clean slate first:

```bash
rm data/cratematch.db
npm run dev
```

The schema and 65-game catalog are recreated automatically. The demo subscriber is **not** hydrated unless `CRATEMATCH_ENABLE_DEMO_SEED=true` is set.

## 2. Walk through onboarding

Visit [http://localhost:3000/onboarding](http://localhost:3000/onboarding). The wizard collects, in order:

1. **Name** — used in greetings and feedback prompts.
2. **Plan** — Discovery ($34.99, budget $35), Explorer ($54.99, budget $55), or Collector ($79.99, budget $80). The budget caps which candidate games can be recommended (with a small overshoot tolerance).
3. **Player count & play time sliders** — your *ideal* table, not absolutes. Candidates are scored on fit, not filtered hard.
4. **Complexity target** — a number on the BGG-style 1.0–5.0 weight scale.
5. **Themes & mechanics** — up to 20 of each. These directly weight the scoring engine.
6. **15-game quiz** — rate each as `loved`, `liked`, `neutral`, `disliked`, or `unplayed`. Rating weights:

   | Rating | Weight |
   |--------|--------|
   | loved | 1.00 |
   | liked | 0.65 |
   | neutral | 0.15 |
   | disliked | −0.80 |
   | unplayed | 0.00 |

Submit. The wizard POSTs to `/api/onboarding` and persists the full taste profile.

## 3. See your monthly box

Navigate to [http://localhost:3000/box](http://localhost:3000/box). CrateMatch picks the highest-scoring game from the catalog that:

- Fits the plan budget (with `±8` tolerance)
- Isn't already in your collection
- Isn't too similar to a strongly-disliked game (similarity threshold: 55)
- Comes within ±75 minutes of your ideal play time

The page shows:

- The game cover and title
- A **confidence score** (0–1)
- A **"why this game?" panel** with concrete reasons:
  - Theme overlap with your preferences
  - Mechanic affinity
  - Loved-game lookalikes
  - Player-count and complexity fit notes
- Two **alternate picks** in case the primary isn't right

## 4. Make a decision

You can mark the box as `keep`, `return`, or `undecided` via `POST /api/box-decision`. This is persisted to `box_history` and informs future feedback flows.

## 5. Leave feedback

After a few seconds of "delivery", visit [http://localhost:3000/feedback](http://localhost:3000/feedback):

- 1–5 star rating
- Multi-select tag feedback (e.g. *too heavy*, *perfect weight*, *great theme*)
- Optional free-text comment (max 2000 characters)

Submitted to `POST /api/feedback`. Feedback is persisted but does not yet feed back into the scoring engine — that's on the [roadmap](../why.md#whats-next).

## What just happened

You exercised every layer of the stack:

- The **wizard** (a `"use client"` component) POSTed to a **route handler** which validated input and called `persistOnboarding()`.
- `persistOnboarding()` wrote to SQLite via prepared statements in `src/lib/db/`.
- The `/box` server component called `recommendBox()`, which read the taste profile and collection, scored every catalog game, and returned the top match plus alternates.
- The explanation strings were generated inline by the engine — there is no LLM or external API call.

## Next steps

- [How the recommendation engine works →](../concepts/recommendation-engine.md)
- [REST API reference →](../reference/api.md)
- [Tune the scoring weights →](../guides/tune-scoring.md)
