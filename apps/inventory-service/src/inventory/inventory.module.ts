import { Module } from '@nestjs/common';

import { InventoryController } from './inventory.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryRetryPublisher } from './inventory-retry.publisher';
import { EventIdempotencyService } from './event-idempotency.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'inventory-retry-producer',
            brokers: ['localhost:29092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryRetryPublisher, EventIdempotencyService],
})
export class InventoryModule {}
