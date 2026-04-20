# CrateMatch — Third-Pass UX & DX Audit

**Date:** 2025-07-19
**Reviewer perspective:** Senior engineer, fresh pass after Reviews 1 & 2 fixes were implemented
**Scope:** Remaining UX gaps, DX friction, architecture debt, accessibility completeness, production readiness

---

## Executive Summary

CrateMatch has matured significantly across two prior review cycles. The mobile nav now has focus trapping + Escape handling, `aria-pressed` is on theme/mechanic toggles, the star rating uses a proper `role="slider"` pattern with keyboard arrows, range sliders have `aria-valuetext`, the radar chart has both `role="img"` with summary label AND a screen-reader-only data table, and the onboarding progress bar gracefully degrades to "Step X of 7" on mobile. The API validation layer is now thorough with explicit range checks and string length limits. Feedback tag pills correctly use `aria-pressed`.

**What remains are structural and DX gaps** — not surface-level polish. The project still has zero tests, zero CI, a type-unsafe DB layer relying on `Record<string, unknown>` casts, hardcoded mock stats without demo labeling, no per-page metadata, and several data-layer inefficiencies where full recommendation runs execute unnecessarily. These are the gaps that separate "working MVP" from "credible open-source project."

---

## 1. Developer Experience — Setup & Onboarding

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| DX1 | **`better-sqlite3` native dependency undocumented** | `README.md`, `package.json:12` | `better-sqlite3` requires a C++ build toolchain (Python, make, g++/clang). A fresh macOS without Xcode CLT or a Linux container without `build-essential` will fail on `npm install` with a confusing `node-gyp` error. The README mentions only "Node.js ≥ 20" and "npm ≥ 10". Add a note: _"Requires a C++ compiler toolchain for `better-sqlite3`. macOS: `xcode-select --install`. Ubuntu: `sudo apt install build-essential`."_ |
| DX2 | **No test command exists** | `package.json:5-10` | There is no `test` script. Running `npm test` yields `"Error: Missing script: "test""`. For any contributor or CI pipeline, this is the first signal that the project lacks verification infrastructure. Even a placeholder `"test": "echo 'No tests yet' && exit 0"` would prevent CI failures. |
| DX3 | **No CI pipeline** | — | No `.github/workflows/`, no GitLab CI, no equivalent. Lint and build pass locally, but there's no automated gate. This means broken commits can land undetected. A 15-line GitHub Actions workflow running `npm ci && npm run lint && npm run build` would close this gap. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| DX4 | **`allowJs: true` in tsconfig is unnecessary noise** | `tsconfig.json:5` | The entire codebase is TypeScript (`.ts`/`.tsx`). `allowJs` serves no purpose and signals to contributors that JS files are welcome — they aren't per `CONTRIBUTING.md:39`. Remove it. |
| DX5 | **No Prettier or pre-commit hooks** | — | While EditorConfig handles basic formatting, there's no automated formatter. Multi-contributor PRs will produce inconsistent style. `prettier` + `lint-staged` + `husky` is a ~10 minute setup. |
| DX6 | **No `npm run reset` script for DB reset** | `README.md:118` | README says "Delete `data/cratematch.db` to reset" — a manual `rm` command. A convenience script `"reset": "rm -f data/cratematch.db data/cratematch.db-shm data/cratematch.db-wal"` would be clearer and cover WAL files too. |

---

## 2. Type Safety & Data Layer

### P0 — Critical

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| TS1 | **Pervasive `Record<string, unknown>` casts in DB queries** | `db/queries.ts:7,11,33-34,42,49,56,63-66,71,171-176` | Every single DB read casts rows to `Record<string, unknown>` and then manually coerces each field with `String()`, `Number()`, `Boolean()`. This is the largest type-safety gap in the codebase. If a column name changes in the schema, no TypeScript error surfaces — it silently produces `"undefined"` strings or `NaN` numbers. **Fix:** Define row interfaces matching the SQLite schema (e.g., `interface GameRow { slug: string; title: string; ... }`) and use `db.prepare<[], GameRow>(...)`. `better-sqlite3` supports generic typed queries. |

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| TS2 | **`mappers.ts` does unsafe JSON.parse without validation** | `db/mappers.ts:9-10` | `JSON.parse(String(row.themes)) as string[]` trusts that the SQLite column contains valid JSON arrays of strings. A malformed row would throw at runtime with an opaque error. Add a guard: validate the parsed result is an array of strings, or use Zod. |
| TS3 | **Schema + seed + connection in single 200-line file** | `db/connection.ts:1-201` | `connection.ts` mixes three concerns: database connection management (singleton + path), schema DDL (CREATE TABLE statements), and demo data seeding (INSERT statements). This makes schema changes risky — you must read through 200 lines of interleaved concerns. Extract to `schema.ts` and `seed.ts`. |
| TS4 | **`getDecision()` return type is implicitly loose** | `db/queries.ts:70-73` | `(row?.decision as BoxDecision | undefined) ?? "undecided"` — the `as BoxDecision` is an unsafe cast. The DB could contain any string. Should validate against the `BoxDecision` union or use a `Set` check like the API routes do. |

---

## 3. Data Layer & Performance

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| DL1 | **Landing page runs full recommendation engine** | `server-data.ts:41` | `getLandingPageSnapshot()` calls `getFullUserState()`, which runs the entire recommendation engine (scoring all 65 games), just to get the top featured match. Before onboarding is complete, this is wasted computation. Consider a guard: if `!profile.onboardingComplete`, return `featuredMatch: null` without running the engine. |
| DL2 | **`getCollectionSnapshot()` re-runs the full engine** | `server-data.ts:98` | Same pattern — calls `getFullUserState()` when it only needs `ownedSlugs`, catalog, and a subset of recommendations. Each collection page load re-runs the scorer for all 65 games. |
| DL3 | **`force-dynamic` on community page** | `community/page.tsx:4` | `getCommunitySnapshot()` returns only hardcoded constants (`COMMUNITY_POSTS`, `FEATURED_REVIEWS`, static stats). This page could be statically generated. Removing `force-dynamic` would eliminate server computation entirely and reduce TTFB to near-zero. |
| DL4 | **Stats are hardcoded mock data without "demo" label** | `server-data.ts:49-53` | Stats like "3,240 subscribers" and "94% satisfaction" appear as real metrics on the landing page. The checkout section correctly labels itself as mock, but stats don't. This inconsistency is misleading. Add a "(demo)" suffix or a small badge. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| DL5 | **`getBoxSnapshot()` silently shows stale state on month rollover** | `server-data.ts:82-95` | When the month changes, `getDecision(getCurrentBoxMonthValue())` returns `"undecided"` for the new month. There's no indication that the previous month's decision was recorded. The user sees their decision disappear with no explanation. A "Previous month archived" message or decision carry-forward UX would help. |
| DL6 | **Game catalog is a 900+ line TypeScript module** | `lib/catalog/` | `GAME_CATALOG` is defined as a TypeScript array literal. This inflates IDE indexing, makes data edits error-prone (one missing comma breaks the build), and prevents non-developers from updating the catalog. Moving to `data/games.json` + Zod validation at startup would be cleaner. |

---

## 4. Remaining Accessibility Gaps

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| A1 | **`<h3>` inside `GameCover` breaks heading hierarchy** | `game-cover.tsx:52` | `GameCover` renders an `<h3>` for the game title, but it's used in varying contexts — inside landing page sections with `<h2>`, inside collection cards with no heading parent, inside the box page already under `<h1>`. This creates non-sequential heading levels (h1 → h3 skip, or orphaned h3). The title inside a decorative cover should be a `<span>` or `<p>`, not a heading. The component already has `role="img"` on the wrapper, so the heading is semantically redundant. |
| A2 | **Loading skeleton has no accessible label** | `loading.tsx:1-14` | The skeleton placeholder uses `animate-pulse` divs but has no `role="status"`, no `aria-label="Loading"`, and no screen-reader text. Screen readers see empty rectangles. Add `role="status" aria-label="Loading content"` to the wrapper. |
| A3 | **Community unboxing posts use `<article>` without heading** | `community/page.tsx:33-49` | Each unboxing post is wrapped in `<article>` but has no `<h2>`/`<h3>` — only a bold `<div>` for the name. Articles should have a heading for landmark navigation. Change the name `<div>` to `<h3>`. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| A4 | **No per-page `<title>` metadata** | All `page.tsx` files | No page exports `metadata` with a custom `title`. The layout provides a template `"%s | CrateMatch"` but no page uses it. Every browser tab shows just "CrateMatch" regardless of route. Add `export const metadata = { title: "Taste Quiz" }` etc. to each page for better tab identification and SEO. |
| A5 | **Community likes heart emoji invites clicking** | `community/page.tsx:46` | `❤ {post.likes}` is plain text but the heart emoji suggests interactivity. Add `cursor-default` to the container, or dim the heart with `opacity-60` to signal non-interactivity. |
| A6 | **Mobile nav drawer doesn't trap scroll** | `site-header.tsx:114-138` | When the mobile drawer opens, the main page content remains scrollable behind it. Users can scroll the page while the drawer is open, which is disorienting. Add `overflow-hidden` to `<body>` while `mobileOpen` is true, or render a backdrop overlay. |

---

## 5. UI/UX Polish

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| UX1 | **FAQ section is still not collapsible** | `page.tsx:153-160` | Flagged in Reviews 1 and 2. All FAQ answers are fully expanded, creating a ~600px scroll zone. Native `<details>`/`<summary>` is a zero-JS, accessible, one-line-per-item fix. This is the longest-standing open issue across all reviews. |
| UX2 | **No post-onboarding redirect** | `onboarding-wizard.tsx:129-136` | After successful onboarding submission, the wizard shows a success message but stays on the onboarding page. The user must manually navigate to `/box` to see their recommendation. Add `router.push("/box")` after a short delay (or immediately). |
| UX3 | **Past boxes on `/box` still lack game cover art** | `box/page.tsx:81-93` | The current match has a rich `GameCover` component, but past box entries are text-only. This creates visual inconsistency and makes past boxes feel second-class. A compact `<GameCover game={box.game} compact />` would unify the experience. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| UX4 | **Inconsistent border-radius across card types** | Multiple files | Cards use `rounded-[2rem]`, `rounded-[1.75rem]`, `rounded-[1.5rem]`, `rounded-3xl`, `rounded-2xl`, and `rounded-xl` across components. No clear hierarchy. Define a consistent rule: outer cards = `2rem`, inner/nested = `1.5rem`, buttons = `full`, and refactor. |
| UX5 | **Empty state for sparse backup matches missing** | `box/page.tsx:97-111` | If the recommendation engine returns fewer than 4 results (e.g., due to heavy collection overlap), the "Backup matches" section renders an empty `<div>` with just the heading. Add a message: "No backup matches available with current constraints." |
| UX6 | **Landing hero heading overflows on <360px** | `page.tsx:19` | `text-5xl sm:text-6xl` produces a very tall text block on 320px viewports. Consider `text-3xl sm:text-5xl lg:text-6xl` for better mobile sizing. |
| UX7 | **Footer layout collision at `md` breakpoint** | `site-footer.tsx:4` | At exactly 768–800px, the footer text and cutoff pill crowd each other. Add `md:gap-6` to prevent collision. |

---

## 6. API & Error Handling

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| API1 | **No error differentiation in client components** | All client components | Every `catch` block shows a generic message string. Network errors (offline), validation errors (400), and server errors (500) all display the same red banner. Users can't distinguish "your input was invalid" from "the server is down." Parse `response.status` in the catch handler to show differentiated messages. |
| API2 | **`box-decision` API doesn't validate `gameSlug` exists in catalog** | `api/box-decision/route.ts:12-14` | The route validates that `gameSlug` is a non-empty string, but doesn't verify the slug corresponds to an actual game in the catalog. A user could POST `gameSlug: "nonexistent-game"` and it would be persisted. Add a catalog lookup check. |
| API3 | **Feedback comment textarea has no client-side length indicator** | `feedback-form.tsx:197-204` | The API enforces a 2000-character limit (`api/feedback/route.ts:31`), but the textarea shows no character count or maxlength constraint. Users will discover the limit only via a server error. Add `maxLength={2000}` and/or a character counter. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| API4 | **`box-decision` API ignores `monthLabel` from client** | `api/box-decision/route.ts`, `box-decision-panel.tsx:32` | The client sends `monthLabel` in the POST body, but the API ignores it and derives the month server-side via `getCurrentBoxMonthValue()`. This is actually correct behavior (server should be authoritative), but the client is doing unnecessary work. Remove `monthLabel` from the client payload to avoid confusion about who controls the month. |
| API5 | **No rate limiting or abuse prevention on any API route** | All API `route.ts` files | All 5 API routes accept unlimited requests. While acceptable for a local MVP, this is a gap worth documenting for production readiness. |

---

## 7. Testing & Quality Infrastructure

### P0 — Critical

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| T1 | **Zero tests in the entire project** | — | No `*.test.*` or `*.spec.*` files exist anywhere. No test framework is installed. No test script in `package.json`. The recommendation engine (`recommendations.ts`) has ~300 lines of pure functions (`buildTasteRadar`, `getRecommendations`, `buildCollectionInsights`) that are ideal unit test candidates. The 5 API routes are ideal integration test candidates. This is the single biggest DX gap. **Recommended:** Install Vitest + React Testing Library. Write unit tests for `recommendations.ts` first (highest value, pure functions, no mocking needed). Target 80%+ coverage on `src/lib/`. |

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| T2 | **No API documentation** | — | The 5 API routes (onboarding, checkout, collection, box-decision, feedback) have no documented request/response schemas. A contributor must read the source to understand the contract. Create `docs/API.md` with request shapes, validation rules, and example responses. |
| T3 | **ESLint config has no custom rules** | `eslint.config.mjs:1-18` | The ESLint config only extends `next/core-web-vitals` and `next/typescript` with no project-specific rules. Consider adding `no-console: "warn"` (there are no console.logs currently, but there's no guard against adding them) and `@typescript-eslint/no-explicit-any: "error"` to enforce the existing `any`-free convention. |

---

## 8. What Reviews 1 & 2 Fixed (Verified) ✅

| Prior Finding | Status | Evidence |
|---------------|--------|----------|
| **P0: Mobile navigation** | ✅ Fixed | `site-header.tsx:94-111` — hamburger + drawer |
| **P0: Focus trap + Escape on mobile drawer** | ✅ Fixed | `site-header.tsx:25-55` — full trap + Escape handler |
| **P0: `aria-pressed` on theme/mechanic toggles** | ✅ Fixed | `onboarding-wizard.tsx:216,239` |
| **P0: Star rating aria/visual mismatch** | ✅ Fixed | `feedback-form.tsx:132-148` — `role="slider"` with `aria-valuenow` + keyboard arrows |
| **P1: Active nav indicator** | ✅ Fixed | `site-header.tsx:80-86` — `aria-current="page"` + visual |
| **P1: Step labels** | ✅ Fixed | `onboarding-wizard.tsx:50` — "Games 1–5" |
| **P1: `role="radio"` + `aria-checked` on quiz** | ✅ Fixed | `onboarding-wizard.tsx:190-191` |
| **P1: Range slider `aria-valuetext`** | ✅ Fixed | `onboarding-wizard.tsx:284,298,312` |
| **P1: Radar chart accessibility** | ✅ Fixed | `taste-radar-chart.tsx:13-46` — `role="img"` + `aria-label` + sr-only table |
| **P1: Collection search matches mechanics** | ✅ Fixed | `collection-manager.tsx:45` |
| **P1: "Current plan" badge** | ✅ Fixed | `plan-selector.tsx:65-67` |
| **P1: Feedback page implemented (FR-08)** | ✅ Fixed | Full star rating, tags with `aria-pressed`, comments |
| **P1: API validation bounds** | ✅ Fixed | All routes validate ranges, lengths, types |
| **P1: Feedback per-box pending state** | ✅ Fixed | `feedback-form.tsx:29` — `pendingBoxMonth` state |
| **P1: Mobile progress bar collapse** | ✅ Fixed | `onboarding-wizard.tsx:161-168` — progress bar + "Step X of 7" |
| **P1: `getPlansSnapshot()` optimized** | ✅ Fixed | `server-data.ts:72-74` — calls `getUserProfile()` directly |
| **P2: `aria-pressed` on feedback tag pills** | ✅ Fixed | `feedback-form.tsx:178` |
| **P2: Dynamic `CURRENT_BOX_MONTH`** | ✅ Fixed | `server-data.ts:6-9` — derives from `new Date()` |
| **P2: Error/404 page focus rings** | ✅ Fixed | `error.tsx:13`, `not-found.tsx:10` |
| **P2: Security headers** | ✅ Fixed | `next.config.ts:5-17` |

---

## 9. Consolidated Recommendations by Priority

### P0 — Fix immediately (blocks credibility)

1. **T1 — Add Vitest + initial test suite.** Install `vitest` and `@testing-library/react`. Write unit tests for `buildTasteRadar()`, `getRecommendations()`, and `buildCollectionInsights()` in `recommendations.ts`. These are pure functions — no mocking needed, highest value-to-effort ratio in the project.

2. **TS1 — Type the DB query layer.** Replace all `Record<string, unknown>` casts in `db/queries.ts` with typed row interfaces. This is the last significant type-safety gap. Every other layer is well-typed.

### P1 — Fix within the sprint

3. **DX1 — Document native dependency requirement** for `better-sqlite3` in README.
4. **DX2 — Add a `test` script** to `package.json` (even if it's a placeholder initially).
5. **DX3 — Add GitHub Actions CI** — `npm ci && npm run lint && npm run build && npm test`.
6. **TS3 — Extract schema and seed from `connection.ts`** into `schema.ts` and `seed.ts`.
7. **A1 — Change `<h3>` in `GameCover` to `<span>`** to fix heading hierarchy.
8. **A2 — Add `role="status" aria-label="Loading content"` to loading skeleton.**
9. **UX1 — Convert FAQ to `<details>`/`<summary>`.** Three reviews, same finding. Just do it.
10. **UX2 — Add post-onboarding redirect** to `/box` via `router.push("/box")`.
11. **API1 — Differentiate error types in client catch blocks** (400 vs 500 vs network).
12. **DL1 — Guard `getLandingPageSnapshot()`** against running recommendations when onboarding is incomplete.
13. **DL3 — Remove `force-dynamic` from community page.**
14. **DL4 — Add "(demo)" label to landing page stats.**
15. **T2 — Create `docs/API.md`** documenting all 5 route contracts.

### P2 — Polish pass

16. **A3 — Add heading to community `<article>` elements.**
17. **A4 — Add per-page `<title>` metadata** to each route page.
18. **A5 — Dim community likes heart** or add `cursor-default`.
19. **A6 — Trap scroll when mobile nav is open.**
20. **UX3 — Add compact `GameCover` to past box entries.**
21. **UX4 — Standardize border-radius tokens.**
22. **UX5 — Add empty state for sparse backup matches.**
23. **UX6 — Scale hero heading for mobile** (`text-3xl sm:text-5xl`).
24. **UX7 — Add `md:gap-6` to footer.**
25. **API2 — Validate `gameSlug` exists in catalog** in box-decision route.
26. **API3 — Add character counter to feedback comment textarea.**
27. **DX4 — Remove `allowJs: true`** from tsconfig.
28. **DX5 — Add Prettier + lint-staged + husky.**
29. **DX6 — Add `npm run reset` convenience script.**
30. **DL6 — Move game catalog to `data/games.json`.**
31. **T3 — Add project-specific ESLint rules.**
32. **TS2 — Add JSON.parse validation in `mappers.ts`.**
33. **TS4 — Validate `getDecision()` return against `BoxDecision` union.**

---

## 10. Score Card — Current State

| Dimension | Score (1–10) | Trend vs Review 2 | Key remaining gap |
|---|:---:|:---:|---|
| **Setup & Onboarding** | 7 | ↑ | Native dep docs, no test script |
| **Documentation** | 7 | → | No API docs, no per-page titles |
| **Code Organization** | 8 | ↑ | `connection.ts` mixing 3 concerns |
| **Type Safety** | 6 | → | DB layer `Record<string, unknown>` |
| **Accessibility** | 8 | ↑↑ | Heading hierarchy, loading skeleton |
| **Error Handling** | 7 | ↑ | No error differentiation client-side |
| **Testing** | 1 | → | Zero tests, zero coverage |
| **CI/CD** | 1 | → | No pipeline exists |
| **UI/UX Polish** | 8 | ↑ | FAQ, onboarding redirect, past boxes |
| **API Design** | 7 | ↑ | gameSlug validation, rate limiting docs |
| **Performance** | 6 | → | Unnecessary recommendation runs |

**Overall:** 6.0/10 — A polished, well-typed frontend on top of an unverified, untested data layer. The app looks and feels premium, but the DX foundation (tests, CI, typed DB) is the bottleneck preventing this from being a credible open-source project.
