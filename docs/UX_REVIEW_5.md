# UX & DX Review 5

**Date:** 2025-07-16
**Reviewer perspective:** Senior engineer, first-time encounter with codebase after Reviews 1–4.
**Scope:** Full UX/DX audit. Only genuinely new findings not already covered in Reviews 1–4.

---

## Executive Summary

The project has matured significantly since Review 1. Many prior P0s (mobile nav focus trap, `aria-pressed` on toggles, typed DB rows, FAQ collapsibility, collection API slug validation, post-onboarding redirect) are now resolved. The codebase is well-organized for an MVP with strong TypeScript discipline, proper security headers, and a clear separation between server data orchestration and client components.

This review surfaces **new issues** not previously flagged, focused on correctness, resilience, and developer-experience gaps that emerged from the current state of the code.

---

## P0 — Critical / Blocks Core Functionality

### P0-1: `box-decision` API ignores `monthLabel` — decisions can target wrong month

**File:** `src/app/api/box-decision/route.ts:10-20`
**File:** `src/lib/server-data.ts:165-167`

The client component `BoxDecisionPanel` sends `{ gameSlug, decision, monthLabel }` in the POST body, but the API route only destructures `gameSlug` and `decision` — **`monthLabel` is silently discarded**. The server then calls `persistBoxDecision(decision, gameSlug)` which internally calls `getCurrentBoxMonthValue()` to determine the month. This means:
- If a user's browser crosses midnight into a new month during a session, the decision targets a *different* month than displayed in the UI.
- There is no way for the client to anchor a decision to the month it's showing.

**Fix:** Accept and validate `monthLabel` from the request body; use it instead of `getCurrentBoxMonthValue()` inside `persistBoxDecision`, or at minimum cross-check it and return a 409 if they diverge.

### P0-2: `persistCollection` reruns the full recommendation engine on every add/remove

**File:** `src/lib/server-data.ts:155-163`

Every collection mutation (add or remove a single game) calls `getCollectionSnapshot()` → `getFullUserState()` → `getRecommendations()`. This runs the entire scoring/filtering pipeline for the full catalog. The response payload is a massive snapshot that the client component (`CollectionManager`) doesn't even consume — it only checks `response.ok` and then calls `router.refresh()`.

The same problem exists in `persistBoxDecision` (line 166) which returns `getBoxSnapshot()` → `getFullUserState()`.

**Impact:** On a 50-game catalog this is tolerable, but it's architecturally wrong — mutation APIs shouldn't re-derive the entire read model as a side effect. It also means every button click serializes the full recommendation engine synchronously on the main Node thread.

**Fix:** Mutation endpoints should return `{ ok: true }` (or a minimal diff). Let the subsequent `router.refresh()` + server component re-render handle the read model.

---

## P1 — Significant UX/DX Issues

### P1-1: `onboarding_complete` flag is silently never set for returning users who re-submit

**File:** `src/lib/db/queries.ts:113`

The onboarding save sets `onboarding_complete = 1` only when `answers.filter(item => item.rating !== "unplayed").length >= 12`. If a returning demo user re-saves with fewer than 12 non-"unplayed" answers (e.g., they reset some to "unplayed"), this **silently reverts** `onboarding_complete` to `0`, which breaks the box page, landing featured match, and plan billing status logic without any user-facing warning.

**Fix:** Either prevent downgrade (keep `onboarding_complete = MAX(onboarding_complete, ?)`) or show an explicit warning when the user is about to lose their completed status.

### P1-2: `force-dynamic` on landing page triggers full recommendation engine on every page load

**File:** `src/app/page.tsx:7`
**File:** `src/lib/server-data.ts:40-61`

The landing page has `export const dynamic = "force-dynamic"` and calls `getLandingPageSnapshot()`, which calls `getFullUserState()` (including full recommendation scoring) when `profile.onboardingComplete` is true. For a landing/marketing page, this is excessive — every visitor hit runs the full engine. There is no caching (`unstable_cache`, `revalidate`, or manual TTL) anywhere in the data layer.

**Fix:** Either remove `force-dynamic` and set a `revalidate` interval, or cache the featured match result for a reasonable TTL (e.g., 60s).

### P1-3: Community `<article>` elements still lack headings inside them

**File:** `src/app/community/page.tsx:39-56`

Each community post is wrapped in `<article>` but the post author name uses `<div class="font-semibold">` instead of a heading element. This was flagged in Review 2 (P2) and Review 3 (P1) as needing headings inside `<article>`, and it remains unfixed. The review cards do use `<h2>` (line 65), so the pattern is inconsistent within the same page.

**Fix:** Add `<h3>` (or appropriate level) for the post author or a post title inside each `<article>`.

### P1-4: No rate-limiting or CSRF protection on any mutation API route

**Files:** All `src/app/api/*/route.ts`

Every POST/DELETE route accepts unauthenticated requests with no rate limiting, no CSRF token, and no origin checking. While the security headers in `next.config.ts` include `X-Frame-Options: DENY` (good), there's no `Content-Security-Policy` header and no server-side origin validation. A malicious page could submit onboarding data, change plans, or mutate the collection via cross-origin fetch (CORS defaults in Next.js allow same-origin only, but there are no explicit safeguards if the deployment proxy strips headers).

**Fix:** Add a `Content-Security-Policy` header to `next.config.ts`. For production readiness, add rate limiting middleware and consider a CSRF token pattern.

### P1-5: `feedback-form.tsx` slider role contains interactive children — ARIA anti-pattern

**File:** `src/components/feedback-form.tsx:131-166`

The star rating uses `role="slider"` on the wrapper div, with inner `<button>` elements marked `aria-hidden="true"`. This is an improvement over Review 2's finding (buttons now have `tabIndex={-1}` and `aria-hidden`), but it's still an anti-pattern: a slider should be a single focusable element, not a container holding hidden buttons. Screen readers will announce it as a slider, but clicking a specific star still requires mouse precision — keyboard users can only use arrow keys and can't directly jump to star 3.

The real issue is that this is semantically a **radio group**, not a slider. `role="radiogroup"` with individual `role="radio"` items would match the visual and interaction model correctly.

**Fix:** Refactor to `role="radiogroup"` with `role="radio"` + `aria-checked` on each star. This was partially suggested in Review 1 but the current implementation chose slider, which remains incorrect.

### P1-6: No per-route `loading.tsx` — all pages share one generic skeleton

**Files:** `src/app/loading.tsx` is the only loading file; no `src/app/box/loading.tsx`, etc.

The single root `loading.tsx` shows a generic pulse skeleton (3 cards + 1 large block) that doesn't match any actual page layout. When navigating to `/collection` (heavy data) or `/box` (recommendation engine), users see a misleading skeleton that doesn't resemble the page they're about to see. This causes layout shift when the real page replaces the skeleton.

**Fix:** Add route-specific `loading.tsx` files for at least `/box`, `/collection`, and `/onboarding` that match the actual page structure.

### P1-7: `textarea` comment field has no visible character count despite 2000-char server limit

**File:** `src/components/feedback-form.tsx:197-204`
**File:** `src/app/api/feedback/route.ts:31`

The feedback comment textarea has no `maxLength` attribute and no visible character counter. The server silently truncates at 2000 characters (line 40 of route.ts: `.slice(0, 2000)`). Users can type beyond the limit with no indication their text will be cut.

This was flagged in Review 3 as a P1 ("Feedback textarea lacks client-side length indicator") and remains unfixed.

**Fix:** Add `maxLength={2000}` to the textarea and show a `{remaining}/2000` counter.

---

## P2 — Minor / Polish

### P2-1: Landing page stats still presented as real data without "demo" label

**File:** `src/lib/server-data.ts:56-59`

Stats like "3,240 active subscribers" and "94% match satisfaction" are hardcoded mock values returned by `getLandingPageSnapshot()`. They're rendered identically to real data on the landing page. This was flagged in Reviews 1, 2, and 3 but remains without a "demo data" indicator.

### P2-2: Community heart count looks interactive but isn't

**File:** `src/app/community/page.tsx:52`

`<span>❤ {post.likes}</span>` renders a heart emoji with a count. It's not a button, but the heart symbol plus count strongly suggests clickability. Flagged in Reviews 2 and 3, still present.

### P2-3: `Geist_Mono` font loaded but never used

**File:** `src/app/layout.tsx:10-12`

`Geist_Mono` is imported, configured as `--font-geist-mono`, and applied to the `<html>` element, but no element in the codebase uses `font-mono` or references this variable. This adds an unnecessary font download (~30KB).

**Fix:** Remove the `Geist_Mono` import and CSS variable unless a monospace font is actually needed.

### P2-4: `eslint.config.mjs` has no project-specific rules

**File:** `eslint.config.mjs`

The ESLint config only extends `next/core-web-vitals` and `next/typescript`. There are no project-specific rules for common pitfalls (e.g., no `console.log` in production, no floating promises, exhaustive-deps enforcement). The CI runs lint, but it's effectively only catching Next.js-specific issues.

### P2-5: No `npm run reset` script to clear SQLite and re-seed

**File:** `package.json:5-11`

The DB auto-seeds on first connection, but there's no way to reset to a clean state without manually deleting `data/cratematch.db`. For a demo/development workflow, a `"reset": "rm -f data/cratematch.db && npm run dev"` script would save time.

### P2-6: `allowJs: true` in `tsconfig.json` is unnecessary

The project has zero `.js` source files — everything is TypeScript. `allowJs: true` weakens type checking guarantees by silently accepting any `.js` file that might be introduced. Flagged in Review 3, still present.

### P2-7: No `.env.example` file

There are no environment variables in use currently, but the README doesn't document this explicitly. A `.env.example` (even if empty with a comment) signals to new developers that no env setup is required.

### P2-8: `ComponentErrorBoundary` has no error reporting hook

**File:** `src/components/component-error-boundary.tsx:21`

`getDerivedStateFromError` captures the error but doesn't log it anywhere — no `console.error`, no telemetry, no `componentDidCatch` implementation. In development this means errors are silently swallowed after the boundary catches them, making debugging harder.

**Fix:** Add `componentDidCatch(error, info)` with at minimum a `console.error` call.

### P2-9: `PlanSelector` cards use `<button>` but lack `aria-pressed` for selected state

**File:** `src/components/plan-selector.tsx:55-80`

Plan cards are rendered as `<button>` elements. The selected plan is visually distinguished by border/shadow changes, but there's no `aria-pressed` or `role="radio"` to communicate the selection to assistive technology. The `currentPlan` badge is present (good), but the *selected* (pre-checkout) state is only visual.

**Fix:** Add `aria-pressed={active}` to each plan button, or refactor to a `role="radiogroup"` pattern.

---

## Summary of Status vs. Prior Reviews

| Prior Finding | Status |
|---|---|
| Mobile nav focus trap + Escape (R1 P0, R2 P0) | ✅ Fixed |
| `aria-pressed` on theme/mechanic pills (R2 P0) | ✅ Fixed |
| FAQ collapsible (R1 P2, R2, R3) | ✅ Fixed |
| Post-onboarding redirect (R1, R2, R3) | ✅ Fixed |
| Typed DB rows (R3 P0) | ✅ Fixed |
| Collection API validates `gameSlug` exists (R4 P1) | ✅ Fixed |
| Skip-to-content link (R1 P2) | ✅ Fixed |
| `Record<string,unknown>` casts (R3 P0) | ✅ Fixed |
| Active page indicator in nav (R1 P1) | ✅ Fixed |
| Community `<article>` headings (R2 P2, R3 P1) | ❌ Still open |
| Feedback textarea char count (R3 P1) | ❌ Still open |
| Landing stats "demo" label (R1 P2, R2, R3) | ❌ Still open |
| Community heart interactivity (R2 P2, R3) | ❌ Still open |
| No tests (R1, R2, R3) | ⚠️ CI exists but still no test suite |
| `allowJs: true` (R3 P2) | ❌ Still open |
