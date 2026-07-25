import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InventoryServiceModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'inventory-service',
          brokers: ['localhost:29092'],
        },
        consumer: {
          groupId: 'inventory-consumer-group',
        },
      },
    },
  );
  await app.listen();

  console.log('Inventory Service connected to Kafka');
}
void bootstrap();
