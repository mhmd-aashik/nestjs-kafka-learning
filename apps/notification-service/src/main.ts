import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'notification-service',
          brokers: ['localhost:29092'],
        },
        consumer: {
          groupId: 'notification-consumer-group',
        },
      },
    },
  );

  await app.listen();

  console.log('Notification Service connected to Kafka');
}
void bootstrap();
