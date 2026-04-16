# CrateMatch — Second-Pass UX & DX Audit

**Date:** 2025-07-18
**Reviewer perspective:** Senior engineer, second pass after Review 1 fixes were implemented
**Scope:** Remaining UX gaps, accessibility, visual polish, responsive edge cases, error handling, regressions

---

## Executive Summary

The first review drove meaningful improvements: mobile navigation now exists (hamburger menu + drawer), active-link indicators are in place, skip-to-content was added, quiz buttons have `role="radio"` and `aria-checked`, `aria-live` regions wrap status messages, step labels are fixed ("Games 1–5" not "Rate 1-5"), collection search now matches mechanics, plan cards show a "Current plan" badge, landing plan cards have per-card CTAs, the box month is dynamic, and `.gitignore` covers SQLite files. The feedback page (FR-08) was also implemented with star ratings, tags, and comments.

However, a second careful pass reveals **remaining gaps across accessibility, responsive polish, error handling robustness, and visual consistency** that collectively prevent a WCAG 2.2 AA claim and create friction at mobile breakpoints. This review focuses exclusively on what's still missing or was introduced during the fix pass.

---

## 1. Remaining Accessibility Issues

### P0 — Critical

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| A1 | **Focus trap missing on mobile nav drawer** | `site-header.tsx:68-87` | The mobile menu opens as a DOM-appended `<nav>` but focus is not trapped inside. A keyboard user pressing Tab can move behind the open drawer into the main content. The drawer also has no `Escape` key handler to close it. WCAG 2.4.3 (Focus Order) and common modal/drawer accessibility patterns require focus trapping + Escape dismissal. |
| A2 | **Theme/mechanic toggle buttons lack accessible pressed state** | `onboarding-wizard.tsx:202-215, 224-237` | Theme and mechanic pill buttons toggle on/off but have no `aria-pressed` attribute. Screen readers announce them as plain buttons with no indication of selected state. Unlike the quiz rating buttons (which correctly use `role="radio"` + `aria-checked`), these toggles rely on color alone for state. Should use `aria-pressed={active}`. |
| A3 | **Feedback star rating has broken radio semantics at boundary** | `feedback-form.tsx:130-147` | Star buttons correctly use `role="radio"` and `aria-checked`, but the visual fill behavior (`currentRating >= star`) makes stars 1–4 appear selected when star 5 is chosen. This creates a mismatch: `aria-checked` is only true for the single selected star, but visually all lower stars are highlighted. Screen reader users get a different mental model than sighted users. Either use `aria-checked` on all visually-active stars or switch to a slider/range pattern. |

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| A4 | **Range sliders have no visible value announcement** | `onboarding-wizard.tsx:267-302` | The `<input type="range">` sliders for player count, play time, and complexity show the current value in the `<span>` label text ("Ideal player count: 4"), but there's no `aria-valuetext` on the slider itself. Screen readers will announce the raw numeric value (e.g., "4") without context like "4 players" or "90 minutes". Add `aria-valuetext` to each range. |
| A5 | **Radar chart is completely inaccessible** | `taste-radar-chart.tsx` | The Recharts radar chart is an SVG with no text alternative. The wrapping `<div>` has no `role` or `aria-label`. Screen reader users receive zero information about their taste profile visualization. Add a `role="img"` wrapper with an `aria-label` summarizing the data, or provide a visually-hidden data table. |
| A6 | **Error page "Try again" button lacks focus ring** | `error.tsx:11-15` | The error boundary reset button has no `focus-visible` ring styling, unlike every other button in the app. Copy: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400`. |
| A7 | **Not-found page "Return home" link lacks focus ring** | `not-found.tsx:10-12` | Same issue as A6 — inconsistent with the rest of the design system. |
| A8 | **`<h3>` inside `GameCover` breaks heading hierarchy** | `game-cover.tsx:52` | `GameCover` renders a `<h3>` for the game title, but it's used in contexts where the parent heading level varies (inside landing page `<section>` with `<h2>`, inside collection cards with no heading parent). This creates non-sequential heading levels. The title inside a decorative cover should be a `<span>` or `<p>`, not a heading. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| A9 | **Community unboxing posts use `<article>` without heading** | `community/page.tsx:33-49` | Each unboxing post is wrapped in `<article>` but has no `<h2>`/`<h3>` — only a bold `<div>` for the name. Articles should have a heading for landmark navigation. |
| A10 | **Loading skeleton has no accessible label** | `loading.tsx` | The skeleton placeholder has `animate-pulse` but no `aria-label="Loading"` or `role="status"`. Screen readers see empty rectangles. |

---

## 2. Responsive Design Edge Cases

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| R1 | **Mobile nav drawer doesn't close on route navigation via keyboard** | `site-header.tsx:77` | The `onClick={() => setMobileOpen(false)}` on links handles click-based navigation, but if a user navigates via keyboard (Enter on a link), the route changes but the `mobileOpen` state persists on the new page — the drawer stays open. Need a `useEffect` watching `pathname` to auto-close. |
| R2 | **Onboarding progress bar illegible below 400px** | `onboarding-wizard.tsx:153-160` | The 7-column grid (`grid-cols-7`) for step indicators becomes unreadable on narrow screens. At 320px viewport width, each label gets ~35px — step text wraps or truncates. Should collapse to a simpler "Step 3 of 7" indicator on mobile or use `overflow-x-auto`. |
| R3 | **Onboarding two-column layout stacks awkwardly on tablet** | `onboarding/page.tsx:12` | `lg:grid-cols-[0.9fr_1.1fr]` means the sidebar and wizard stack only below 1024px. On tablets (768–1023px), both columns are full-width stacked, making the sidebar info panel push the wizard far down the page — poor scanning. A `md:` breakpoint for the grid would improve tablet layout. |
| R4 | **Plan cards lose readability on small mobile** | `plan-selector.tsx:51` | `lg:grid-cols-3` means plan cards stack on all screens below 1024px. Good. But each stacked card takes ~300px height, forcing heavy scrolling on the plans page. Consider a horizontal scrollable card strip on mobile (`flex overflow-x-auto snap-x`) for quicker comparison. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| R5 | **Box page stat cards overflow on narrow viewports** | `box/page.tsx:34-47` | `sm:grid-cols-3` kicks in at 640px. Below that, all 3 stat cards are full-width and push the game cover far down. These small info nuggets would benefit from a 2-column grid at all widths: `grid-cols-2 sm:grid-cols-3`. |
| R6 | **Landing hero "5xl/6xl" heading causes text overflow on <360px** | `page.tsx:19` | `text-5xl sm:text-6xl` — at 320px the heading "A warm, premium crate matched to your shelf — not someone else's." produces a very tall text block. Consider `text-3xl sm:text-5xl lg:text-6xl` for better mobile sizing. |
| R7 | **Footer layout breaks at exactly `md` breakpoint** | `site-footer.tsx:4` | `md:flex-row md:items-center md:justify-between` switches at 768px. At exactly 768–800px the text and cutoff pill crowd each other with no gap. Add `md:gap-6` to prevent collision. |

---

## 3. Error Handling & Robustness Gaps

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| E1 | **API routes have no input sanitization** | All API `route.ts` files | No route validates string length, trims whitespace, or rejects special characters. The `name` field in onboarding accepts unlimited length strings. `comment` in feedback has no length cap. While SQLite parameterized queries prevent injection, unbounded input can cause DB bloat and UI overflow. |
| E2 | **Feedback API accepts arbitrary `rating` values** | `api/feedback/route.ts` | The check `!body.rating` passes for any truthy value (strings, objects, rating=99). The DB constraint `CHECK(rating BETWEEN 1 AND 5)` will throw a SQLite error, but that surfaces as a generic 500 to the user rather than a helpful 400 with "Rating must be 1-5". Validate on the API side before hitting the DB. |
| E3 | **Onboarding API doesn't validate numeric ranges** | `api/onboarding/route.ts` | `idealPlayerCount`, `idealPlayTime`, `complexityTarget` are `Number()` coerced but never range-checked. A user could POST `idealPlayerCount: -5` or `complexityTarget: 999`. The recommendation engine would silently produce nonsensical results. Add min/max bounds matching the UI sliders. |
| E4 | **No error differentiation in client components** | All client components | Every `catch` block shows a generic message. Network errors (offline), server errors (500), and validation errors (400) all display the same red banner. Users can't distinguish between "your input was invalid" and "the server is down." Parse the response status to show different messages. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| E5 | **`buildUserState()` still called by `getCommunitySnapshot()` indirectly** | `server-data.ts:111-121` | Review 1 noted this (item #19), and `getCommunitySnapshot()` was cleaned to not call `buildUserState()` — good. However, `getPlansSnapshot()` (line 65) still calls `buildUserState()` which runs the full recommendation engine just to get the profile. It only uses `profile` from the result. Should call `getUserProfile()` directly. |
| E6 | **`getBoxSnapshot()` silently returns stale `decision` for non-existent months** | `server-data.ts:84` | `getDecision(getCurrentBoxMonthValue())` returns `"undecided"` for any month that has no decision row. If the app is accessed on the 1st of a new month, the decision from the previous month is lost and the new month shows "undecided" with no indication that last month's choice was recorded. |
| E7 | **Single global `pending` state across multiple feedback forms** | `feedback-form.tsx:29` | One `useTransition` controls `pending` for all feedback forms on the page. Submitting feedback for one box disables all submit buttons. Should be per-box pending state. |

---

## 4. Visual Polish & Consistency

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| V1 | **FAQ still not collapsible** | `page.tsx:153-160` | Review 1 flagged this as P2 (item #14). The FAQ section still renders all answers fully expanded. With 4+ items this creates a ~600px scroll zone. Using `<details>`/`<summary>` is a one-line-per-item fix that's native, accessible, and requires zero JS. |
| V2 | **Stats on landing page still lack "demo" qualifier** | `server-data.ts:43-46` | Review 1 flagged this (item #21). The stats "3,240 subscribers", "94% satisfaction", and "11,802 duplicate catches" are still presented as real metrics with no "(demo)" or "(mock)" label. The checkout section correctly labels itself as mock — stats should be consistent. |
| V3 | **Past boxes on `/box` still lack game cover art** | `box/page.tsx:81-93` | Review 1 flagged this (item #20). Past box entries remain text-only while the current match has a rich `GameCover`. Adding a compact `GameCover` would create visual consistency. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| V4 | **Inconsistent border-radius across card types** | Multiple files | Cards use `rounded-[2rem]`, `rounded-[1.75rem]`, `rounded-[1.5rem]`, `rounded-3xl`, `rounded-2xl`, and `rounded-xl` across different components with no clear hierarchy. A design token or consistent rule (e.g., outer cards = `2rem`, inner cards = `1.5rem`, buttons = `full`) would reduce visual noise. |
| V5 | **Community page likes are still non-interactive** | `community/page.tsx:46` | `❤ {post.likes}` is plain text. Adding a `cursor-default` or muting the heart emoji color would signal non-interactivity. Currently the heart emoji invites clicking. |
| V6 | **Onboarding "Finish onboarding" doesn't redirect** | `onboarding-wizard.tsx:129-136` | Review 1 recommended (item #24) a post-onboarding redirect to `/box`. The current implementation shows a success message but stays on the onboarding page. The user must manually navigate to see their recommendation. |
| V7 | **No empty state for alternatives on `/box` when recommendations are sparse** | `box/page.tsx:97-111` | If the recommendation engine returns fewer than 4 results (e.g., heavy collection overlap + tight constraints), the "Backup matches" section renders an empty `<div>`. No message like "No backup matches available with current constraints." |

---

## 5. DX & Code Quality Gaps (Post-Fix)

### P1 — High

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| D1 | **Still no tests** | — | Review 1's #10 recommendation for Vitest + recommendation engine tests was not implemented. The recommendation engine (`recommendations.ts`) has pure functions ideal for unit testing. The 5 API routes are ideal for integration tests. This remains the single biggest DX gap. |
| D2 | **Still no CI configuration** | — | No GitHub Actions, no `.github/workflows/`. Lint + build + (future) test should run on every push. A basic CI workflow is <20 lines of YAML. |
| D3 | **`catalog.ts` still a 1000+ line TypeScript module** | `lib/catalog.ts` | Review 1 recommended moving game data to `data/catalog.json` (item #16). The file remains a giant TS module. This inflates IDE indexing time, makes data edits error-prone, and prevents non-developers from updating the catalog. |

### P2 — Medium

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| D4 | **`force-dynamic` on community page** | `community/page.tsx:4` | Review 1 noted this (item #22). The community page uses only hardcoded constants but is still `force-dynamic`. Removing it would allow static generation, improving TTFB. |
| D5 | **No Prettier or pre-commit hooks** | — | Review 1 items #17 and #18. No `.prettierrc`, no husky/lint-staged. Multi-developer contributions will produce formatting inconsistency. |
| D6 | **No API documentation** | — | Review 1 item #25. The 5 API routes (onboarding, checkout, collection, box-decision, feedback) have no documented request/response shapes. |

---

## 6. Regressions Introduced by Fix Pass

| # | Finding | File(s) | Details |
|---|---------|---------|---------|
| REG1 | **Mobile nav adds client-side state to every page** | `site-header.tsx:2,18` | The header was previously a server component. Adding the hamburger menu required `"use client"`, `useState`, and `usePathname`. This pulls React's client runtime into the header on every page. The actual impact is small (Next.js would hydrate the page anyway for other client components), but if the header were extracted into a thin `MobileNavToggle` client component with the rest remaining as server-rendered, bundle size would be marginally better. Low priority but worth noting. |
| REG2 | **Feedback form tag pills don't match quiz rating button a11y pattern** | `feedback-form.tsx:153-169` | Quiz rating buttons were fixed to use `role="radio"` + `aria-checked`. But the nearly identical feedback tag pills don't use `aria-pressed`. This creates an inconsistency — same visual toggle pattern, different accessibility treatment. Should use `aria-pressed` on tag buttons. |
| REG3 | **New feedback page has no page-specific `<meta>` description** | `feedback/page.tsx` | The page uses the global metadata from `layout.tsx`. Other pages are the same (none export custom metadata), but the feedback page was newly added and missed the opportunity to set page-level `<title>` for better browser tab identification: "Rate Your Crates — CrateMatch". |

---

## 7. Consolidated Recommendations by Priority

### P0 — Fix immediately

1. **A1 — Focus trap + Escape handler for mobile nav drawer.** Without this, keyboard-only users cannot reliably use the mobile experience. Implement a `useFocusTrap` hook or use `@headlessui/react`'s `Dialog` component.

2. **A2 — Add `aria-pressed` to theme/mechanic toggle buttons.** One-line fix per button: `aria-pressed={active}`. Fixes the largest remaining "color-only state" gap.

3. **A3 — Fix star rating aria/visual mismatch.** Either mark all visually-filled stars with `aria-checked` (changing semantics to a filled-bar model) or use a single `aria-valuenow` on a container `role="slider"`.

### P1 — Fix within the sprint

4. **R1 — Auto-close mobile drawer on route change** via `useEffect` on `pathname`.
5. **R2 — Collapse progress bar to "Step X of 7" on small screens** with a `sm:grid-cols-7` and single-line fallback.
6. **A4 — Add `aria-valuetext` to range sliders** (e.g., `aria-valuetext={`${idealPlayerCount} players`}`).
7. **A5 — Add accessible summary for radar chart** (`role="img"` + `aria-label`).
8. **A6/A7 — Add focus rings to error page and 404 page buttons.**
9. **E1/E2/E3 — Add input validation bounds** in API routes: string length limits, numeric range checks, explicit 400 responses.
10. **E4 — Differentiate error types in client UI** (network vs. validation vs. server).
11. **E7 — Per-box pending state in feedback form** (use a `pendingBoxMonth` state instead of global transition).
12. **V1 — Convert FAQ to `<details>`/`<summary>`** — native, accessible, zero JS.
13. **V6 — Add post-onboarding redirect to `/box`** via `router.push("/box")` after successful persist.
14. **D1 — Add Vitest + initial test suite** for `getRecommendations()`, `buildTasteRadar()`, and `buildCollectionInsights()`.

### P2 — Polish pass

15. **A8 — Change `<h3>` in `GameCover` to `<span>`** to fix heading hierarchy.
16. **A9 — Add heading to community `<article>` elements.**
17. **A10 — Add `role="status" aria-label="Loading content"` to loading skeleton.**
18. **R5 — Use `grid-cols-2 sm:grid-cols-3` for box stat cards.**
19. **R6 — Scale hero heading down for mobile** (`text-3xl sm:text-5xl lg:text-6xl`).
20. **R7 — Add `md:gap-6` to footer flex container.**
21. **V2 — Add "(demo)" label to landing page stats.**
22. **V3 — Add compact `GameCover` to past box entries.**
23. **V4 — Standardize border-radius tokens** across card hierarchy.
24. **V7 — Add empty state message for sparse backup matches.**
25. **E5 — Optimize `getPlansSnapshot()`** to call `getUserProfile()` directly.
26. **D2 — Add GitHub Actions CI** (lint + build).
27. **D3 — Move `GAME_CATALOG` to `data/catalog.json`.**
28. **D4 — Remove `force-dynamic` from community page.**
29. **D5 — Add Prettier + lint-staged.**
30. **D6 — Create `docs/API.md` for route documentation.**
31. **REG2 — Add `aria-pressed` to feedback tag pills** for consistency with quiz buttons.
32. **REG3 — Add per-page `<title>` metadata** via `export const metadata` on each route page.

---

## 8. What Review 1 Fixed (Verified) ✅

| Review 1 Item | Status | Evidence |
|---------------|--------|----------|
| P0: Mobile navigation | ✅ Fixed | `site-header.tsx:49-87` — hamburger button + slide drawer |
| P0: Focus ring styles | ✅ Fixed | All buttons have `focus-visible:ring-2 focus-visible:ring-orange-400` |
| P0: `aria-live` on status messages | ✅ Fixed | All 5 client components wrap messages in `<div role="status" aria-live="polite">` |
| P1: Step labels | ✅ Fixed | `onboarding-wizard.tsx:50` — "Games 1–5" etc. |
| P1: Active nav indicator | ✅ Fixed | `site-header.tsx:35,41` — `aria-current="page"` + visual border/color |
| P1: `role="radio"` + `aria-checked` on quiz buttons | ✅ Fixed | `onboarding-wizard.tsx:182-183` |
| P1: Non-color cue on rating buttons | ✅ Fixed | `onboarding-wizard.tsx:187` — checkmark "✓" prefix |
| P1: Dynamic `CURRENT_BOX_MONTH` | ✅ Fixed | `server-data.ts:6-9` — derives from `new Date()` |
| P1: Collection search includes mechanics | ✅ Fixed | `collection-manager.tsx:45` |
| P1: "Current plan" badge on plan cards | ✅ Fixed | `plan-selector.tsx:65-67` |
| P1: Implement feedback page (FR-08) | ✅ Fixed | `feedback/page.tsx` + `feedback-form.tsx` — full 1-5 star rating, tags, comments |
| P1: `.gitignore` SQLite files | ✅ Fixed | `.gitignore:3-5` |
| P1: Landing plan cards need CTA | ✅ Fixed | `page.tsx:121-127` — "Select {plan.name}" button |
| P2: Skip-to-content link | ✅ Fixed | `layout.tsx:33-38` — visually hidden, focusable |

---

## Updated Scorecard (Post-Review 1 Fixes)

| Dimension | Review 1 | Review 2 | Delta | Notes |
|-----------|----------|----------|-------|-------|
| Visual Design | 9/10 | 9/10 | — | Still excellent. Minor polish items remain (FAQ, past box covers). |
| UX Flows | 7/10 | 8/10 | +1 | Feedback page adds a key retention flow. Post-onboarding redirect still missing. |
| Accessibility | 3/10 | 5/10 | +2 | Major fixes landed (ARIA, focus rings, skip link). Focus trap, toggle states, chart a11y still needed. |
| PRD Coverage | 4/10 | 5/10 | +1 | Feedback (FR-08) now implemented. Auth, admin, fulfillment still absent. |
| Code Quality | 9/10 | 9/10 | — | Unchanged. Clean, typed, well-organized. |
| Developer Experience | 7/10 | 7/10 | — | No tests or CI added yet. These remain the biggest DX gaps. |
| Performance | 8/10 | 8/10 | — | `getPlansSnapshot` still runs full recommendation engine unnecessarily. |
| Polish | 8/10 | 8.5/10 | +0.5 | FAQ, past box covers, and demo label remain unfixed. |

**Overall: The first review's P0 and most P1 items were successfully addressed. The remaining work is primarily in accessibility refinement (focus trapping, toggle states, chart accessibility), responsive edge cases at narrow viewports, API input validation, and DX infrastructure (tests, CI). Completing the P0 items in this review would bring accessibility to a solid ~7/10.**
