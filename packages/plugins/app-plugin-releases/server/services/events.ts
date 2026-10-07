import { createDiagnosticLogger, type Logger } from '@nocobase/logging';

import type {
  ReleasesEvent,
  ReleasesEventListener,
  ReleasesEvents,
} from '../tokens.js';

/** Delivers events to the application's listeners in order; a failing listener is logged and skipped. */
export class ReleasesEventBus implements ReleasesEvents {
  private readonly listeners = new Set<ReleasesEventListener>();
  private readonly diagnostic: ReturnType<typeof createDiagnosticLogger>;

  public constructor(logger?: Logger) {
    this.diagnostic = createDiagnosticLogger(logger);
  }

  public subscribe(listener: ReleasesEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async emit(event: ReleasesEvent): Promise<void> {
    for (const listener of [...this.listeners]) {
      try {
        await listener(event);
      } catch (error) {
        this.diagnostic.error(
          `A releases listener failed on ${event.type}`,
          error,
        );
      }
    }
  }
}
