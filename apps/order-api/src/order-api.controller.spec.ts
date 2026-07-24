import { Test, TestingModule } from '@nestjs/testing';
import { OrderApiController } from './order-api.controller';
import { OrderApiService } from './order-api.service';

describe('OrderApiController', () => {
  let orderApiController: OrderApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderApiController],
      providers: [OrderApiService],
    }).compile();

    orderApiController = app.get<OrderApiController>(OrderApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(orderApiController.getHello()).toBe('Hello World!');
    });
  });
});
