---
title: Installation
sidebar_position: 2
---

# Installation

A deeper look at what `npm install` and `npm run dev` actually do, plus environment knobs and platform notes.

## System requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 20.x | 20 LTS or 22 LTS |
| npm | 10.x | 10.x |
| Disk | 500 MB | 1 GB |
| Memory | 1 GB | 2 GB |

CrateMatch targets Node 20+ because Next.js 16 and `better-sqlite3` 11 both require it.

## Native build prerequisites

`better-sqlite3` is a native module. Each platform needs a C++ toolchain:

```bash
# macOS
xcode-select --install

# Debian / Ubuntu
sudo apt install -y build-essential python3

# Fedora / RHEL
sudo dnf install -y gcc-c++ make python3

# Windows (PowerShell, admin)
npm install --global windows-build-tools
```

If `npm install` fails with `node-gyp` errors, this is the first thing to check.

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `CRATEMATCH_ENABLE_DEMO_SEED` | `true` in dev, unset in prod | When `true`, seeds the demo subscriber + 8 months of history. Leave unset in production to keep a blank profile so onboarding can run safely. |
| `CRATEMATCH_DB_PATH` | `./data/cratematch.db` | Override the SQLite file location. Useful for Docker volumes or read-only filesystems. |

Variables not in the table do not affect CrateMatch.

## Production build

```bash
npm run build
npm run start
```

`npm run build` runs the Next.js production compile (App Router, server components, route handlers). `npm run start` serves the built output on port 3000.

For a single command that runs type checking, linting, and the build:

```bash
npm run check-all
```

Use this in CI.

## File locations

| Path | Purpose |
|------|---------|
| `data/cratematch.db` | SQLite database (gitignored, auto-created) |
| `src/app/` | Next.js App Router pages and API routes |
| `src/lib/` | Recommendation engine, server data orchestration, types |
| `src/components/` | Reusable UI components |
| `public/` | Static assets |

## Verifying the install

After `npm run dev`, hit the health endpoint:

```bash
curl -s http://localhost:3000/api/health | jq
```

A healthy install returns `status: "healthy"` and `gameCount: 65`.

## Next steps

- [Get your first recommendation →](./first-recommendation.md)
- [Understand the architecture →](../concepts/architecture.md)
