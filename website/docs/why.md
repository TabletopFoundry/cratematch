---
title: Why CrateMatch
---

# Why CrateMatch

Most monthly board game subscriptions are a roulette wheel with a markup. CrateMatch is opinionated about doing the opposite: every pick is explained, every collection is respected, and every taste profile shapes the next box.

## The honest comparison

| | CrateMatch | Typical "curated" box | Generic discovery sites |
|---|---|---|---|
| Personalization | Content-based scoring across themes, mechanics, complexity, players, and play time | Tier-based; one box per tier per month | Popularity / editorial picks |
| Collection awareness | Hard duplicate filter + complementary suggestions | Subscriber tracks their own collection | None |
| Explainability | Plain-English reasons per pick, with confidence score | "Our experts picked it" | Star ratings, no rationale |
| Quiz inputs | 15 games × 5-level ratings | Brief preference form, optional | None |
| Source of truth | Open code, deterministic engine | Editorial team, opaque process | Crowd ratings |
| Cost to evaluate | `git clone` and `npm install` | Subscribe and wait | Browse |

CrateMatch isn't trying to replace human curators — it's trying to make personalization legible.

## Who this is for

- **Subscribers** who've been burned by random boxes and want to see *why* a game was picked before committing.
- **Hobby brands** evaluating a recommendation layer for an existing subscription product.
- **Engineers and designers** prototyping content-based recommenders without ML infrastructure.
- **Researchers** studying explainable recommendation systems with a fully open implementation.

## What makes the engine credible

Three things, none of which are common in the category:

1. **Deterministic.** Same inputs, same output, every time. Reviewers can audit the picks. Subscribers can build trust over months.
2. **Composed of named, weighted signals.** Theme overlap (+18), mechanic overlap (+20), complexity fit (+12), and so on — see [Recommendation Engine](./concepts/recommendation-engine.md). Every weight is a tunable constant.
3. **Reasons reference real overlaps.** "Strong overlap with themes you loved: nature, engine-building" cites the actual themes the engine found. Not a templated platitude.

## What's next

The MVP is feature-complete for the curation + explainability hypothesis. Realistic next milestones:

- **Per-subscriber accounts** instead of the single demo user.
- **Real billing** (Stripe) on top of the existing plan model.
- **Feedback-driven weight updates** — tag feedback should adjust the subscriber's effective theme/mechanic weights between boxes.
- **Editable preferences** post-onboarding (no full re-onboarding required).
- **Cross-subscriber signals** as an opt-in second-layer ranker for cold-start subscribers.
- **A test suite** covering the engine and the route handlers.

These are deliberately out of scope for the MVP — the goal of v0.1 is to validate that explainable, collection-aware curation is meaningfully different from the alternative.

## When CrateMatch is the wrong choice

- You need a multi-tenant SaaS *today*. The MVP assumes one subscriber.
- You need real fulfillment. There's no logistics layer.
- You want ML-based recommendations. The engine is intentionally non-ML.
- You need >10k concurrent writers. SQLite is the constraint; migrate to Postgres first (see [Deploy](./guides/deploy.md)).

Picking the right tool means knowing where it stops. CrateMatch stops at "the right game lands on the right shelf, and the subscriber understands why."
