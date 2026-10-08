import { randomUUID } from 'node:crypto';
import type {
  DatabaseManager,
  Expression,
  ExpressionBuilder,
  Row,
  SqlBool,
} from '@nocobase/db';
import type { MailAccountRemoval } from '../contracts/persistence.js';

type ExpressionFactory<T> = (builder: ExpressionBuilder) => Expression<T>;

interface RemovalRow extends Row {
  accountId: string;
  failed: boolean;
  availableAt: string;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
}

const BATCH_SIZE = 500;

export class MailAccountRemovalsStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async claimAccountRemoval(): Promise<MailAccountRemoval | undefined> {
    const now = new Date().toISOString();
    const ready: ExpressionFactory<SqlBool> = (eb) =>
      eb.and([
        eb.eb('availableAt', '<=', now),
        eb.or([
          eb.eb('leaseToken', 'is', null),
          eb.eb('leaseExpiresAt', '<=', now),
        ]),
      ]);
    const row = await this.database
      .query()
      .selectFrom<RemovalRow>('mailAccountRemovals')
      .select('accountId')
      .where(ready)
      .orderBy('availableAt')
      .orderBy('accountId')
      .executeTakeFirst<RemovalRow>();
    if (!row) return undefined;
    const leaseToken = randomUUID();
    const result = await this.database
      .query()
      .updateTable<RemovalRow>('mailAccountRemovals')
      .set({
        leaseToken,
        leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      })
      .where('accountId', '=', row.accountId)
      .where(ready)
      .execute();
    return result.updatedCount === 1
      ? { accountId: row.accountId, leaseToken }
      : undefined;
  }

  public async renewAccountRemoval(task: MailAccountRemoval): Promise<boolean> {
    const now = new Date();
    const result = await this.database
      .query()
      .updateTable<RemovalRow>('mailAccountRemovals')
      .set({ leaseExpiresAt: new Date(now.getTime() + 60_000).toISOString() })
      .where('accountId', '=', task.accountId)
      .where('leaseToken', '=', task.leaseToken)
      .where('leaseExpiresAt', '>', now.toISOString())
      .execute();
    return result.updatedCount === 1;
  }

  public async releaseAccountRemoval(
    task: MailAccountRemoval,
    failed: boolean,
  ): Promise<void> {
    await this.database
      .query()
      .updateTable<RemovalRow>('mailAccountRemovals')
      .set({
        failed,
        leaseToken: null,
        leaseExpiresAt: null,
        availableAt: new Date(Date.now() + (failed ? 30_000 : 0)).toISOString(),
      })
      .where('accountId', '=', task.accountId)
      .where('leaseToken', '=', task.leaseToken)
      .execute();
  }

  /** A single bounded transaction; true means only external cleanup remains. */
  public async deleteAccountBatch(task: MailAccountRemoval): Promise<boolean> {
    return this.database.transaction(async ({ query }) => {
      // The fencing update also serializes expired-lease takeovers with this batch.
      const locked = await query
        .updateTable<RemovalRow>('mailAccountRemovals')
        .set({ leaseToken: task.leaseToken })
        .where('accountId', '=', task.accountId)
        .where('leaseToken', '=', task.leaseToken)
        .execute();
      if (locked.updatedCount !== 1) return false;
      const account = await query
        .selectFrom('mailAccounts')
        .select('status')
        .where('id', '=', task.accountId)
        .executeTakeFirst<{ status: string }>();
      if (account && account.status !== 'removing')
        throw new Error('Mail account is not being removed.');
      const belongsTo =
        (column: string, table: string): ExpressionFactory<SqlBool> =>
        (eb) =>
          eb.eb(
            column,
            'in',
            eb
              .selectFrom(table)
              .select('id')
              .where('accountId', '=', task.accountId),
          );
      const accountFilter: ExpressionFactory<SqlBool> = (eb) =>
        eb.eb('accountId', '=', task.accountId);
      const stages: readonly {
        table: string;
        keys: readonly string[];
        filter: ExpressionFactory<SqlBool>;
      }[] = [
        {
          table: 'mailMessageLabels',
          keys: ['messageId', 'labelId'],
          filter: belongsTo('messageId', 'mailMessages'),
        },
        {
          table: 'mailMessageFolders',
          // Match the account/folder/message index when selecting each batch.
          keys: ['providerFolderId', 'messageId'],
          filter: accountFilter,
        },
        { table: 'mailMessages', keys: ['id'], filter: accountFilter },
        { table: 'mailDraftStates', keys: ['id'], filter: accountFilter },
        {
          table: 'mailSyncTombstones',
          keys: ['runId', 'providerMessageId'],
          filter: belongsTo('runId', 'mailSyncRuns'),
        },
        {
          table: 'mailOutbox',
          keys: ['id'],
          filter: belongsTo('aggregateId', 'mailSyncRuns'),
        },
        { table: 'mailSyncRuns', keys: ['id'], filter: accountFilter },
        {
          table: 'mailOutbox',
          keys: ['id'],
          filter: belongsTo('aggregateId', 'mailSubmissions'),
        },
        { table: 'mailSubmissions', keys: ['id'], filter: accountFilter },
        { table: 'mailSignatures', keys: ['id'], filter: accountFilter },
        { table: 'mailIdentities', keys: ['id'], filter: accountFilter },
        { table: 'mailFolders', keys: ['id'], filter: accountFilter },
      ];
      for (const stage of stages) {
        let selection = query
          .selectFrom(stage.table)
          .select(stage.keys)
          .where(stage.filter)
          .limit(BATCH_SIZE);
        for (const key of stage.keys) selection = selection.orderBy(key);
        const rows = await selection.execute<Record<string, string>>();
        if (rows.length === 0) continue;
        // Composite keys use small chunks to respect dialect expression/parameter limits.
        for (let offset = 0; offset < rows.length; offset += 100) {
          await query
            .deleteFrom(stage.table)
            .where((eb) =>
              eb.or(
                rows
                  .slice(offset, offset + 100)
                  .map((row) =>
                    eb.and(stage.keys.map((key) => eb.eb(key, '=', row[key]))),
                  ),
              ),
            )
            .execute();
        }
        return false;
      }
      return true;
    });
  }

  public async finishAccountRemoval(
    task: MailAccountRemoval,
  ): Promise<boolean> {
    return this.database.transaction(async ({ query }) => {
      const result = await query
        .deleteFrom('mailAccountRemovals')
        .where('accountId', '=', task.accountId)
        .where('leaseToken', '=', task.leaseToken)
        .execute();
      if (result.deletedCount !== 1) return false;
      await query
        .deleteFrom('mailAccounts')
        .where('id', '=', task.accountId)
        .where('status', '=', 'removing')
        .execute();
      return true;
    });
  }
}
