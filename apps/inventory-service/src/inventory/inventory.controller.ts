import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
} from './order-created-event.interface';

@Controller()
export class InventoryController {
  private readonly instanceName =
    process.env.INSTANCE_NAME ?? 'inventory-default';

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const message = context.getMessage();
    const partition = context.getPartition();

    console.log('--------------------------------');
    console.log('Instance:', this.instanceName);
    console.log('Topic:', context.getTopic());
    console.log('Partition:', partition);
    console.log('Offset:', message.offset);
    console.log('Order ID:', event.data.orderId);
    console.log('Product ID:', event.data.productId);
    console.log('Quantity:', event.data.quantity);

    if (event.data.productId === 'FAIL-PRODUCT') {
      console.error('Inventory processing failed');

      throw new Error(
        `Unable to reserve inventory for ${event.data.productId}`,
      );
    }

    await this.reserveInventory(event);

    console.log(
      `[${this.instanceName}] Inventory reserved for order ` +
        event.data.orderId,
    );

    console.log('--------------------------------');
  }

  private async reserveInventory(event: OrderCreatedEvent): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    console.log(
      `Reserved ${event.data.quantity} unit(s) of ` + event.data.productId,
    );
  }

  @EventPattern('order.status-changed')
  handleOrderStatusChanged(
    @Payload() event: OrderStatusChangedEvent,
    @Ctx() context: KafkaContext,
  ): void {
    const message = context.getMessage();

    console.log('================================');
    console.log('Instance:', this.instanceName);
    console.log('Event:', event.eventType);
    console.log('Order ID:', event.data.orderId);
    console.log('Status:', event.data.status);
    console.log('Partition:', context.getPartition());
    console.log('Offset:', message.offset);
    console.log('Kafka key:', message.key?.toString());
    console.log('================================');
  }
}
