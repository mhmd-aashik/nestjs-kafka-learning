import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import type { OrderCreatedEvent } from './order-created-event.interface';

@Controller()
export class InventoryController {
  @EventPattern('order.created')
  handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): void {
    const message = context.getMessage();
    const topic = context.getTopic();
    const partition = context.getPartition();

    console.log('-----------------------------');
    console.log('Order created event received');
    console.log('Topic:', topic);
    console.log('Partition:', partition);
    console.log('Offset:', message.offset);
    console.log('Event:', event);

    console.log(
      `Reserving ${event.data.quantity} unit(s) of ` +
        `${event.data.productId}`,
    );

    console.log(`Inventory reserved for order ${event.data.orderId}`);
    console.log('-----------------------------');
  }
}
