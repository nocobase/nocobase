import { type DatabaseManager } from '@nocobase/db';
import { type MailAuthorizationTransaction } from '../contracts/persistence.js';
import { type AuthorizationStateRow } from './rows.js';
import { parseJson } from './serialization.js';

export class MailAuthorizationStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async createAuthorizationTransaction(
    transaction: MailAuthorizationTransaction,
  ): Promise<void> {
    await this.database
      .query()
      .insertInto<AuthorizationStateRow>('mailAuthorizationStates')
      .values({
        stateHash: transaction.stateHash,
        userId: transaction.userId,
        providerType: transaction.provider.type,
        providerName: transaction.provider.name,
        redirectUri: transaction.redirectUri,
        verifierCredentialReference: transaction.verifierCredentialReference,
        scopes: JSON.stringify(transaction.scopes),
        initialSyncReceivedAfter: transaction.initialSyncReceivedAfter ?? null,
        expiresAt: transaction.expiresAt,
        createdAt: new Date().toISOString(),
      })
      .execute();
  }

  public async consumeAuthorizationTransaction(
    stateHash: string,
    now: string,
  ): Promise<MailAuthorizationTransaction | undefined> {
    return this.database.transaction(async (connection) => {
      const row = await connection.query
        .selectFrom<AuthorizationStateRow>('mailAuthorizationStates')
        .selectAll()
        .where('stateHash', '=', stateHash)
        .where('consumedAt', 'is', null)
        .where('expiresAt', '>', now)
        .executeTakeFirst<AuthorizationStateRow>();
      if (!row) return undefined;
      const updated = await connection.query
        .updateTable<AuthorizationStateRow>('mailAuthorizationStates')
        .set({ consumedAt: now })
        .where('stateHash', '=', stateHash)
        .where('consumedAt', 'is', null)
        .execute();
      return updated.updatedCount === 1
        ? {
            stateHash: row.stateHash,
            userId: row.userId,
            provider: {
              type: row.providerType,
              name: row.providerName,
            },
            redirectUri: row.redirectUri,
            verifierCredentialReference: row.verifierCredentialReference,
            scopes: parseJson<readonly string[]>(
              row.scopes,
              'authorization scopes',
            ),
            initialSyncReceivedAfter: row.initialSyncReceivedAfter,
            expiresAt: row.expiresAt,
          }
        : undefined;
    });
  }

  public async deleteExpiredAuthorizationTransactions(
    now: string,
  ): Promise<number> {
    const result = await this.database
      .query()
      .deleteFrom<AuthorizationStateRow>('mailAuthorizationStates')
      .where((builder) =>
        builder.or([
          builder.eb('expiresAt', '<=', now),
          builder.eb('consumedAt', 'is not', null),
        ]),
      )
      .execute();
    return result.deletedCount ?? 0;
  }
}
