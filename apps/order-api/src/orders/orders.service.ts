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

interface PublishOrderEventInput {
  orderId: string;
  status: string;
}

interface OrderStatusChangedEvent {
  eventId: string;
  eventType: 'order.status-changed';
  occurredAt: string;
  data: {
    orderId: string;
    status: string;
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

  async publishOrderStatus(input: PublishOrderEventInput): Promise<{
    message: string;
    orderId: string;
    status: string;
  }> {
    const event: OrderStatusChangedEvent = {
      eventId: randomUUID(),
      eventType: 'order.status-changed',
      occurredAt: new Date().toISOString(),
      data: {
        orderId: input.orderId,
        status: input.status,
      },
    };

    await lastValueFrom(
      this.kafkaClient.emit('order.status-changed', {
        key: input.orderId,
        value: event,
      }),
    );

    return {
      message: 'Order status event published',
      orderId: input.orderId,
      status: input.status,
    };
  }

  async publishDuplicateOrderCreated(): Promise<{
    message: string;
    eventId: string;
    orderId: string;
  }> {
    const orderId = randomUUID();

    const event: OrderCreatedEvent = {
      eventId: randomUUID(),
      eventType: 'order.created',
      occurredAt: new Date().toISOString(),
      data: {
        orderId,
        productId: 'DUPLICATE-TEST-PRODUCT',
        quantity: 2,
      },
    };

    const kafkaRecord = {
      key: orderId,
      value: event,
    };

    await lastValueFrom(this.kafkaClient.emit('order.created', kafkaRecord));

    await lastValueFrom(this.kafkaClient.emit('order.created', kafkaRecord));

    return {
      message: 'Same event published twice',
      eventId: event.eventId,
      orderId,
    };
  }
}
