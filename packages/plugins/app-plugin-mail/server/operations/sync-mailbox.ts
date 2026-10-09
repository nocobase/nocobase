import { mailLogError, writeMailLog, type MailLogger } from '../logging.js';
import { randomUUID } from 'node:crypto';
import { mailSyncDateMonthsAgo } from '../../shared/mail-sync-date.js';

import type {
  MailProviderAdapter,
  MailProviderAdapterResolver,
} from '../contracts/provider.js';
import type {
  MailProviderError,
  MailProviderResult,
  MailSyncCursor,
  MailSyncRun,
} from '../../shared/mail.js';
import type {
  MailStore,
  MailSyncMailboxTaskPayload,
  MailSyncStepCommit,
} from '../contracts/persistence.js';
import {
  notifyMailMessageChange,
  type MailMessageChangeNotifier,
} from '../realtime.js';

export interface SyncMailboxOperationDependencies {
  readonly logger?: MailLogger;
  readonly store: MailStore;
  readonly adapters: MailProviderAdapterResolver;
  readonly leaseMs?: number;
  readonly messageChangeNotifier?: MailMessageChangeNotifier;
}

const SYNC_STEP_TIMEOUT_MS = 5 * 60 * 1_000;
const MAX_RETRYABLE_SYNC_ATTEMPTS = 12;

export class SyncMailboxOperation {
  public constructor(
    private readonly dependencies: SyncMailboxOperationDependencies,
  ) {}

  public async execute(payload: MailSyncMailboxTaskPayload): Promise<void> {
    try {
      await this.executeTask(payload);
    } catch (error) {
      writeMailLog(
        this.dependencies.logger,
        'error',
        {
          event: 'mail.sync.exception',
          syncRunId: payload.syncRunId,
          phase: payload.expectedPhase,
          revision: payload.expectedRevision,
          err: mailLogError(error),
        },
        'Mail synchronization task failed.',
      );
      throw error;
    }
  }

  private async executeTask(
    payload: MailSyncMailboxTaskPayload,
  ): Promise<void> {
    const now = Date.now();
    const leaseMs = this.dependencies.leaseMs ?? 60_000;
    const leaseToken = randomUUID();
    const run = await this.dependencies.store.claimSyncRun(
      payload.syncRunId,
      payload.expectedRevision,
      payload.expectedPhase,
      leaseToken,
      new Date(now + leaseMs).toISOString(),
    );
    if (!run) {
      const current = await this.dependencies.store.getSyncRun(
        payload.syncRunId,
      );
      if (
        (current?.status === 'pending' || current?.status === 'running') &&
        current.revision === payload.expectedRevision &&
        current.phase === payload.expectedPhase
      ) {
        throw new Error('Mail sync run is currently leased by another worker.');
      }
      return;
    }
    if (
      run.status === 'completed' ||
      run.status === 'partial' ||
      run.status === 'cancelled'
    )
      return;

    writeMailLog(
      this.dependencies.logger,
      'info',
      { event: 'mail.sync.started', ...this.logFields(run) },
      'Mail synchronization step started.',
    );
    const signal = AbortSignal.timeout(SYNC_STEP_TIMEOUT_MS);
    const account = await this.dependencies.store.getAccount(run.accountId);
    if (!account || account.status !== 'active') {
      await this.failSyncRun(
        run,
        terminalError(
          account ? 'MAIL_ACCOUNT_INACTIVE' : 'MAIL_ACCOUNT_NOT_FOUND',
          account
            ? 'Mail account is not active.'
            : 'Mail account was not found.',
        ),
      );
      return;
    }
    if (run.mode === 'initial' && !isValidSyncDate(run.policy.receivedAfter)) {
      const receivedAfter = isValidSyncDate(account.initialSyncReceivedAfter)
        ? account.initialSyncReceivedAfter
        : new Date(`${mailSyncDateMonthsAgo(1)}T00:00:00Z`).toISOString();
      await this.commitSyncStep({
        run,
        messages: [],
        phase: 'preparing',
        status: 'running',
        restart: true,
        receivedAfter,
        createNextTask: true,
      });
      return;
    }

    let adapter: MailProviderAdapter;
    try {
      adapter = await this.dependencies.adapters.resolve(account, signal);
    } catch (error) {
      await this.failSyncRun(
        run,
        terminalError(
          'MAIL_PROVIDER_UNAVAILABLE',
          error instanceof Error
            ? error.message
            : 'The selected mail Provider is unavailable.',
        ),
        error,
      );
      return;
    }
    const stopLeaseHeartbeat = this.startLeaseHeartbeat(
      run.id,
      leaseToken,
      leaseMs,
    );
    try {
      const changed = await this.executeStep(run, adapter, signal);
      if (changed) {
        notifyMailMessageChange(
          this.dependencies.messageChangeNotifier,
          account.userId,
          this.dependencies.logger,
        );
      }
    } catch (error) {
      if (await this.isCancelledOrRemoved(run)) return;
      const normalized = normalizeError(error);
      if (isCursorInvalid(normalized)) {
        await this.commitSyncStep({
          run,
          messages: [],
          phase: 'preparing',
          status: 'running',
          restart: true,
          receivedAfter:
            run.policy.receivedAfter ?? account.initialSyncReceivedAfter,
          createNextTask: true,
        });
        return;
      }
      if (normalized.category === 'authentication' && !normalized.retryable) {
        await this.dependencies.store.markAccountReauthorizationRequired(
          account.id,
        );
      }
      if (normalized.retryable) {
        if ((run.retryAttempts ?? 0) >= MAX_RETRYABLE_SYNC_ATTEMPTS) {
          await this.failSyncRun(
            run,
            { ...normalized, retryable: false },
            error,
          );
          return;
        }
        const exponentialDelayMs =
          1_000 * 2 ** Math.min(run.retryAttempts ?? 0, 6);
        const backoffWithJitterMs = Math.min(
          64_000,
          exponentialDelayMs + Math.floor(Math.random() * 1_001),
        );
        const retryDelayMs = Math.max(
          normalized.retryAfterMs ?? 0,
          backoffWithJitterMs,
        );
        let released: MailSyncRun;
        try {
          released = await this.dependencies.store.releaseSyncRun(
            run,
            normalized,
            new Date(Date.now() + retryDelayMs).toISOString(),
          );
        } catch (releaseError) {
          if (!(await this.isCancelledOrRemoved(run))) throw releaseError;
          return;
        }
        writeMailLog(
          this.dependencies.logger,
          'warn',
          {
            event: 'mail.sync.retry_scheduled',
            ...this.logFields(released),
            errorCode: normalized.code,
            category: normalized.category,
            retryable: true,
            retryAfterMs: retryDelayMs,
            err: mailLogError(error),
          },
          'Mail synchronization retry scheduled.',
        );
        return;
      }
      await this.failSyncRun(run, normalized, error);
    } finally {
      stopLeaseHeartbeat();
      await closeQuietly(adapter);
    }
  }

  private async failSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
    cause: unknown = error,
  ): Promise<void> {
    try {
      const failed = await this.dependencies.store.failSyncRun(run, error);
      writeMailLog(
        this.dependencies.logger,
        'error',
        {
          event: 'mail.sync.failed',
          ...this.logFields(failed),
          errorCode: error.code,
          category: error.category,
          retryable: error.retryable,
          err: mailLogError(cause),
        },
        'Mail synchronization failed.',
      );
    } catch (failureError) {
      if (!(await this.isCancelledOrRemoved(run))) throw failureError;
    }
  }

  private logFields(run: MailSyncRun): object {
    return {
      accountId: run.accountId,
      syncRunId: run.id,
      phase: run.phase,
      status: run.status,
      revision: run.revision,
      processedMessages: run.processedMessages,
      processedPages: run.processedPages,
      pendingMessages: run.pendingMessages,
      durationMs: Math.max(0, Date.now() - Date.parse(run.createdAt)),
    };
  }

  private async commitSyncStep(
    input: MailSyncStepCommit,
  ): Promise<MailSyncRun> {
    const result = await this.dependencies.store.commitSyncStep(input);
    writeMailLog(
      this.dependencies.logger,
      result.status === 'partial' || input.restart ? 'warn' : 'info',
      {
        event: input.restart
          ? 'mail.sync.restarted'
          : result.status === 'completed' || result.status === 'partial'
            ? 'mail.sync.completed'
            : 'mail.sync.progress',
        ...this.logFields(result),
      },
      'Mail synchronization progress saved.',
    );
    return result;
  }

  private async isCancelledOrRemoved(
    run: Pick<MailSyncRun, 'id' | 'accountId'>,
  ): Promise<boolean> {
    const [currentRun, currentAccount] = await Promise.all([
      this.dependencies.store.getSyncRun(run.id),
      this.dependencies.store.getAccount(run.accountId),
    ]);
    return Boolean(
      !currentRun ||
      currentRun.status === 'cancelled' ||
      !currentAccount ||
      currentAccount.status === 'removing',
    );
  }

  private startLeaseHeartbeat(
    syncRunId: string,
    leaseToken: string,
    leaseMs: number,
  ): () => void {
    const interval = setInterval(
      () => {
        void this.dependencies.store
          .renewSyncRunLease(
            syncRunId,
            leaseToken,
            new Date(Date.now() + leaseMs).toISOString(),
          )
          .catch((error: unknown) => {
            writeMailLog(
              this.dependencies.logger,
              'error',
              {
                event: 'mail.sync.lease_failed',
                syncRunId,
                err: mailLogError(error),
              },
              'Mail synchronization lease could not be renewed.',
            );
          });
      },
      Math.max(1_000, Math.floor(leaseMs / 3)),
    );
    interval.unref();
    return (): void => clearInterval(interval);
  }

  private async executeStep(
    run: MailSyncRun,
    adapter: MailProviderAdapter,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (run.phase === 'preparing') {
      return this.prepare(run, adapter, signal);
    }
    if (run.phase === 'history') {
      return this.importHistoryPage(run, adapter, signal);
    }
    if (run.phase === 'catchUp' || run.phase === 'incremental') {
      return this.importChangePage(run, adapter, signal);
    }
    return false;
  }

  private async prepare(
    run: MailSyncRun,
    adapter: MailProviderAdapter,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (
      run.mode === 'initial' &&
      (!adapter.listMessages || !adapter.getCurrentSyncCursor)
    ) {
      throw new MailOperationError(
        terminalError(
          'MAIL_INITIAL_SYNC_NOT_SUPPORTED',
          'The selected mail Provider does not support resumable initial sync.',
        ),
      );
    }
    const baseline =
      run.mode === 'initial'
        ? (run.baselineCursor ??
          unwrap(await adapter.getCurrentSyncCursor!(signal)))
        : undefined;
    const folderPage = adapter.listFolders
      ? unwrap(
          await adapter.listFolders({
            cursor: run.folderCursor,
            limit: run.policy.batchSize,
            signal,
          }),
        )
      : { folders: [], completeProviderFolderIds: [] };
    if (folderPage.nextCursor) {
      await this.commitSyncStep({
        run,
        folders: folderPage.folders,
        messages: [],
        phase: 'preparing',
        status: 'running',
        folderCursor: folderPage.nextCursor,
        baselineCursor: baseline,
        createNextTask: true,
      });
      return false;
    }
    const currentCursor =
      run.mode === 'initial'
        ? baseline
        : await this.dependencies.store.getSyncCursor(run.accountId);
    const providerFolderIds =
      folderPage.completeProviderFolderIds ??
      folderPage.folders.map((folder) => folder.providerFolderId);
    const changeCursor = adapter.reconcileSyncCursor
      ? unwrap(adapter.reconcileSyncCursor(currentCursor, providerFolderIds))
      : currentCursor;
    await this.commitSyncStep({
      run,
      folders: folderPage.folders,
      completeProviderFolderIds: folderPage.completeProviderFolderIds,
      messages: [],
      phase: run.mode === 'initial' ? 'history' : 'incremental',
      status: 'running',
      baselineCursor: run.mode === 'initial' ? changeCursor : baseline,
      changeCursor: run.mode === 'incremental' ? changeCursor : undefined,
      createNextTask: true,
    });
    return false;
  }

  private async importHistoryPage(
    run: MailSyncRun,
    adapter: MailProviderAdapter,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (!adapter.listMessages) {
      throw new MailOperationError(
        terminalError(
          'MAIL_HISTORY_SYNC_NOT_SUPPORTED',
          'The selected mail Provider does not support history sync.',
        ),
      );
    }
    const page = unwrap(
      await adapter.listMessages({
        providerFolderIds: (
          await this.dependencies.store.listFolders(run.accountId)
        ).map((folder) => folder.providerFolderId),
        receivedAfter: run.policy.receivedAfter,
        baselineCursor: run.baselineCursor,
        cursor: run.historyCursor,
        limit: run.policy.batchSize,
        signal,
      }),
    );
    const imported = page.messages;
    const hasMore = page.nextCursor !== undefined;
    if (hasMore && page.nextCursor === run.historyCursor) {
      throw new MailOperationError(
        terminalError(
          'MAIL_PROVIDER_CURSOR_STALLED',
          'The mail Provider returned the same history cursor while more pages were expected.',
        ),
      );
    }
    await this.commitSyncStep({
      run,
      messages: imported,
      historyPage: true,
      phase: page.historyReady === false && hasMore ? 'history' : 'catchUp',
      historyComplete: !hasMore,
      status: 'running',
      historyCursor: hasMore ? page.nextCursor : undefined,
      baselineCursor: run.baselineCursor,
      changeCursor:
        page.historyReady === false
          ? (page.syncCursor ?? run.changeCursor)
          : (run.changeCursor ?? page.syncCursor ?? run.baselineCursor),
      createNextTask: true,
    });
    return imported.length > 0;
  }

  private async importChangePage(
    run: MailSyncRun,
    adapter: MailProviderAdapter,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (!adapter.listChanges) {
      throw new MailOperationError(
        terminalError(
          'MAIL_INCREMENTAL_SYNC_NOT_SUPPORTED',
          'The selected mail Provider does not support incremental sync.',
        ),
      );
    }
    const knownProviderMessageIds =
      adapter.identity.type === 'imap-smtp'
        ? await this.dependencies.store.listImapProviderMessageIds?.(
            run.accountId,
          )
        : undefined;
    const result = await adapter.listChanges({
      cursor: run.changeCursor,
      ...(knownProviderMessageIds ? { knownProviderMessageIds } : {}),
      limit: run.policy.batchSize,
      signal,
    });
    const page = unwrap(result);
    if (page.hasMore && sameSyncCursor(run.changeCursor, page.nextCursor)) {
      throw new MailOperationError(
        terminalError(
          'MAIL_PROVIDER_CURSOR_STALLED',
          'The mail Provider returned the same change cursor while more pages were expected.',
        ),
      );
    }
    const resumeHistory =
      run.mode === 'initial' &&
      !run.historyComplete &&
      run.historyCursor !== undefined;
    await this.commitSyncStep({
      run,
      historyCursor: run.historyCursor,
      messages: page.messages,
      removedFromFolders: page.removedFromFolders,
      deletedProviderMessageIds: page.deletedProviderMessageIds,
      phase: resumeHistory ? 'history' : page.hasMore ? run.phase : 'completed',
      status: page.hasMore || resumeHistory ? 'running' : 'completed',
      baselineCursor: run.baselineCursor,
      changeCursor: page.nextCursor,
      createNextTask: page.hasMore || resumeHistory,
    });
    return (
      page.messages.length > 0 ||
      (page.removedFromFolders?.length ?? 0) > 0 ||
      (page.deletedProviderMessageIds?.length ?? 0) > 0
    );
  }
}

function unwrap<T>(result: MailProviderResult<T>): T {
  if (!result.ok) throw new MailOperationError(result.error);
  return result.value;
}

class MailOperationError extends Error {
  public constructor(public readonly mailError: MailProviderError) {
    super(mailError.message);
  }
}

function terminalError(code: string, message: string): MailProviderError {
  return {
    code,
    message,
    category: 'configuration',
    retryable: false,
  };
}

function isValidSyncDate(value: string | undefined): value is string {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function normalizeError(error: unknown): MailProviderError {
  if (error instanceof MailOperationError) return error.mailError;
  return {
    code: 'MAIL_SYNC_FAILED',
    message: error instanceof Error ? error.message : 'Mailbox sync failed.',
    category: 'unknown',
    retryable: true,
  };
}

function isCursorInvalid(error: MailProviderError): boolean {
  return error.code.endsWith('_SYNC_CURSOR_INVALID');
}

function sameSyncCursor(
  left: MailSyncCursor | undefined,
  right: MailSyncCursor,
): boolean {
  return Boolean(
    left &&
    left.version === right.version &&
    JSON.stringify(left.value) === JSON.stringify(right.value),
  );
}

export type SyncCursor = MailSyncCursor;

async function closeQuietly(adapter: MailProviderAdapter): Promise<void> {
  try {
    await adapter.close?.();
  } catch {
    // Closing a Provider client must not replay a committed sync step.
  }
}
