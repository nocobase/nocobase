import { lockWritableAccount } from './account-guard.js';
import { type DatabaseManager } from '@nocobase/db';
import {
  type MailAccount,
  type MailIdentity,
  type MailProviderIdentity,
  type MailSignature,
} from '../../shared/mail.js';
import {
  persistAccount,
  replaceAccountIdentities,
  saveSignature,
} from './account-writes.js';
import { fromAccountRow } from './mappers.js';
import { type AccountRow } from './rows.js';
import { normalizeAddress } from './serialization.js';

export class MailAccountsStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async getAccount(accountId: string): Promise<MailAccount | undefined> {
    const row = await this.database
      .query()
      .selectFrom<AccountRow>('mailAccounts')
      .selectAll()
      .where('id', '=', accountId)
      .executeTakeFirst<AccountRow>();
    return row ? fromAccountRow(row) : undefined;
  }

  public async findAccountByProviderIdentity(
    provider: MailProviderIdentity,
    address: string,
    authorizationSubject?: string,
  ): Promise<MailAccount | undefined> {
    if (authorizationSubject) {
      const bySubject = await this.database
        .query()
        .selectFrom<AccountRow>('mailAccounts')
        .selectAll()
        .where('providerType', '=', provider.type)
        .where('providerName', '=', provider.name)
        .where('authorizationSubject', '=', authorizationSubject)
        .executeTakeFirst<AccountRow>();
      if (bySubject) return fromAccountRow(bySubject);
    }
    const row = await this.database
      .query()
      .selectFrom<AccountRow>('mailAccounts')
      .selectAll()
      .where('providerType', '=', provider.type)
      .where('providerName', '=', provider.name)
      .where('address', '=', normalizeAddress(address))
      .executeTakeFirst<AccountRow>();
    return row ? fromAccountRow(row) : undefined;
  }

  public async listAccounts(userId: string): Promise<readonly MailAccount[]> {
    const rows = await this.database
      .query()
      .selectFrom<AccountRow>('mailAccounts')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('address', 'asc')
      .execute<AccountRow>();
    for (const row of rows) {
      if (row.status !== 'removing') continue;
      const removal = await this.database
        .query()
        .selectFrom('mailAccountRemovals')
        .select('failed')
        .where('accountId', '=', row.id)
        .executeTakeFirst<{ failed: boolean }>();
      row.removalFailed = removal?.failed;
    }
    return rows.map(fromAccountRow);
  }

  public async listAllAccounts(): Promise<readonly MailAccount[]> {
    const rows = await this.database
      .query()
      .selectFrom<AccountRow>('mailAccounts')
      .selectAll()
      .orderBy('userId', 'asc')
      .orderBy('address', 'asc')
      .execute<AccountRow>();
    return rows.map(fromAccountRow);
  }

  public async updateAccountStatus(
    accountId: string,
    status: 'active' | 'suspended',
  ): Promise<void> {
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, accountId);
      await query
        .updateTable<AccountRow>('mailAccounts')
        .set({ status, updatedAt: new Date().toISOString() })
        .where('id', '=', accountId)
        .execute();
    });
  }

  public async saveAccount(account: MailAccount): Promise<MailAccount> {
    await this.database.transaction(async ({ query }) => {
      await persistAccount(query, account);
    });
    return account;
  }

  public async markAccountRemoving(
    accountId: string,
    userId: string,
  ): Promise<boolean> {
    return this.database.transaction(async ({ query }) => {
      const updated = await query
        .updateTable<AccountRow>('mailAccounts')
        .set({ status: 'removing', updatedAt: new Date().toISOString() })
        .where('id', '=', accountId)
        .where('userId', '=', userId)
        .execute();
      if (updated.updatedCount !== 1) return false;
      const existing = await query
        .selectFrom('mailAccountRemovals')
        .select('accountId')
        .where('accountId', '=', accountId)
        .executeTakeFirst();
      if (!existing) {
        await query
          .insertInto('mailAccountRemovals')
          .values({
            accountId,
            failed: false,
            availableAt: new Date().toISOString(),
          })
          .execute();
      }
      return true;
    });
  }

  public async markAccountReauthorizationRequired(
    accountId: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<AccountRow>('mailAccounts')
      .set({
        status: 'reauthorizationRequired',
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', accountId)
      .where('status', '=', 'active')
      .execute();
    return result.updatedCount === 1;
  }

  public async saveAuthorizedAccount(
    account: MailAccount,
    identities: readonly MailIdentity[],
    signatures: readonly MailSignature[] = [],
    replacingAccount: boolean = false,
  ): Promise<void> {
    await this.database.transaction(async (connection): Promise<void> => {
      if (replacingAccount)
        await lockWritableAccount(connection.query, account.id);
      await persistAccount(connection.query, account);
      await replaceAccountIdentities(connection.query, account.id, identities);
      for (const signature of signatures) {
        await saveSignature(connection.query, signature);
      }
    });
  }
}
