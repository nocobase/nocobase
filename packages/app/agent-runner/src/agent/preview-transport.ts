import { RUNNER_ROUTES, routePath } from '../protocol/index.ts';
import type { ApiClient } from '../lib/http.ts';
import type { SpoolEvent } from '../core/events.ts';

/** Best effort, bounded and memory-only. Durable snapshots use the ordinary spool independently. */
export class PreviewTransport {
  private sequence = 0;
  private queued = 0;
  private failed = false;
  private pending = Promise.resolve();
  private readonly client: ApiClient;
  private readonly runId: string;
  constructor(client: ApiClient, runId: string) {
    this.client = client;
    this.runId = runId;
  }
  send(event: SpoolEvent): void {
    if (this.failed || this.queued >= 64) {
      this.failed = true;
      return;
    }
    this.queued++;
    const numbered = {
      ...event,
      seq: ++this.sequence,
      at: new Date().toISOString(),
    };
    this.pending = this.pending
      .then(async () => {
        if (!this.failed)
          await this.client.request(
            'POST',
            routePath(RUNNER_ROUTES.events, { runId: this.runId }),
            { events: [numbered] },
          );
      })
      .catch(() => {
        this.failed = true;
      })
      .finally(() => {
        this.queued--;
      });
  }
  async drain(): Promise<void> {
    await this.pending;
  }
}
