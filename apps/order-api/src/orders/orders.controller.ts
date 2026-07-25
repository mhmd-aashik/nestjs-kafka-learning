import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

interface CreateOrderRequest {
  productId: string;
  quantity: number;
}

interface UpdateOrderStatusRequest {
  status: string;
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

  @Post(':orderId/events')
  publishOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderStatusRequest,
  ) {
    return this.ordersService.publishOrderStatus({
      orderId,
      status: body.status,
    });
  }
}
