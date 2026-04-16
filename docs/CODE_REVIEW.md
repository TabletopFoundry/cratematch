# Code Quality & Architecture Review — CrateMatch

**Reviewed:** 2025-07-15
**Codebase:** Next.js 16 + React 19 + TypeScript + SQLite (better-sqlite3) + Tailwind CSS 4 + Recharts
**Total Source Lines:** ~4,081 (excluding `node_modules`, `.next`)
**Files Analyzed:** 31 source files across `src/lib`, `src/components`, `src/app`

---

## Executive Summary

| Dimension              | Rating        |
|------------------------|---------------|
| Overall Quality Score  | **B**         |
| Architecture Health    | **Good**      |
| Maintainability Index  | **Medium**    |
| Technical Debt Estimate| **Medium**    |

CrateMatch is a well-structured MVP with clear layer separation (data → service → UI), solid TypeScript typing, good accessibility practices, and thoughtful input validation on all API routes. The codebase is consistent in style and naming conventions. The primary concerns are: (1) the absence of any automated tests, (2) a monolithic 1,091-line static data catalog, (3) repeated computation patterns across snapshot functions, and (4) client components that carry nontrivial complexity without error boundary coverage. These are all addressable with moderate effort before the codebase scales further.

---

## Positive Observations (Preserve These)

| Area | Detail |
|------|--------|
| **Type safety** | Strict TypeScript (`strict: true`), clean domain types in `types.ts` with union types for constrained values (`RatingValue`, `PlanId`, `BoxDecision`). |
| **Layer separation** | Clear 3-layer architecture: `lib/db.ts` (persistence) → `lib/server-data.ts` (service/orchestration) → `app/*/page.tsx` + `components/*` (presentation). No layer skipping. |
| **API validation** | Every API route validates inputs with type checks, length limits, and range constraints before calling persistence. Consistent `try/catch` with user-friendly 400/500 responses. |
| **Accessibility** | Skip-to-content link, `aria-label`, `aria-current`, `aria-pressed`, `role="radiogroup"`, focus-visible rings, screen-reader-only data table for radar chart, keyboard-navigable star rating with `role="slider"`, mobile nav focus trap with Escape support. |
| **Server/client boundary** | Clean `"use client"` directives only on interactive components. Server components (pages) call server-only data functions. `import "server-only"` guard in `db.ts`. |
| **SQLite pragmas** | WAL mode + foreign keys enabled on database creation — correct production-ready setup. |
| **Consistent error UX** | Global `error.tsx`, `not-found.tsx`, `loading.tsx` with styled recovery actions. Per-component `role="status" aria-live="polite"` for async feedback. |
| **Transaction safety** | `saveOnboarding` wraps multi-table writes in a `db.transaction()`. Seed data uses transactions too. |

---

## Critical Findings — P0 (Must Address)

### P0-1: Zero Test Coverage

**Location:** Entire codebase
**Severity:** Critical
**Impact:** All business logic, API validation, and recommendation algorithms are unverified. Any refactor risks silent regression.

The project has no test files, no test runner configured (`package.json` has no `test` script beyond the default), and no testing dependencies (no Jest, Vitest, or Playwright).

**Critical untested surface area:**
- `recommendations.ts` — scoring weights, overlap calculations, filtering logic (202 lines of pure functions)
- `server-data.ts` — snapshot assembly, `buildUserState()` orchestration
- API routes — validation edge cases (boundary values, malformed JSON, type coercion)
- `db.ts` — schema migrations, seed data idempotency

**Fix:**
1. Add Vitest (`npm i -D vitest`) and configure a `test` script.
2. Start with unit tests for `recommendations.ts` (pure functions, no DB needed): `overlapScore`, `closeness`, `buildTasteRadar`, `getRecommendations`, `buildCollectionInsights`.
3. Add integration tests for API routes using Next.js test helpers or direct SQLite in-memory DB.
4. Target: ≥80% coverage on `lib/` before adding features.

---

### P0-2: No Input Sanitization on `QuizAnswer[]` Items in Onboarding API

**Location:** `src/app/api/onboarding/route.ts:36-63`
**Severity:** Critical (data integrity)

The onboarding API validates that `body.answers` is an array but does **not** validate individual items:

```typescript
// Line 36-37: Only checks Array.isArray
if (!Array.isArray(body.answers)) {
  return Response.json({ error: "Answers must be an array." }, { status: 400 });
}
// Line 63: Passes raw answers directly to persistence
answers: body.answers,
```

A client can submit answers with arbitrary `gameSlug` values (SQL injection via malformed slugs is prevented by prepared statements, but data corruption is not), invalid `rating` values outside the `RatingValue` union, or non-string types.

**Fix:**
```typescript
const validRatings = new Set(["loved", "liked", "neutral", "disliked", "unplayed"]);
const sanitizedAnswers = body.answers
  .filter((a): a is { gameSlug: string; rating: string } =>
    typeof a?.gameSlug === "string" && typeof a?.rating === "string"
  )
  .filter(a => a.gameSlug.length <= 100 && validRatings.has(a.rating))
  .map(a => ({ gameSlug: a.gameSlug.trim(), rating: a.rating as RatingValue }));
```

---

### P0-3: Hardcoded Demo User — No Multi-User Path

**Location:** `src/lib/db.ts:16` (`const DEMO_USER_ID = "demo-user"`) and all 15+ functions using `userId = DEMO_USER_ID`
**Severity:** High (architectural)

Every DB function defaults to `DEMO_USER_ID`. While acceptable for an MVP demo, there is no authentication layer, no session management, and no path to multi-tenancy. Any concurrent users would mutate the same profile, creating data races on the shared SQLite file.

**Fix (staged):**
1. **Immediate:** Document this as a known limitation in README.
2. **Short-term:** Add cookie-based anonymous session IDs (e.g., `crypto.randomUUID()`) so concurrent demo users don't collide.
3. **Long-term:** Introduce an auth provider (NextAuth.js / Clerk) and replace the default parameter pattern with middleware-injected user context.

---

## Architectural Concerns — P1

### P1-1: Monolithic Static Catalog File (1,091 lines)

**Location:** `src/lib/catalog.ts`
**Severity:** High
**Impact:** Maintainability, code review friction, merge conflicts

This single file contains 65 game definitions (inline JSON objects), constants for themes, mechanics, ratings, plan details, quiz slugs, community posts, featured reviews, testimonials, FAQ items, and how-it-works steps — all in one 1,091-line file.

**Fix:**
Split into domain-scoped modules:
```
src/lib/catalog/
  games.ts          # GAME_CATALOG array
  plans.ts          # PLAN_DETAILS, pricing
  content.ts        # COMMUNITY_POSTS, FEATURED_REVIEWS, TESTIMONIALS, FAQ_ITEMS, HOW_IT_WORKS
  constants.ts      # ALL_THEMES, ALL_MECHANICS, RATING_OPTIONS, QUIZ_GAME_SLUGS
  index.ts          # Re-exports
```

---

### P1-2: `buildUserState()` Called Redundantly Across Snapshots

**Location:** `src/lib/server-data.ts:11-31`
**Severity:** Medium-High
**Impact:** Performance, unnecessary DB reads

`buildUserState()` performs 7 DB queries + full recommendation computation. It's called by every snapshot function (`getLandingPageSnapshot`, `getOnboardingSnapshot`, `getBoxSnapshot`, `getCollectionSnapshot`, `getPlansSnapshot`, `getFeedbackSnapshot`). Even `getLandingPageSnapshot` (line 33) and `getPlansSnapshot` (line 65) run the full recommendation engine despite needing only a subset of data.

**Fix:**
1. **Extract granular data-fetching helpers** that snapshot functions can compose:
   ```typescript
   function getProfileAndPreferences() { ... }
   function getRecommendationsForProfile(profile, prefs) { ... }
   ```
2. **Lazy-compute recommendations** only when snapshots actually need them.
3. For `getPlansSnapshot`, only `getUserProfile()` is needed — skip recommendations entirely.
4. Consider request-level memoization (React `cache()` or a per-request context) to avoid redundant DB reads if multiple snapshots are called in the same render.

---

### P1-3: `db.ts` Mixes Schema, Seed Data, CRUD, and Mapping

**Location:** `src/lib/db.ts` (388 lines)
**Severity:** Medium
**Impact:** SRP violation, hard to maintain

This single file contains:
- Schema DDL (lines 30-108)
- Seed data generation (lines 126-187)
- Global singleton management (lines 192-198)
- Row-to-domain mapping (`parseGame`, lines 200-214)
- 15 CRUD functions (lines 216-388)

**Fix:**
```
src/lib/db/
  connection.ts    # getDb(), singleton, pragma setup
  schema.ts        # CREATE TABLE statements
  seed.ts          # Demo user and game seeding
  queries.ts       # All CRUD functions
  mappers.ts       # parseGame and row mapping utilities
  index.ts         # Re-exports
```

---

### P1-4: No Error Boundaries Around Client Components

**Location:** All interactive client components
**Severity:** Medium
**Impact:** Resilience

The global `error.tsx` catches server-side rendering errors, but client-side errors in `OnboardingWizard`, `CollectionManager`, `FeedbackForm`, `PlanSelector`, and `BoxDecisionPanel` will crash the entire page without a targeted recovery option.

**Fix:**
Add React error boundaries (or Next.js nested `error.tsx` files) around each major interactive section. At minimum, wrap the three most complex components:
- `OnboardingWizard` (406 lines, multi-step state machine)
- `CollectionManager` (219 lines, search + mutation)
- `FeedbackForm` (220 lines, multi-form state)

---

### P1-5: Magic Numbers in Recommendation Algorithm

**Location:** `src/lib/recommendations.ts`
**Severity:** Medium
**Impact:** Maintainability, tuning difficulty

The recommendation engine is littered with unexplained numeric constants:

| Line | Value | Purpose (inferred) |
|------|-------|---------------------|
| 36   | `18`  | strategy mechanic weight per match |
| 37   | `12`  | theme bias multiplier |
| 39   | `10`  | complexity-to-score factor |
| 58   | `16, 18, 18, 20, 10, 10, 12` | similarity sub-weights |
| 85   | `8`   | budget tolerance buffer |
| 95   | `75`  | play-time tolerance buffer |
| 101  | `55`  | dislike similarity threshold |
| 104  | `22`  | base candidate score |
| 115  | `16`  | supporting-title threshold |
| 139  | `0.25, 0.98, 145` | confidence clamp bounds and divisor |

**Fix:**
Extract all weights into a named configuration object:
```typescript
const RECOMMENDATION_WEIGHTS = {
  themeOverlap: 16,
  mechanicOverlap: 18,
  profileThemeOverlap: 18,
  profileMechanicOverlap: 20,
  playerFit: 10,
  timeFit: 10,
  complexityFit: 12,
  budgetTolerance: 8,
  playTimeTolerance: 75,
  dislikeSimilarityThreshold: 55,
  baseCandidateScore: 22,
  supportingTitleThreshold: 16,
  confidenceMin: 0.25,
  confidenceMax: 0.98,
  confidenceDivisor: 145,
} as const;
```

---

## Code Smell Inventory — P2

### P2-1: Repeated Status/Error State Pattern

**Location:** `box-decision-panel.tsx`, `collection-manager.tsx`, `feedback-form.tsx`, `onboarding-wizard.tsx`, `plan-selector.tsx`
**Severity:** Low-Medium (DRY violation)

Every interactive component independently manages `[status, setStatus]`, `[error, setError]`, and an identical status display pattern:
```tsx
<div role="status" aria-live="polite">
  {(status || error) && (
    <div className={`... ${status ? "emerald" : "rose"} ...`}>
      {status ?? error}
    </div>
  )}
</div>
```

**Fix:** Extract a `useAsyncAction()` hook and a `<StatusBanner />` component:
```typescript
function useAsyncAction() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clear = () => { setStatus(null); setError(null); };
  return { status, error, setStatus, setError, clear };
}
```

---

### P2-2: Unsafe Type Assertions on DB Rows

**Location:** `src/lib/db.ts:200-277` (every query result mapping)
**Severity:** Low-Medium

All query results are cast via `as Record<string, unknown>` and then individually coerced with `String()` / `Number()`. This is fragile — if a column is `NULL` or the schema changes, `String(undefined)` returns `"undefined"` and `Number(undefined)` returns `NaN` without any error.

**Fix:**
1. Use a lightweight validation library (Zod or Valibot) for row parsing:
   ```typescript
   const GameRow = z.object({
     slug: z.string(),
     title: z.string(),
     year: z.coerce.number(),
     // ...
   });
   ```
2. Or add runtime null checks in `parseGame` and similar mappers.

---

### P2-3: `OnboardingWizard` Carries Too Much State (406 lines)

**Location:** `src/components/onboarding-wizard.tsx`
**Severity:** Medium

This component manages 12+ `useState` hooks, a 7-step wizard, a computed radar chart, a payload builder, two submit paths, and renders all step variants inline. It is the single largest component and violates SRP.

**Fix:**
1. Extract each wizard step into its own component (`QuizStep`, `ThemeStep`, `MechanicStep`, `PreferencesStep`, `SummaryStep`).
2. Extract wizard navigation into a `useWizardNavigation(totalSteps)` hook.
3. Extract the onboarding state into a `useOnboardingState(initialProps)` hook or a `useReducer`.

---

### P2-4: `page.tsx` (Landing Page) Is a 165-Line JSX Monolith

**Location:** `src/app/page.tsx`
**Severity:** Low-Medium

The landing page renders hero, stats, how-it-works, pricing tiers, testimonials, and FAQ all inline in a single component with deeply nested JSX.

**Fix:** Extract each section into a presentational component:
```
components/landing/
  hero-section.tsx
  how-it-works-section.tsx
  pricing-preview.tsx
  testimonials-section.tsx
  faq-section.tsx
```

---

### P2-5: `buildTasteRadar` Uses Hardcoded Dimension Names and Thresholds

**Location:** `src/lib/recommendations.ts:22-46`
**Severity:** Low

Radar dimensions ("Strategy", "Theme", "Social", "Adventure", "Cozy", "Discovery") and their associated theme/mechanic lists are hardcoded inline. Adding a new dimension requires modifying the function body.

**Fix:** Define radar dimensions as a data-driven configuration:
```typescript
const RADAR_DIMENSIONS: Array<{
  subject: string;
  baseScore: number;
  compute: (ctx: RadarContext) => number;
}> = [ /* ... */ ];
```

---

### P2-6: `GameCover` Uses Inline Hash Function with Weak Distribution

**Location:** `src/components/game-cover.tsx:3-5`
**Severity:** Low

```typescript
function hashFromTitle(title: string) {
  return title.split("").reduce((acc, character) => acc + character.charCodeAt(0), 0);
}
```

This produces the same value for anagrams (e.g., "AB" and "BA" both yield the same hash). It also overflows for long strings. For a cosmetic feature (cover gradient color), this is acceptable but fragile.

**Fix:** Use a simple position-aware hash: `acc * 31 + character.charCodeAt(0)`. Or use `Math.abs(title.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0))`.

---

### P2-7: Global Mutable Singleton via `global.__crateMatchDb`

**Location:** `src/lib/db.ts:10-12, 192-198`
**Severity:** Low

```typescript
declare global {
  var __crateMatchDb: Database.Database | undefined;
}
```

This is a known Next.js dev-mode pattern to preserve the connection across HMR reloads, but `var` in a `declare global` block is untyped in strict mode and risks collision with other globals.

**Fix:** Namespace the global key more specifically: `__crateMatchDb_v1` or use a module-level `let` with `Symbol.for()`:
```typescript
const DB_KEY = Symbol.for("cratematch.db");
const g = globalThis as Record<symbol, Database.Database | undefined>;
```

---

### P2-8: CSS Is Minimal but Has a Redundant Import

**Location:** `src/app/globals.css`

The file is only 31 lines with standard Tailwind imports. No issues, but verify `postcss.config.mjs` aligns with Tailwind v4's new setup.

---

### P2-9: `feedbackForm.tsx` Uses `async function` Without `useTransition`

**Location:** `src/components/feedback-form.tsx:52`
**Severity:** Low

Unlike other components that use `useTransition` for pending states, `FeedbackForm.submitFeedback` is a raw `async function` with manual `setPendingBoxMonth` state. This works but is inconsistent with the pattern used everywhere else and misses React 19's concurrent rendering benefits.

**Fix:** Refactor to use `useTransition` for consistency:
```typescript
const [pending, startTransition] = useTransition();
function submitFeedback(box: BoxWithFeedback) {
  startTransition(async () => { /* ... */ });
}
```

---

## SOLID Violations Summary

| Principle | Status | Notes |
|-----------|--------|-------|
| **SRP** | ⚠️ Partial | `catalog.ts` (5+ responsibilities), `db.ts` (schema + seed + CRUD + mapping), `OnboardingWizard` (12 states + 7 steps + submit + radar). |
| **OCP** | ✅ Good | Plan types, rating values, and themes use data-driven patterns. Adding a new plan or theme doesn't require modifying logic. Recommendation weights could be more open. |
| **LSP** | ✅ Good | No class hierarchies to violate. Union types are well-constrained. |
| **ISP** | ✅ Good | Component props are focused. `RecommendationCard` type in `collection-manager.tsx` correctly narrows `BoxRecommendation` to only needed fields. |
| **DIP** | ⚠️ Partial | `server-data.ts` directly imports from `db.ts` (concrete). Not a concern for this scale, but injecting a `DataSource` interface would improve testability. |

---

## Refactoring Roadmap (Prioritized)

### Tier 1: High Impact, Low Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Add Vitest, write unit tests for `recommendations.ts` | New files | 2-3 hours |
| 2 | Validate `answers[]` items in onboarding API | `api/onboarding/route.ts` | 30 min |
| 3 | Extract magic numbers into `RECOMMENDATION_WEIGHTS` const | `recommendations.ts` | 1 hour |
| 4 | Extract `<StatusBanner />` and `useAsyncAction()` hook | New + 5 components | 1 hour |
| 5 | Add `npm test` script to `package.json` | `package.json` | 5 min |

### Tier 2: High Impact, Medium Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 6 | Split `catalog.ts` into `catalog/` directory | `catalog.ts` → 5 files | 2 hours |
| 7 | Split `db.ts` into `db/` directory | `db.ts` → 5 files | 2 hours |
| 8 | Decompose `OnboardingWizard` into step components + hooks | `onboarding-wizard.tsx` → 5-6 files | 3 hours |
| 9 | Make `buildUserState()` lazy / composable | `server-data.ts` | 2 hours |
| 10 | Add error boundaries around major client components | 3-4 new files | 1 hour |

### Tier 3: Medium Impact, Low Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 11 | Extract landing page sections into components | `page.tsx` → 5 components | 1.5 hours |
| 12 | Add Zod/Valibot for DB row parsing | `db.ts` or `db/mappers.ts` | 2 hours |
| 13 | Unify `FeedbackForm` to use `useTransition` | `feedback-form.tsx` | 30 min |
| 14 | Improve `hashFromTitle` hash distribution | `game-cover.tsx` | 15 min |
| 15 | Document single-user limitation in README | `README.md` | 15 min |

---

## Detailed File-Level Metrics

| File | Lines | Complexity | Issues |
|------|-------|-----------|--------|
| `catalog.ts` | 1,091 | Low (static data) | P1-1: Should be split |
| `db.ts` | 388 | Medium | P0-3, P1-3, P2-2, P2-7 |
| `recommendations.ts` | 202 | High (algorithmic) | P0-1, P1-5, P2-5 |
| `server-data.ts` | 184 | Medium | P1-2 |
| `onboarding-wizard.tsx` | 406 | High (12 states, 7 steps) | P2-3 |
| `collection-manager.tsx` | 219 | Medium | P2-1 |
| `feedback-form.tsx` | 220 | Medium | P2-1, P2-9 |
| `page.tsx` (landing) | 165 | Low (JSX) | P2-4 |
| `site-header.tsx` | 144 | Low-Medium | Clean ✓ |
| `plan-selector.tsx` | 129 | Low | P2-1 |
| `box/page.tsx` | 123 | Low | Clean ✓ |
| `box-decision-panel.tsx` | 84 | Low | P2-1 |
| `api/onboarding/route.ts` | 70 | Medium | P0-2 |
| `api/feedback/route.ts` | 47 | Low | Clean ✓ |
| `game-cover.tsx` | 59 | Low | P2-6 |
| `taste-radar-chart.tsx` | 49 | Low | Clean ✓ |
| `types.ts` | 87 | Low | Clean ✓ |

---

## Dependency Analysis

```
app/page.tsx ──→ components/game-cover.tsx ──→ lib/types.ts
             ──→ lib/server-data.ts ─────────→ lib/catalog.ts ──→ lib/types.ts
                                              → lib/db.ts ──────→ lib/catalog.ts
                                              → lib/recommendations.ts → lib/catalog.ts
                                                                       → lib/types.ts
app/api/*    ──→ lib/server-data.ts (same chain)
components/* ──→ lib/types.ts (types only)
             ──→ lib/catalog.ts (constants: RATING_OPTIONS)
             ──→ lib/recommendations.ts (buildTasteRadar — from onboarding-wizard)
```

**Observations:**
- No circular dependencies ✓
- `components/onboarding-wizard.tsx` imports from `lib/recommendations.ts` (business logic in a client component) — this works because `buildTasteRadar` is a pure function, but it couples the client bundle to recommendation logic. Consider computing radar data server-side and passing as props.
- `catalog.ts` is imported by `db.ts` and `server-data.ts` — high afferent coupling on a large file. Splitting it (P1-1) will reduce blast radius of changes.

---

## Security Posture

| Area | Status | Notes |
|------|--------|-------|
| SQL injection | ✅ Safe | All queries use prepared statements |
| XSS | ✅ Safe | React auto-escapes JSX output |
| Input validation | ⚠️ Partial | P0-2: `answers[]` items not validated |
| Auth/AuthZ | ❌ None | P0-3: Single hardcoded user |
| Rate limiting | ❌ None | Acceptable for MVP demo |
| CSRF | ⚠️ Partial | No CSRF tokens on API routes (acceptable for same-origin demo) |
| Server-only guard | ✅ Good | `import "server-only"` in `db.ts` prevents accidental client import |

---

*End of review. Prioritize P0 items before any feature work. P1 items should be addressed before scaling beyond MVP. P2 items improve long-term maintainability and developer experience.*
