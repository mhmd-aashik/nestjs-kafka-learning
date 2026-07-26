export interface OrderStatusChangedEvent {
  eventId: string;
  eventType: 'order.status-changed';
  occurredAt: string;
  data: {
    orderId: string;
    status: string;
  };
}
