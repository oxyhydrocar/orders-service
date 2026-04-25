CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
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

INSERT INTO orders (id, customer_id, total_amount, status)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001',
   'u1000000-0000-0000-0000-000000000001',
   149.99, 'PAYMENT_PENDING'),
  ('a1b2c3d4-0000-0000-0000-000000000002',
   'u1000000-0000-0000-0000-000000000002',
   49.00,  'AWAITING_PAYMENT')
ON CONFLICT DO NOTHING;
