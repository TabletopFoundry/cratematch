# CrateMatch — Fourth-Pass UX & DX Audit

**Date:** 2025-07-21
**Reviewer perspective:** Senior engineer, focused delta pass after Reviews 1–3 fixes
**Scope:** Only genuinely new P0/P1 findings not documented in prior reviews

---

## Executive Summary

CrateMatch has matured impressively across three review cycles. The FAQ is now collapsible (`<details>`/`<summary>`), onboarding redirects to `/box`, the mobile nav has focus trapping + Escape, all API routes validate inputs with range checks, typed row interfaces replaced the old `Record<string, unknown>` casts, and accessibility gaps around the radar chart, star rating, and toggle buttons are resolved. The project is well-organized with clean server/client boundaries and strong domain modeling.

**This review surfaces two P1 data-integrity issues** that slipped through prior passes: the collection API persists arbitrary slugs without catalog validation (a different endpoint from the already-flagged `box-decision` route), and `getFeedback()` performs an unguarded `JSON.parse` on the `tags` column (distinct from the `mappers.ts` parse already flagged in Review 3). Both can silently corrupt application state or crash page renders. Everything else in the codebase has been addressed or already documented.

---

## New Findings

### P1-1: Collection API accepts and persists arbitrary `gameSlug` values

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — High |
| **Files** | `src/app/api/collection/route.ts:9-11`, `src/lib/db/queries.ts:136-142`, `src/lib/db/connection.ts:76-81` |
| **Prior coverage** | Review 3 flagged the **`box-decision`** route for not validating `gameSlug` exists (API2). This is a **different endpoint** — the collection add/remove mutation — which was not covered. |

**Problem:** The collection API validates that `gameSlug` is a non-empty string ≤ 100 chars, but never checks whether the slug corresponds to an actual game in the `games` table. The `user_collection` table has no `FOREIGN KEY` constraint (despite `PRAGMA foreign_keys = ON` being set — it has no effect without actual FK declarations). A client can `POST /api/collection` with `{ "gameSlug": "nonexistent-game" }` and it will be silently persisted via `INSERT OR IGNORE`.

**Impact:**
- `getCollectionSnapshot()` calls `catalog.filter(game => ownedSlugs.includes(game.slug))` — invalid slugs silently disappear from the owned-games view but remain in the DB, inflating `ownedSlugs` and affecting recommendation filtering (the engine excludes owned slugs from candidates).
- `buildCollectionInsights()` receives a stale `ownedSlugs` array containing phantom entries, potentially hiding real mechanic gaps.
- There is no way for the user to remove an invalid slug through the UI, since the collection manager only renders games that match the catalog.

**Fix:** Add a catalog lookup before persisting:

```typescript
// In api/collection/route.ts or server-data.ts
const game = getAllGames().find(g => g.slug === body.gameSlug);
if (!game) {
  return Response.json({ error: "Game not found in catalog." }, { status: 400 });
}
```

Alternatively, add a `FOREIGN KEY (game_slug) REFERENCES games(slug)` to the `user_collection` table DDL — the pragma is already enabled.

---

### P1-2: `getFeedback()` performs unguarded `JSON.parse` on `tags` column

| Attribute | Detail |
|-----------|--------|
| **Severity** | P1 — High |
| **Files** | `src/lib/db/queries.ts:178-189` |
| **Prior coverage** | Review 3 flagged `JSON.parse` in **`src/lib/db/mappers.ts:10`** (TS2 — game themes/mechanics parsing). This is a **different call site** in `getFeedback()` parsing the `box_feedback.tags` column. |

**Problem:** Line 186 does `JSON.parse(row.tags) as string[]` with no try/catch or validation. If the `tags` column ever contains malformed JSON (manual DB edit, partial write, encoding corruption), this throws an unhandled exception during the server render of `/feedback`.

**Impact:**
- The entire feedback page crashes with an opaque "Application error" rather than gracefully degrading. The `ComponentErrorBoundary` wrapping `FeedbackForm` won't catch this because the parse happens in the **server-side** `getFeedbackSnapshot()` call, not in the client component.
- Because `getFeedback()` fetches **all** feedback rows, a single corrupted row poisons the entire page — the user cannot access any of their feedback.

**Fix:** Wrap the parse in a safe helper with a fallback:

```typescript
function safeParseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(item => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

// In getFeedback():
tags: safeParseStringArray(row.tags),
```

This helper could also be reused by `mappers.ts` to close the TS2 finding from Review 3.

---

## Previously Documented — Verified Status

| Review 3 Finding | Current Status |
|------------------|----------------|
| FAQ not collapsible (UX1) | ✅ Fixed — `page.tsx:155` uses `<details>`/`<summary>` |
| No post-onboarding redirect (UX2) | ✅ Fixed — `onboarding-wizard.tsx:132` calls `router.push("/box")` |
| `Record<string, unknown>` DB casts (TS1) | ✅ Fixed — `row-types.ts` + typed `as GameRow[]` etc. |
| Community page `force-dynamic` (DL3) | Still present — `community/page.tsx` has no `dynamic` export (correctly omitted now) |

---

## Score Card Delta

| Dimension | Review 3 | Review 4 | Change | Note |
|---|:---:|:---:|:---:|---|
| **Type Safety** | 6 | 7 | ↑ | Row types added; DB layer is now typed (mappers.ts/getFeedback parse gaps remain) |
| **Data Integrity** | — | 5 | new | Two unvalidated mutation paths can corrupt state |
| **UI/UX Polish** | 8 | 8.5 | ↑ | FAQ fixed, onboarding redirect added |
| **Testing** | 1 | 1 | → | Still zero tests |
| **Overall** | 6.0 | 6.5 | ↑ | Incremental improvement; data-integrity gaps are the last P1 blockers |
