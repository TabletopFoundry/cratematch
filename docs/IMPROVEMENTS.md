# CrateMatch — Improvement Plan

> Actionable recommendations to elevate CrateMatch from working MVP to top-tier GitHub project.  
> Generated from a comprehensive audit of code, docs, tooling, and developer experience.

---

## Executive Summary

CrateMatch is a well-structured Next.js 16 MVP with strong TypeScript usage, good domain modeling, and polished UI. The five highest-impact improvements are:

1. **README overhaul** — The current README is functional but doesn't showcase what makes CrateMatch special. A richer README with badges, architecture overview, screenshots section, and contributing guide would dramatically improve first impressions.
2. **Fix lint errors** — Two ESLint errors and one warning block clean CI runs. These are trivial to fix and unblock a green status badge.
3. **Add `.editorconfig` and stricter tooling** — Ensures consistent formatting across contributors and IDEs.
4. **Add `CONTRIBUTING.md`** — Even for personal projects, this signals professionalism and lowers the barrier to collaboration.
5. **Improve metadata and SEO** — Per-page metadata, Open Graph tags, and a proper favicon setup make the app more shareable and professional.

---

## Current State Assessment

| Dimension              | Score (1-10) | Key Gap                                                       |
|------------------------|:------------:|---------------------------------------------------------------|
| Language Modernity     | 8            | Modern stack (Next.js 16, React 19, TS 5); target could be ES2022+ |
| Tooling & CI/CD        | 4            | No CI pipeline, no pre-commit hooks, no formatter configured  |
| Type Safety            | 8            | Strict mode on; minor `Record<string, unknown>` casting in DB layer |
| Documentation          | 5            | Good PRD and reviews in `/docs`, but README is thin; no CONTRIBUTING, no architecture doc |
| Security Posture       | 3            | No SECURITY.md, no dependency scanning, API validation is decent but ad hoc |
| Community Health       | 2            | No issue templates, no PR template, no CODEOWNERS             |
| Discoverability        | 3            | No badges, no social preview, no topic tags                   |

---

## Implemented Improvements

The following changes were made directly to the codebase:

### 1. ✅ README Overhaul
- Added badges (build, license, Node version, TypeScript)
- Added clear value proposition and feature highlights
- Added architecture overview section
- Added screenshot placeholder section
- Added detailed development setup with prerequisites
- Added project structure documentation
- Added tech stack details with version info
- Added contributing section with link to CONTRIBUTING.md
- Added license section

### 2. ✅ Lint Error Fixes
- **`src/app/feedback/page.tsx`**: Removed unused `profile` variable; escaped apostrophe with `&apos;`
- **`src/components/site-header.tsx`**: Replaced `useEffect` + `setState` anti-pattern with `useRef` to track previous pathname, avoiding cascading renders

### 3. ✅ `.editorconfig` Added
- Consistent indentation (2 spaces for JS/TS/JSON/CSS/MD)
- UTF-8 encoding, LF line endings, final newline
- Trim trailing whitespace

### 4. ✅ `CONTRIBUTING.md` Added
- Zero-to-first-PR guide
- Development setup instructions
- Code style guidelines
- Commit message conventions
- PR process documentation

### 5. ✅ Enhanced Metadata
- **`src/app/layout.tsx`**: Added Open Graph metadata, theme color, and viewport meta for better social sharing and mobile experience

### 6. ✅ TypeScript Config Tightened
- Bumped target from `ES2017` to `ES2022` to enable modern JS features
- Added `noUncheckedIndexedAccess` for safer array/object access
- Added `forceConsistentCasingInFileNames` to prevent cross-platform bugs

### 7. ✅ Next.js Config Enhanced
- Added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Added `poweredByHeader: false` to reduce fingerprinting

---

## Remaining Recommendations

### Quick Wins (< 1 day each)

#### Add GitHub Actions CI
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

#### Add Prettier
```bash
npm install -D prettier eslint-config-prettier
```
Add `.prettierrc`:
```json
{ "semi": true, "singleQuote": false, "trailingComma": "es5", "printWidth": 120 }
```

#### Add Issue & PR Templates
Create `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/pull_request_template.md` with standard checklists.

### Medium Effort (1 day – 1 week)

#### Add Testing Infrastructure
- Install Vitest + React Testing Library
- Write unit tests for `src/lib/recommendations.ts` (pure functions, high value)
- Write API route tests for validation edge cases
- Target: 70%+ coverage on `src/lib/`

#### Add Zod for API Validation
Replace ad hoc `typeof` checks in API routes with Zod schemas for type-safe runtime validation. This removes ~40% of boilerplate validation code and produces better error messages.

#### Improve Database Layer Type Safety
Replace `Record<string, unknown>` casting in `src/lib/db/queries.ts` with typed row interfaces matching the SQLite schema. This eliminates fragile `String()` / `Number()` coercions.

### Strategic Investments (> 1 week)

#### Extract Game Catalog to JSON
Move the 849-line `src/lib/catalog/games.ts` to a `data/games.json` file. This makes the data easier to review, diff, and edit without touching TypeScript. Load and validate with Zod at startup.

#### Add E2E Tests with Playwright
Cover the critical user flows: landing → onboarding → plan selection → box reveal → feedback.

#### Accessibility Audit
- Add screen-reader-friendly alternatives for the radar chart
- Ensure toggle/rating components have proper ARIA roles
- Add automated a11y testing with axe-core in CI

---

## GitHub Project Health Checklist

```
Repository Basics:
[x] Descriptive README with quick start
[ ] LICENSE file
[x] CONTRIBUTING.md
[ ] Issue templates
[ ] PR template
[ ] CODEOWNERS

Automation:
[ ] CI running on PRs
[x] Linting configured
[ ] Automated testing
[ ] Dependency updates (Dependabot)
[ ] Release automation
[ ] Security scanning

Documentation:
[x] PRD document
[x] Code review document
[x] UX review documents
[ ] API docs
[ ] Architecture decision records (ADRs)
[x] Changelog (via git history)

Community:
[ ] Good first issues labeled
[ ] Discussion forum or chat
[ ] Social preview image
[ ] Appropriate topic tags

Code Quality:
[x] TypeScript strict mode
[x] ESLint configured
[x] EditorConfig
[ ] Prettier configured
[ ] Pre-commit hooks (husky + lint-staged)
[ ] Unit tests
[ ] E2E tests
```

---

## 90-Day Roadmap

### Days 1–7: Foundation ✅ (Partially Complete)
- [x] README overhaul
- [x] Fix lint errors
- [x] Add `.editorconfig`
- [x] Add `CONTRIBUTING.md`
- [x] Tighten TypeScript config
- [x] Add security headers
- [ ] Add LICENSE file (MIT recommended)
- [ ] Add GitHub Actions CI

### Days 8–30: Core Improvements
- [ ] Add Prettier + pre-commit hooks
- [ ] Install Vitest, write tests for `recommendations.ts`
- [ ] Add Zod for API validation
- [ ] Type the DB layer properly (remove `Record<string, unknown>`)
- [ ] Add issue/PR templates
- [ ] Add Dependabot configuration

### Days 31–60: Polish & Documentation
- [ ] Extract game catalog to JSON
- [ ] Add architecture decision records
- [ ] Add API documentation
- [ ] Add Playwright E2E tests
- [ ] Accessibility audit + fixes
- [ ] Add social preview image

### Days 61–90: Community & Growth
- [ ] Label good-first-issues
- [ ] Add GitHub Discussions
- [ ] Performance audit (Lighthouse CI)
- [ ] Add CODEOWNERS
- [ ] Benchmark recommendation algorithm
- [ ] Consider deployment (Vercel/Railway)
