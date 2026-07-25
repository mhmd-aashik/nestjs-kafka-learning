import { Controller } from '@nestjs/common';

import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

import type { OrderCreatedEvent } from './order-created-event.interface';

@Controller()
export class NotificationsController {
  @EventPattern('order.created')
  handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): void {
    const message = context.getMessage();
    const topic = context.getTopic();
    const partition = context.getPartition();

    console.log('=================================');
    console.log('Notification event received');
    console.log('Topic:', topic);
    console.log('Partition:', partition);
    console.log('Offset:', message.offset);
    console.log('Event ID:', event.eventId);
    console.log('Order ID:', event.data.orderId);

    console.log(`Sending order confirmation for ${event.data.orderId}`);

    console.log(`Confirmation sent for product ${event.data.productId}`);

    console.log('=================================');
  }
}
