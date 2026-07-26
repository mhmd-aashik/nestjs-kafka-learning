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

          /*
           * Broker removes this consumer when it does
           * not receive heartbeats within this period.
           */
          sessionTimeout: 30_000,

          /*
           * Heartbeat interval must remain lower than
           * the session timeout.
           */
          heartbeatInterval: 3_000,

          /*
           * Maximum time allowed for members to rejoin
           * while a consumer-group rebalance occurs.
           */
          rebalanceTimeout: 60_000,
        },

        // Disable KafkaJS automatic offset commits.
        run: {
          autoCommit: false,
        },
      },
    },
  );

  app.enableShutdownHooks();

  await app.listen();

  console.log(`${instanceName} connected to Kafka`);
  console.log('Automatic offset commits disabled');
  console.log('Shutdown hooks enabled');
}
void bootstrap();
