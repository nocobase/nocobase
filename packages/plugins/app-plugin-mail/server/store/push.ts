import { type DatabaseManager } from '@nocobase/db';
import { normalizeAddress } from './serialization.js';
import {
  type MailAccount,
  type MailProviderIdentity,
} from '../../shared/mail.js';
import { type MailProviderPushSubscription } from '../contracts/provider.js';
import { type MailStore } from '../contracts/persistence.js';
import {
  completePushSubscription,
  fromAccountRow,
  fromPushSubscriptionRow,
} from './mappers.js';
import {
  type AccountRow,
  type PushPendingRow,
  type PushSubscriptionRow,
} from './rows.js';

export class MailPushStore {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly accounts: Pick<MailStore, 'getAccount'>,
  ) {}

  public async getPushSubscription(
    accountId: string,
  ): Promise<MailProviderPushSubscription | undefined> {
    const row = await this.database
      .query()
      .selectFrom<PushSubscriptionRow>('mailPushSubscriptions')
      .selectAll()
      .where('accountId', '=', accountId)
      .executeTakeFirst<PushSubscriptionRow>();
    return row && completePushSubscription(row)
      ? fromPushSubscriptionRow(row)
      : undefined;
  }

  public async findPushSubscription(
    provider: MailProviderIdentity,
    providerSubscriptionId: string,
  ): Promise<MailProviderPushSubscription | undefined> {
    const row = await this.database
      .query()
      .selectFrom<PushSubscriptionRow>('mailPushSubscriptions')
      .selectAll()
      .where('providerType', '=', provider.type)
      .where('providerName', '=', provider.name)
      .where('providerSubscriptionId', '=', providerSubscriptionId)
      .executeTakeFirst<PushSubscriptionRow>();
    return row && completePushSubscription(row)
      ? fromPushSubscriptionRow(row)
      : undefined;
  }

  public async findActiveAccountsForPush(
    provider: MailProviderIdentity,
    providerSubscriptionIds: readonly string[],
    accountAddresses: readonly string[],
  ): Promise<readonly MailAccount[]> {
    const normalizedAddresses = accountAddresses.map(normalizeAddress);
    const accountIds = providerSubscriptionIds.length
      ? await this.database
          .query()
          .selectFrom<PushSubscriptionRow>('mailPushSubscriptions')
          .where('providerType', '=', provider.type)
          .where('providerName', '=', provider.name)
          .where('providerSubscriptionId', 'in', providerSubscriptionIds)
          .pluck<string>('accountId')
      : [];
    if (accountIds.length === 0 && normalizedAddresses.length === 0) return [];
    const rows = await this.database
      .query()
      .selectFrom<AccountRow>('mailAccounts')
      .selectAll()
      .where('providerType', '=', provider.type)
      .where('providerName', '=', provider.name)
      .where('status', '=', 'active')
      .where((builder) =>
        builder.or([
          ...(accountIds.length ? [builder.eb('id', 'in', accountIds)] : []),
          ...(normalizedAddresses.length
            ? [builder.eb('address', 'in', normalizedAddresses)]
            : []),
        ]),
      )
      .execute<AccountRow>();
    return rows.map(fromAccountRow);
  }

  public async savePushSubscription(
    subscription: MailProviderPushSubscription,
    leaseToken?: string,
  ): Promise<boolean> {
    const query = this.database.query();
    let update = query
      .updateTable<PushSubscriptionRow>('mailPushSubscriptions')
      .set({
        providerType: subscription.provider.type,
        providerName: subscription.provider.name,
        providerSubscriptionId: subscription.providerSubscriptionId,
        configurationFingerprint: subscription.configurationFingerprint,
        renewAfter: subscription.renewAfter,
        expiresAt: subscription.expiresAt,
        leaseToken: null,
        leaseExpiresAt: null,
        updatedAt: subscription.updatedAt,
      })
      .where('accountId', '=', subscription.accountId);
    if (leaseToken) update = update.where('leaseToken', '=', leaseToken);
    update = update.where((builder) =>
      builder.exists(
        builder
          .selectFrom('mailAccounts')
          .select('id')
          .whereRef('mailAccounts.id', '=', 'mailPushSubscriptions.accountId')
          .where('mailAccounts.status', '=', 'active'),
      ),
    );
    const result = await update.execute();
    if (result.updatedCount === 1) return true;
    if (leaseToken) return false;
    try {
      await query
        .insertInto<PushSubscriptionRow>('mailPushSubscriptions')
        .values({
          accountId: subscription.accountId,
          providerType: subscription.provider.type,
          providerName: subscription.provider.name,
          providerSubscriptionId: subscription.providerSubscriptionId,
          configurationFingerprint: subscription.configurationFingerprint,
          renewAfter: subscription.renewAfter,
          expiresAt: subscription.expiresAt,
          updatedAt: subscription.updatedAt,
        })
        .execute();
      return true;
    } catch {
      return false;
    }
  }

  public async claimPushSubscriptionMaintenance(
    account: MailAccount,
    leaseToken: string,
    now: string,
    leaseExpiresAt: string,
  ): Promise<
    | import('../contracts/provider.js').MailPushSubscriptionMaintenanceLease
    | undefined
  > {
    try {
      await this.database
        .query()
        .insertInto<PushSubscriptionRow>('mailPushSubscriptions')
        .values({
          accountId: account.id,
          providerType: account.provider.type,
          providerName: account.provider.name,
          leaseToken,
          leaseExpiresAt,
          updatedAt: now,
        })
        .execute();
      const activeAccount = await this.accounts.getAccount(account.id);
      if (activeAccount?.status === 'active') return { leaseToken };
      await this.database
        .query()
        .deleteFrom<PushSubscriptionRow>('mailPushSubscriptions')
        .where('accountId', '=', account.id)
        .where('leaseToken', '=', leaseToken)
        .execute();
      return undefined;
    } catch {
      const result = await this.database
        .query()
        .updateTable<PushSubscriptionRow>('mailPushSubscriptions')
        .set({ leaseToken, leaseExpiresAt, updatedAt: now })
        .where('accountId', '=', account.id)
        .where((builder) =>
          builder.or([
            builder.eb('leaseToken', 'is', null),
            builder.eb('leaseExpiresAt', '<=', now),
          ]),
        )
        .execute();
      if (result.updatedCount !== 1) return undefined;
      const row = await this.database
        .query()
        .selectFrom<PushSubscriptionRow>('mailPushSubscriptions')
        .selectAll()
        .where('accountId', '=', account.id)
        .where('leaseToken', '=', leaseToken)
        .executeTakeFirst<PushSubscriptionRow>();
      const activeAccount = await this.accounts.getAccount(account.id);
      if (activeAccount?.status !== 'active') {
        if (row && completePushSubscription(row)) {
          await this.releasePushSubscriptionMaintenance(account.id, leaseToken);
        } else {
          await this.database
            .query()
            .deleteFrom<PushSubscriptionRow>('mailPushSubscriptions')
            .where('accountId', '=', account.id)
            .where('leaseToken', '=', leaseToken)
            .execute();
        }
        return undefined;
      }
      return row
        ? {
            leaseToken,
            subscription: completePushSubscription(row)
              ? fromPushSubscriptionRow(row)
              : undefined,
          }
        : undefined;
    }
  }

  public async releasePushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
  ): Promise<void> {
    await this.database
      .query()
      .updateTable<PushSubscriptionRow>('mailPushSubscriptions')
      .set({ leaseToken: null, leaseExpiresAt: null })
      .where('accountId', '=', accountId)
      .where('leaseToken', '=', leaseToken)
      .execute();
  }

  public async renewPushSubscriptionMaintenance(
    accountId: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<PushSubscriptionRow>('mailPushSubscriptions')
      .set({ leaseExpiresAt })
      .where('accountId', '=', accountId)
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }

  public async markPushSubscriptionReplacementNeeded(
    accountId: string,
    leaseToken: string,
    updatedAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<PushSubscriptionRow>('mailPushSubscriptions')
      .set({
        providerSubscriptionId: null,
        configurationFingerprint: null,
        renewAfter: null,
        expiresAt: null,
        updatedAt,
      })
      .where('accountId', '=', accountId)
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }

  public async deletePushSubscription(accountId: string): Promise<boolean> {
    const result = await this.database
      .query()
      .deleteFrom<PushSubscriptionRow>('mailPushSubscriptions')
      .where('accountId', '=', accountId)
      .execute();
    return result.deletedCount === 1;
  }

  public async markPushSyncPending(
    accountId: string,
    requestToken: string,
  ): Promise<void> {
    const requestedAt = new Date().toISOString();
    const updated = await this.database
      .query()
      .updateTable<PushPendingRow>('mailPushPending')
      .set({ requestToken, requestedAt })
      .where('accountId', '=', accountId)
      .execute();
    if (updated.updatedCount === 1) return;
    try {
      await this.database
        .query()
        .insertInto<PushPendingRow>('mailPushPending')
        .values({ accountId, requestToken, requestedAt })
        .execute();
    } catch (error) {
      const raced = await this.database
        .query()
        .updateTable<PushPendingRow>('mailPushPending')
        .set({ requestToken, requestedAt })
        .where('accountId', '=', accountId)
        .execute();
      if (raced.updatedCount !== 1) throw error;
    }
  }

  public async markPushSyncPendingBatch(
    accountIds: readonly string[],
    requestToken: string,
  ): Promise<void> {
    const unique = [...new Set(accountIds)];
    if (unique.length === 0) return;
    const requestedAt = new Date().toISOString();
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.database.transaction(async (connection): Promise<void> => {
          const existingIds = await connection.query
            .selectFrom<PushPendingRow>('mailPushPending')
            .where('accountId', 'in', unique)
            .pluck<string>('accountId');
          if (existingIds.length > 0) {
            await connection.query
              .updateTable<PushPendingRow>('mailPushPending')
              .set({ requestToken, requestedAt })
              .where('accountId', 'in', existingIds)
              .execute();
          }
          const existing = new Set(existingIds);
          const missing = unique.filter(
            (accountId) => !existing.has(accountId),
          );
          if (missing.length === 0) return;
          await connection.query
            .insertInto<PushPendingRow>('mailPushPending')
            .values(
              missing.map((accountId) => ({
                accountId,
                requestToken,
                requestedAt,
              })),
            )
            .execute();
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  public async clearPushSyncPending(
    accountId: string,
    requestToken: string,
  ): Promise<void> {
    await this.database
      .query()
      .deleteFrom<PushPendingRow>('mailPushPending')
      .where('accountId', '=', accountId)
      .where('requestToken', '=', requestToken)
      .execute();
  }
}
