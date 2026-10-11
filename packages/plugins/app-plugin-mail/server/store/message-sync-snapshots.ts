import type { QueryAdapter } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import type { MailSyncRun } from '../../shared/mail.js';
import type { MailMessagesSyncedEvent } from '../contracts/message-sync-events.js';
import type { AccountRow, MessageRow } from './rows.js';
import { chunks } from './serialization.js';

/** Builds transient delivery snapshots inside the message transaction; never persists an event journal. */
export async function makeMessageSyncEvents(
  query: QueryAdapter,
  run: MailSyncRun,
  insertedMessageIds: readonly string[],
): Promise<readonly MailMessagesSyncedEvent[]> {
  if (insertedMessageIds.length === 0) return [];
  const survivingIds: string[] = [];
  for (const ids of chunks([...new Set(insertedMessageIds)], 100)) {
    const rows = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', run.accountId)
      .where('id', 'in', ids)
      .execute();
    const surviving = new Set(rows.map((row) => row.id));
    survivingIds.push(...ids.filter((id) => surviving.has(id)));
  }
  if (survivingIds.length === 0) return [];
  const phase = eventPhase(run.phase);
  const account = await query
    .selectFrom<AccountRow>('mailAccounts')
    .select('userId')
    .where('id', '=', run.accountId)
    .executeTakeFirst();
  if (!account || typeof account.userId !== 'string')
    throw new Error('Mail sync account disappeared before commit.');
  const ownerId = account.userId;
  const syncedAt = new Date().toISOString();
  return chunks(survivingIds, 100).map((messageIds) =>
    Object.freeze({
      eventId: randomUUID(),
      accountId: run.accountId,
      ownerId,
      syncRunId: run.id,
      phase,
      syncedAt,
      messageIds: Object.freeze(messageIds),
    }),
  );
}

function eventPhase(
  phase: MailSyncRun['phase'],
): MailMessagesSyncedEvent['phase'] {
  switch (phase) {
    case 'history':
      return 'history';
    case 'catchUp':
      return 'catchUp';
    case 'incremental':
      return 'incremental';
    default:
      throw new Error(
        'Mail message sync events require a synchronization phase.',
      );
  }
}
