# UX Review 7 — Focused Delta Audit

**Date:** 2025-07-18
**Scope:** New P0/P1 issues only — findings already documented in UX_REVIEW through UX_REVIEW_6 and CODE_REVIEW through CODE_REVIEW_3 are excluded.
**Methodology:** Full source read of all API routes, components, lib/, and page files. Cross-referenced against every issue in docs/ to avoid duplication.

---

## P0 — Data Integrity / Security

### 1. Feedback API tags array has no length limit

**File:** `src/app/api/feedback/route.ts:28`

The route validates individual tag format (string, ≤50 chars) but imposes no cap on the number of tags. Every other array-accepting endpoint has a ceiling: onboarding caps themes at 20, mechanics at 20, and answers at 50. Feedback tags are unbounded.

```typescript
// Current: validates element shape but not array length
if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string" || t.length > 50))) {
  return Response.json({ error: "Tags must be an array of strings (max 50 chars each)." }, { status: 400 });
}
```

**Impact:** A single POST with 100,000 tags × 50 chars = ~5 MB is `JSON.stringify`'d and stored in the `box_feedback.tags` TEXT column. Repeated submissions balloon the SQLite file. No rate limiting compounds this.

**Fix:** Add `if ((body.tags?.length ?? 0) > 20)` guard before the element-level check, consistent with the onboarding route's pattern.

---

### 2. Onboarding API quiz answer gameSlugs are not validated against the catalog

**File:** `src/app/api/onboarding/route.ts:50-63`

The route sanitizes theme and mechanic values against `ALL_THEMES` / `ALL_MECHANICS` (lines 66–69), and the collection route validates slugs with `gameExists()`. But quiz answers only check that `gameSlug` is a non-empty string ≤100 chars — it never verifies the slug exists in the `games` table.

```typescript
// Themes/mechanics: validated against catalog ✓
const sanitizedThemes = body.themes.map((t) => t.trim().slice(0, 50)).filter((t) => validThemes.has(t));

// Quiz answer slugs: format-only, no catalog check ✗
.filter((a) => {
  const slug = a.gameSlug as string;
  return slug.length > 0 && slug.length <= 100 && validRatings.has(rating as RatingValue);
})
```

**Impact:** Arbitrary slugs (e.g., `"xss-probe"`, `"../../etc/passwd"`) are persisted in `quiz_answers`. The recommendation engine silently discards them (`catalog.find()` returns undefined), so they're inert data pollution — but they defeat any future analytics on quiz completion rates and leave phantom rows in the DB.

**Fix:** Filter `sanitizedAnswers` against a `Set` of valid game slugs from the catalog, mirroring the theme/mechanic validation pattern already in place.

---

### 3. Box-decision API doesn't verify gameSlug matches current recommendation

**File:** `src/app/api/box-decision/route.ts:13`

The route validates `gameSlug` format and `monthLabel` against the server month, but never checks that the submitted slug is the game actually recommended for the current box. Any valid slug from the catalog can be paired with any month.

```typescript
// Validates format and month match — but not that gameSlug is the current recommendation
if (!body.gameSlug || typeof body.gameSlug !== "string" || body.gameSlug.trim().length === 0 || body.gameSlug.length > 100) {
  return Response.json({ error: "Provide a valid game slug." }, { status: 400 });
}
// ...
persistBoxDecision(body.decision, body.gameSlug, body.monthLabel);
```

**Impact:** A client-side modification can store a "keep" decision for a game that was never recommended, creating orphaned `box_decisions` rows. Downstream features that read decision history (e.g., future "shipped games" logic) would see phantom entries. The `past_boxes` table and `box_decisions` table can desync.

**Fix:** In the API handler, call `getBoxSnapshot()` (or a lighter variant) and assert `body.gameSlug === currentMatch.game.slug` before persisting. Return 409 on mismatch.

---

## P1 — Developer Experience / Correctness

### 4. `sitemap.ts` and `robots.ts` hardcode production domain

**Files:** `src/app/sitemap.ts:3`, `src/app/robots.ts:13`

Both files embed `https://cratematch.app` as a string literal. This domain doesn't resolve (the project is an MVP running on localhost). There's no env-var override, no `.env.example` documenting a `NEXT_PUBLIC_BASE_URL`, and no build-time substitution.

```typescript
// sitemap.ts
const BASE_URL = "https://cratematch.app";

// robots.ts
sitemap: "https://cratematch.app/sitemap.xml",
```

**Impact:** Search engines indexing a deployed preview/staging instance receive incorrect canonical URLs. Developers must manually find and edit these files for any non-production deployment. The `.env.example` absence (already flagged in UX_REVIEW_5) compounds this — even if a variable existed, there's no documentation telling contributors to set it.

**Fix:** Read from `process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"` and add the variable to a new `.env.example`.

---

### 5. `getCollectionSnapshot()` ships unused data to the client

**File:** `src/lib/server-data.ts:120-140`

The snapshot destructures `answers`, `themes`, `mechanics` from `getFullUserState()` and includes them in the return object, but `CollectionPage` (`src/app/collection/page.tsx`) never passes these to `CollectionManager`. They're serialized across the server/client boundary for no reason.

```typescript
// server-data.ts — returned but never consumed downstream
return {
  profile,    // used by page? no — not passed to CollectionManager
  answers,    // ← unused
  themes,     // ← unused
  mechanics,  // ← unused
  ownedGames,
  availableGames,
  recommendations: recommendations.slice(0, 5),
  insights: buildCollectionInsights({ ... }),
  ownedCount: ownedGames.length,
};
```

**Impact:** Extra serialization overhead on every collection page load (profile + answers + themes + mechanics). Minor in absolute terms for 65 games, but it's dead data in the RSC payload and a maintenance trap — future contributors may assume these fields are consumed.

**Fix:** Remove `profile`, `answers`, `themes`, `mechanics` from the return object. If they're needed later, add them back intentionally.

---

### 6. Inconsistent `boxMonth` format validation between API routes

**Files:** `src/app/api/box-decision/route.ts:7` vs `src/app/api/feedback/route.ts:16`

The box-decision route enforces a strict `YYYY-MM` regex. The feedback route only checks the value is a non-empty string ≤20 characters. Both handle month identifiers for the same conceptual entity.

```typescript
// box-decision: strict
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
if (!body.monthLabel || !MONTH_PATTERN.test(body.monthLabel)) { ... }

// feedback: loose
if (!body.boxMonth || typeof body.boxMonth !== "string" || body.boxMonth.trim().length === 0 || body.boxMonth.length > 20) { ... }
```

**Impact:** The feedback route accepts `"January 2025"`, `"2025/01"`, or any string ≤20 chars as `boxMonth`. The `pastBoxes.find()` guard on line 39 prevents real damage (it won't match), but the inconsistency means validation errors surface at the business-logic layer instead of the format-validation layer, producing a confusing `"No delivery found for that month"` error instead of a clear `"Provide a valid month (YYYY-MM)"`.

**Fix:** Extract `MONTH_PATTERN` to a shared validation constant in `lib/` and reuse it in both routes.

---

### 7. `getProfileSummaryLine` produces garbled text with empty preference arrays

**File:** `src/lib/server-data.ts:188`

When `themes` or `mechanics` arrays are empty (valid state during early onboarding), the template literal produces: `"...with  themes plus  mechanics."` — double spaces and missing content.

```typescript
// When themes = [] and mechanics = []:
`${profile.name}'s crate aims for ... with ${themes.slice(0, 2).join(" and ")} themes plus ${mechanics.slice(0, 2).join(" and ")} mechanics.`
// → "Avery's crate aims for 4-player nights, ~90 minutes, and 3.1/5 complexity with  themes plus  mechanics."
```

**Impact:** Visible on the onboarding page's "Current demo profile snapshot" card. A user who hasn't picked themes/mechanics yet sees broken prose. Minor cosmetic issue but it's in a prominent UI position.

**Fix:** Guard with `themes.length ? \`with ${themes.slice(0,2).join(" and ")} themes\` : "with no themes selected yet"` (and similarly for mechanics).

---

### 8. Box page empty state has no link to onboarding

**File:** `src/app/box/page.tsx:20-26`

When the user hasn't completed onboarding, the box page shows a text-only message saying "Head to onboarding to unlock the preview" — but provides no clickable link or button. Every other cross-page CTA in the app uses an actual `<Link>`.

```tsx
// Current: tells user where to go but doesn't link there
<div className="rounded-[2rem] border border-dashed ...">
  We need a completed taste profile before revealing this month's match.
  Head to onboarding to unlock the preview.
</div>
```

**Impact:** Dead-end UX. A new user navigating to `/box` before onboarding sees instructional text but must manually navigate via the header. This is the one page where a clear CTA matters most — it's the primary value proposition.

**Fix:** Add `<Link href="/onboarding">` wrapping a styled CTA button below the explanatory text.

---

## Summary

| # | Severity | Category | Issue | File(s) |
|---|----------|----------|-------|---------|
| 1 | **P0** | Validation | Feedback tags array unbounded | `api/feedback/route.ts:28` |
| 2 | **P0** | Validation | Quiz answer slugs not checked against catalog | `api/onboarding/route.ts:50` |
| 3 | **P0** | Correctness | Box decision accepts any gameSlug, not just current recommendation | `api/box-decision/route.ts:13` |
| 4 | P1 | Config | Hardcoded production domain in sitemap/robots | `sitemap.ts:3`, `robots.ts:13` |
| 5 | P1 | Performance | Collection snapshot ships unused fields to client | `server-data.ts:120` |
| 6 | P1 | Validation | Inconsistent month format validation across routes | `box-decision/route.ts:7`, `feedback/route.ts:16` |
| 7 | P1 | Display | Profile summary garbled with empty arrays | `server-data.ts:188` |
| 8 | P1 | UX | Box empty state has no link to onboarding | `box/page.tsx:22` |

### Delta vs. prior reviews

All 8 issues are **net-new** — none appear in UX_REVIEW through UX_REVIEW_6 or CODE_REVIEW through CODE_REVIEW_3. Several are in areas adjacent to previously flagged issues (e.g., onboarding validation was partially fixed but quiz slugs were missed; box-decision month validation was fixed but gameSlug was not). The pattern suggests a "fix the reported symptom" approach that leaves sibling validation gaps open.

### Positive progress since prior reviews

The codebase has meaningfully improved across iterations:
- FAQ is now collapsible via `<details>` (UX_REVIEW flagged)
- `box-decision` now validates `monthLabel` against server month (UX_REVIEW_5)
- Collection route now validates `gameSlug` against catalog via `gameExists()` (UX_REVIEW_4)
- Feedback route validates `boxMonth`/`gameSlug` against stored past boxes (UX_REVIEW_6)
- Onboarding themes/mechanics now validated against `ALL_THEMES`/`ALL_MECHANICS` (UX_REVIEW_6)
- `getBoxSnapshot()` has onboarding guard (UX_REVIEW_6)
- Multiple `loading.tsx` files added for key routes (UX_REVIEW_5)
- Focus trap and Escape handler added to mobile drawer (UX_REVIEW_2)
- `aria-pressed` added to theme/mechanic toggle pills (UX_REVIEW_2)
- Star rating uses proper `role="radiogroup"` with keyboard navigation (UX_REVIEW_2)
- Range sliders have `aria-valuetext` (UX_REVIEW_2)
- Onboarding now redirects to `/box` on completion (UX_REVIEW_3)
- DB layer split into typed modules: `connection.ts`, `queries.ts`, `mappers.ts`, `row-types.ts` (CODE_REVIEW)
- `safeParseStringArray` added for defensive JSON parsing (CODE_REVIEW_2)
- Landing page switched from `force-dynamic` to `revalidate = 60` (UX_REVIEW_5)
