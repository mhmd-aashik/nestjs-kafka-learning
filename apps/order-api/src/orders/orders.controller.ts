import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

interface CreateOrderRequest {
  productId: string;
  quantity: number;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() body: CreateOrderRequest) {
    return this.ordersService.createOrder({
      productId: body.productId,
      quantity: body.quantity,
    });
  }
}
