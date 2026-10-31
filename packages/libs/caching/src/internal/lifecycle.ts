const CLOSE_TIMEOUT_MS = 30_000;

function failure(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Cache operation failed.', { cause: error });
}

/** Owns admitted work and retains cleanup after a caller's close deadline. */
export class OperationScope {
  private state: 'open' | 'closing' | 'closed' = 'open';
  private readonly active = new Set<Promise<unknown>>();
  private cleanup: Promise<void> | undefined;
  private closing: Promise<void> | undefined;

  assertOpen(): void {
    if (this.state !== 'open')
      throw new Error('Cache provider is closing or closed.');
  }

  run<T>(operation: () => T | Promise<T>): Promise<T> {
    try {
      this.assertOpen();
      // Admit before invoking user code, including a reentrant wrap loader.
      const result = Promise.resolve().then(operation);
      this.active.add(result);
      const settled = (): void => {
        this.active.delete(result);
      };
      void result.then(settled, settled);
      return result;
    } catch (error) {
      return Promise.reject(failure(error));
    }
  }

  close(release: () => Promise<void>): Promise<void> {
    if (this.state === 'closed') return Promise.resolve();
    this.state = 'closing';
    if (this.closing) return this.closing;
    this.cleanup ??= this.drainAndRelease(release).then(
      () => {
        this.state = 'closed';
      },
      (error: unknown) => {
        this.cleanup = undefined;
        throw failure(error);
      },
    );
    const cleanup = this.cleanup;
    const attempt = new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        timer = setTimeout(() => {
          reject(
            new Error('Cache provider close timed out; cleanup is retained.'),
          );
        }, CLOSE_TIMEOUT_MS);
      } catch (error) {
        reject(failure(error));
      }
      // Observe cleanup even if a timer could not be registered.
      void cleanup.then(
        () => {
          clearTimeout(timer);
          resolve();
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(failure(error));
        },
      );
    });
    this.closing = attempt;
    const settled = (): void => {
      if (this.closing === attempt) this.closing = undefined;
    };
    void attempt.then(settled, settled);
    return attempt;
  }

  private async drainAndRelease(release: () => Promise<void>): Promise<void> {
    await Promise.allSettled([...this.active]);
    await release();
  }
}

export async function settleCleanup(
  cleanups: readonly Promise<void>[],
): Promise<void> {
  const results = await Promise.allSettled(cleanups);
  const failures: unknown[] = [];
  for (const result of results) {
    if (result.status === 'rejected') failures.push(result.reason);
  }
  if (failures.length > 0)
    throw new AggregateError(failures, 'Cache provider cleanup failed.');
}
