# Code Quality & Architecture Review #2 — CrateMatch

**Reviewed:** 2025-07-16 (delta review against `docs/CODE_REVIEW.md` from 2025-07-15)
**Scope:** Only genuinely new P0/P1 issues not covered in the first review. Previously flagged items are tracked in the "Resolved / Still Open" section below.

---

## Executive Summary

| Dimension              | Previous | Current   | Trend |
|------------------------|----------|-----------|-------|
| Overall Quality Score  | B        | **B+**    | ↑     |
| Architecture Health    | Good     | **Good+** | ↑     |
| Maintainability Index  | Medium   | **Medium-High** | ↑ |
| Technical Debt Estimate| Medium   | **Medium** | →    |

Three significant structural fixes from the first review have been completed: `catalog.ts` was split into `catalog/` (P1-1 resolved), `db.ts` was split into `db/` with proper row types (P1-3 resolved), and `ComponentErrorBoundary` now wraps interactive components (P1-4 resolved). The onboarding API now sanitizes individual `answers[]` items (P0-2 resolved). Magic numbers in `recommendations.ts` are now extracted into named constant objects (P1-5 resolved). `server-data.ts` now separates `getProfileData()` from `getFullUserState()` (P1-2 partially resolved).

This delta review surfaces **2 new P0 findings** and **4 new P1 findings** that were not visible or did not exist in the first review.

---

## Status of Previously Flagged Items

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| P0-1 | Zero test coverage | **Still open** | No test files, no test runner, no `test` script |
| P0-2 | No input sanitization on `answers[]` | **Resolved** | `api/onboarding/route.ts:40-51` now validates/sanitizes each answer item |
| P0-3 | Hardcoded demo user | **Still open** | Acceptable for MVP; no auth added |
| P1-1 | Monolithic catalog file | **Resolved** | Split into `catalog/{constants,content,games,plans,index}.ts` |
| P1-2 | `buildUserState()` redundancy | **Partially resolved** | `getProfileData()` added (line 12-18); `getPlansSnapshot()` now calls only `getUserProfile()`. However, `getLandingPageSnapshot()` still calls `getFullUserState()` (line 41) despite needing only `recommendations[0]` |
| P1-3 | `db.ts` SRP violation | **Resolved** | Split into `db/{connection,queries,mappers,row-types,index}.ts` |
| P1-4 | No error boundaries | **Resolved** | `ComponentErrorBoundary` class component added; used on onboarding and collection pages |
| P1-5 | Magic numbers in recommendations | **Resolved** | Named constant objects: `RADAR`, `SIMILARITY_WEIGHTS`, `FILTER`, `SCORING`, `CONFIDENCE`, `INSIGHTS` |

---

## New Critical Findings — P0

### P0-4: `getLandingPageSnapshot()` Runs Full Recommendation Engine on Every Landing Page Load

**Location:** `src/lib/server-data.ts:40-41`
**Severity:** Critical (performance)
**New since:** This is a refinement that became visible only after P1-2 was partially fixed. The first review flagged `buildUserState()` redundancy generally; this is the remaining high-impact instance.

```typescript
export function getLandingPageSnapshot() {
  const { recommendations } = getFullUserState(); // ← 7 DB queries + full scoring
  return {
    featuredMatch: recommendations[0],  // ← only needs the top result
    // ...static data...
  };
}
```

The landing page (`src/app/page.tsx:10`) calls this on every visit (`force-dynamic`). `getFullUserState()` executes 7 DB reads (`getUserProfile`, `getQuizAnswers`, `getUserThemes`, `getUserMechanics`, `getCollection`, `getPastBoxes`, `getAllGames`) plus the full `getRecommendations()` scoring pipeline — all to extract `recommendations[0]`. Every static piece (testimonials, FAQ, plans, how-it-works) is already imported from catalog constants.

For an unauthenticated demo MVP where the landing page is the entry point, this means every first-visit triggers the full recommendation engine synchronously on the server. As the game catalog grows, the O(n × m) scoring in `getRecommendations()` will linearly slow the most-visited page.

**Fix:**
```typescript
export function getLandingPageSnapshot() {
  const profile = getUserProfile();
  if (!profile.onboardingComplete) {
    return { featuredMatch: undefined, /* static data */ };
  }
  const { recommendations } = getFullUserState();
  return { featuredMatch: recommendations[0], /* static data */ };
}
```
Or better: cache the top recommendation per user with React `cache()` or a TTL memo, so repeated renders within the same request don't re-compute.

---

### P0-5: `mappers.ts` Uses Unsafe `JSON.parse` Without Validation — Silent Data Corruption

**Location:** `src/lib/db/mappers.ts:10-11`
**Severity:** Critical (data integrity)

```typescript
export function parseGame(row: GameRow): Game {
  return {
    // ...
    themes: JSON.parse(row.themes) as string[],     // line 10
    mechanics: JSON.parse(row.mechanics) as string[],  // line 11
    // ...
  };
}
```

If `row.themes` or `row.mechanics` contain malformed JSON (e.g., due to a botched seed, a manual DB edit, or a future migration bug), `JSON.parse` throws, and the entire `getAllGames()` call crashes — taking down whichever page triggered it. There is no try/catch anywhere in the call chain until the global `error.tsx`.

Notably, `queries.ts:17-23` already contains `safeParseStringArray()` — a runtime-safe JSON parser with fallback:

```typescript
function safeParseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}
```

This function is used for `box_feedback.tags` (line 195) but **not** for game themes/mechanics, which are the highest-traffic JSON columns.

**Fix:** Use `safeParseStringArray` in `mappers.ts`, or export it from a shared utility:
```typescript
// mappers.ts
import { safeParseStringArray } from "./queries"; // or a shared utils file

export function parseGame(row: GameRow): Game {
  return {
    // ...
    themes: safeParseStringArray(row.themes),
    mechanics: safeParseStringArray(row.mechanics),
    // ...
  };
}
```

---

## New Architectural Concerns — P1

### P1-6: `collection/route.ts` Loads Entire Game Catalog to Validate a Single Slug

**Location:** `src/app/api/collection/route.ts:14`
**Severity:** High (performance, scaling)

```typescript
const game = getAllGames().find((g) => g.slug === body.gameSlug);
if (!game) {
  return Response.json({ error: "Game not found in catalog." }, { status: 400 });
}
```

`getAllGames()` runs `SELECT * FROM games ORDER BY title`, parses every row through `parseGame` (including two `JSON.parse` calls per row), then does a linear scan. This is executed on every POST/DELETE to the collection API.

**Fix:** Add a targeted query in `queries.ts`:
```typescript
export function gameExists(slug: string): boolean {
  const row = getDb().prepare("SELECT 1 FROM games WHERE slug = ?").get(slug);
  return row !== undefined;
}
```

---

### P1-7: `box-decision-panel.tsx` Sends `monthLabel` to API but API Ignores It — Ghost Payload Field

**Location:** `src/components/box-decision-panel.tsx:32`, `src/app/api/box-decision/route.ts:10`
**Severity:** Medium (correctness risk)

The client sends `monthLabel` in the request body:
```typescript
body: JSON.stringify({ gameSlug, decision: nextDecision, monthLabel }),
```

But the API route destructures only `gameSlug` and `decision`:
```typescript
const body = (await request.json()) as { gameSlug?: string; decision?: BoxDecision };
```

Meanwhile, `persistBoxDecision` in `server-data.ts:160` derives the month from `getCurrentBoxMonthValue()`:
```typescript
export function persistBoxDecision(decision: BoxDecision, gameSlug: string) {
  saveBoxDecision({ boxMonth: getCurrentBoxMonthValue(), decision, gameSlug });
}
```

This means if the server clock crosses midnight into a new month between when the box page rendered and when the user clicks "Keep", the decision is saved against the wrong month. The client already has the correct `monthLabel` from the server-rendered page but it's silently discarded.

**Fix:** Accept `boxMonth` from the client (with validation), or explicitly document that box decisions always target the server's current month:
```typescript
// In the API route:
if (!body.boxMonth || typeof body.boxMonth !== "string" || !/^\d{4}-\d{2}$/.test(body.boxMonth)) {
  return Response.json({ error: "Provide a valid box month (YYYY-MM)." }, { status: 400 });
}
const snapshot = persistBoxDecision(body.decision, body.gameSlug, body.boxMonth);
```

---

### P1-8: `getCollectionSnapshot()` Returns Full Catalog to Client via `availableGames`

**Location:** `src/lib/server-data.ts:106`
**Severity:** Medium (performance, payload size)

```typescript
export function getCollectionSnapshot() {
  const { catalog, ...rest } = getFullUserState();
  return {
    // ...
    availableGames: catalog,  // ← entire 65-game catalog serialized to the client
    // ...
  };
}
```

The `CollectionManager` component receives `availableGames` as a prop (all 65 games with full descriptions, themes, mechanics arrays). This is serialized into the RSC payload on every collection page load. As the catalog grows (100s–1000s of games), this payload becomes untenable.

The component uses it only for client-side search filtering (`collection-manager.tsx:37-47`). With 65 games this is acceptable, but the architecture won't scale.

**Fix (short-term):** Strip fields the client doesn't need:
```typescript
availableGames: catalog.map(({ slug, title, themes, mechanics, playTime }) => ({
  slug, title, themes, mechanics, playTime,
})),
```

**Fix (long-term):** Move search to a server action or API endpoint with debounced queries.

---

### P1-9: Feedback Star Rating Buttons Are `aria-hidden="true"` but Remain Clickable — Accessibility Violation

**Location:** `src/components/feedback-form.tsx:151-156`
**Severity:** Medium (accessibility, WCAG 2.1 violation)

```tsx
<button
  key={star}
  type="button"
  tabIndex={-1}
  aria-hidden="true"          // ← hidden from assistive tech
  onClick={() => setRatings(/* ... */)}  // ← still clickable
  className={/* ... */}
>
  ★
</button>
```

Each star button is marked `aria-hidden="true"` and `tabIndex={-1}`, meaning assistive technology users cannot interact with them. The wrapping `div` has `role="slider"` with keyboard handlers, which is the intended AT interaction path. **However**, the slider has `aria-valuemin={0}` (line 135) while the minimum selectable value via keyboard is `1` (the `ArrowDown` handler clamps to `Math.max(1, ...)`). An AT user can't tell that `0` is not a valid value but `ArrowDown` won't go below `1`.

Additionally, `role="slider"` on a `<div>` that wraps interactive `<button>` children violates the ARIA spec: a slider should be a standalone interactive widget, not a container for other interactive elements. The buttons should either be `<span>` elements (truly presentational) or the entire widget should use a different pattern.

**Fix:**
1. Change star buttons from `<button>` to `<span>` (since they're hidden from AT and the slider handles all AT interaction).
2. Fix `aria-valuemin` to `1` to match the actual minimum.
```tsx
aria-valuemin={1}  // was 0
```
3. Or: replace the entire pattern with standard radio buttons styled as stars, which natively handle both mouse and keyboard without the impedance mismatch.

---

## Updated SOLID Violations

| Principle | Previous | Current | Delta |
|-----------|----------|---------|-------|
| **SRP** | ⚠️ Partial | ✅ Improved | `catalog.ts` and `db.ts` split. `OnboardingWizard` still large (407 lines) but unchanged — tracked in prior review as P2-3. |
| **OCP** | ✅ Good | ✅ Good | Recommendation weights now externalized into named constants, making tuning open without modifying scoring logic. |
| **LSP** | ✅ Good | ✅ Good | No change. |
| **ISP** | ✅ Good | ✅ Good | No change. |
| **DIP** | ⚠️ Partial | ⚠️ Partial | `server-data.ts` still directly imports concrete `queries.ts` functions. Acceptable at this scale. |

---

## Summary of New Findings

| ID | Severity | Title | Location | Effort |
|----|----------|-------|----------|--------|
| **P0-4** | Critical | Landing page runs full recommendation engine unnecessarily | `server-data.ts:40-41` | 30 min |
| **P0-5** | Critical | Unsafe `JSON.parse` in `parseGame` without fallback | `db/mappers.ts:10-11` | 15 min |
| **P1-6** | High | Collection API loads full catalog to validate a slug | `api/collection/route.ts:14` | 30 min |
| **P1-7** | Medium | `monthLabel` sent by client but silently ignored by API | `box-decision-panel.tsx:32` ↔ `api/box-decision/route.ts` | 45 min |
| **P1-8** | Medium | Full game catalog serialized to client on collection page | `server-data.ts:106` | 30 min |
| **P1-9** | Medium | Star rating `aria-hidden` buttons + `aria-valuemin` mismatch | `feedback-form.tsx:135-156` | 30 min |

---

## Refactoring Roadmap (New Items Only)

### Tier 1: High Impact, Low Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Use `safeParseStringArray` in `parseGame` (P0-5) | `db/mappers.ts` | 15 min |
| 2 | Short-circuit landing page snapshot when onboarding incomplete (P0-4) | `server-data.ts` | 30 min |
| 3 | Add `gameExists(slug)` query, replace `getAllGames().find()` (P1-6) | `db/queries.ts`, `api/collection/route.ts` | 30 min |
| 4 | Fix `aria-valuemin` from 0 → 1, change star buttons to `<span>` (P1-9) | `feedback-form.tsx` | 20 min |

### Tier 2: High Impact, Medium Effort
| # | Action | Files | Effort |
|---|--------|-------|--------|
| 5 | Accept and validate `boxMonth` from client in box-decision API (P1-7) | `api/box-decision/route.ts`, `server-data.ts`, `box-decision-panel.tsx` | 45 min |
| 6 | Slim down `availableGames` payload or move search server-side (P1-8) | `server-data.ts`, `collection-manager.tsx` | 1-2 hrs |

---

## Positive Observations (New Since First Review)

| Area | Detail |
|------|--------|
| **Structural improvements** | Both `catalog/` and `db/` directory splits are clean, with proper barrel exports and no circular dependencies introduced. |
| **Row type safety** | `row-types.ts` provides explicit interfaces for every DB table, replacing the previous `Record<string, unknown>` casting pattern. |
| **`safeParseStringArray`** | A runtime-safe JSON parser was added in `queries.ts:17-23` — it just needs to be used more broadly. |
| **Error boundaries deployed** | `ComponentErrorBoundary` is now wrapping `OnboardingWizard` and `CollectionManager` on their respective pages. |
| **Recommendation constants** | The 6 named constant objects (`RADAR`, `SIMILARITY_WEIGHTS`, etc.) with JSDoc comments are a significant readability improvement. |
| **Lazy profile fetch** | `getPlansSnapshot()` now correctly calls only `getUserProfile()` instead of the full recommendation pipeline. |

---

*End of delta review. Prioritize P0-4 and P0-5 immediately (combined ~45 min). P1 items should be addressed before the catalog exceeds ~100 games.*
