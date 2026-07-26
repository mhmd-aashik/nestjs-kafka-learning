import { NestFactory } from '@nestjs/core';
import { OrderApiModule } from './order-api.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(OrderApiModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('ORDER_API_PORT', 3000);

  await app.listen(port);
}

void bootstrap();
