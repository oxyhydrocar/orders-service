interface AuditEvent {
  action: string;
  orderId: string;
  actorId: string;
  at: string;
}

const events: AuditEvent[] = [];

export function logAuditEvent(action: string, orderId: string, actorId: string): void {
  events.push({ action, orderId, actorId, at: new Date().toISOString() });
}

export function getAuditEvents(orderId: string): AuditEvent[] {
  return events.filter((e) => e.orderId === orderId);
}
