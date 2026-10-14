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

  public async close(waitMs: number = 5_000): Promise<void> {
    this.stopped = true;
    for (const controller of this.active.keys()) controller.abort();
    if (!this.active.size) return;
    // Shutdown's bounded wait does not change the original work or its accounting.
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      Promise.allSettled([...this.active.values()]),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, waitMs);
      }),
    ]);
    clearTimeout(timer);
  }
}
