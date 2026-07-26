import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { InventoryServiceModule } from './inventory-service.module';

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(
    InventoryServiceModule,
  );

  const configService = appContext.get(ConfigService);

  const instanceName =
    process.env.INSTANCE_NAME ??
    configService.get<string>('INVENTORY_CLIENT_ID', 'inventory-service');

  const broker = configService.get<string>(
    'KAFKA_EXTERNAL_BROKER',
    'localhost:29092',
  );

  const groupId = configService.get<string>(
    'INVENTORY_GROUP_ID',
    'inventory-consumer-group',
  );

  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InventoryServiceModule,
    {
      transport: Transport.KAFKA,

      options: {
        client: {
          clientId: instanceName,
          brokers: [broker],
        },

        consumer: {
          groupId,
          sessionTimeout: 30_000,
          heartbeatInterval: 3_000,
          rebalanceTimeout: 60_000,
        },

        run: {
          autoCommit: false,
        },
      },
    },
  );

  app.enableShutdownHooks();

  await app.listen();

  console.log(`${instanceName} connected to Kafka`);
}

void bootstrap();
