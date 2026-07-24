import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
