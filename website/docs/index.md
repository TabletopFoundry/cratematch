---
slug: /introduction
title: Introduction
description: Personalized board game subscriptions, scored and explained.
sidebar_position: 1
---

# CrateMatch

**A personalized board game subscription MVP with content-based curation, collection intelligence, and transparent recommendation explanations.**

CrateMatch matches subscribers with one monthly board game tailored to their taste profile and existing collection — not a random pick from a warehouse. It combines a multi-step taste quiz, preference-weighted scoring, and explainable recommendation logic to deliver one game each month that actually fits your table.

```bash
git clone https://github.com/TabletopFoundry/cratematch
cd cratematch
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app auto-seeds SQLite with 65 real board games, a demo subscriber, and 8 months of crate history on first run.

## What you get

- **Taste onboarding** — a 15-game quiz, theme/mechanic preferences, complexity & player-count sliders, with a live radar chart.
- **Content-based recommendation engine** — theme overlap, mechanic affinity, complexity fit, plan budget, and collection-aware duplicate prevention.
- **Explainable matches** — every monthly box ships with a confidence score and plain-English reasons.
- **Collection intelligence** — duplicate prevention, complementary suggestions, gap analysis.
- **Three subscription tiers** — Discovery, Explorer, Collector — each with a budget that scores candidates.
- **Post-delivery feedback** — 1–5 star ratings, tag-based feedback, free-text comments.

## Where to next

- New to the project? Start with the [Quick Start](getting-started/quick-start.md) — productive in under five minutes.
- Want the mental model? Read [Core Concepts](concepts/overview.md).
- Building on it? Skip to the [API Reference](reference/api.md) and [Data Model](reference/data-model.md).
- Choosing between rivals? See [Why CrateMatch](why.md).
