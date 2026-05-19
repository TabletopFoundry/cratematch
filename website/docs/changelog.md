---
title: Changelog
---

# Changelog

All notable changes to CrateMatch. Format adapted from [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project follows semantic versioning once it ships a public `1.0.0`.

## [0.1.0] — MVP

The first end-to-end release. Validates the curation + explainability hypothesis with a single demo subscriber and a 65-game catalog.

### Added

- **Taste onboarding wizard** — name, plan, sliders (player count, play time, complexity), theme & mechanic preferences (up to 20 each), and a 15-game quiz with five rating levels.
- **Content-based recommendation engine** (`src/lib/recommendations.ts`) — deterministic scoring across theme overlap, mechanic overlap, complexity fit, player fit, time fit, and disliked-game similarity filtering. Returns the top pick, two alternates, a confidence score, and plain-English reasons.
- **Live radar chart** powered by Recharts, computed from the in-progress taste profile and re-rendered as the wizard progresses.
- **Monthly box preview** at `/box` — primary pick, alternates, confidence, and reason panel. Supports `keep` / `return` / `undecided` decisions persisted via `POST /api/box-decision`.
- **Collection intelligence dashboard** at `/collection` — search-driven add/remove, gap analysis radar, and complementary suggestions derived from owned games.
- **Subscription tier selector** at `/plans` — Discovery, Explorer, Collector — with a mock checkout flow.
- **Post-delivery feedback form** at `/feedback` — 1–5 star rating, tag selection, free-text comment (max 2000 chars).
- **Mock community feed** at `/community` — unboxings, subscriber stats, featured reviews.
- **65-game catalog** with theme, mechanic, complexity, player count, play time, and price metadata. Lives in `src/lib/catalog/games.ts`.
- **Demo seed** — 8 months of crate history, 49 recommendation snapshots, 26 owned games. Gated by `CRATEMATCH_ENABLE_DEMO_SEED` in production.
- **REST API** — `/api/onboarding`, `/api/checkout`, `/api/box-decision`, `/api/collection` (POST/DELETE), `/api/feedback`, `/api/health`.
- **SQLite persistence** via `better-sqlite3` with prepared statements and a single-file database at `data/cratematch.db`.
- **Health endpoint** for production probes — `GET /api/health` returns connection status and seeded game count.
- **MIT license**, contribution guide, and editorconfig.

### Stack

- Next.js 16 (App Router) on Node 20+.
- React 19.
- TypeScript 5.x in strict mode.
- Tailwind CSS 4.
- Recharts 3.x.
- `better-sqlite3` 11.x.

### Known gaps

- No automated test suite. Engine output is verified by manual snapshot inspection.
- Single demo subscriber. Multi-subscriber support is a planned refactor.
- No real billing or fulfillment.
- Feedback is persisted but does not yet adjust the scoring engine.
- Onboarding is one-shot; per-field editing is planned.

See [Why CrateMatch → What's next](./why.md#whats-next) for the planned trajectory.

---

For releases beyond `0.1.0`, this page will list user-visible changes per version with `### Added`, `### Changed`, `### Fixed`, and `### Removed` sections.
