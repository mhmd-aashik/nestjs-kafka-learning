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
