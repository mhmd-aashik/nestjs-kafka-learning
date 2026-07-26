import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import type { ClientKafkaProxy } from '@nestjs/microservices';

import { lastValueFrom } from 'rxjs';

import { OrderCreatedEvent } from './order-created-event.interface';
import { KafkaTopics } from '@app/kafka-contracts';

interface RetryPublishOptions {
  event: OrderCreatedEvent;
  orderId: string;
  retryCount: number;
  sourceTopic: string;
  errorMessage: string;
}

type DlqPublishOptions = RetryPublishOptions;

@Injectable()
export class InventoryRetryPublisher implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('INVENTORY_KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafkaProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaClient.connect();

    console.log('Inventory retry producer connected to Kafka');
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  async publishRetry(options: RetryPublishOptions): Promise<void> {
    await lastValueFrom(
      this.kafkaClient.emit(KafkaTopics.ORDER_CREATED_RETRY, {
        key: options.orderId,
        value: options.event,
        headers: {
          'retry-count': options.retryCount.toString(),

          'source-topic': options.sourceTopic,

          'failure-reason': options.errorMessage,

          'failed-at': new Date().toISOString(),
        },
      }),
    );
  }

  async publishDlq(options: DlqPublishOptions): Promise<void> {
    await lastValueFrom(
      this.kafkaClient.emit(KafkaTopics.ORDER_CREATED_DLQ, {
        key: options.orderId,
        value: options.event,
        headers: {
          'retry-count': options.retryCount.toString(),

          'source-topic': options.sourceTopic,

          'failure-reason': options.errorMessage,

          'failed-at': new Date().toISOString(),
        },
      }),
    );
  }
}
