---
title: Troubleshooting & FAQ
---

# Troubleshooting & FAQ

## Install fails on `better-sqlite3`

You're missing a C++ toolchain. `better-sqlite3` is a native module.

```bash
# macOS
xcode-select --install

# Debian / Ubuntu
sudo apt install -y build-essential python3

# Fedora / RHEL
sudo dnf install -y gcc-c++ make python3
```

Then `rm -rf node_modules && npm install`.

## `Error: Cannot find module './better_sqlite3.node'`

The native binding wasn't built for your Node version. Reinstall after switching Node:

```bash
nvm use 20
rm -rf node_modules package-lock.json
npm install
```

## The `/box` page shows no recommendation

Either the demo seed didn't run, or the subscriber has no completed onboarding.

Check the health endpoint:

```bash
curl -s http://localhost:3000/api/health | jq
```

If `gameCount` is `0`, the catalog wasn't seeded — see [Empty database](#empty-database).

If `gameCount` is `65` but the box is empty, the subscriber profile isn't complete. Visit `/onboarding` and finish the wizard, or set `CRATEMATCH_ENABLE_DEMO_SEED=true` and reset:

```bash
rm data/cratematch.db
CRATEMATCH_ENABLE_DEMO_SEED=true npm run dev
```

## Empty database

`/api/health` returns `gameCount: 0`. The schema was created but the catalog wasn't seeded. Most likely the seed module errored silently. Delete and try again:

```bash
rm data/cratematch.db
npm run dev
# Watch the terminal for seed errors.
```

If you see a constraint or migration error, that means the seed and the existing schema disagree. Always delete the file rather than patching the schema in place.

## "Game slug doesn't match the current recommendation"

`POST /api/box-decision` returned `409`. The client cached a slug from a stale recommendation; the server picked a different one for the current month. Refresh the `/box` page and retry. The validation is intentional — it prevents recording a decision against the wrong game.

## "Month mismatch — your session shows a different month"

Same family of error: the client posted a `monthLabel` that doesn't match the server's current month. Happens around the month boundary or if a tab has been open for weeks. Refresh.

## "Onboarding is temporarily unavailable"

`POST /api/onboarding` returned `500`. Check the dev server logs — almost always a SQLite write error. Common causes:

- Database file is read-only (check filesystem permissions).
- Database file is locked by another process (`fuser data/cratematch.db`).
- Disk is full.

## TypeScript errors after editing the catalog

You probably referenced a theme or mechanic that isn't in `ALL_THEMES` / `ALL_MECHANICS`. Add it to `src/lib/catalog/constants.ts` first, then re-run `npm run type-check`.

## The radar chart looks broken

Recharts requires React 19's strict-mode semantics. If you've added a wrapper that disables strict mode, the chart can mis-measure on first render. Re-enable strict mode in `src/app/layout.tsx`.

## `npm run dev` runs but the page is blank

Check the browser console. The most common cause is an uncaught error in a server component — the page-level error boundary (`src/app/error.tsx`) catches it, but a misconfigured `globals.css` can hide the message. Open DevTools and inspect.

---

## FAQ

### Is this a real subscription service?

No. CrateMatch is an MVP that validates the curation + explainability hypothesis. Checkout is mocked, fulfillment is mocked, and the subscriber is a single demo user.

### Can I use the recommendation engine on my own dataset?

Yes. `recommendBox()` in `src/lib/recommendations.ts` is a pure function. Swap the catalog in `src/lib/catalog/games.ts` for your own, and you can call the engine directly.

### Does it use AI / an LLM?

No. The engine is deterministic and content-based. The "reasons" in each recommendation are constructed from the engine's own overlap sets — no model, no prompt, no external API.

### Why SQLite?

Zero-setup local development and a single file for the entire demo dataset. For production scale, see [Deploy](./guides/deploy.md) on migrating to Postgres.

### Where does the game data come from?

The catalog in `src/lib/catalog/games.ts` is hand-curated to span a representative range of complexity, themes, mechanics, and price points. It is not synced from BoardGameGeek; nothing prevents you from doing so in a fork.

### Can I run two subscribers?

Not without code changes. The MVP hardcodes a single `userId` (`"demo"`). Adding multi-subscriber support is a tractable refactor — every persistence call already takes a `userId` argument.

### Is there an API client library?

No. The API surface is six route handlers; call them directly with `fetch` or `curl`. See [REST API](./reference/api.md).
