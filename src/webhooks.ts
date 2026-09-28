import { Router } from "express";
import { pool } from "./db";

export const webhooksRouter = Router();

// payments-service calls this once a charge settles.
webhooksRouter.post("/webhooks/payment-confirmed", async (req, res) => {
  const { orderId, paymentId } = req.body as { orderId?: string; paymentId?: string };

  if (!orderId || !paymentId) {
    return res.status(400).json({ error: "orderId and paymentId are required" });
  }

  await pool.query(
    "UPDATE orders SET status = 'paid' WHERE id = $1",
    [orderId],
  );

  res.status(200).json({ received: true });
});
