# Code Quality & Architecture Review #3 — CrateMatch

**Reviewed:** 2025-07-17 (delta review against `docs/CODE_REVIEW_2.md` from 2025-07-16)
**Scope:** Only genuinely new P0/P1 issues not covered in prior reviews. Previously flagged items tracked in status table below.

---

## Executive Summary

| Dimension              | Previous (R2) | Current   | Trend |
|------------------------|---------------|-----------|-------|
| Overall Quality Score  | B+            | **A−**    | ↑     |
| Architecture Health    | Good+         | **Good+** | →     |
| Maintainability Index  | Medium-High   | **High**  | ↑     |
| Technical Debt Estimate| Medium        | **Low-Medium** | ↑ |

Significant fixes have landed since the second review: `mappers.ts` now uses `safeParseStringArray` (P0-5 resolved), landing page short-circuits when onboarding is incomplete (P0-4 resolved), collection API uses the targeted `gameExists()` query (P1-6 resolved), the box-decision API now validates and accepts `monthLabel` from the client with a server-month consistency check (P1-7 resolved), and the star rating widget was rewritten to use `role="radiogroup"` with proper `aria-checked` per button (P1-9 resolved).

This delta review surfaces **1 new P0 finding** and **3 new P1 findings** that were not visible or did not exist in prior reviews.

---

## Status of Previously Flagged Items

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| P0-1 | Zero test coverage | **Still open** | No test files, runner, or `test` script. Highest-impact remaining debt. |
| P0-2 | No input sanitization on `answers[]` | **Resolved** | Individual items validated since R1. |
| P0-3 | Hardcoded demo user | **Still open** | Acceptable for MVP; no auth layer added. |
| P0-4 | Landing page runs full recommendation engine | **Resolved** | `getLandingPageSnapshot()` now short-circuits when `!profile.onboardingComplete` (line 44). |
| P0-5 | Unsafe `JSON.parse` in `parseGame` | **Resolved** | `safeParseStringArray()` moved to `mappers.ts:4-11` and used in `parseGame` (lines 19-20). |
| P1-1 | Monolithic catalog file | **Resolved** | Split into `catalog/{constants,content,games,plans,index}.ts`. |
| P1-2 | `buildUserState()` redundancy | **Resolved** | `getProfileData()` and `getPlansSnapshot()` use targeted queries; landing page short-circuits. |
| P1-3 | `db.ts` SRP violation | **Resolved** | Split into `db/{connection,queries,mappers,row-types,index}.ts`. |
| P1-4 | No error boundaries | **Resolved** | `ComponentErrorBoundary` wraps onboarding, collection, and feedback pages. |
| P1-5 | Magic numbers in recommendations | **Resolved** | Named constant objects with JSDoc. |
| P1-6 | Collection API loads full catalog for slug validation | **Resolved** | `gameExists(slug)` query added at `queries.ts:178-181`; used in `api/collection/route.ts:14`. |
| P1-7 | `monthLabel` sent but ignored by API | **Resolved** | `box-decision/route.ts:21-31` now validates `monthLabel` format via regex and checks against `getCurrentBoxMonth()` with a 409 on mismatch. |
| P1-8 | Full catalog serialized to client via `availableGames` | **Still open** | `server-data.ts:125` still passes full `catalog` array. Acceptable at 65 games but should be addressed before scaling. |
| P1-9 | Star rating accessibility violations | **Resolved** | Rewritten to `role="radiogroup"` with individual `role="radio"` buttons, proper `aria-checked`, roving `tabIndex`, and correct keyboard navigation (lines 128-170 of `feedback-form.tsx`). |

---

## New Critical Findings — P0

### P0-6: `getCollectionSnapshot()` Computes `ownedGames` Filter Twice — and Second Pass Has O(n×m) Complexity

**Location:** `src/lib/server-data.ts:124, 133`
**Severity:** Critical (correctness risk + performance)

```typescript
// line 124
ownedGames: catalog.filter((game) => ownedSlugs.includes(game.slug)),
// line 133
duplicateCount: catalog.filter((game) => ownedSlugs.includes(game.slug)).length,
```

These two lines perform the **exact same O(n×m) linear scan** (`Array.includes` on `ownedSlugs` for every game in `catalog`). The result on line 124 is an array whose `.length` is precisely the value computed on line 133. This is:

1. **Redundant computation** — the second filter traverses the full catalog and owned-slugs array a second time for no benefit.
2. **Semantically misleading** — `duplicateCount` claims to represent "duplicate flags prevented" in the UI (`collection-manager.tsx:92`), but it actually returns the number of games the user *already owns* from the catalog — which is the collection size, not a "duplicate prevention" count. The real duplicate-prevention value would be the count of *recommended* games that were filtered out *because* they're already owned. This metric gives users incorrect feedback about the system's value.
3. **Linear search on arrays** — `ownedSlugs` is `string[]` from `getCollection()`, so `.includes()` is O(m) per call. With 65 games × 6 owned = 390 comparisons per scan, doubled = 780. This scales poorly.

**Fix:**
```typescript
export function getCollectionSnapshot() {
  const { catalog, ownedSlugs, recommendations, profile, answers, themes, mechanics } = getFullUserState();
  const ownedSet = new Set(ownedSlugs);
  const ownedGames = catalog.filter((game) => ownedSet.has(game.slug));

  return {
    profile,
    answers,
    themes,
    mechanics,
    ownedGames,
    availableGames: catalog,
    recommendations: recommendations.slice(0, 5),
    insights: buildCollectionInsights({ catalog, recommendations, ownedSlugs, preferredMechanics: mechanics }),
    duplicateCount: ownedGames.length,  // reuse, don't re-scan
  };
}
```

Additionally, fix the *semantic* issue: rename to `ownedCount` or compute the actual duplicate-prevention count (number of catalog games that matched user ownership and were therefore excluded from recommendations).

---

## New Architectural Concerns — P1

### P1-10: `getOnboardingSnapshot()` Uses `GAME_CATALOG` In-Memory While All Other Snapshots Use DB-Sourced `getAllGames()` — Data Source Divergence

**Location:** `src/lib/server-data.ts:71-73`
**Severity:** High (data integrity)

```typescript
// line 71
quizGames: GAME_CATALOG.filter((game) => QUIZ_GAME_SLUGS.includes(game.slug as ...)),
// line 72
allThemes: [...new Set(GAME_CATALOG.flatMap((game) => game.themes))].sort(),
// line 73
allMechanics: [...new Set(GAME_CATALOG.flatMap((game) => game.mechanics))].sort(),
```

`getOnboardingSnapshot()` reads game data directly from the in-memory `GAME_CATALOG` constant, while every other snapshot function (`getBoxSnapshot`, `getCollectionSnapshot`, `getFeedbackSnapshot`) reads from the database via `getAllGames()`. The seed process in `connection.ts:128-145` upserts `GAME_CATALOG` into the DB on startup, meaning the DB and in-memory constant should stay in sync. However:

1. **If the DB is modified directly** (manual edit, migration script, or future admin endpoint), the onboarding page shows stale/divergent data while all other pages reflect the DB state.
2. **Themes/mechanics derived from `GAME_CATALOG`** are used to populate the UI pickers. If a future code path adds games to the DB without updating the constant (e.g., an "add game" admin API), the onboarding wizard won't show the new themes/mechanics, but the recommendation engine *will* score those games.
3. **Inconsistent access pattern** makes the architecture harder to reason about — a developer must know which snapshots read from which source.

**Fix:** Use `getAllGames()` consistently:
```typescript
export function getOnboardingSnapshot() {
  const { profile, answers, themes, mechanics } = getProfileData();
  const catalog = getAllGames();
  const quizSlugs = new Set<string>(QUIZ_GAME_SLUGS);

  return {
    profile,
    answers,
    themes,
    mechanics,
    quizGames: catalog.filter((game) => quizSlugs.has(game.slug)),
    allThemes: [...new Set(catalog.flatMap((game) => game.themes))].sort(),
    allMechanics: [...new Set(catalog.flatMap((game) => game.mechanics))].sort(),
    radarData: buildTasteRadar({ answers, themes, mechanics, profile }),
  };
}
```

---

### P1-11: `getFeedbackSnapshot()` and `getBoxSnapshot()` Perform Redundant O(n) Catalog Lookups Per Past Box Without Shared Index

**Location:** `src/lib/server-data.ts:109, 196-198`
**Severity:** Medium (performance pattern, scaling)

Both `getBoxSnapshot` and `getFeedbackSnapshot` join past boxes with the game catalog using `catalog.find()` inside a `.map()`:

```typescript
// getBoxSnapshot — line 109
pastBoxes: pastBoxes.map((box) => ({
  ...box,
  game: catalog.find((game) => game.slug === box.gameSlug),
})),

// getFeedbackSnapshot — lines 196-198
pastBoxes: pastBoxes.map((box) => ({
  ...box,
  game: catalog.find((game) => game.slug === box.gameSlug),
  feedback: feedbackMap.get(box.boxMonth) ?? null,
})),
```

Each `.find()` is O(n) over 65+ games, executed per past box. With 3 past boxes today the cost is negligible (3 × 65 = 195 comparisons), but the pattern scales as O(boxes × catalog_size). Notably, `getFeedbackSnapshot` already builds a `Map` for feedback lookups (line 191) — demonstrating the developer knows indexed lookups — but doesn't apply the same optimization for game lookups.

**Fix:** Build a slug→game `Map` once and reuse it:
```typescript
const gameMap = new Map(catalog.map((game) => [game.slug, game]));

// Then in the map:
game: gameMap.get(box.gameSlug),
```

This pattern should be applied in both `getBoxSnapshot` and `getFeedbackSnapshot`.

---

### P1-12: `BoxDecisionPanel` and `PlanSelector` Missing `ComponentErrorBoundary` Wrappers — Inconsistent Resilience

**Location:** `src/app/box/page.tsx:79`, `src/app/plans/page.tsx:30`
**Severity:** Medium (resilience consistency)

After P1-4 was addressed, `ComponentErrorBoundary` was added around `OnboardingWizard`, `CollectionManager`, and `FeedbackForm`. However, two other interactive client components remain **unwrapped**:

1. **`BoxDecisionPanel`** (`box/page.tsx:79`) — handles network mutations for keep/return decisions. A JSON parse failure on the response or an unexpected state could crash the entire box page, taking down the match preview, alternatives, and past boxes sections.

2. **`PlanSelector`** (`plans/page.tsx:30`) — handles mock checkout mutations. Same crash risk.

These components perform `fetch()` calls with `startTransition`, parse JSON responses, and manage error state — the same pattern used by the three components that *do* have boundaries.

**Fix:**
```tsx
// box/page.tsx
<ComponentErrorBoundary sectionName="Box decision">
  <BoxDecisionPanel gameSlug={currentMatch.game.slug} monthLabel={monthLabel} initialDecision={decision} />
</ComponentErrorBoundary>

// plans/page.tsx
<ComponentErrorBoundary sectionName="Plan selector">
  <PlanSelector plans={plans} currentPlan={profile.planId} cutoff={cutoff} />
</ComponentErrorBoundary>
```

---

## Updated SOLID Status

| Principle | Previous | Current | Delta |
|-----------|----------|---------|-------|
| **SRP** | ✅ Improved | ✅ Good | `getCollectionSnapshot` mixes data fetching with metric computation (P0-6), but overall module boundaries are clean. |
| **OCP** | ✅ Good | ✅ Good | No change. |
| **LSP** | ✅ Good | ✅ Good | No change. |
| **ISP** | ✅ Good | ✅ Good | No change. |
| **DIP** | ⚠️ Partial | ⚠️ Partial | Still concrete imports in `server-data.ts`. Acceptable at this scale. |

---

## Summary of New Findings

| ID | Severity | Title | Location | Effort |
|----|----------|-------|----------|--------|
| **P0-6** | Critical | Duplicate filter + misleading `duplicateCount` metric | `server-data.ts:124,133` | 20 min |
| **P1-10** | High | Onboarding reads `GAME_CATALOG` constant instead of DB | `server-data.ts:71-73` | 15 min |
| **P1-11** | Medium | O(n) catalog lookups per past box without indexed Map | `server-data.ts:109,196-198` | 15 min |
| **P1-12** | Medium | `BoxDecisionPanel` and `PlanSelector` missing error boundaries | `box/page.tsx:79`, `plans/page.tsx:30` | 10 min |

---

## Refactoring Roadmap (New Items Only)

### Tier 1: High Impact, Low Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Deduplicate `ownedGames` filter, use `Set` for lookup, fix `duplicateCount` semantics (P0-6) | `server-data.ts` | 20 min |
| 2 | Replace `GAME_CATALOG` with `getAllGames()` in `getOnboardingSnapshot` (P1-10) | `server-data.ts` | 15 min |
| 3 | Build slug→game `Map` for past-box joins (P1-11) | `server-data.ts` | 15 min |
| 4 | Wrap `BoxDecisionPanel` and `PlanSelector` in `ComponentErrorBoundary` (P1-12) | `box/page.tsx`, `plans/page.tsx` | 10 min |

### Still Open From Prior Reviews
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 5 | Add Vitest + initial test suite for `recommendations.ts` pure functions (P0-1) | New `__tests__/` dir, `package.json` | 2-4 hrs |
| 6 | Slim down `availableGames` payload or move search server-side (P1-8) | `server-data.ts`, `collection-manager.tsx` | 1-2 hrs |

---

## Positive Observations (New Since Second Review)

| Area | Detail |
|------|--------|
| **P0-5 fix quality** | `safeParseStringArray` was moved to `mappers.ts` and co-located with `parseGame` — clean module organization rather than a cross-module import. |
| **Box-decision month validation** | The fix for P1-7 went beyond the recommendation: it not only accepts `monthLabel` from the client but validates format with a regex *and* cross-checks against the server's `getCurrentBoxMonth()`, returning a 409 with a clear user message on mismatch. This is a defense-in-depth approach. |
| **Star rating rewrite** | The P1-9 fix replaced the problematic `role="slider"` + hidden buttons pattern with a standards-compliant `role="radiogroup"` + `role="radio"` pattern with roving tabindex and correct `aria-checked`/`aria-label` attributes. This is a proper ARIA implementation. |
| **Landing page short-circuit** | P0-4 fix correctly guards the expensive path behind `profile.onboardingComplete`, eliminating 7 DB queries + full scoring for first-time visitors. |
| **Strict TypeScript config** | `tsconfig.json` includes `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters` — stricter than most Next.js projects and catching bugs at compile time. |
| **`revalidate: 60` on landing page** | The landing page switched from `force-dynamic` to `revalidate = 60` (ISR with 60-second TTL), significantly reducing server load for the most-visited page. |
| **Consistent error handling** | All 6 API routes follow the same try/catch → 400/500 pattern with user-friendly messages. All 5 client components follow the same `startTransition` → fetch → parse error → `setError` pattern. |

---

*End of delta review. All new findings total ~60 minutes of effort. P0-6 should be addressed first (20 min) as it produces misleading user-facing metrics. P0-1 (test coverage) remains the highest-impact open item across all three reviews.*
