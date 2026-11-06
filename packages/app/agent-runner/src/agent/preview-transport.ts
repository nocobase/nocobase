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
  private readonly onResponse?: (body: unknown) => void;
  constructor(
    client: ApiClient,
    runId: string,
    onResponse?: (body: unknown) => void,
  ) {
    this.client = client;
    this.runId = runId;
    this.onResponse = onResponse;
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
        if (this.failed) return;
        const body: unknown = await this.client.request(
          'POST',
          routePath(RUNNER_ROUTES.events, { runId: this.runId }),
          { events: [numbered] },
        );
        this.onResponse?.(body);
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
