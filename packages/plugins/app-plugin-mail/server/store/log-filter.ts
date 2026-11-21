import { type SelectQuery } from '@nocobase/db';

import { type MailManagedLogFilter } from '../../shared/mail.js';
import { type MailStore } from '../contracts/persistence.js';

/**
 * The account ids a member filter allows: `undefined` when the filter names no member, so every account matches, and
 * an empty list when the member has no account, so nothing does.
 */
export async function accountIdsOfMember(
  accounts: Pick<MailStore, 'listAccounts'>,
  filter: MailManagedLogFilter,
): Promise<readonly string[] | undefined> {
  if (filter.userId === undefined) return undefined;
  const ids = (await accounts.listAccounts(filter.userId)).map(
    (account) => account.id,
  );
  return filter.accountId === undefined
    ? ids
    : ids.filter((id) => id === filter.accountId);
}

/** Narrows a query of `mailSyncRuns` or `mailSubmissions` by everything but the member, resolved by the caller. */
export function applyManagedLogFilter<TQuery extends SelectQuery>(
  query: TQuery,
  filter: MailManagedLogFilter,
  memberAccountIds: readonly string[] | undefined,
): TQuery {
  let narrowed = query as SelectQuery;
  if (memberAccountIds !== undefined)
    narrowed = narrowed.where('accountId', 'in', [...memberAccountIds]);
  else if (filter.accountId !== undefined)
    narrowed = narrowed.where('accountId', '=', filter.accountId);
  if (filter.statuses?.length)
    narrowed = narrowed.where('status', 'in', [...filter.statuses]);
  if (filter.createdFrom !== undefined)
    narrowed = narrowed.where('createdAt', '>=', filter.createdFrom);
  if (filter.createdBefore !== undefined)
    narrowed = narrowed.where('createdAt', '<', filter.createdBefore);
  return narrowed as TQuery;
}

/** Statuses after which a sync run never changes again. */
export const FINISHED_SYNC_RUN_STATUSES: readonly string[] = [
  'completed',
  'partial',
  'failed',
  'cancelled',
];

/** Statuses after which a submission is not sent anymore by itself; `failed` can still be retried by its owner. */
export const FINISHED_SUBMISSION_STATUSES: readonly string[] = [
  'accepted',
  'failed',
  'unknown',
  'cancelled',
];
