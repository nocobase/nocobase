// Keeps a run's lease: renews it every 15 s (the server grants 45 s, so two renewals may fail in a row). The answer
// carries the cancel flag and the unhandled inputs, which the worker treats like a status poll. `LEASE_LOST`, and any
// other answer saying the run is no longer this runner's, ends the run here: the worker kills the tool.
import { ApiError, type ApiClient } from '../lib/http.ts';
import {
  LeaseResponseSchema,
  type LeaseResponse,
  RUNNER_ROUTES,
  routePath,
} from '../protocol/index.ts';

export const LOST_CODES: ReadonlySet<string> = new Set([
  'LEASE_LOST',
  'RUN_NOT_ACTIVE',
  'RUN_NOT_OWNED',
  'RUNNER_REVOKED',
  'RUNNER_KEY_INVALID',
]);

export interface LeaseKeeperOptions {
  client: ApiClient;
  runId: string;
  intervalMs?: number;
  onRenewed?: (response: LeaseResponse) => void;
  onLost: (error: ApiError) => void;
  log?: (message: string) => void;
}

export class LeaseKeeper {
  private readonly options: LeaseKeeperOptions;
  private timer: NodeJS.Timeout | undefined;
  private lost = false;
  private renewing = false;

  constructor(options: LeaseKeeperOptions) {
    this.options = options;
  }

  start(): void {
    if (this.timer !== undefined) return;
    this.timer = setInterval(() => {
      void this.renew();
    }, this.options.intervalMs ?? 15_000);
  }

  stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  get isLost(): boolean {
    return this.lost;
  }

  async renew(): Promise<void> {
    if (this.lost || this.renewing) return;
    this.renewing = true;
    try {
      const response = await this.options.client.post(
        routePath(RUNNER_ROUTES.lease, { runId: this.options.runId }),
        {},
        LeaseResponseSchema,
        {
          timeoutMs: 10_000,
        },
      );
      this.options.onRenewed?.(response);
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason)) {
        this.lost = true;
        this.stop();
        this.options.onLost(error);
        return;
      }
      this.options.log?.(
        `lease: renewal failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.renewing = false;
    }
  }
}
