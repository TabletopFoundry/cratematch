# UX & DX Review 6 — Focused Delta Audit

**Date:** 2025-07-17
**Reviewer perspective:** Senior engineer, first-time encounter with codebase after Reviews 1–5.
**Scope:** Only genuinely new P0/P1 findings not documented in any prior review. Previously flagged items tracked in the status table below.

---

## Executive Summary

CrateMatch has addressed a substantial number of prior findings across five review cycles. The major wins since Review 5 include: `parseGame` now uses `safeParseStringArray` (R4 P0-5 closed), the landing page short-circuits for non-onboarded users with `revalidate = 60` replacing `force-dynamic` (R4 P0-4 / R5 P1-2 closed), the box-decision API now validates and cross-checks `monthLabel` (R5 P0-1 closed), mutation endpoints return `{ ok: true }` instead of full snapshots (R5 P0-2 closed), the star rating uses a proper `role="radiogroup"` pattern (R5 P1-5 closed), the collection API validates slugs via `gameExists()` (R4 P1-1 closed), the feedback textarea has `maxLength` and a live character counter (R5 P1-7 closed), community articles now use `<h3>` headings (R5 P1-3 closed), and `onboarding_complete` uses `MAX()` to prevent silent downgrade (R5 P1-1 closed).

This review surfaces **1 new P0** and **4 new P1 findings** that were not visible in or covered by any prior review.

---

## P0 — Critical / Blocks Correct Functionality

### P0-1: `duplicateCount` metric is always 0 — broken UI indicator

| Attribute | Detail |
|-----------|--------|
| **Severity** | P0 — Correctness |
| **Files** | `src/lib/server-data.ts:120`, `src/lib/recommendations.ts:191-193`, `src/components/collection-manager.tsx:92` |
| **Prior coverage** | None. The `duplicateCount` field was not examined in any prior review. |

**Problem:** The collection page displays a "Duplicate flags prevented: {duplicateCount}" badge (rendered in `collection-manager.tsx:92`). This count is computed as:

```typescript
// server-data.ts:120
duplicateCount: recommendations.filter((item) => ownedSlugs.includes(item.game.slug)).length,
```

However, `getRecommendations()` already excludes owned games at its filter step:

```typescript
// recommendations.ts:192
if (ownedSlugs.includes(candidate.slug) || shippedSlugs.includes(candidate.slug)) {
  return false;
}
```

Since the recommendation engine filters out all owned slugs **before** scoring, `recommendations` can never contain a game whose slug is in `ownedSlugs`. The expression evaluates to `0` for every possible input. The badge permanently reads "Duplicate flags prevented: 0", which is factually incorrect (the engine *is* preventing duplicates — it's just that the metric is measuring the wrong thing).

**Impact:**
- Users see a feature badge that suggests duplicate prevention isn't working ("0 flags").
- The metric undermines trust in the recommendation engine, which is a core product differentiator.

**Fix:** Count the duplicates that were *filtered out*, not the ones that survived filtering:

```typescript
// Option A: Count directly
const allCandidates = catalog.filter(g => !shippedSlugs.includes(g.slug));
const duplicateCount = allCandidates.filter(g => ownedSlugs.includes(g.slug)).length;

// Option B: Simpler — just count owned games in the catalog
duplicateCount: ownedSlugs.length,
```

The simplest correct metric is the count of owned games that the engine excluded from consideration. `ownedSlugs.length` (filtered to catalog matches) communicates this accurately.

---

## P1 — Significant UX/DX Issues

### P1-1: Onboarding API accepts unbounded `themes`, `mechanics`, and `answers` arrays — DoS vector

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — Data integrity / resilience |
| **Files** | `src/app/api/onboarding/route.ts:28-51`, `src/lib/db/queries.ts:119-126` |
| **Prior coverage** | R1–R5 flagged missing validation on individual answer items (resolved) and input sanitization (resolved). **Array length limits** were never examined. |

**Problem:** The onboarding API validates that `themes`, `mechanics`, and `answers` are arrays of correctly-typed items (strings ≤50 chars for themes/mechanics, valid rating objects for answers), but imposes **no upper bound on array length**. A malicious client can POST:

```json
{
  "themes": ["a","b","c", ... /* 50,000 items */],
  "mechanics": ["x","y","z", ... /* 50,000 items */],
  "answers": [{"gameSlug":"a","rating":"loved"}, ... /* 50,000 items */]
}
```

The `saveOnboarding` function in `queries.ts:108-130` processes these in a transaction:
- Line 115: `DELETE FROM quiz_answers` (fine)
- Line 119-120: `answers.forEach(answer => insertAnswer.run(...))` — **50,000 individual INSERT statements**
- Line 122-123: `themes.forEach(theme => insertTheme.run(...))` — **50,000 more INSERTs**
- Line 125-126: `mechanics.forEach(mechanic => insertMechanic.run(...))` — **50,000 more INSERTs**

This is 150,000 synchronous SQLite write operations on the main Node thread, inside a single transaction. Even with WAL mode, this blocks the event loop for several seconds.

**Fix:** Add array length limits in the API route validation:

```typescript
if (body.themes.length > 20) {
  return Response.json({ error: "Select up to 20 themes." }, { status: 400 });
}
if (body.mechanics.length > 20) {
  return Response.json({ error: "Select up to 20 mechanics." }, { status: 400 });
}
if (sanitizedAnswers.length > 50) {
  return Response.json({ error: "Too many quiz answers." }, { status: 400 });
}
```

The catalog defines 16 themes and 16 mechanics (`constants.ts`), so 20 is a generous upper bound.

---

### P1-2: Onboarding API accepts arbitrary theme/mechanic values — data pollution

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — Data integrity |
| **Files** | `src/app/api/onboarding/route.ts:28-34`, `src/lib/catalog/constants.ts:3-39` |
| **Prior coverage** | R1 flagged missing input sanitization on `answers[]` (resolved). Theme/mechanic **value validation** against the catalog was never examined. |

**Problem:** The API validates that theme/mechanic entries are strings of ≤50 characters, but never checks whether they match the defined `ALL_THEMES` or `ALL_MECHANICS` constants. A client can POST:

```json
{ "themes": ["nonexistent-theme", "another-fake"], "mechanics": ["made-up-mechanic"] }
```

These phantom values are persisted to `user_themes` and `user_mechanics`. Downstream effects:

1. **`buildTasteRadar()`** — phantom themes like `"xxx"` don't match any radar dimension switch case, so they add zero signal but inflate `themes.length`, inflating the Theme dimension score via `themeBias = themes.length * RADAR.themeBiasMultiplier` (`recommendations.ts:133`). With 100 phantom themes, the Theme radar score maxes out at 100 regardless of actual preferences.

2. **`getRecommendations()`** — phantom mechanics/themes inflate `profileMechanicOverlap` and `profileThemeOverlap` denominators via the Jaccard-style `overlapScore` function (`recommendations.ts:108-111`), which dilutes overlap scores for all candidates, making recommendations less relevant.

3. **`getOnboardingSnapshot()`** — phantom values are returned as `initialThemes`/`initialMechanics` and rendered in the wizard. They appear as toggle buttons the user can't understand because they don't match any catalog-defined value.

**Fix:** Validate against the known sets:

```typescript
import { ALL_THEMES, ALL_MECHANICS } from "@/lib/catalog";

const validThemes = new Set<string>(ALL_THEMES);
const validMechanics = new Set<string>(ALL_MECHANICS);

const sanitizedThemes = body.themes.filter(t => validThemes.has(t.trim()));
const sanitizedMechanics = body.mechanics.filter(m => validMechanics.has(m.trim()));
```

---

### P1-3: `getBoxSnapshot()` runs full recommendation engine without onboarding guard

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — Performance |
| **Files** | `src/lib/server-data.ts:88-101`, `src/app/box/page.tsx:13-16` |
| **Prior coverage** | R4 CODE_REVIEW P0-4 and R5 P1-2 flagged the **landing page** for running the full rec engine unnecessarily. That was fixed (short-circuit + `revalidate`). The **box page** has the same pattern but was never flagged. |

**Problem:** The box page uses `export const dynamic = "force-dynamic"` (`box/page.tsx:13`) and calls `getBoxSnapshot()` on every request. `getBoxSnapshot()` unconditionally calls `getFullUserState()` — which executes 7 DB queries plus the full recommendation scoring pipeline — before the page component checks `if (!currentMatch)` to show a placeholder.

For users who haven't completed onboarding (or for a fresh DB), the recommendation engine runs with empty preferences and produces zero-value results, only for the page to discard them and show a "complete onboarding first" message.

The landing page had exactly this problem (R4 P0-4) and was fixed with a profile check short-circuit. The box page was not.

**Fix:** Add the same short-circuit pattern:

```typescript
export function getBoxSnapshot() {
  const profile = getUserProfile();
  if (!profile.onboardingComplete) {
    return {
      profile,
      currentMatch: undefined,
      alternatives: [],
      pastBoxes: [],
      decision: "undecided" as BoxDecision,
      monthLabel: getCurrentBoxMonthValue(),
      reviewQueueSize: 0,
    };
  }

  const { recommendations, pastBoxes, catalog } = getFullUserState();
  // ... rest of function
}
```

---

### P1-4: Feedback API accepts arbitrary `boxMonth` — phantom feedback rows

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — Data integrity |
| **Files** | `src/app/api/feedback/route.ts:15-16`, `src/lib/db/queries.ts:154-176` |
| **Prior coverage** | R4 UX_REVIEW P1-2 flagged unsafe `JSON.parse` in `getFeedback()` (resolved). The **input validation gap** on `boxMonth`/`gameSlug` referential integrity was never examined. |

**Problem:** The feedback API validates that `boxMonth` is a non-empty string ≤20 characters, but never checks whether the month corresponds to an actual past box delivery for the user. Similarly, `gameSlug` is validated as a non-empty string ≤100 chars but not checked against the games table or the user's past box history.

A client can create feedback for months that never had deliveries:

```json
{ "boxMonth": "2099-12", "gameSlug": "nonexistent-game", "rating": 5, "tags": [], "comment": "fake" }
```

This is persisted via `INSERT ... ON CONFLICT DO UPDATE` in `saveFeedback()`. The `getFeedbackSnapshot()` function then returns it, but since `pastBoxes` won't contain `boxMonth: "2099-12"`, the feedback is orphaned — it exists in the DB but is never rendered. Worse, if the user later receives a box in that month, the pre-existing feedback would be returned as if they'd already reviewed it.

The `ON CONFLICT` clause means a second POST with the same fabricated `boxMonth` silently overwrites any legitimate feedback for that month.

**Fix:** Validate that `boxMonth` references an actual past box:

```typescript
import { getPastBoxes } from "@/lib/db";

const pastBoxes = getPastBoxes();
const targetBox = pastBoxes.find(b => b.boxMonth === body.boxMonth);
if (!targetBox) {
  return Response.json({ error: "No delivery found for that month." }, { status: 400 });
}
if (targetBox.gameSlug !== body.gameSlug) {
  return Response.json({ error: "Game slug doesn't match the delivered game." }, { status: 400 });
}
```

---

## Previously Documented — Verified Status

### Resolved Since Review 5

| Prior Finding | Review | Status |
|---|---|---|
| `box-decision` API ignores `monthLabel` (R5 P0-1) | R5 | ✅ Fixed — API now validates + cross-checks against server month |
| `persistCollection` reruns full rec engine on mutation (R5 P0-2) | R5 | ✅ Fixed — mutation endpoints return `{ ok: true }` |
| `onboarding_complete` silently reverted (R5 P1-1) | R5 | ✅ Fixed — uses `MAX(onboarding_complete, ?)` |
| `force-dynamic` on landing page (R5 P1-2) | R4/R5 | ✅ Fixed — `revalidate = 60`, short-circuits when not onboarded |
| Community `<article>` headings (R2 P2, R3 P1, R5 P1-3) | R2+ | ✅ Fixed — `<h3>` used for post name |
| No rate-limiting/CSRF/CSP (R5 P1-4) | R5 | ⚠️ Partial — CSP header added; rate limiting still absent |
| Star rating ARIA anti-pattern (R5 P1-5) | R5 | ✅ Fixed — proper `role="radiogroup"` + `role="radio"` |
| No per-route `loading.tsx` (R5 P1-6) | R5 | ❌ Still open |
| Feedback textarea char count (R3 P1, R5 P1-7) | R3+ | ✅ Fixed — `maxLength={2000}` + live counter |
| Unsafe `JSON.parse` in `parseGame` (R4 P0-5) | R4 | ✅ Fixed — `mappers.ts` uses `safeParseStringArray` |
| Collection loads full catalog for slug validation (R4 P1-6) | R4 | ✅ Fixed — `gameExists()` query added |
| `monthLabel` ghost payload in box-decision (R4 P1-7) | R4 | ✅ Fixed — accepted, validated, cross-checked |
| Collection API accepts arbitrary slugs (R4 P1-1) | R4 | ✅ Fixed — `gameExists()` check in collection route |
| `getFeedback()` unguarded `JSON.parse` (R4 P1-2) | R4 | ✅ Fixed — uses `safeParseStringArray` |

### Still Open from Prior Reviews

| Prior Finding | Review | Status |
|---|---|---|
| No test suite (R1–R5) | R1 | ❌ CI runs lint+build+typecheck but zero test files |
| `allowJs: true` in tsconfig (R3, R5 P2-6) | R3 | ❌ Still present, no `.js` source files exist |
| Landing stats no "demo" label (R1–R5 P2-1) | R1 | ❌ Still hardcoded mock values without indicator |
| Community heart looks interactive (R2–R5 P2-2) | R2 | ❌ `❤ {post.likes}` still not a button or labeled non-interactive |
| `Geist_Mono` font loaded unused (R5 P2-3) | R5 | ❌ Still imported in `layout.tsx:14` |
| ESLint no project-specific rules (R5 P2-4) | R5 | ❌ Only `next/core-web-vitals` + `next/typescript` |
| No `npm run reset` script (R5 P2-5) | R5 | ❌ Still no reset command |
| `ComponentErrorBoundary` no error reporting (R5 P2-8) | R5 | ❌ No `componentDidCatch` |
| `PlanSelector` cards no `aria-pressed` (R5 P2-9) | R5 | ❌ Selection state still visual-only |
| Full catalog serialized to client on collection page (R4 P1-8) | R4 | ❌ `availableGames: catalog` still sends all 65 games |
| Box-decision `gameSlug` not validated against DB (R3) | R3 | ❌ Fixed for collection route only; box-decision still unchecked |
| No per-route `loading.tsx` (R5 P1-6) | R5 | ❌ Only root skeleton exists |

---

## Score Card Delta

| Dimension | Review 5 | Review 6 | Change | Note |
|---|:---:|:---:|:---:|---|
| **Data Integrity** | 5 | 5.5 | ↑ | Prior JSON.parse and slug validation issues fixed; new input validation gaps surfaced |
| **API Robustness** | 6 | 6 | → | monthLabel cross-check added; unbounded arrays and missing referential checks found |
| **UI Correctness** | 8 | 7 | ↓ | `duplicateCount` always-zero is a visible correctness regression |
| **Performance** | 6 | 7 | ↑ | Landing page fixed; box page still has same anti-pattern |
| **Accessibility** | 7 | 8 | ↑ | Star rating radiogroup, article headings — significant wins |
| **Testing** | 1 | 1 | → | Still zero tests |
| **Overall** | 6.5 | 6.5 | → | Fixes balanced by newly surfaced issues |

---

## Refactoring Roadmap (New Items Only)

### Tier 1: High Impact, Low Effort

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Fix `duplicateCount` to measure filtered-out games, not post-filter (P0-1) | `server-data.ts` | 15 min |
| 2 | Add array length limits for themes/mechanics/answers in onboarding API (P1-1) | `api/onboarding/route.ts` | 15 min |
| 3 | Validate themes/mechanics against `ALL_THEMES`/`ALL_MECHANICS` sets (P1-2) | `api/onboarding/route.ts` | 20 min |
| 4 | Short-circuit `getBoxSnapshot()` when onboarding incomplete (P1-3) | `server-data.ts` | 15 min |

### Tier 2: Medium Effort

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 5 | Validate feedback `boxMonth`/`gameSlug` against past_boxes (P1-4) | `api/feedback/route.ts` | 30 min |
| 6 | Validate box-decision `gameSlug` against games table (R3, still open) | `api/box-decision/route.ts` | 15 min |

---

*End of delta review. P0-1 is a 15-minute fix with immediate user-visible impact. P1-1 and P1-2 are defense-in-depth hardening that compound if left unaddressed.*
