import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/client";
import { Order, OrderItem, OrderStatus, OrderCreatedEvent } from "../types/shared";

export const ordersRouter = Router();

// ─── GET /orders/:id ──────────────────────────────────────────────────────────
ordersRouter.get("/:id", async (req: Request, res: Response) => {
  const [order] = await query<{
    id: string;
    customer_id: string;
    total_amount: string;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, customer_id, total_amount, status, created_at, updated_at
     FROM orders WHERE id = $1`,
    [req.params.id]
  );

  if (!order) return res.status(404).json({ error: "Order not found" });

  const items = await query<OrderItem>(
    `SELECT product_id as "productId", name, quantity, unit_price as "unitPrice"
     FROM order_items WHERE order_id = $1`,
    [order.id]
  );

  const response: Order = {
    id: order.id,
    customerId: order.customer_id,
    items,
    totalAmount: parseFloat(order.total_amount),  // field is totalAmount
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };

  return res.json(response);
});

// ─── POST /orders ─────────────────────────────────────────────────────────────
ordersRouter.post("/", async (req: Request, res: Response) => {
  const { customerId, items } = req.body as {
    customerId: string;
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
  };

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const orderId = uuidv4();

  await query(
    `INSERT INTO orders (id, customer_id, total_amount, status)
     VALUES ($1, $2, $3, 'AWAITING_PAYMENT')`,
    [orderId, customerId, totalAmount]
  );

  for (const item of items) {
    await query(
      `INSERT INTO order_items (order_id, product_id, name, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, item.productId, item.name, item.quantity, item.unitPrice]
    );
  }

  // Publish event — payments-service subscribes to this topic.
  // BUG SURFACE: event shape changed (userId → customerId) but payments-service
  // still destructures `event.userId`. Any event-driven payment flow is broken.
  const event: OrderCreatedEvent = {
    eventType: "order.created",
    orderId,
    customerId,        // was: userId — payments-service reads event.userId (undefined)
    totalAmount,
    items: items.map(i => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    timestamp: new Date().toISOString(),
  };

  console.log("[orders-service] event published:", JSON.stringify(event));
  // In production this would go to Kafka/SQS. For demo, we log it.

  return res.status(201).json({ orderId, status: "AWAITING_PAYMENT" });
});

// ─── PATCH /orders/:id/status ─────────────────────────────────────────────────
ordersRouter.patch("/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body as { status: OrderStatus };

  const validStatuses: OrderStatus[] = [
    "AWAITING_PAYMENT", "PAYMENT_PENDING", "PAID",
    "FULFILLING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }

  await query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`,
    [status, req.params.id]
  );

  return res.json({ orderId: req.params.id, status });
});
