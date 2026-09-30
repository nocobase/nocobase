import type { Logger } from '@nocobase/logging';

export interface NotificationReconcileJobOptions {
  readonly intervalMs: number;
  readonly logger: Logger;
  readonly execute: () => Promise<void>;
}

/** Owns the lifecycle of periodic notification reconciliation. */
export class NotificationReconcileJob {
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;

  constructor(private readonly options: NotificationReconcileJobOptions) {}

  public start(): void {
    if (this.timer) return;
    // Process-local on purpose. Delivery leases make a scan from every
    // instance harmless, and a ScheduleExecutor `every` rule fires as soon as
    // setup() writes it, which in install mode is before the notification
    // tables exist.
    this.timer = setInterval(
      (): void => this.execute(),
      this.options.intervalMs,
    );
    this.timer.unref?.();
  }

  public async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    await this.running;
  }

  private execute(): void {
    if (this.running) return;
    const operation = this.options
      .execute()
      .catch((error: unknown) => {
        this.options.logger.error(
          { event: 'notification.reconcile_failed', err: error },
          'Notification reconciliation failed.',
        );
      })
      .finally(() => {
        if (this.running === operation) this.running = undefined;
      });
    this.running = operation;
  }
}
