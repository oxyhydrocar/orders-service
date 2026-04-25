-- orders-service database schema
-- This schema is the source of truth. payments-service connects to the same DB.
--
-- Migration history:
--   V1  (2024-08-01): initial schema
--   V2  (2024-12-01): renamed column users.user_id → orders.customer_id
--                     payments-service was NOT updated; it still queries user_id.
--   V3  (2025-02-10): renamed column orders.total → orders.total_amount
--                     storefront API client was NOT updated; reads `order.total`.
--   V4  (2025-01-15): expanded order_status enum (see status column)

CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Renamed from user_id in migration V2. payments-service still uses user_id.
  customer_id   UUID NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL,  -- Renamed from `total` in migration V3
  status        TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
    -- Valid values: AWAITING_PAYMENT | PAYMENT_PENDING | PAID | FULFILLING
    --               SHIPPED | DELIVERED | CANCELLED | REFUNDED
    -- ⚠️  payments-service checks: status = 'pending_payment' (stale, never matches)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL,
  name        TEXT NOT NULL,
  quantity    INT  NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);

-- Sample seed data (for local development)
INSERT INTO orders (id, customer_id, total_amount, status)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001',
   'u1000000-0000-0000-0000-000000000001',
   149.99, 'PAYMENT_PENDING'),
  ('a1b2c3d4-0000-0000-0000-000000000002',
   'u1000000-0000-0000-0000-000000000002',
   49.00,  'AWAITING_PAYMENT')
ON CONFLICT DO NOTHING;
