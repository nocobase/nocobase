/** Which kind of transaction callback failed. */
export type TransactionCallbackPhase = 'afterCommit' | 'afterRollback';

export type AfterCommitCallback = () => void | Promise<void>;
export type AfterRollbackCallback = (error: unknown) => void | Promise<void>;
export type TransactionCallbackErrorReporter = (
  error: unknown,
  phase: TransactionCallbackPhase,
) => void;

/**
 * Callbacks registered on one transaction or savepoint.
 *
 * A savepoint's callbacks belong to the transaction that encloses it: when the
 * savepoint is released they move to the parent and wait for the outermost
 * commit, and when it rolls back its rollback callbacks run at once while its
 * commit callbacks are dropped. Only the outermost scope runs commit callbacks,
 * because nothing is durable before the outermost commit.
 */
export class TransactionCallbacks {
  private commitCallbacks: AfterCommitCallback[] = [];
  private rollbackCallbacks: AfterRollbackCallback[] = [];
  private finished = false;

  constructor(readonly parent: TransactionCallbacks | undefined) {}

  afterCommit(callback: AfterCommitCallback): void {
    this.assertOpen();
    this.commitCallbacks.push(callback);
  }

  afterRollback(callback: AfterRollbackCallback): void {
    this.assertOpen();
    this.rollbackCallbacks.push(callback);
  }

  /** The savepoint was released: its callbacks now wait on the parent. */
  release(): void {
    if (!this.parent) {
      throw new Error('Only a savepoint scope can be released.');
    }
    this.parent.commitCallbacks.push(...this.commitCallbacks);
    this.parent.rollbackCallbacks.push(...this.rollbackCallbacks);
    this.finish();
  }

  /**
   * Runs the commit callbacks in registration order. A failing callback is
   * reported and the rest still run: the transaction has committed, so an
   * error here must not make the caller believe the write failed.
   */
  async commit(report: TransactionCallbackErrorReporter): Promise<void> {
    const callbacks = this.commitCallbacks;
    this.finish();
    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error) {
        report(error, 'afterCommit');
      }
    }
  }

  /** Drops the commit callbacks and runs the rollback callbacks in order. */
  async rollback(
    cause: unknown,
    report: TransactionCallbackErrorReporter,
  ): Promise<void> {
    const callbacks = this.rollbackCallbacks;
    this.finish();
    for (const callback of callbacks) {
      try {
        await callback(cause);
      } catch (error) {
        report(error, 'afterRollback');
      }
    }
  }

  private finish(): void {
    this.finished = true;
    this.commitCallbacks = [];
    this.rollbackCallbacks = [];
  }

  /**
   * A transaction connection that escaped its callback would otherwise accept
   * a callback that can never run, and the work it stood for would silently
   * never happen.
   */
  private assertOpen(): void {
    if (this.finished) {
      throw new Error(
        'This transaction has finished; register afterCommit and afterRollback callbacks inside the transaction callback.',
      );
    }
  }
}

/**
 * Outside a transaction there is nothing to wait for: the write a caller made
 * has already committed. The callback starts at once and its failure is
 * reported the same way a failure after a commit would be.
 */
export function runAfterCommitNow(
  callback: AfterCommitCallback,
  report: TransactionCallbackErrorReporter,
): void {
  void (async () => {
    await callback();
  })().catch((error: unknown) => report(error, 'afterCommit'));
}
