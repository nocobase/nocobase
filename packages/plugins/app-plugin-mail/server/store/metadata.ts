import { lockWritableAccount } from './account-guard.js';
import { type DatabaseManager } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import {
  type MailFolder,
  type MailIdentity,
  type MailLabel,
  type MailLabelColor,
  type MailSignature,
} from '../../shared/mail.js';
import { type NormalizedMailFolder } from '../contracts/provider.js';
import { replaceAccountIdentities, saveSignature } from './account-writes.js';
import {
  fromFolderRow,
  fromIdentityRow,
  fromLabelRow,
  fromSignatureRow,
} from './mappers.js';
import { upsertFolders } from './message-writes.js';
import {
  type FolderRow,
  type IdentityRow,
  type LabelRow,
  type SignatureRow,
} from './rows.js';

export class MailMetadataStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async listIdentities(
    accountId: string,
  ): Promise<readonly MailIdentity[]> {
    const rows = await this.database
      .query()
      .selectFrom<IdentityRow>('mailIdentities')
      .selectAll()
      .where('accountId', '=', accountId)
      .orderBy('address', 'asc')
      .execute<IdentityRow>();
    return rows.map(fromIdentityRow);
  }

  public async replaceIdentities(
    accountId: string,
    identities: readonly MailIdentity[],
  ): Promise<void> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, accountId);
      await replaceAccountIdentities(connection.query, accountId, identities);
    });
  }

  public async getIdentity(
    identityId: string,
  ): Promise<MailIdentity | undefined> {
    const row = await this.database
      .query()
      .selectFrom<IdentityRow>('mailIdentities')
      .selectAll()
      .where('id', '=', identityId)
      .executeTakeFirst<IdentityRow>();
    return row ? fromIdentityRow(row) : undefined;
  }

  public async updateIdentity(
    identityId: string,
    patch: Pick<MailIdentity, 'displayName'>,
  ): Promise<MailIdentity | undefined> {
    await this.database.transaction(async ({ query }) => {
      const identity = await query
        .selectFrom<IdentityRow>('mailIdentities')
        .select('accountId')
        .where('id', '=', identityId)
        .executeTakeFirst<Pick<IdentityRow, 'accountId'>>();
      if (!identity) return;
      await lockWritableAccount(query, identity.accountId);
      await query
        .updateTable<IdentityRow>('mailIdentities')
        .set({
          displayName: patch.displayName ?? null,
        })
        .where('id', '=', identityId)
        .execute();
    });
    return this.getIdentity(identityId);
  }

  public async listSignatures(
    accountId: string,
  ): Promise<readonly MailSignature[]> {
    const rows = await this.database
      .query()
      .selectFrom<SignatureRow>('mailSignatures')
      .selectAll()
      .where('accountId', '=', accountId)
      .orderBy('name', 'asc')
      .orderBy('id', 'asc')
      .execute<SignatureRow>();
    return rows.map(fromSignatureRow);
  }

  public async getSignature(
    signatureId: string,
  ): Promise<MailSignature | undefined> {
    const row = await this.database
      .query()
      .selectFrom<SignatureRow>('mailSignatures')
      .selectAll()
      .where('id', '=', signatureId)
      .executeTakeFirst<SignatureRow>();
    return row ? fromSignatureRow(row) : undefined;
  }

  public async saveSignature(signature: MailSignature): Promise<MailSignature> {
    await this.database.transaction(async (connection): Promise<void> => {
      await lockWritableAccount(connection.query, signature.accountId);
      await saveSignature(connection.query, signature);
    });
    return signature;
  }

  public async deleteSignature(
    accountId: string,
    signatureId: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .deleteFrom<SignatureRow>('mailSignatures')
      .where('id', '=', signatureId)
      .where('accountId', '=', accountId)
      .execute();
    return result.deletedCount === 1;
  }

  public async listFolders(accountId: string): Promise<readonly MailFolder[]> {
    const rows = await this.database
      .query()
      .selectFrom<FolderRow>('mailFolders')
      .selectAll()
      .where('accountId', '=', accountId)
      .orderBy('name', 'asc')
      .execute<FolderRow>();
    return rows.map(fromFolderRow);
  }

  public async listLabels(ownerId: string): Promise<readonly MailLabel[]> {
    const rows = await this.database
      .query()
      .selectFrom<LabelRow>('mailLabels')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .orderBy('name', 'asc')
      .execute<LabelRow>();
    return rows.map(fromLabelRow);
  }

  public async createLabel(
    ownerId: string,
    name: string,
    color: MailLabelColor,
  ): Promise<MailLabel> {
    const now = new Date().toISOString();
    const row: LabelRow = {
      id: randomUUID(),
      ownerId,
      name,
      color,
      createdAt: now,
      updatedAt: now,
    };
    await this.database
      .query()
      .insertInto<LabelRow>('mailLabels')
      .values(row)
      .execute();
    return fromLabelRow(row);
  }

  public async updateLabel(
    ownerId: string,
    labelId: string,
    patch: Pick<MailLabel, 'name' | 'color'>,
  ): Promise<MailLabel | undefined> {
    const result = await this.database
      .query()
      .updateTable<LabelRow>('mailLabels')
      .set({
        name: patch.name,
        color: patch.color,
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', labelId)
      .where('ownerId', '=', ownerId)
      .execute();
    if (result.updatedCount !== 1) return undefined;
    const row = await this.database
      .query()
      .selectFrom<LabelRow>('mailLabels')
      .selectAll()
      .where('id', '=', labelId)
      .where('ownerId', '=', ownerId)
      .executeTakeFirst<LabelRow>();
    return row ? fromLabelRow(row) : undefined;
  }

  public async deleteLabel(ownerId: string, labelId: string): Promise<boolean> {
    const result = await this.database
      .query()
      .deleteFrom<LabelRow>('mailLabels')
      .where('id', '=', labelId)
      .where('ownerId', '=', ownerId)
      .execute();
    return result.deletedCount === 1;
  }

  public async saveFolder(
    accountId: string,
    folder: NormalizedMailFolder,
  ): Promise<MailFolder> {
    await this.database.transaction(async ({ query }) => {
      await lockWritableAccount(query, accountId);
      await upsertFolders(query, accountId, [folder]);
    });
    const row = await this.database
      .query()
      .selectFrom<FolderRow>('mailFolders')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', folder.providerFolderId)
      .executeTakeFirst<FolderRow>();
    if (!row) throw new Error('Saved mail label was not found.');
    return fromFolderRow(row);
  }
}
