import { Order, OrderStatus } from "../types/shared";

describe("Order type contracts", () => {
  it("Order has totalAmount field", () => {
    const order: Order = {
      id: "test-id",
      customerId: "cust-1",
      items: [],
      totalAmount: 99.99,
      status: "PAID",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(order.totalAmount).toBe(99.99);
  });

  it("PAYMENT_PENDING is a valid status", () => {
    const status: OrderStatus = "PAYMENT_PENDING";
    expect(status).toBe("PAYMENT_PENDING");
  });

  it("order uses customerId", () => {
    const order: Order = {
      id: "x",
      customerId: "c1",
      items: [],
      totalAmount: 10,
      status: "AWAITING_PAYMENT",
      createdAt: "",
      updatedAt: "",
    };
    expect(order.customerId).toBeDefined();
  });
});
