import { notifyMailMessageChange } from '../realtime.js';
import { MailSyncScheduler } from '../operations/schedule-sync.js';
import {
  type MailAccount,
  type MailOperationContext,
  type MailOffsetPage,
  type MailStartSyncInput,
  type MailSyncRun,
  type MailSyncRunView,
} from '../../shared/mail.js';
import { toSyncRunView } from '../views.js';
import { requireActiveAccount, requireOwnedAccount } from './access.js';
import { type MailServiceDependencies } from './dependencies.js';
import { mailSyncDateMonthsAgo } from '../../shared/mail-sync-date.js';
import {
  mailAccountInactive,
  mailAccountNotFound,
  mailFailedPrecondition,
  mailNotFound,
} from './errors.js';

export class MailSyncService {
  private readonly scheduler: MailSyncScheduler;
  public constructor(
    private readonly dependencies: MailServiceDependencies<
      | 'cancelSyncRun'
      | 'countSyncRuns'
      | 'createSyncRun'
      | 'findActiveSyncRun'
      | 'getAccount'
      | 'getSyncCursor'
      | 'getSyncRun'
      | 'listSyncRuns'
      | 'replaceSyncFolders',
      'outbox' | 'messageChangeNotifier' | 'logger'
    >,
    syncBatchSize: number,
  ) {
    this.scheduler = new MailSyncScheduler(dependencies.store, syncBatchSize);
  }

  public async startSync(
    context: MailOperationContext,
    input: MailStartSyncInput,
  ): Promise<MailSyncRunView> {
    const account = await requireActiveAccount(
      this.dependencies.store,
      context,
      input.accountId,
    );
    return this.schedule(context, account, input);
  }

  private async schedule(
    context: MailOperationContext,
    account: MailAccount,
    input: MailStartSyncInput,
  ): Promise<MailSyncRunView> {
    const { run } = await this.scheduler.request(
      account,
      context.actorId,
      input,
    );
    this.dependencies.outbox.kick();
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      account.userId,
      this.dependencies.logger,
    );
    return toSyncRunView(run);
  }

  /**
   * Save the account's folder selection and, in the same transaction, replace its active run with an initial one under
   * it, which imports newly selected folders and removes local data outside the selection. Undefined when the account
   * is not active.
   */
  public async replaceSyncFolders(
    context: MailOperationContext,
    account: MailAccount,
    syncFolderIds: readonly string[] | undefined,
  ): Promise<MailSyncRun | undefined> {
    const receivedAfter =
      validDateOrUndefined(account.initialSyncReceivedAfter) ??
      new Date(`${mailSyncDateMonthsAgo(1)}T00:00:00Z`).toISOString();
    const run = await this.scheduler.replaceSyncFolders(
      account,
      context.actorId,
      syncFolderIds,
      receivedAfter,
    );
    if (!run) return undefined;
    this.dependencies.outbox.kick();
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      account.userId,
      this.dependencies.logger,
    );
    return run;
  }

  public async getSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView | undefined> {
    const run = await this.dependencies.store.getSyncRun(syncRunId);
    if (!run) return undefined;
    const account = await this.dependencies.store.getAccount(run.accountId);
    return account?.userId === context.actorId ? toSyncRunView(run) : undefined;
  }

  public async listSyncRunsPage(
    context: MailOperationContext,
    offset = 0,
    limit = 20,
  ): Promise<MailOffsetPage<MailSyncRunView>> {
    const [items, total] = await Promise.all([
      this.listSyncRuns(context, offset, limit),
      this.dependencies.store.countSyncRuns(context.actorId),
    ]);
    return { items, total };
  }

  public async listSyncRuns(
    context: MailOperationContext,
    offset = 0,
    limit = 100,
  ): Promise<readonly MailSyncRunView[]> {
    return (
      await this.dependencies.store.listSyncRuns(context.actorId, offset, limit)
    ).map(toSyncRunView);
  }

  public async retrySyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    const run = await this.requireOwnedSyncRun(context, syncRunId);
    return this.retry(context, run, () =>
      requireActiveAccount(this.dependencies.store, context, run.accountId),
    );
  }

  public async cancelSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    const run = await this.requireOwnedSyncRun(context, syncRunId);
    return this.cancel(run, context.actorId);
  }

  /**
   * Retry any member's failed or cancelled run, for a caller with `settings:mail.admin/manage`. The new run is
   * requested by the caller and synchronizes the member's account as their own retry would.
   */
  public async retryManagedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    const run = await this.requireSyncRun(syncRunId);
    return this.retry(context, run, async () => {
      const account = await this.dependencies.store.getAccount(run.accountId);
      if (!account) throw mailAccountNotFound();
      if (account.status !== 'active') throw mailAccountInactive();
      return account;
    });
  }

  /** Cancel any member's active run, for a caller with `settings:mail.admin/manage`. */
  public async cancelManagedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    const run = await this.requireSyncRun(syncRunId);
    const account = await this.dependencies.store.getAccount(run.accountId);
    return this.cancel(run, account?.userId ?? context.actorId);
  }

  private async retry(
    context: MailOperationContext,
    run: MailSyncRun,
    activeAccount: () => Promise<MailAccount>,
  ): Promise<MailSyncRunView> {
    if (!['failed', 'cancelled'].includes(run.status)) {
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Only failed or cancelled sync runs can be retried.',
      );
    }
    const account = await activeAccount();
    const receivedAfter =
      run.mode === 'initial'
        ? (validDateOrUndefined(run.policy.receivedAfter) ??
          validDateOrUndefined(account.initialSyncReceivedAfter) ??
          new Date(`${mailSyncDateMonthsAgo(1)}T00:00:00Z`).toISOString())
        : undefined;
    return this.schedule(context, account, {
      accountId: run.accountId,
      mode: run.mode,
      receivedAfter,
    });
  }

  private async cancel(
    run: MailSyncRun,
    ownerId: string,
  ): Promise<MailSyncRunView> {
    if (!['pending', 'running'].includes(run.status)) {
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Only active sync runs can be cancelled.',
      );
    }
    const cancelled = await this.dependencies.store.cancelSyncRun(run.id);
    if (!cancelled)
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Mail sync run is no longer active.',
      );
    notifyMailMessageChange(
      this.dependencies.messageChangeNotifier,
      ownerId,
      this.dependencies.logger,
    );
    return toSyncRunView(cancelled);
  }

  private async requireSyncRun(syncRunId: string): Promise<MailSyncRun> {
    const run = await this.dependencies.store.getSyncRun(syncRunId);
    if (!run)
      throw mailNotFound(
        'MAIL_SYNC_RUN_NOT_FOUND',
        'Mail sync run was not found.',
        'syncRunId',
      );
    return run;
  }

  private async requireOwnedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRun> {
    const run = await this.requireSyncRun(syncRunId);
    await requireOwnedAccount(this.dependencies.store, context, run.accountId);
    return run;
  }
}

function validDateOrUndefined(value: string | undefined): string | undefined {
  return value && Number.isFinite(Date.parse(value)) ? value : undefined;
}
