import { type SelectQuery } from '@nocobase/db';
import { Buffer } from 'node:buffer';

import { mailInvalidArgument } from '../services/errors.js';

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

/** Where a page of a settings log ends: the last row's creation time and id, in the list's newest-first order. */
interface MailLogCursor {
  readonly createdAt: string;
  readonly id: string;
}

export function encodeLogCursor(row: MailLogCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt, id: row.id }),
  ).toString('base64url');
}

function parseLogCursor(token: string): MailLogCursor {
  try {
    const value = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    ) as Partial<MailLogCursor>;
    if (
      typeof value.createdAt === 'string' &&
      !Number.isNaN(Date.parse(value.createdAt)) &&
      typeof value.id === 'string' &&
      value.id.length > 0 &&
      value.id.length <= 255
    )
      return { createdAt: value.createdAt, id: value.id };
  } catch (cause) {
    throw mailInvalidArgument(
      'Mail page token is invalid.',
      'pageToken',
      cause,
    );
  }
  throw mailInvalidArgument('Mail page token is invalid.', 'pageToken');
}

/**
 * Continues a newest-first log after `pageToken`. Paging by the last row's time and id, not by an offset, keeps a page
 * from repeating rows when newer ones arrive, or skipping rows when the retention period deletes older ones, between
 * two requests.
 */
export function applyLogCursor<TQuery extends SelectQuery>(
  query: TQuery,
  pageToken: string | undefined,
): TQuery {
  if (pageToken === undefined) return query;
  const cursor = parseLogCursor(pageToken);
  return (query as SelectQuery).where((builder) =>
    builder.eb.or([
      builder.eb('createdAt', '<', cursor.createdAt),
      builder.eb.and([
        builder.eb('createdAt', '=', cursor.createdAt),
        builder.eb('id', '<', cursor.id),
      ]),
    ]),
  ) as TQuery;
}
