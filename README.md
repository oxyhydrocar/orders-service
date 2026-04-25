# orders-service

Manages order lifecycle for the Oxyhydrocar e-commerce platform.

## Related Services

- **payments-service** — processes payments for orders in this service's database
- **storefront** — frontend that creates and displays orders via this API

## API

```
GET  /orders/:id
POST /orders              body: { customerId, items[] }
PATCH /orders/:id/status  body: { status: OrderStatus }
```

## Events

Publishes to the `orders` topic:
- `order.created` — emitted after a new order is saved
- `order.status_changed` — emitted on every status transition

`payments-service` subscribes to both events.

## Database

PostgreSQL. Schema is in `src/db/schema.sql`.

`payments-service` connects to the same database instance.

## Running locally

```bash
cp .env.example .env
npm install
psql $DATABASE_URL -f src/db/schema.sql
npm run dev
```
