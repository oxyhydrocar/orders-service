/**
 * Shared contract types — orders-service copy
 *
 * ⚠️  WARNING: This file is duplicated across services:
 *   - orders-service/src/types/shared.ts   ← YOU ARE HERE (source of truth)
 *   - payments-service/src/types/shared.ts  (copy — last synced: 2024-11-10)
 *   - storefront/src/types/shared.ts        (copy — last synced: 2024-09-22)
 *
 * When you change anything here you MUST manually update the other copies.
 * There is no automated sync. This is a known tech debt item.
 * Ticket: https://github.com/oxyhydrocar/orders-service/issues/12
 */

// ─── Order Status ────────────────────────────────────────────────────────────
// Updated 2025-01-15: split PENDING into two states for clearer payment flow.
// BEFORE: "pending" | "paid" | "cancelled"
// AFTER:  see enum below
export type OrderStatus =
  | "AWAITING_PAYMENT"   // order created, payment not yet initiated
  | "PAYMENT_PENDING"    // payment initiated, awaiting gateway confirmation
  | "PAID"               // payment confirmed
  | "FULFILLING"         // warehouse is picking/packing
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

// ─── Order ───────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  customerId: string;   // renamed from userId (2024-12-01)
  items: OrderItem[];
  totalAmount: number;  // renamed from total (2025-02-10) to match DB column
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// ─── Events emitted by orders-service ────────────────────────────────────────
// These are published to the "orders" topic in the message broker.
// payments-service subscribes to these events.
export interface OrderCreatedEvent {
  eventType: "order.created";
  orderId: string;
  customerId: string;   // ← renamed from userId; payments-service still reads userId
  totalAmount: number;
  items: OrderItem[];
  timestamp: string;
}

export interface OrderStatusChangedEvent {
  eventType: "order.status_changed";
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}
