import { NestFactory } from '@nestjs/core';
import { OrderApiModule } from './order-api.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(OrderApiModule);

  const port = 3000;

  await app.listen(port);

  console.log(`Order API running at http://localhost:${port}`);
}

void bootstrap();
