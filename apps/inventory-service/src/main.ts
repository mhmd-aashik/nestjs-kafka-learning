import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap(): Promise<void> {
  const instanceName = process.env.INSTANCE_NAME ?? 'inventory-default';

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

  console.log(`${instanceName} connected to Kafka`);
}
void bootstrap();
