# orders-service

Manages order lifecycle for the Oxyhydrocar e-commerce platform.

## Connected Services

| Service | How it connects | Risk |
|---|---|---|
| **payments-service** | Reads directly from the same PostgreSQL database (`orders` table) | Schema changes here can silently break payments |
| **payments-service** | Subscribes to `order.created` / `order.status_changed` events | Event payload changes here break payment event handlers |
| **storefront** | Calls `GET /orders/:id`, `POST /orders` | Response shape changes here break the UI |

## Known Cross-Repo Drift (open bugs)

> These bugs pass all unit tests in every repo. They only appear in integration.

| # | What changed here | What wasn't updated | Symptom |
|---|---|---|---|
| [#12](../../issues/12) | `status` enum: `"pending"` → `"PAYMENT_PENDING"` | `payments-service` still checks `status === 'pending_payment'` | **Payments never process** — orders stuck forever |
| [#13](../../issues/13) | Field renamed: `total` → `totalAmount` | `storefront` reads `order.total` | **Checkout total always shows `undefined`** |
| [#14](../../issues/14) | Field renamed: `userId` → `customerId` (DB + events) | `payments-service` reads `event.userId` | **Payment events silently drop customer ID** |

## API

```
GET  /orders/:id          → Order
POST /orders              body: { customerId, items[] }
PATCH /orders/:id/status  body: { status: OrderStatus }
```

## Running locally

```bash
cp .env.example .env
npm install
psql $DATABASE_URL -f src/db/schema.sql
npm run dev
```
