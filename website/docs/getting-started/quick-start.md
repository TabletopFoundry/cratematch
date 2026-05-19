---
title: Quick Start
sidebar_position: 1
---

# Quick Start

Get CrateMatch running locally in under five minutes.

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A POSIX shell (macOS, Linux, or WSL on Windows)

Verify your toolchain:

```bash
node --version   # v20.x or newer
npm --version    # 10.x or newer
```

## 1. Clone and install

```bash
git clone https://github.com/TabletopFoundry/cratematch
cd cratematch
npm install
```

`npm install` builds `better-sqlite3` from native sources, which requires a working C++ toolchain. On macOS, Xcode Command Line Tools (`xcode-select --install`) are enough. On Debian/Ubuntu, install `build-essential` and `python3`.

## 2. Start the dev server

```bash
npm run dev
```

The first request triggers SQLite schema creation and seeds:

- 65 real board games with theme, mechanic, complexity, and price metadata
- A demo subscriber with completed onboarding (15 quiz ratings, 8 themes, 8 mechanics, Collector plan)
- 26 owned games in the current collection
- 8 months of crate history with keep/return decisions and feedback
- 49 recommendation snapshots showing monthly matches, alternatives, and explanations

Open [http://localhost:3000](http://localhost:3000).

## 3. Take the tour

| Route | What you'll see |
|-------|-----------------|
| `/` | Landing page with hero, pricing, FAQ |
| `/onboarding` | The multi-step taste profile wizard |
| `/plans` | Subscription tier comparison + mock checkout |
| `/box` | This month's match with explainability |
| `/collection` | Collection intelligence dashboard |
| `/feedback` | Post-delivery rating and feedback form |
| `/community` | Mock community unboxings |

## 4. Verify the install

```bash
curl http://localhost:3000/api/health
```

Expect a `200` response shaped like:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:23:00.000Z",
  "version": "0.1.0",
  "database": { "connected": true, "gameCount": 65 }
}
```

If `gameCount` is `0`, the seed didn't run — see [Troubleshooting](../troubleshooting.md#empty-database).

## Reset to a clean state

The database lives at `data/cratematch.db`. Delete it to reseed from scratch:

```bash
rm data/cratematch.db
npm run dev
```

## Next steps

- [Get your first recommendation →](./first-recommendation.md)
- [Understand the recommendation engine →](../concepts/recommendation-engine.md)
- [Browse the REST API →](../reference/api.md)
