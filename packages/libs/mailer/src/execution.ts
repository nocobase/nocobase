export interface MailExecution<T> {
  /** Settles only when the original work has ended. */
  readonly completion: Promise<T>;
  readonly signal: AbortSignal;
}

/** No queue: expired waits never create capacity for work that is still running. */
export class MailExecutions {
  private readonly active = new Map<AbortController, Promise<unknown>>();
  private stopped = false;

  public constructor(
    private readonly limit: number = 4,
    private readonly timeoutMs: number = 20_000,
  ) {
    if (!Number.isInteger(limit) || limit < 1 || timeoutMs < 1)
      throw new Error('Invalid mail execution limits.');
  }

  public get inFlight(): number {
    return this.active.size;
  }

  public submit<T>(
    work: (signal: AbortSignal) => Promise<T>,
  ): MailExecution<T> | undefined {
    if (this.stopped || this.active.size >= this.limit) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    timer.unref();
    const completion = Promise.resolve().then(() => work(controller.signal));
    this.active.set(controller, completion);
    const cleanup = (): void => {
      clearTimeout(timer);
      this.active.delete(controller);
    };
    // Observe late failures even when callers have stopped waiting.
    void completion.then(cleanup, cleanup);
    return { completion, signal: controller.signal };
  }

  /** Stop admission and signal cancellation without releasing active work early. */
  public stop(): void {
    this.stopped = true;
    const errors: unknown[] = [];
    for (const controller of this.active.keys()) {
      try {
        controller.abort();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Mail execution cancellation failed.');
  }

  /** Observe real completion; the application shutdown boundary owns any time limit. */
  public async wait(): Promise<void> {
    while (this.active.size) {
      await Promise.allSettled([...this.active.values()]);
    }
  }
}
