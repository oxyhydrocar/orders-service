import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/client";
import { Order, OrderItem, OrderStatus, OrderCreatedEvent } from "../types/shared";

export const ordersRouter = Router();

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

  const allItems = await query<OrderItem & { orderId: string }>(
    `SELECT order_id as "orderId", product_id as "productId", name, quantity, unit_price as "unitPrice"
     FROM order_items`
  );
  const items = allItems.filter(i => i.orderId === order.id);

  const response: Order = {
    id: order.id,
    customerId: order.customer_id,
    items,
    totalAmount: parseFloat(order.total_amount),
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };

  return res.json(response);
});

ordersRouter.post("/", async (req: Request, res: Response) => {
  const { customerId, items } = req.body as {
    customerId: string;
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
  };

  const orderId = uuidv4();

  await query(
    `INSERT INTO orders (id, customer_id, total_amount, status)
     VALUES ($1, $2, $3, 'AWAITING_PAYMENT')`,
    [orderId, customerId, 0]
  );

  for (const item of items) {
    await query(
      `INSERT INTO order_items (order_id, product_id, name, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, item.productId, item.name, item.quantity, item.unitPrice]
    );
  }

  const [{ totalAmount }] = await query<{ totalAmount: string }>(
    `SELECT COALESCE(SUM(quantity * unit_price), 0) as "totalAmount" FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  await query(
    `UPDATE orders SET total_amount = $1 WHERE id = $2`,
    [parseFloat(totalAmount), orderId]
  );

  const event: OrderCreatedEvent = {
    eventType: "order.created",
    orderId,
    customerId,
    totalAmount: parseFloat(totalAmount),
    items: items.map(i => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    timestamp: new Date().toISOString(),
  };

  console.log("[orders-service] event published:", JSON.stringify(event));

  return res.status(201).json({ orderId, status: "AWAITING_PAYMENT" });
});

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

ordersRouter.delete("/:id", async (req: Request, res: Response) => {
  const [order] = await query<{ id: string; status: OrderStatus }>(
    `SELECT id, status FROM orders WHERE id = $1`,
    [req.params.id]
  );

  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== "AWAITING_PAYMENT" && order.status !== "CANCELLED") {
    return res.status(409).json({ error: "Only orders in AWAITING_PAYMENT or CANCELLED state can be deleted" });
  }

  await query(`DELETE FROM orders WHERE id = $1`, [req.params.id]);

  return res.status(204).send();
});
