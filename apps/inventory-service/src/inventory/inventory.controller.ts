import { Controller } from '@nestjs/common';

import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

import { InventoryRetryPublisher } from './inventory-retry.publisher';

import {
  type OrderCreatedEvent,
  type OrderStatusChangedEvent,
} from './order-created-event.interface';

@Controller()
export class InventoryController {
  private readonly instanceName =
    process.env.INSTANCE_NAME ?? 'inventory-default';

  private readonly maxRetries = 3;

  constructor(private readonly retryPublisher: InventoryRetryPublisher) {}

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.processOrderCreated(event, context);
  }

  @EventPattern('order.created.retry')
  async handleOrderCreatedRetry(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.processOrderCreated(event, context);
  }

  private async processOrderCreated(
    event: OrderCreatedEvent,
    context: KafkaContext,
  ): Promise<void> {
    const message = context.getMessage();

    const retryCount = this.getRetryCount(message.headers);

    console.log('--------------------------------');
    console.log('Instance:', this.instanceName);
    console.log('Topic:', context.getTopic());
    console.log('Partition:', context.getPartition());
    console.log('Offset:', message.offset);
    console.log('Kafka key:', message.key?.toString());
    console.log('Retry count:', retryCount);
    console.log('Order ID:', event.data.orderId);
    console.log('Product ID:', event.data.productId);

    try {
      await this.reserveInventory(event);

      console.log(`Inventory reserved for order ` + event.data.orderId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown inventory error';

      await this.handleFailure({
        event,
        retryCount,
        sourceTopic: context.getTopic(),
        errorMessage,
      });
    }

    console.log('--------------------------------');
  }

  private async reserveInventory(event: OrderCreatedEvent): Promise<void> {
    if (event.data.productId === 'FAIL-PRODUCT') {
      throw new Error('Inventory provider rejected the product');
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    console.log(
      `Reserved ${event.data.quantity} ` + `unit(s) of ${event.data.productId}`,
    );
  }

  private async handleFailure(options: {
    event: OrderCreatedEvent;
    retryCount: number;
    sourceTopic: string;
    errorMessage: string;
  }): Promise<void> {
    const nextRetryCount = options.retryCount + 1;

    if (nextRetryCount <= this.maxRetries) {
      console.warn(
        `Attempt ${nextRetryCount} failed. ` + 'Publishing to retry topic.',
      );

      await this.retryPublisher.publishRetry({
        event: options.event,
        orderId: options.event.data.orderId,
        retryCount: nextRetryCount,
        sourceTopic: options.sourceTopic,
        errorMessage: options.errorMessage,
      });

      return;
    }

    console.error(`Maximum retries reached. ` + 'Publishing event to DLQ.');

    await this.retryPublisher.publishDlq({
      event: options.event,
      orderId: options.event.data.orderId,
      retryCount: options.retryCount,
      sourceTopic: options.sourceTopic,
      errorMessage: options.errorMessage,
    });
  }

  private getRetryCount(headers: Record<string, unknown> | undefined): number {
    const retryHeader = headers?.['retry-count'];

    if (retryHeader === undefined) {
      return 0;
    }

    if (Buffer.isBuffer(retryHeader)) {
      return Number(retryHeader.toString());
    }

    if (typeof retryHeader === 'string') {
      return Number(retryHeader);
    }

    return 0;
  }

  @EventPattern('order.status-changed')
  handleOrderStatusChanged(
    @Payload()
    event: OrderStatusChangedEvent,

    @Ctx()
    context: KafkaContext,
  ): void {
    const message = context.getMessage();

    console.log('Order status changed', {
      orderId: event.data.orderId,
      status: event.data.status,
      partition: context.getPartition(),
      offset: message.offset,
    });
  }
}
