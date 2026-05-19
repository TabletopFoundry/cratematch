---
title: REST API
sidebar_position: 1
---

# REST API

All mutation endpoints live under `/api/`. Every route is `runtime = "nodejs"` because the SQLite layer requires native bindings.

Errors always return JSON with an `error` field and a `4xx` or `5xx` status. Successful responses return either `{ ok: true }` (mutations) or domain JSON (queries).

## `POST /api/onboarding`

Persists a complete taste profile. Called once at the end of the wizard.

**Request body**

```json
{
  "name": "Alex Rivera",
  "planId": "explorer",
  "idealPlayerCount": 3,
  "idealPlayTime": 75,
  "complexityTarget": 3.0,
  "themes": ["nature", "fantasy", "economics"],
  "mechanics": ["engine-building", "deck-building", "co-operative"],
  "answers": [
    { "gameSlug": "wingspan", "rating": "loved" },
    { "gameSlug": "catan", "rating": "neutral" }
  ]
}
```

**Validation**

| Field | Rule |
|-------|------|
| `name` | required, 1–100 chars |
| `planId` | required, one of `discovery`, `explorer`, `collector` |
| `idealPlayerCount` | integer 1–8 |
| `idealPlayTime` | integer 15–360 minutes |
| `complexityTarget` | number 1.0–5.0 |
| `themes` | array of strings, max 20 entries, each ≤ 50 chars |
| `mechanics` | array of strings, max 20 entries, each ≤ 50 chars |
| `answers` | array of `{ gameSlug, rating }`, gameSlug must exist in catalog |

**Responses**

- `200 { "ok": true }` on success.
- `400 { "error": "..." }` on validation failure.
- `500 { "error": "Onboarding is temporarily unavailable." }` on persistence failure.

## `POST /api/checkout`

Persists a plan selection. Mock checkout — no payment.

**Request body**

```json
{ "planId": "collector" }
```

**Responses**

- `200 { "ok": true }`
- `400 { "error": "Select a valid subscription tier." }`

## `POST /api/box-decision`

Records the subscriber's decision on the current month's box.

**Request body**

```json
{
  "gameSlug": "wingspan",
  "decision": "keep",
  "monthLabel": "2025-01"
}
```

**Validation**

- `gameSlug` must match the server's current recommendation for the month.
- `decision` must be `keep`, `return`, or `undecided`.
- `monthLabel` must match `^\d{4}-\d{2}$` and equal the server's current box month.

**Responses**

- `200 { "ok": true }`
- `400` on validation failure.
- `409` on `monthLabel` or `gameSlug` mismatch with server state — refresh and retry.

## `POST /api/collection`

Adds a game to the subscriber's collection.

```json
{ "gameSlug": "everdell" }
```

`gameSlug` must exist in the catalog. Adding a game already present is a no-op.

## `DELETE /api/collection`

Removes a game from the collection. Same body shape as `POST`.

## `POST /api/feedback`

Records post-delivery feedback.

**Request body**

```json
{
  "boxMonth": "2024-12",
  "gameSlug": "ark-nova",
  "rating": 4,
  "tags": ["heavier-than-expected", "great-theme"],
  "comment": "Loved the zoo theme, but it was a long evening."
}
```

**Validation**

| Field | Rule |
|-------|------|
| `boxMonth` | `YYYY-MM` |
| `gameSlug` | required, ≤ 100 chars |
| `rating` | integer 1–5 |
| `tags` | array of strings, ≤ 20 entries, each ≤ 50 chars |
| `comment` | string, ≤ 2000 chars |

**Responses**

- `200 { "ok": true }`
- `400` on validation failure.

## `GET /api/health`

Health probe. No body.

**Response**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:23:00.000Z",
  "version": "0.1.0",
  "database": { "connected": true, "gameCount": 65 }
}
```

Returns `503 { "status": "unhealthy" }` if the database is unreachable.

## Calling the API from outside the app

There is no authentication. The API assumes single-subscriber MVP usage. To call from `curl`:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "content-type: application/json" \
  -d '{"planId":"explorer"}'
```

For production, add auth in front of every route handler before exposing the app to the internet.
