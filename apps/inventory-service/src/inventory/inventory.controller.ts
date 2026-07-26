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
import { EventIdempotencyService } from './event-idempotency.service';
import { KafkaTopics } from '@app/kafka-contracts';
import { ConfigService } from '@nestjs/config';

@Controller()
export class InventoryController {
  private readonly instanceName =
    process.env.INSTANCE_NAME ?? 'inventory-default';

  private get maxRetries(): number {
    return this.configService.get<number>('INVENTORY_MAX_RETRIES', 3);
  }
  constructor(
    private readonly retryPublisher: InventoryRetryPublisher,
    private readonly eventIdempotencyService: EventIdempotencyService,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern(KafkaTopics.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.processOrderCreated(event, context);
  }

  @EventPattern(KafkaTopics.ORDER_CREATED_RETRY)
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
    console.log('Event ID:', event.eventId);
    console.log('Order ID:', event.data.orderId);
    console.log('Product ID:', event.data.productId);
    console.log('Retry count:', retryCount);

    /*
     * A duplicate means the business operation was
     * already completed previously.
     *
     * It is therefore safe to commit and skip it.
     */
    if (this.eventIdempotencyService.hasProcessed(event.eventId)) {
      console.warn(`Duplicate event skipped: ${event.eventId}`);

      await this.commitCurrentOffset(context);

      console.log('--------------------------------');

      return;
    }

    try {
      await this.reserveInventory(event);

      /*
       * In a real application, inventory reservation
       * and the processed-event record should be stored
       * in one database transaction.
       */
      this.eventIdempotencyService.markAsProcessed(event.eventId);

      console.log(`Inventory reserved for order ` + event.data.orderId);

      console.log(`Event marked as processed: ` + event.eventId);

      /*
       * Commit only after business processing and
       * idempotency recording succeed.
       */
      await this.commitCurrentOffset(context);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown inventory error';

      await this.handleFailure({
        event,
        context,
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
    context: KafkaContext;
    retryCount: number;
    sourceTopic: string;
    errorMessage: string;
  }): Promise<void> {
    const nextRetryCount = options.retryCount + 1;

    if (nextRetryCount <= this.maxRetries) {
      console.warn(
        `Attempt ${nextRetryCount} failed. ` + 'Publishing to retry topic.',
      );

      /*
       * First publish the replacement retry record.
       */
      await this.retryPublisher.publishRetry({
        event: options.event,
        orderId: options.event.data.orderId,
        retryCount: nextRetryCount,
        sourceTopic: options.sourceTopic,
        errorMessage: options.errorMessage,
      });

      console.log('Retry record published successfully');

      /*
       * Only now can the source record be committed.
       */
      await this.commitCurrentOffset(options.context);

      return;
    }

    console.error('Maximum retries reached. ' + 'Publishing event to DLQ.');

    /*
     * First safely publish the DLQ record.
     */
    await this.retryPublisher.publishDlq({
      event: options.event,
      orderId: options.event.data.orderId,
      retryCount: options.retryCount,
      sourceTopic: options.sourceTopic,
      errorMessage: options.errorMessage,
    });

    console.log('DLQ record published successfully');

    /*
     * Commit the retry record only after
     * the DLQ write succeeds.
     */
    await this.commitCurrentOffset(options.context);
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

  @EventPattern(KafkaTopics.ORDER_STATUS_CHANGED)
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

  private async commitCurrentOffset(context: KafkaContext): Promise<void> {
    const message = context.getMessage();
    const consumer = context.getConsumer();

    const topic = context.getTopic();
    const partition = context.getPartition();

    const currentOffset = message.offset;

    const nextOffset = (BigInt(currentOffset) + 1n).toString();

    await consumer.commitOffsets([
      {
        topic,
        partition,
        offset: nextOffset,
      },
    ]);

    console.log('Offset committed', {
      topic,
      partition,
      processedOffset: currentOffset,
      committedOffset: nextOffset,
    });
  }
}
