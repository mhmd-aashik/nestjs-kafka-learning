import { Module } from '@nestjs/common';
import { OrderApiController } from './order-api.controller';
import { OrderApiService } from './order-api.service';

@Module({
  imports: [],
  controllers: [OrderApiController],
  providers: [OrderApiService],
})
export class OrderApiModule {}
