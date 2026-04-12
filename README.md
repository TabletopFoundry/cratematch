# CrateMatch

CrateMatch is a polished MVP for a personalized board game subscription service with AI-style curation, taste onboarding, collection intelligence, and monthly box previews.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS 4
- SQLite via `better-sqlite3`
- Recharts for the taste radar chart

## Features

- Warm premium landing page with hero, how-it-works flow, pricing, testimonials, and FAQ
- Multi-step taste onboarding quiz with 15 anchor games, theme/mechanic preferences, profile sliders, and a radar chart
- Three subscription tiers with a working mock checkout flow
- Monthly box preview with personalized explanation, game details, keep/return decision UI, and past box history
- Collection management with owned-game tracking, gap analysis, complementary recommendations, and duplicate prevention messaging
- Mock community feed with recent unboxings, subscriber stats, and featured reviews
- Loading, empty, and error states across the app

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Data persistence

The app seeds 65 real board games on first run and stores local demo state in:

- `data/cratematch.db`

That includes the demo subscriber profile, quiz answers, selected plan, collection, and box decisions.

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Main routes

- `/` — landing page
- `/onboarding` — taste profile wizard
- `/plans` — tier comparison + mock checkout
- `/box` — this month’s match
- `/collection` — collection intelligence dashboard
- `/community` — mock subscriber community
