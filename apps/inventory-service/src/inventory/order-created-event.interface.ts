export interface OrderCreatedEvent {
  eventId: string;
  eventType: 'order.created';
  occurredAt: string;
  data: {
    orderId: string;
    productId: string;
    quantity: number;
  };
}

export interface OrderStatusChangedEvent {
  eventId: string;
  eventType: 'order.status-changed';
  occurredAt: string;
  data: {
    orderId: string;
    status: string;
  };
}
