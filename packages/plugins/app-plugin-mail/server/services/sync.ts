import { MailSyncScheduler } from '../operations/schedule-sync.js';
import {
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
import { mailFailedPrecondition, mailNotFound } from './errors.js';

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
      | 'listSyncRuns',
      'outbox'
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
    const { run } = await this.scheduler.request(
      account,
      context.actorId,
      input,
    );
    this.dependencies.outbox.kick();
    return toSyncRunView(run);
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
    if (!['failed', 'cancelled'].includes(run.status)) {
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Only failed or cancelled sync runs can be retried.',
      );
    }
    const receivedAfter =
      run.mode === 'initial'
        ? (validDateOrUndefined(run.policy.receivedAfter) ??
          validDateOrUndefined(
            (await this.dependencies.store.getAccount(run.accountId))
              ?.initialSyncReceivedAfter,
          ) ??
          new Date(`${mailSyncDateMonthsAgo(1)}T00:00:00Z`).toISOString())
        : undefined;
    return this.startSync(context, {
      accountId: run.accountId,
      mode: run.mode,
      receivedAfter,
    });
  }

  public async cancelSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRunView> {
    const run = await this.requireOwnedSyncRun(context, syncRunId);
    if (!['pending', 'running'].includes(run.status)) {
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Only active sync runs can be cancelled.',
      );
    }
    const cancelled = await this.dependencies.store.cancelSyncRun(syncRunId);
    if (!cancelled)
      throw mailFailedPrecondition(
        'MAIL_SYNC_RUN_STATE_INVALID',
        'Mail sync run is no longer active.',
      );
    return toSyncRunView(cancelled);
  }

  private async requireOwnedSyncRun(
    context: MailOperationContext,
    syncRunId: string,
  ): Promise<MailSyncRun> {
    const run = await this.dependencies.store.getSyncRun(syncRunId);
    if (!run)
      throw mailNotFound(
        'MAIL_SYNC_RUN_NOT_FOUND',
        'Mail sync run was not found.',
        'syncRunId',
      );
    await requireOwnedAccount(this.dependencies.store, context, run.accountId);
    return run;
  }
}

function validDateOrUndefined(value: string | undefined): string | undefined {
  return value && Number.isFinite(Date.parse(value)) ? value : undefined;
}
