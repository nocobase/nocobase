import { lockWritableAccount } from './account-guard.js';
import { validateLogPagination } from '../log-pagination.js';
import { type DatabaseManager } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import {
  MAIL_LOCAL_DRAFT_FOLDER_ID,
  type MailOffsetPage,
  type MailProviderError,
  type MailSyncCursor,
  type MailSyncRun,
} from '../../shared/mail.js';
import {
  type MailCreateSyncRunInput,
  type MailStore,
  type MailSyncBatch,
  type MailSyncStepCommit,
} from '../contracts/persistence.js';
import { fromSyncRunRow, toSyncRunRow } from './mappers.js';
import {
  deleteMessages,
  removeMessagesFromFolders,
  removeStaleMessageFolders,
  upsertFolders,
  upsertMessages,
} from './message-writes.js';
import {
  type AccountRow,
  type MessageRow,
  type OutboxRow,
  type PushPendingRow,
  type SyncRunRow,
  type SyncStateRow,
} from './rows.js';
import { chunks, jsonOrNull, parseJson } from './serialization.js';
import { insertOutbox, upsertSyncState } from './sync-writes.js';

export class MailSyncStore {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly accounts: Pick<MailStore, 'getAccount' | 'listAccounts'>,
  ) {}

  public async commitSyncBatch(batch: MailSyncBatch): Promise<void> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, batch.accountId);
      await upsertFolders(connection.query, batch.accountId, batch.folders);
      await upsertMessages(connection.query, batch.accountId, batch.messages);
      await removeMessagesFromFolders(
        connection.query,
        batch.accountId,
        batch.removedFromFolders ?? [],
      );
      await deleteMessages(
        connection.query,
        batch.accountId,
        batch.deletedProviderMessageIds,
      );
      await upsertSyncState(
        connection.query,
        batch.accountId,
        batch.nextCursor,
      );
    });
  }

  public async getSyncCursor(
    accountId: string,
  ): Promise<MailSyncCursor | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SyncStateRow>('mailSyncStates')
      .selectAll()
      .where('accountId', '=', accountId)
      .executeTakeFirst<SyncStateRow>();
    return row
      ? parseJson<MailSyncCursor>(row.cursor, 'sync cursor')
      : undefined;
  }

  public async getLastSyncedAt(accountId: string): Promise<string | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SyncStateRow>('mailSyncStates')
      .select('lastSyncedAt')
      .where('accountId', '=', accountId)
      .executeTakeFirst<Pick<SyncStateRow, 'lastSyncedAt'>>();
    return row?.lastSyncedAt;
  }

  public async clearSyncCursor(accountId: string): Promise<void> {
    await this.database
      .query()
      .deleteFrom('mailSyncStates')
      .where('accountId', '=', accountId)
      .execute();
  }

  public async createSyncRun(
    input: MailCreateSyncRunInput,
  ): Promise<MailSyncRun> {
    const now = new Date().toISOString();
    const run: MailSyncRun = {
      ...input,
      phase: 'preparing',
      status: 'pending',
      historyStartedAt: now,
      revision: 0,
      processedMessages: 0,
      processedPages: 0,
      retryAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.database.transaction(async (connection): Promise<void> => {
        const account = await connection.query
          .updateTable<AccountRow>('mailAccounts')
          // This conditional update serializes sync creation with account
          // removal while keeping the account status unchanged.
          .set({ status: 'active' })
          .where('id', '=', input.accountId)
          .where('status', '=', 'active')
          .execute();
        if (account.updatedCount !== 1) {
          throw new Error('Mail account is not active.');
        }
        await connection.query
          .insertInto<SyncRunRow>('mailSyncRuns')
          .values(toSyncRunRow(run))
          .execute();
        await insertOutbox(connection.query, run, 0, now);
      });
    } catch (error) {
      const account = await this.accounts.getAccount(input.accountId);
      const active =
        account?.status === 'active'
          ? await this.findActiveSyncRun(input.accountId)
          : undefined;
      if (active) return active;
      throw error;
    }
    return run;
  }

  public async findActiveSyncRun(
    accountId: string,
  ): Promise<MailSyncRun | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SyncRunRow>('mailSyncRuns')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('status', 'in', ['pending', 'running'])
      .orderBy('createdAt', 'asc')
      .executeTakeFirst<SyncRunRow>();
    return row ? fromSyncRunRow(row) : undefined;
  }

  public async getSyncRun(syncRunId: string): Promise<MailSyncRun | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SyncRunRow>('mailSyncRuns')
      .selectAll()
      .where('id', '=', syncRunId)
      .executeTakeFirst<SyncRunRow>();
    return row ? fromSyncRunRow(row) : undefined;
  }

  public async countSyncRuns(userId: string): Promise<number> {
    const accounts = await this.accounts.listAccounts(userId);
    if (accounts.length === 0) return 0;
    const query = this.database
      .query()
      .selectFrom<SyncRunRow>('mailSyncRuns')
      .select(({ fn }) => [fn.countAll().as('count')])
      .where(
        'accountId',
        'in',
        accounts.map((account) => account.id),
      );
    const row = await query.executeTakeFirst<{
      readonly count: number | string;
    }>();
    return Number(row?.count ?? 0);
  }

  public async listSyncRuns(
    userId: string,
    offset = 0,
    limit = 100,
  ): Promise<readonly MailSyncRun[]> {
    validateLogPagination(offset, limit);
    const accounts = await this.accounts.listAccounts(userId);
    if (accounts.length === 0) return [];
    const rows = await this.database
      .query()
      .selectFrom<SyncRunRow>('mailSyncRuns')
      .selectAll()
      .where(
        'accountId',
        'in',
        accounts.map((account) => account.id),
      )
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(limit)
      .execute<SyncRunRow>();
    return rows.map(fromSyncRunRow);
  }

  public async listAllSyncRuns(
    offset: number,
    limit: number,
  ): Promise<MailOffsetPage<MailSyncRun>> {
    validateLogPagination(offset, limit);
    const [rows, count] = await Promise.all([
      this.database
        .query()
        .selectFrom<SyncRunRow>('mailSyncRuns')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .offset(offset)
        .limit(limit)
        .execute<SyncRunRow>(),
      this.database
        .query()
        .selectFrom<SyncRunRow>('mailSyncRuns')
        .select(({ fn }) => [fn.countAll().as('count')])
        .executeTakeFirst<{ readonly count: number | string }>(),
    ]);
    return {
      items: rows.map(fromSyncRunRow),
      total: Number(count?.count ?? 0),
    };
  }

  /** Recreate lost queue deliveries from durable checkpoints, fenced by revision and lease. */
  public async recoverSyncRuns(now: string): Promise<number> {
    const staleBefore = new Date(Date.parse(now) - 120_000).toISOString();
    const candidates = await this.database
      .query()
      .selectFrom<SyncRunRow>('mailSyncRuns')
      .selectAll()
      .where('status', 'in', ['pending', 'running'])
      .where((builder) =>
        builder.not(
          builder.exists(
            builder
              .selectFrom('mailOutbox')
              .select('id')
              .whereRef('mailOutbox.aggregateId', '=', 'mailSyncRuns.id')
              .where('mailOutbox.status', 'in', ['pending', 'publishing']),
          ),
        ),
      )
      .where((builder) =>
        builder.or([
          builder.eb('leaseExpiresAt', '<=', now),
          builder.eb.and([
            builder.eb('leaseToken', 'is', null),
            builder.eb('updatedAt', '<=', staleBefore),
          ]),
        ]),
      )
      .orderBy('updatedAt', 'asc')
      .orderBy('id', 'asc')
      .limit(100)
      .execute<SyncRunRow>();
    let recovered = 0;
    for (const row of candidates) {
      recovered += await this.database.transaction(
        async (connection): Promise<number> => {
          const writable = await connection.query
            .updateTable<AccountRow>('mailAccounts')
            .set({ id: row.accountId })
            .where('id', '=', row.accountId)
            .where('status', '=', 'active')
            .execute();
          if (writable.updatedCount !== 1) return 0;
          const waiting = await connection.query
            .selectFrom<OutboxRow>('mailOutbox')
            .select('id')
            .where('aggregateId', '=', row.id)
            .where('status', 'in', ['pending', 'publishing'])
            .executeTakeFirst();
          if (waiting) return 0;
          let update = connection.query
            .updateTable<SyncRunRow>('mailSyncRuns')
            .set({
              revision: Number(row.revision) + 1,
              status: 'pending',
              leaseToken: null,
              leaseExpiresAt: null,
              updatedAt: now,
            })
            .where('id', '=', row.id)
            .where('revision', '=', row.revision)
            .where('status', 'in', ['pending', 'running']);
          update = row.leaseToken
            ? update
                .where('leaseToken', '=', row.leaseToken)
                .where('leaseExpiresAt', '<=', now)
            : update
                .where('leaseToken', 'is', null)
                .where('updatedAt', '<=', staleBefore);
          const result = await update.execute();
          if (result.updatedCount !== 1) return 0;
          await insertOutbox(
            connection.query,
            {
              id: row.id,
              phase: row.phase,
              revision: Number(row.revision) + 1,
            },
            Number(row.processedPages),
            now,
            randomUUID(),
          );
          return 1;
        },
      );
    }
    return recovered;
  }

  public async cancelSyncRun(
    syncRunId: string,
  ): Promise<MailSyncRun | undefined> {
    const current = await this.getSyncRun(syncRunId);
    if (!current || !['pending', 'running'].includes(current.status)) {
      return undefined;
    }
    const now = new Date().toISOString();
    const result = await this.database
      .query()
      .updateTable<SyncRunRow>('mailSyncRuns')
      .set({
        status: 'cancelled',
        activeKey: null,
        revision: current.revision + 1,
        leaseToken: null,
        leaseExpiresAt: null,
        updatedAt: now,
        completedAt: now,
      })
      .where('id', '=', syncRunId)
      .where('status', 'in', ['pending', 'running'])
      .where('revision', '=', current.revision)
      .execute();
    return result.updatedCount === 1 ? this.getSyncRun(syncRunId) : undefined;
  }

  public async claimSyncRun(
    syncRunId: string,
    expectedRevision: number,
    expectedPhase: MailSyncRun['phase'],
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<MailSyncRun | undefined> {
    const now = new Date().toISOString();
    const result = await this.database
      .query()
      .updateTable<SyncRunRow>('mailSyncRuns')
      .set({ status: 'running', leaseToken, leaseExpiresAt, updatedAt: now })
      .where('id', '=', syncRunId)
      .where('revision', '=', expectedRevision)
      .where('phase', '=', expectedPhase)
      .where('status', 'in', ['pending', 'running'])
      .where((builder) =>
        builder.or([
          builder.eb('leaseToken', 'is', null),
          builder.eb('leaseExpiresAt', '<=', now),
        ]),
      )
      .execute();
    return result.updatedCount === 1 ? this.getSyncRun(syncRunId) : undefined;
  }

  public async renewSyncRunLease(
    syncRunId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<SyncRunRow>('mailSyncRuns')
      .set({ leaseExpiresAt, updatedAt: new Date().toISOString() })
      .where('id', '=', syncRunId)
      .where('status', '=', 'running')
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }

  public async commitSyncStep(input: MailSyncStepCommit): Promise<MailSyncRun> {
    const now = new Date().toISOString();
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, input.run.accountId);
      await upsertFolders(
        connection.query,
        input.run.accountId,
        input.folders ?? [],
      );
      if (input.completeProviderFolderIds) {
        let staleFolders = connection.query
          .deleteFrom('mailFolders')
          .where('accountId', '=', input.run.accountId);
        staleFolders = staleFolders.where(
          'providerFolderId',
          '!=',
          MAIL_LOCAL_DRAFT_FOLDER_ID,
        );
        if (input.completeProviderFolderIds.length > 0) {
          staleFolders = staleFolders.where(
            'providerFolderId',
            'not in',
            input.completeProviderFolderIds,
          );
        }
        await staleFolders.execute();
        await removeStaleMessageFolders(
          connection.query,
          input.run.accountId,
          input.completeProviderFolderIds,
        );
      }
      let messages = input.messages;
      if (input.historyPage && messages.length > 0) {
        const removed = await connection.query
          .selectFrom('mailSyncTombstones')
          .select('providerMessageId')
          .where('runId', '=', input.run.id)
          .where(
            'providerMessageId',
            'in',
            messages.map((message) => message.providerMessageId),
          )
          .execute<{ providerMessageId: string }>();
        const deletedIds = new Set(removed.map((row) => row.providerMessageId));
        messages = messages.filter(
          (message) => !deletedIds.has(message.providerMessageId),
        );
      }
      await upsertMessages(
        connection.query,
        input.run.accountId,
        messages,
        input.historyPage
          ? (input.run.historyStartedAt ?? input.run.createdAt)
          : undefined,
      );
      if (input.run.mode === 'initial' && !input.historyPage) {
        const affectedIds = [
          ...new Set([
            ...input.messages.map((message) => message.providerMessageId),
            ...(input.deletedProviderMessageIds ?? []),
          ]),
        ];
        for (const ids of chunks(affectedIds, 100)) {
          await connection.query
            .deleteFrom('mailSyncTombstones')
            .where('runId', '=', input.run.id)
            .where('providerMessageId', 'in', ids)
            .execute();
        }
        for (const ids of chunks(
          [...new Set(input.deletedProviderMessageIds ?? [])],
          100,
        )) {
          await connection.query
            .insertInto('mailSyncTombstones')
            .values(
              ids.map((providerMessageId) => ({
                runId: input.run.id,
                providerMessageId,
              })),
            )
            .execute();
        }
      }
      await removeMessagesFromFolders(
        connection.query,
        input.run.accountId,
        input.removedFromFolders ?? [],
      );
      await deleteMessages(
        connection.query,
        input.run.accountId,
        input.deletedProviderMessageIds ?? [],
      );
      const pendingPush =
        input.status === 'completed'
          ? await connection.query
              .selectFrom<PushPendingRow>('mailPushPending')
              .select(['accountId', 'requestToken'])
              .where('accountId', '=', input.run.accountId)
              .executeTakeFirst<
                Pick<PushPendingRow, 'accountId' | 'requestToken'>
              >()
          : undefined;
      if (pendingPush) {
        await connection.query
          .deleteFrom<PushPendingRow>('mailPushPending')
          .where('accountId', '=', input.run.accountId)
          .where('requestToken', '=', pendingPush.requestToken)
          .execute();
      }
      const pending = await connection.query
        .selectFrom<MessageRow>('mailMessages')
        .select(({ fn }) => [fn.countAll().as('count')])
        .where('accountId', '=', input.run.accountId)
        .where('contentStatus', '!=', 'complete')
        .executeTakeFirst<{ count: number | string }>();
      const pendingMessages = Number(pending?.count ?? 0);
      const status = pendingPush
        ? 'running'
        : input.status === 'completed' && pendingMessages > 0
          ? 'partial'
          : input.status;
      // Refresh folder metadata too: a send may have created the Sent folder.
      const phase = pendingPush ? 'preparing' : input.phase;
      const createNextTask = pendingPush || input.createNextTask;
      const result = await connection.query
        .updateTable<SyncRunRow>('mailSyncRuns')
        .set({
          phase,
          status,
          mode: input.restart
            ? 'initial'
            : pendingPush
              ? 'incremental'
              : input.run.mode,
          policy: JSON.stringify(
            input.restart
              ? {
                  receivedAfter: input.receivedAfter,
                  batchSize: input.run.policy.batchSize,
                }
              : input.run.policy,
          ),
          historyStartedAt: input.restart
            ? now
            : (input.run.historyStartedAt ?? input.run.createdAt),
          historyComplete: input.restart
            ? false
            : (input.historyComplete ?? input.run.historyComplete ?? false),
          recovering:
            input.restart ||
            (status === 'running' && (input.run.recovering ?? false)),
          pendingMessages,
          retryAttempts: 0,
          revision: input.run.revision + 1,
          activeKey:
            status === 'completed' || status === 'partial'
              ? null
              : input.run.accountId,
          processedMessages:
            input.run.processedMessages + input.messages.length,
          processedPages: input.run.processedPages + 1,
          historyCursor: input.historyCursor ?? null,
          folderCursor: input.folderCursor ?? null,
          baselineCursor: jsonOrNull(input.baselineCursor),
          changeCursor: jsonOrNull(input.changeCursor),
          leaseToken: null,
          leaseExpiresAt: null,
          error: null,
          updatedAt: now,
          completedAt:
            status === 'completed' || status === 'partial' ? now : null,
        })
        .where('id', '=', input.run.id)
        .where('status', '=', 'running')
        .where('leaseToken', '=', input.run.leaseToken ?? '')
        .execute();
      if (result.updatedCount !== 1) {
        throw new Error('Mail sync run lease was lost before commit.');
      }
      if (input.restart || input.status === 'completed')
        await connection.query
          .deleteFrom('mailSyncTombstones')
          .where('runId', '=', input.run.id)
          .execute();
      if (input.restart) {
        await connection.query
          .deleteFrom('mailSyncStates')
          .where('accountId', '=', input.run.accountId)
          .execute();
      }
      if (input.status === 'completed' && input.changeCursor) {
        await upsertSyncState(
          connection.query,
          input.run.accountId,
          input.changeCursor,
        );
      }
      if (createNextTask) {
        await insertOutbox(
          connection.query,
          {
            ...input.run,
            phase,
            revision: input.run.revision + 1,
          },
          input.run.processedPages + 1,
          now,
        );
      }
    });
    const updated = await this.getSyncRun(input.run.id);
    if (!updated) throw new Error('Committed mail sync run could not be read.');
    return updated;
  }

  public async failSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
  ): Promise<MailSyncRun> {
    const now = new Date().toISOString();
    await this.database
      .query()
      .updateTable<SyncRunRow>('mailSyncRuns')
      .set({
        status: 'failed',
        activeKey: null,
        error: JSON.stringify(error),
        leaseToken: null,
        leaseExpiresAt: null,
        updatedAt: now,
      })
      .where('id', '=', run.id)
      .where('leaseToken', '=', run.leaseToken ?? '')
      .execute();
    const updated = await this.getSyncRun(run.id);
    if (!updated) throw new Error('Failed mail sync run could not be read.');
    return updated;
  }

  public async releaseSyncRun(
    run: MailSyncRun,
    error: MailProviderError,
    availableAt: string,
  ): Promise<MailSyncRun> {
    const now = new Date().toISOString();
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, run.accountId);
      const result = await connection.query
        .updateTable<SyncRunRow>('mailSyncRuns')
        .set({
          status: 'pending',
          activeKey: run.accountId,
          error: JSON.stringify(error),
          retryAttempts: (run.retryAttempts ?? 0) + 1,
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now,
        })
        .where('id', '=', run.id)
        .where('leaseToken', '=', run.leaseToken ?? '')
        .execute();
      if (result.updatedCount !== 1) {
        throw new Error('Mail sync run lease was lost before retry planning.');
      }
      await insertOutbox(
        connection.query,
        run,
        run.processedPages,
        availableAt,
        randomUUID(),
      );
    });
    const updated = await this.getSyncRun(run.id);
    if (!updated) throw new Error('Released mail sync run could not be read.');
    return updated;
  }
}
