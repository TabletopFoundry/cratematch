---
title: Deploy CrateMatch
sidebar_position: 4
---

# Deploy CrateMatch

CrateMatch is a Next.js 16 app with a single SQLite file. That makes it cheap to host but constrains how you scale. This guide covers the realistic options.

## The SQLite constraint

`better-sqlite3` is synchronous and file-bound. That means:

- ✅ Vertical scale on a single node — fine.
- ✅ Read-heavy horizontal scale with a shared filesystem — workable for reads, dangerous for writes.
- ❌ Multiple writers across nodes — race conditions guaranteed.

For an MVP demo, a **single-instance** deployment is correct. When you outgrow it, swap `src/lib/db/` for a Postgres adapter — the rest of the app (server-data, engine, route handlers) needs no changes.

## Option 1: Single VM / container

This is the cleanest production target for the MVP.

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
VOLUME /app/data
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Run with a persistent volume so `data/cratematch.db` survives restarts:

```bash
docker build -t cratematch .
docker run -d -p 3000:3000 -v cratematch-data:/app/data --name cratematch cratematch
```

## Option 2: Fly.io, Railway, Render

All three support single-instance Node apps with persistent disk. The shape is the same:

1. Push the repo.
2. Set the build command to `npm run build`, start command to `npm run start`.
3. Mount a persistent volume at `/app/data`.
4. Set `CRATEMATCH_DB_PATH=/app/data/cratematch.db` if not using the default.
5. (Optional) Set `CRATEMATCH_ENABLE_DEMO_SEED=true` on the very first deploy to seed the demo subscriber, then unset it.

## Option 3: Vercel — not recommended

Vercel's serverless runtime is incompatible with `better-sqlite3` (no persistent filesystem). You'd need to either:

- Swap to a serverless-friendly DB (Postgres via Neon, libSQL via Turso), or
- Run on Vercel's Node runtime + external attached storage, which is non-trivial.

If you want zero-touch Vercel hosting, plan on swapping the DB layer first.

## Required environment variables

| Variable | Production value |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `CRATEMATCH_DB_PATH` | absolute path to a writable file on a persistent volume |
| `CRATEMATCH_ENABLE_DEMO_SEED` | unset (or `true` only for demo deployments) |

## Health checks

Configure your platform's health check to hit:

```
GET /api/health
```

A healthy response is `200` with `status: "healthy"` and `database.connected: true`. Anything else is failure.

## Logs and observability

There is no built-in logger. Next.js's default request log goes to stdout. For production, wrap route handlers in your platform's logging primitive, or add a thin logger module in `src/lib/`.

## Database backups

The database is a single file. Back it up like any other file:

```bash
# Inside the container
sqlite3 /app/data/cratematch.db ".backup /app/data/cratematch.backup.db"
```

Or use a sidecar that snapshots `data/cratematch.db` on a schedule to object storage.

## When to switch to Postgres

You've outgrown SQLite when one of these is true:

- You need more than one writer node (any concurrent-write scaling).
- Database file size exceeds ~10 GB.
- You need point-in-time recovery rather than file backups.
- Multiple services need to query the same data.

The migration is bounded — `src/lib/db/` is the only file that needs to change. Server data, route handlers, the engine, and the UI are untouched.
