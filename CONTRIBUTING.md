# Contributing to CrateMatch

Thank you for your interest in contributing to CrateMatch! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A code editor with TypeScript and Tailwind CSS support (VS Code recommended)

### Getting Started

```bash
# 1. Fork and clone the repository
git clone <your-fork-url>
cd cratematch

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Verify the lint passes
npm run lint

# 5. Verify the build succeeds
npm run build
```

The app auto-seeds a SQLite database with 65 board games on first run. Delete `data/cratematch.db` to reset.

---

## Code Style

### TypeScript

- **Strict mode is enabled** — do not use `any` types.
- Use interfaces for domain objects (see `src/lib/types.ts` for examples).
- Prefer `const` assertions and union types over enums.
- Use path aliases: `@/components/...`, `@/lib/...`.

### React & Next.js

- Use the App Router pattern — pages go in `src/app/`, components in `src/components/`.
- Mark client components with `"use client"` only when they need browser APIs or interactivity.
- Server components should fetch data directly (no `useEffect` for data loading).
- Handle loading, error, and empty states for every page.

### CSS

- Use **Tailwind CSS utility classes** exclusively — no custom CSS except in `globals.css`.
- Follow the existing design system: `orange-*` accent palette, `stone-*` neutrals, `rounded-[2rem]` cards.

### File Naming

- Use **kebab-case** for all files: `taste-radar-chart.tsx`, `server-data.ts`.
- Page components: `page.tsx` inside the route directory.
- API routes: `route.ts` inside `src/app/api/<endpoint>/`.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add feedback tag autocomplete
fix: prevent duplicate collection entries
docs: update API route documentation
refactor: extract radar chart data builder
```

---

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** and verify:
   ```bash
   npm run lint    # Must pass with no errors
   npm run build   # Must succeed
   ```

3. **Write a clear PR description** explaining:
   - What changed and why
   - How to test the change
   - Screenshots for UI changes

4. **Keep PRs focused** — one feature or fix per PR.

---

## Project Architecture

```
src/lib/          → Business logic (recommendations, data orchestration)
src/lib/db/       → Database layer (SQLite queries, connection management)
src/lib/catalog/  → Static data (game catalog, plans, content)
src/components/   → Reusable UI components
src/app/          → Next.js pages and API routes
```

Key patterns:
- **Server data functions** (`src/lib/server-data.ts`) orchestrate data fetching for pages.
- **API routes** handle mutations (POST/DELETE) with input validation.
- **Client components** manage local UI state and call API routes for persistence.

---

## Need Help?

- Check existing [docs/](./docs/) for PRD, code reviews, and UX audits.
- Open an issue to discuss larger changes before implementing.
