import { Controller, Get } from '@nestjs/common';
import { OrderApiService } from './order-api.service';

@Controller()
export class OrderApiController {
  constructor(private readonly orderApiService: OrderApiService) {}

  @Get()
  getHello(): string {
    return this.orderApiService.getHello();
  }
}
