import type { QueryAdapter } from '@nocobase/db';
import type { AccountRow } from './rows.js';
import { mailAccountRemoving } from '../services/errors.js';

/** Call inside the writing transaction. Serialize writes with account removal. */
export async function lockWritableAccount(
  query: QueryAdapter,
  accountId: string,
): Promise<void> {
  const result = await query
    .updateTable<AccountRow>('mailAccounts')
    .set({ id: accountId })
    .where('id', '=', accountId)
    .where('status', '!=', 'removing')
    .execute();
  if (result.updatedCount !== 1) throw mailAccountRemoving();
}
