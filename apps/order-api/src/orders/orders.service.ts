import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientKafkaProxy } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { lastValueFrom } from 'rxjs';

interface CreateOrderInput {
  productId: string;
  quantity: number;
}

interface OrderCreatedEvent {
  eventId: string;
  eventType: 'order.created';
  occurredAt: string;
  data: {
    orderId: string;
    productId: string;
    quantity: number;
  };
}

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('ORDER_KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafkaProxy,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    console.log('Order API connected to kafka');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  async createOrder(input: CreateOrderInput): Promise<{
    message: string;
    orderId: string;
  }> {
    const orderId = randomUUID();

    const event: OrderCreatedEvent = {
      eventId: randomUUID(),
      eventType: 'order.created',
      occurredAt: new Date().toISOString(),
      data: {
        orderId,
        productId: input.productId,
        quantity: input.quantity,
      },
    };

    await lastValueFrom(
      this.kafkaClient.emit('order.created', {
        key: orderId,
        value: event,
      }),
    );

    return {
      message: 'Order created event published',
      orderId,
    };
  }
}
