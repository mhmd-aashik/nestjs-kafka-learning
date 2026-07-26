import { Injectable } from '@nestjs/common';

@Injectable()
export class EventIdempotencyService {
  private readonly processedEventIds = new Set<string>();

  hasProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  markAsProcessed(eventId: string): void {
    this.processedEventIds.add(eventId);
  }

  getProcessedCount(): number {
    return this.processedEventIds.size;
  }
}
