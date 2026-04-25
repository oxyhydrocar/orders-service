/**
 * Orders service unit tests.
 *
 * These tests pass. The bugs below only surface when payments-service or
 * storefront actually consume the responses — unit tests can't catch that.
 */
import { Order, OrderStatus } from "../types/shared";

describe("Order type contracts", () => {
  it("Order has totalAmount (not total)", () => {
    const order: Order = {
      id: "test-id",
      customerId: "cust-1",
      items: [],
      totalAmount: 99.99,  // ✅ correct field name in this service
      status: "PAID",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // This test passes — the field IS totalAmount here.
    // But storefront reads order.total, which will be undefined.
    expect(order.totalAmount).toBe(99.99);
    expect((order as any).total).toBeUndefined(); // ← storefront bug, invisible here
  });

  it("PAYMENT_PENDING is a valid status", () => {
    const status: OrderStatus = "PAYMENT_PENDING";
    // This test passes — the status string is correct in orders-service.
    // But payments-service checks status === 'pending_payment', so no
    // order ever gets picked up for payment processing.
    expect(status).toBe("PAYMENT_PENDING");
  });

  it("order uses customerId (not userId)", () => {
    const order: Order = {
      id: "x",
      customerId: "c1",  // ✅ correct here
      items: [],
      totalAmount: 10,
      status: "AWAITING_PAYMENT",
      createdAt: "",
      updatedAt: "",
    };
    expect(order.customerId).toBeDefined();
    expect((order as any).userId).toBeUndefined(); // ← payments-service still uses userId
  });
});
