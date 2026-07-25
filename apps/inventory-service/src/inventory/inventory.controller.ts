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
  private readonly instanceName =
    process.env.INSTANCE_NAME ?? 'inventory-default';

  @EventPattern('order.created')
  handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): void {
    const message = context.getMessage();
    const topic = context.getTopic();
    const partition = context.getPartition();

    console.log('--------------------------------');
    console.log('Instance:', this.instanceName);
    console.log('Topic:', topic);
    console.log('Partition:', partition);
    console.log('Offset:', message.offset);
    console.log('Order ID:', event.data.orderId);
    console.log('Product ID:', event.data.productId);
    console.log('Quantity:', event.data.quantity);

    console.log(
      `[${this.instanceName}] Inventory reserved for order ` +
        event.data.orderId,
    );

    console.log('--------------------------------');
  }
}
