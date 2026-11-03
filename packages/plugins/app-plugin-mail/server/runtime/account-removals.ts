import { performance } from 'node:perf_hooks';
import { setImmediate } from 'node:timers/promises';
import type { MailRuntimeOptions } from '../runtime.js';
import { closeAdapter } from '../services/provider-lifecycle.js';
import { notifyMailMessageChange } from '../realtime.js';
import { mailLogError, writeMailLog } from '../logging.js';

/** The independent removal table is the durable work queue; each batch keeps its own transaction and lease. */
export class MailAccountRemovals {
  public constructor(
    private readonly options: Pick<
      MailRuntimeOptions,
      'store' | 'adapters' | 'credentials' | 'logger' | 'messageChangeNotifier'
    >,
  ) {}

  /** Bound each relay sweep, yielding between independently claimed batches so other work can run. */
  public async drain(shouldStop: () => boolean = () => false): Promise<void> {
    const started = performance.now();
    for (let batch = 0; batch < 8 && !shouldStop(); batch++) {
      if (batch > 0 && performance.now() - started >= 100) return;
      if (!(await this.runBatch())) return;
      await setImmediate();
    }
  }

  public async runBatch(): Promise<boolean> {
    const { store } = this.options;
    const task = await store.claimAccountRemoval();
    if (!task) return false;
    let renewal: Promise<void> | undefined;
    let timer: NodeJS.Timeout | undefined;
    const abort = new AbortController();
    try {
      if (!(await store.deleteAccountBatch(task))) {
        await store.releaseAccountRemoval(task, false);
        return true;
      }
      if (!(await store.renewAccountRemoval(task))) return true;
      timer = setInterval(() => {
        if (renewal) return;
        renewal = store
          .renewAccountRemoval(task)
          .then((owned) => {
            if (!owned)
              abort.abort(new Error('Mail account removal lease was lost.'));
          })
          .catch((error: unknown) => {
            abort.abort(error);
          })
          .finally(() => {
            renewal = undefined;
          });
      }, 10_000);
      timer.unref();
      const account = await store.getAccount(task.accountId);
      if (account) {
        const subscription = await store.getPushSubscription(account.id);
        if (subscription) {
          // Provider disconnection is best effort, as it was for synchronous removal.
          try {
            const signal = AbortSignal.any([
              abort.signal,
              AbortSignal.timeout(15_000),
            ]);
            const adapter = await this.options.adapters.resolve(
              account,
              signal,
            );
            try {
              await adapter.deletePushSubscription?.(
                subscription.providerSubscriptionId,
                signal,
              );
            } finally {
              await closeAdapter(adapter);
            }
          } catch (error) {
            writeMailLog(
              this.options.logger,
              'warn',
              { accountId: account.id, err: mailLogError(error) },
              'Mail push subscription cleanup failed.',
            );
          }
        }
        abort.signal.throwIfAborted();
        await this.options.credentials?.delete(account.credentialReference);
      }
      abort.signal.throwIfAborted();
      if (await store.finishAccountRemoval(task)) {
        if (account)
          notifyMailMessageChange(
            this.options.messageChangeNotifier,
            account.userId,
            this.options.logger,
          );
      }
    } catch (error) {
      await store.releaseAccountRemoval(task, true);
      writeMailLog(
        this.options.logger,
        'error',
        { accountId: task.accountId, err: mailLogError(error) },
        'Mail account removal failed; it will be retried.',
      );
    } finally {
      if (timer) clearInterval(timer);
      await renewal;
    }
    return true;
  }
}
