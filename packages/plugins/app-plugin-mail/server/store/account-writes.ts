import { lockWritableAccount } from './account-guard.js';
import { type QueryAdapter } from '@nocobase/db';
import {
  type MailAccount,
  type MailIdentity,
  type MailSignature,
} from '../../shared/mail.js';
import { toAccountRow, toIdentityRow } from './mappers.js';
import {
  type AccountRow,
  type IdentityRow,
  type SignatureRow,
} from './rows.js';

export async function persistAccount(
  query: QueryAdapter,
  account: MailAccount,
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await query
    .selectFrom<AccountRow>('mailAccounts')
    .select('id')
    .where('id', '=', account.id)
    .executeTakeFirst<Pick<AccountRow, 'id'>>();
  const row = toAccountRow(account, now, existing ? undefined : now);
  if (existing) {
    await lockWritableAccount(query, account.id);
    await query
      .updateTable<AccountRow>('mailAccounts')
      .set(row)
      .where('id', '=', account.id)
      .execute();
    return;
  }
  await query.insertInto<AccountRow>('mailAccounts').values(row).execute();
}

export async function replaceAccountIdentities(
  query: QueryAdapter,
  accountId: string,
  identities: readonly MailIdentity[],
): Promise<void> {
  await query
    .updateTable<IdentityRow>('mailIdentities')
    .set({ primaryForAccountId: null })
    .where('accountId', '=', accountId)
    .execute();
  const existingIds = await query
    .selectFrom<IdentityRow>('mailIdentities')
    .where('accountId', '=', accountId)
    .pluck<string>('id');
  const nextIds = new Set(identities.map((identity) => identity.id));
  const staleIds = existingIds.filter((id) => !nextIds.has(id));
  for (const identity of identities) {
    const row = toIdentityRow(identity);
    if (existingIds.includes(identity.id)) {
      await query
        .updateTable<IdentityRow>('mailIdentities')
        .set(row)
        .where('id', '=', identity.id)
        .execute();
    } else {
      await query
        .insertInto<IdentityRow>('mailIdentities')
        .values(row)
        .execute();
    }
  }
  if (staleIds.length > 0 && identities.length > 0) {
    const fallbackIdentityId =
      identities.find((identity) => identity.isPrimary)?.id ?? identities[0].id;
    await query
      .updateTable<SignatureRow>('mailSignatures')
      .set({
        identityId: fallbackIdentityId,
        defaultForIdentityId: null,
      })
      .where('accountId', '=', accountId)
      .where('identityId', 'in', staleIds)
      .execute();
    await query
      .deleteFrom<IdentityRow>('mailIdentities')
      .where('id', 'in', staleIds)
      .execute();
  }
}

export async function saveSignature(
  query: QueryAdapter,
  signature: MailSignature,
): Promise<void> {
  const existing = await query
    .selectFrom<SignatureRow>('mailSignatures')
    .select(['id', 'identityId'])
    .where('id', '=', signature.id)
    .executeTakeFirst<Pick<SignatureRow, 'id' | 'identityId'>>();
  const legacyIdentityId =
    existing?.identityId ??
    (await findPrimaryIdentityId(query, signature.accountId));
  if (!legacyIdentityId) {
    throw new Error('Mail account has no sending identity.');
  }

  if (signature.isDefault) {
    await query
      .updateTable<SignatureRow>('mailSignatures')
      .set({
        defaultForAccountId: null,
        defaultForIdentityId: null,
        updatedAt: signature.updatedAt,
      })
      .where('accountId', '=', signature.accountId)
      .execute();
    await query
      .updateTable<SignatureRow>('mailSignatures')
      .set({ defaultForIdentityId: null })
      .where('identityId', '=', legacyIdentityId)
      .execute();
  }
  const row: SignatureRow = {
    id: signature.id,
    accountId: signature.accountId,
    identityId: legacyIdentityId,
    name: signature.name,
    text: signature.text,
    html: signature.html,
    defaultForAccountId: signature.isDefault ? signature.accountId : null,
    defaultForIdentityId: signature.isDefault ? legacyIdentityId : null,
    createdAt: signature.createdAt,
    updatedAt: signature.updatedAt,
  };
  if (existing) {
    await query
      .updateTable<SignatureRow>('mailSignatures')
      .set(row)
      .where('id', '=', signature.id)
      .execute();
  } else {
    await query
      .insertInto<SignatureRow>('mailSignatures')
      .values(row)
      .execute();
  }
}

async function findPrimaryIdentityId(
  query: QueryAdapter,
  accountId: string,
): Promise<string | undefined> {
  const primary = await query
    .selectFrom<IdentityRow>('mailIdentities')
    .select('id')
    .where('accountId', '=', accountId)
    .where('primaryForAccountId', '=', accountId)
    .executeTakeFirst<Pick<IdentityRow, 'id'>>();
  if (primary) return primary.id;
  const first = await query
    .selectFrom<IdentityRow>('mailIdentities')
    .select('id')
    .where('accountId', '=', accountId)
    .orderBy('address', 'asc')
    .executeTakeFirst<Pick<IdentityRow, 'id'>>();
  return first?.id;
}
