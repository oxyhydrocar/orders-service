import { Router } from "express";
import { pool } from "./db";

export const adminRouter = Router();

adminRouter.get("/admin/orders", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, user_id, total, status FROM orders ORDER BY id DESC LIMIT 200",
  );
  res.json({ orders: result.rows });
});

adminRouter.post("/admin/orders/:id/force-refund", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "UPDATE orders SET status = 'refunded' WHERE id = $1 RETURNING id, status, total",
    [id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "order not found" });
  }

  res.json(result.rows[0]);
});
