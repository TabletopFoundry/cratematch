# CrateMatch — UX & Developer Experience Audit

**Date:** 2025-07-18
**Reviewer perspective:** Senior engineer encountering codebase for the first time
**Scope:** Product UX, developer experience, PRD coverage, polish, performance

---

## Executive Summary

CrateMatch is an impressively cohesive MVP. The visual design is warm, consistent, and premium-feeling. The codebase is clean, well-organized, and runs out of the box in two commands. The onboarding wizard, recommendation engine, and collection management features are fully functional with real persistence. However, the project has meaningful gaps in mobile UX (no hamburger menu), accessibility (missing keyboard/screen-reader support), and several PRD features are absent by design (auth, BGG import, feedback, admin tools). The biggest user-facing friction is that the navigation disappears entirely on mobile, making the app effectively unusable on phones — despite the PRD requiring a responsive web app.

---

## 1. Product UX Findings

### 1.1 Navigation & Information Architecture

| Finding | Severity | Details |
|---------|----------|---------|
| **No mobile navigation** | P0 | `site-header.tsx:24` uses `hidden md:flex` for the nav links. On screens below `md` (768px), all navigation vanishes. There is no hamburger menu, drawer, or any alternative. The PRD explicitly requires a "responsive web app" (§3 In Scope #1). |
| **No active-link indicator** | P1 | All nav links share identical styling (`text-stone-600 hover:text-orange-600`). The user has no visual cue which page they're currently on. |
| **No "back to dashboard" flow** | P2 | After completing onboarding, the user sees a success message but isn't routed to `/box` or `/plans`. There's no subscriber dashboard page to land on. |
| **Footer cutoff reminder is orphaned** | P2 | The footer shows "changes lock on the 20th at 11:59 PM local time" on every page, including the landing page where it has no context for new visitors. |

### 1.2 Landing Page

| Finding | Severity | Details |
|---------|----------|---------|
| **Strong hero section** | ✅ | Clear value prop, dual CTAs, stat cards, featured match preview — well-executed. |
| **Stats are hardcoded vanity metrics** | P2 | `server-data.ts:40-44` hardcodes "3,240 subscribers" and "94% satisfaction". These are mock but presented without any "demo" qualifier, unlike the checkout which clearly labels itself as mock. |
| **FAQ is not collapsible** | P2 | All FAQ answers are fully expanded, creating a very long scroll. Standard UX is accordion/disclosure pattern. |
| **No CTA on plan cards** | P1 | The pricing section on the landing page shows plan cards but has no button to select/subscribe from each card. User must notice the separate "View subscription tiers" link. |

### 1.3 Onboarding Wizard

| Finding | Severity | Details |
|---------|----------|---------|
| **Well-structured multi-step flow** | ✅ | 7 steps, progress bar, save-and-resume — solid implementation. |
| **Quiz rating buttons lack keyboard role** | P1 | Buttons inside `role="radiogroup"` are `<button>` elements but lack `role="radio"` and `aria-checked`. Screen readers will announce them as generic buttons, not as a radio group. |
| **Step labels are misleading** | P1 | Steps are labeled "Rate 1-5", "Rate 6-10", "Rate 11-15" which refer to game indices, not ratings. Confusing — could read as "rate games on a 1-5 scale." Better: "Games 1-5", "Games 6-10", "Games 11-15". |
| **No validation before advancing steps** | P2 | User can click "Continue" through all quiz steps without rating a single game, reaching the summary step where they see the "at least 12" warning. Early step validation would reduce abandonment. |
| **Radar chart updates live — nice touch** | ✅ | `useMemo` recalculates on every answer change. Good feedback loop. |
| **No confirmation dialog on "Finish onboarding"** | P2 | Submitting replaces all quiz answers atomically (`DELETE FROM quiz_answers WHERE user_id = ?` in `db.ts:303`). A mis-click could wipe carefully curated answers with a partial set. |

### 1.4 Plans & Checkout

| Finding | Severity | Details |
|---------|----------|---------|
| **Clear mock labeling** | ✅ | The checkout panel explicitly says "This MVP uses a mock payment action" — honest and avoids confusion. |
| **Selected plan card has strong visual distinction** | ✅ | Shadow and border change on selection is clear. |
| **No price comparison or "current plan" badge** | P1 | When the user already has an active plan, the checkout doesn't show "You're currently on Explorer" on the card itself. Only shown as a small pill above the cards. |

### 1.5 Monthly Box Preview

| Finding | Severity | Details |
|---------|----------|---------|
| **Excellent "Why this game?" transparency** | ✅ | Personalized reasons tied to profile — exactly what the PRD asks for (FR-06). |
| **Keep/return decision panel is clear** | ✅ | Good use of color states (emerald for keep, rose for return). |
| **Past boxes lack game cover art** | P2 | Past box entries show title and note but no `GameCover` component, unlike the current match. Visual inconsistency. |
| **No post-delivery feedback mechanism** | P1 | PRD FR-08 requires 1-5 rating and feedback capture after delivery. No rating UI exists anywhere in the app. The keep/return decision is not the same as quality feedback. |

### 1.6 Collection Management

| Finding | Severity | Details |
|---------|----------|---------|
| **Search + add/remove works well** | ✅ | Optimistic local state with server sync and clear status messages. |
| **Gap analysis is insightful** | ✅ | Mechanic gap detection and complementary picks are a strong differentiator. |
| **Search doesn't match on mechanics** | P2 | The search input placeholder says "Search titles, themes, or mechanics" but the filter in `collection-manager.tsx:45` only checks `title` and `themes`, not `mechanics`. |
| **No pagination for large collections** | P2 | If a user adds many games, all are rendered in a flat grid. With 65 catalog games, this is fine, but doesn't scale. |

### 1.7 Community Page

| Finding | Severity | Details |
|---------|----------|---------|
| **Good mock social proof** | ✅ | Unboxing posts, reviews, stats — well-structured static content. |
| **No interactivity** | P2 | Likes are static numbers with no click action. Acceptable for MVP but the lack of any interactive element makes the page feel dead. |

---

## 2. Accessibility Audit

| Finding | Severity | Details |
|---------|----------|---------|
| **PRD requires WCAG 2.2 AA** | — | §5 Non-Functional Requirements, Accessibility section. |
| **Only 2 `aria-*` attributes in entire app** | P0 | `game-cover.tsx:37` and `onboarding-wizard.tsx:175`. No ARIA labels on navigation, form controls, status messages, or interactive panels. |
| **Rating buttons lack `role="radio"` / `aria-checked`** | P1 | The radiogroup in onboarding has buttons without radio semantics. |
| **No skip-to-content link** | P1 | Sticky header means keyboard users must tab through 5+ links on every page load. |
| **No focus ring styles** | P1 | Buttons use `outline-none` (e.g., onboarding inputs at line 247) which removes focus indicators entirely. WCAG 2.4.7 requires visible focus. |
| **Color-only rating state** | P1 | Active vs. inactive quiz buttons differ only by color (orange-500 vs white). No icon, border-weight, or text change for non-color distinction (PRD: "non-color cues required for rating states"). |
| **No `<h1>` on some route pages** | P2 | The community page and collection page have `<h1>` but the box page uses `<h1>` only when a match exists. The empty state has no heading. |
| **No `aria-live` for status messages** | P1 | Success/error banners in onboarding, checkout, and collection are not announced to screen readers. |

---

## 3. PRD Feature Coverage

### Implemented ✅

| PRD Requirement | Implementation |
|-----------------|----------------|
| FR-03 — Taste Quiz (15 games, preferences, ratings) | `onboarding-wizard.tsx` — full quiz with 15 anchor games, themes, mechanics, sliders |
| FR-05 — Recommendation engine with constraints | `recommendations.ts` — ownership, shipped, budget, player count, play time, dislike filtering |
| FR-06 — "Why this game?" explanation | `box/page.tsx` — reasons rendered from recommendation overlaps |
| FR-02 — Plan selection (partial) | `plan-selector.tsx` — 3 tiers with mock checkout |
| Landing page (marketing) | Full hero, how-it-works, pricing, testimonials, FAQ |
| Collection management | `collection-manager.tsx` — add/remove, gap analysis, recommendations |
| Loading/error/empty states | `loading.tsx`, `error.tsx`, `not-found.tsx` + inline empty states |
| Resume-safe onboarding | Save progress + server persistence in SQLite |

### Missing / Not Implemented ❌

| PRD Requirement | Priority | Notes |
|-----------------|----------|-------|
| **FR-01 — Authentication** | Must | No auth at all — single hardcoded `demo-user`. PRD requires email/password signup, verification, login/logout. |
| **FR-04 — BGG Import** | Must | Not implemented. PRD screen #4 specifies a dedicated import screen with matched/unmatched counts. |
| **FR-07 — Fulfillment & Shipping** | Must | No shipment tracking, 3PL integration, or tracking UI. |
| **FR-08 — Post-Delivery Feedback** | Must | No 1-5 rating or feedback form anywhere. The keep/return panel is not feedback. |
| **FR-09 — Subscription Self-Serve** | Must | No pause, skip, cancel, or address management. |
| **FR-10 — Admin Console** | Must | No admin pages for catalog, inventory, batch monitoring, or overrides. |
| **FR-11 — Notifications** | Should | No email integration or lifecycle messaging. |
| **Subscriber Dashboard** | Must | PRD screen #6 requires a central dashboard with subscription status, next curation date, shipment tracking. No `/dashboard` route exists. |
| **Feedback Screen** | Must | PRD screen #7 requires a dedicated 1-5 rating screen with structured tags. |

> **Verdict:** The MVP implements ~40% of PRD v1 "Must" requirements. It covers the taste onboarding, recommendation, and collection tracks well, but omits all operational infrastructure (auth, billing, fulfillment, feedback, admin).

---

## 4. Polish & Edge Cases

### Loading States
| Item | Status |
|------|--------|
| Root loading skeleton | ✅ `loading.tsx` with `animate-pulse` |
| Per-component loading | ✅ Buttons show "Saving...", "Processing...", "Finishing..." |
| Transition pending state | ✅ Uses `useTransition` correctly; disables buttons during mutations |

### Error States
| Item | Status |
|------|--------|
| Global error boundary | ✅ `error.tsx` with retry |
| API error handling | ✅ All 4 API routes return structured `{ error: string }` with 400/500 |
| Client-side error display | ✅ Inline rose-colored banners in all interactive components |
| 404 page | ✅ Branded not-found page with home link |

### Empty States
| Item | Status |
|------|--------|
| No featured match | ✅ Dashed-border placeholder in landing hero |
| Empty collection | ✅ "Your collection is empty" message with guidance |
| No search results | ✅ "No matching games found" with suggestion |
| No testimonials | ✅ Graceful fallback message |
| Empty box (no profile) | ✅ "Complete taste profile first" message |

### Edge Cases
| Finding | Severity | Details |
|---------|----------|---------|
| **Onboarding allows empty name** | P1 | `name` field can be submitted as empty string. The API validates `!body.name` which is falsy for empty string, so this is caught — but the client doesn't show inline validation. |
| **Hardcoded `CURRENT_BOX_MONTH = "2025-03"`** | P1 | `server-data.ts:7` — this will become stale. Should derive from current date or be configurable. |
| **`buildUserState()` called on every page** | P2 | `server-data.ts:8-28` runs the full recommendation engine for every snapshot function. On the landing page, community stats don't need recommendations but `buildUserState()` still computes them. |
| **Global DB singleton via `global.__crateMatchDb`** | P2 | `db.ts:11` — works for dev but the global type augmentation is informal. Fine for MVP. |

---

## 5. Performance Analysis

| Area | Assessment |
|------|------------|
| **Server-side rendering** | ✅ All page components are server components calling `getDb()` synchronously. No client-side data fetching waterfalls. |
| **Client bundle** | ✅ Only 4 client components: `onboarding-wizard`, `plan-selector`, `box-decision-panel`, `collection-manager`. Minimal client JS. |
| **Recharts dependency** | ⚠️ Recharts is a heavy library (~200KB gzipped) used only for a single radar chart. Consider a lightweight alternative like `chart.js` or SVG-only radar. |
| **SQLite queries** | ✅ All queries use prepared statements. Seeding uses transactions. WAL mode enabled. |
| **Redundant computation** | ⚠️ `buildUserState()` recomputes the full recommendation list for every page load, including pages that don't use it (community). The recommendation engine iterates all 65 games × all quiz answers on every request. |
| **No image optimization** | ✅ N/A — Game covers are CSS gradient-based, not images. Clever choice that avoids CDN/image pipeline entirely. |
| **Static vs. dynamic** | ⚠️ All pages are `force-dynamic`. The community page and landing FAQ/testimonials could be statically generated or ISR-cached since they're hardcoded constants. |

---

## 6. Developer Experience

### Setup & Onboarding
| Area | Assessment |
|------|------------|
| **Clone to running** | ✅ Excellent — `npm install && npm run dev` works immediately. README documents this clearly. |
| **Data seeding** | ✅ Auto-seeds 65 games and demo profile on first DB access. Zero manual setup. |
| **Build / lint** | ✅ Both pass cleanly with zero warnings. |
| **Route documentation** | ✅ README lists all 6 routes with one-line descriptions. |

### Code Organization
| Area | Assessment |
|------|------------|
| **Structure** | ✅ Clean separation: `app/` (pages + API), `components/` (client UI), `lib/` (data + logic). |
| **Naming** | ✅ Consistent kebab-case files, PascalCase components, camelCase functions. |
| **Type safety** | ✅ All types defined in `types.ts`. No `any` usage. Strict TypeScript enabled. |
| **File sizes** | ⚠️ `catalog.ts` is 1,091 lines — mostly game data. Should be a JSON file or DB seed script, not a TypeScript module. |

### What's Missing for DX
| Finding | Severity | Details |
|---------|----------|---------|
| **No tests** | P1 | Zero test files. No test runner configured. The recommendation engine and API routes are highly testable. |
| **No `.env.example`** | P2 | No environment variables are used (everything is hardcoded), but if the project grows, there's no pattern to follow. |
| **No Prettier config** | P2 | No formatter configured — relies on individual developer setups. |
| **No pre-commit hooks** | P2 | No husky/lint-staged to enforce lint on commit. |
| **`catalog.ts` as a data file** | P2 | 1,091 lines of hardcoded game objects in a `.ts` file. Should be `data/catalog.json` imported at build time. |
| **No API documentation** | P2 | 4 API routes exist but none have documented request/response shapes beyond reading the code. |
| **`.gitignore` should exclude `data/*.db*`** | P1 | The SQLite database and WAL files are committed to git. These are generated on first run and should be gitignored. |

---

## 7. Recommendations by Priority

### P0 — Critical (blocks core user experience)

1. **Add mobile navigation (hamburger menu or slide drawer)**
   - File: `src/components/site-header.tsx`
   - The nav links are `hidden md:flex` with no mobile alternative. 100% of mobile users cannot navigate.
   - Recommendation: Add a client-side hamburger toggle with a slide-out drawer or overlay menu.

2. **Add visible focus indicators to all interactive elements**
   - Files: `src/components/onboarding-wizard.tsx`, `src/components/plan-selector.tsx`, all buttons
   - Multiple inputs use `outline-none` and buttons lack `focus-visible:ring-*` styles.
   - Recommendation: Add `focus-visible:ring-2 focus-visible:ring-orange-400` to all buttons and inputs. Remove `outline-none` from form fields.

3. **Add `aria-live="polite"` to all status/error message containers**
   - Files: All 4 client components
   - Success and error messages appear dynamically but aren't announced to screen readers.
   - Recommendation: Wrap message divs in `<div role="status" aria-live="polite">`.

### P1 — High (significant UX or DX improvement)

4. **Fix onboarding step labels**
   - File: `src/components/onboarding-wizard.tsx:50`
   - Change `["Rate 1-5", "Rate 6-10", "Rate 11-15", ...]` to `["Games 1–5", "Games 6–10", "Games 11–15", ...]`

5. **Add active page indicator to navigation**
   - File: `src/components/site-header.tsx`
   - Use `usePathname()` to highlight the current route link (requires making header a client component or extracting nav to a client child).

6. **Implement post-delivery feedback UI**
   - Create: `src/app/feedback/page.tsx` + `src/components/feedback-form.tsx`
   - PRD FR-08 requires 1-5 star rating + optional tags. This is a core retention mechanic.

7. **Add `role="radio"` and `aria-checked` to quiz rating buttons**
   - File: `src/components/onboarding-wizard.tsx:179-184`
   - Buttons inside `role="radiogroup"` need proper radio semantics.

8. **Add non-color cues to active rating buttons**
   - File: `src/components/onboarding-wizard.tsx:183`
   - Add a checkmark icon or bold border to selected state, not just color change.

9. **Make `CURRENT_BOX_MONTH` dynamic**
   - File: `src/lib/server-data.ts:7`
   - Replace hardcoded `"2025-03"` with `new Date().toISOString().slice(0, 7)` or similar.

10. **Add unit tests for recommendation engine**
    - File: `src/lib/recommendations.ts`
    - The scoring, constraint filtering, and radar chart builder are pure functions — ideal for testing.
    - Recommendation: Add Vitest with tests for `getRecommendations()`, `buildTasteRadar()`, `buildCollectionInsights()`.

11. **Gitignore SQLite database files**
    - File: `.gitignore`
    - Add `data/*.db`, `data/*.db-shm`, `data/*.db-wal`. These are generated on first run.

12. **Fix collection search to include mechanics**
    - File: `src/components/collection-manager.tsx:45`
    - Add `|| game.mechanics.some((m) => m.includes(normalized))` to match the placeholder promise.

13. **Add a "current plan" badge on plan cards**
    - File: `src/components/plan-selector.tsx`
    - Show a "Current plan" indicator on the card matching `currentPlan` so users know their active tier.

### P2 — Medium (polish and DX improvements)

14. **Add FAQ accordion behavior**
    - File: `src/app/page.tsx:147-154`
    - Wrap FAQ items in `<details>`/`<summary>` elements or a disclosure component.

15. **Add skip-to-content link**
    - File: `src/app/layout.tsx`
    - Add a visually hidden but focusable "Skip to main content" link before the header.

16. **Move game catalog to JSON**
    - Move `GAME_CATALOG` from `src/lib/catalog.ts` to `data/catalog.json`. Import it. Reduces the 1,091-line file to ~200 lines of constants + types.

17. **Add Prettier configuration**
    - Create: `.prettierrc` with consistent formatting rules. Align with existing code style (double quotes, trailing commas).

18. **Lazy-load Recharts**
    - File: `src/components/taste-radar-chart.tsx`
    - Use `next/dynamic` with `ssr: false` to defer the ~200KB Recharts bundle until the onboarding summary step is reached.

19. **Optimize `buildUserState()` per-page**
    - File: `src/lib/server-data.ts`
    - `getCommunitySnapshot()` calls `buildUserState()` for no reason (it doesn't use profile/recommendations). Split into lighter per-page data loaders.

20. **Add `GameCover` to past box entries**
    - File: `src/app/box/page.tsx:82-93`
    - Past boxes show text only while the current match has a rich cover. Add compact covers for visual consistency.

21. **Add demo qualifier to landing page stats**
    - File: `src/lib/server-data.ts:40-44`
    - Label stats as "demo data" or add a subtle "(mock)" suffix to avoid misleading impressions.

22. **Consider static generation for community page**
    - File: `src/app/community/page.tsx`
    - All data is hardcoded constants. Remove `force-dynamic` and let Next.js statically render.

23. **Add onboarding step validation warnings**
    - File: `src/components/onboarding-wizard.tsx`
    - Show "Rate at least X more games" before allowing continuation past quiz steps.

24. **Post-onboarding redirect**
    - File: `src/components/onboarding-wizard.tsx:131`
    - After "Finish onboarding", redirect to `/box` to see the updated recommendation.

25. **Add API route documentation**
    - Create: `docs/API.md` documenting request/response shapes for all 4 API routes.

---

## 8. Comparison to Best Practices

| Practice | Industry Standard | CrateMatch Status |
|----------|-------------------|-------------------|
| Responsive design | Mobile-first, all breakpoints tested | ❌ No mobile nav |
| Accessibility | WCAG 2.2 AA | ❌ Minimal ARIA, no focus rings, no skip link |
| Testing | Unit + integration + E2E | ❌ No tests at all |
| CI/CD | Automated lint + test + build on PR | ❌ No CI configuration |
| Error monitoring | Sentry or equivalent | ❌ Errors only visible in server logs |
| Performance monitoring | Core Web Vitals tracking | ❌ No analytics or RUM |
| Formatting | Prettier + pre-commit hooks | ❌ No formatter configured |
| API documentation | OpenAPI or at minimum markdown | ❌ Undocumented |
| State management | Client-state + server-state separation | ✅ Clean RSC + minimal client state |
| Type safety | Strict TypeScript, no `any` | ✅ Excellent |
| Visual consistency | Design tokens / component library | ✅ Consistent Tailwind theme with orange/stone palette |
| Data persistence | Proper seeding + migrations | ✅ Auto-seed with transactions, WAL mode |
| Loading/error/empty states | Comprehensive coverage | ✅ All states handled with clear messaging |

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual Design | 9/10 | Warm, premium, consistent. One of the best MVP visual identities I've seen. |
| UX Flows | 7/10 | Onboarding and collection are strong. Missing feedback, dashboard, and mobile nav. |
| Accessibility | 3/10 | Barely any ARIA, no focus management, fails WCAG AA per PRD requirements. |
| PRD Coverage | 4/10 | ~40% of Must requirements implemented. Strong on taste/recommendation track, missing operational infra. |
| Code Quality | 9/10 | Clean, typed, well-organized. Recommendation engine is well-designed. |
| Developer Experience | 7/10 | Instant setup, clean build. Missing tests, CI, and formatter. |
| Performance | 8/10 | SSR-first, minimal client JS. Minor redundant computation. |
| Polish | 8/10 | Excellent loading/error/empty states. Minor edge cases remain. |

**Overall: Strong foundation with excellent visual design and clean code. The critical gaps are mobile navigation, accessibility, and missing PRD features (auth, feedback, admin). Addressing the P0 items (mobile nav + accessibility basics) would make the biggest impact on real-world usability.**
