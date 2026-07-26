import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class InventoryLifecycleService
  implements OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown
{
  onModuleDestroy(): void {
    console.log('[Lifecycle] Inventory modules are being destroyed');
  }

  beforeApplicationShutdown(signal?: string): void {
    console.log(`[Lifecycle] Shutdown started. Signal: ${signal ?? 'unknown'}`);

    console.log('[Lifecycle] Finishing cleanup before application shutdown');
  }

  onApplicationShutdown(signal?: string): void {
    console.log(
      `[Lifecycle] Inventory application stopped. Signal: ${
        signal ?? 'unknown'
      }`,
    );
  }
}
