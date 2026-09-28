export async function sendOrderConfirmation(orderId: string, userId: string): Promise<void> {
  console.log(`[notify] order confirmation sent for ${orderId} to user ${userId}`);
}

export async function sendCancellationNotice(orderId: string, userId: string): Promise<void> {
  console.log(`[notify] cancellation notice sent for ${orderId} to user ${userId}`);
}

export async function sendRefundNotice(orderId: string, userId: string, amount: number): Promise<void> {
  console.log(`[notify] refund notice sent for ${orderId} ($${amount}) to user ${userId}`);
}
