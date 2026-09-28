import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "./db";

export const ordersRouter = Router();

interface OrderItem {
  sku: string;
  price: number;
  quantity: number;
}

ordersRouter.post("/orders", async (req, res) => {
  const { userId, items } = req.body as { userId?: string; items?: OrderItem[] };

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "userId and items are required" });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = uuidv4();

  await pool.query(
    "INSERT INTO orders (id, user_id, items, total, status) VALUES ($1, $2, $3, $4, 'pending')",
    [id, userId, JSON.stringify(items), total],
  );

  res.status(201).json({ id, status: "pending", total });
});

ordersRouter.get("/orders", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 100);
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;

  const result = await pool.query(
    "SELECT id, user_id, total, status FROM orders ORDER BY id LIMIT $1 OFFSET $2",
    [limit, offset],
  );

  res.json({ orders: result.rows, limit, offset });
});

ordersRouter.get("/orders/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT id, user_id, items, total, status FROM orders WHERE id = $1",
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "order not found" });
  }

  res.json(result.rows[0]);
});

ordersRouter.patch("/orders/:id/cancel", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending' RETURNING id, status",
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "order not found or not cancellable" });
  }

  res.json(result.rows[0]);
});

ordersRouter.post("/orders/:id/refund", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body as { amount?: number };

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "a positive refund amount is required" });
  }

  const result = await pool.query(
    "UPDATE orders SET status = 'refunded' WHERE id = $1 RETURNING id, status, total",
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "order not found" });
  }

  res.json({ id: result.rows[0].id, status: result.rows[0].status, refunded: amount });
});
