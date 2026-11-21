/** A service-wide bound that also covers reads left running by an earlier timed-out overview. */
export class ReadQueue {
  private active = 0;
  private readonly waiting: (() => void)[] = [];
  private readonly idle = new Set<() => void>();

  public constructor(private readonly limit = 4) {}

  public run<T>(read: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const abort = (): void => {
        const index = this.waiting.indexOf(start);
        if (index >= 0) this.waiting.splice(index, 1);
        reject(new Error('Foundation read deadline exceeded.'));
      };
      const start = (): void => {
        if (signal?.aborted) {
          abort();
          return;
        }
        this.active += 1;
        void Promise.resolve()
          .then(() => {
            signal?.throwIfAborted();
            return read();
          })
          .then(resolve, reject)
          .finally(() => {
            signal?.removeEventListener('abort', abort);
            // A driver read has no generic cancellation API. Keep its slot until it actually settles.
            this.active -= 1;
            this.drain();
          });
      };
      if (signal?.aborted) {
        reject(new Error('Foundation read deadline exceeded.'));
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      this.waiting.push(start);
      this.drain();
    });
  }

  /** Wait for driver reads that cannot be cancelled before the application closes its database. */
  public async settled(): Promise<void> {
    if (this.active === 0 && this.waiting.length === 0) return;
    await new Promise<void>((resolve) => this.idle.add(resolve));
  }

  private drain(): void {
    while (this.active < this.limit && this.waiting.length)
      this.waiting.shift()?.();
    if (this.active === 0 && this.waiting.length === 0) {
      for (const resolve of this.idle) resolve();
      this.idle.clear();
    }
  }
}
