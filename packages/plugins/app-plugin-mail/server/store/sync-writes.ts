import { type QueryAdapter } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { type MailSyncCursor, type MailSyncRun } from '../../shared/mail.js';
import { type OutboxRow, type SyncStateRow } from './rows.js';

export async function upsertSyncState(
  query: QueryAdapter,
  accountId: string,
  cursor: MailSyncCursor,
): Promise<void> {
  const existing = await query
    .selectFrom<SyncStateRow>('mailSyncStates')
    .select('accountId')
    .where('accountId', '=', accountId)
    .executeTakeFirst();
  const row: SyncStateRow = {
    accountId,
    cursor: JSON.stringify(cursor),
    lastSyncedAt: new Date().toISOString(),
  };
  if (existing) {
    await query
      .updateTable<SyncStateRow>('mailSyncStates')
      .set(row)
      .where('accountId', '=', accountId)
      .execute();
  } else {
    await query
      .insertInto<SyncStateRow>('mailSyncStates')
      .values(row)
      .execute();
  }
}

export async function insertOutbox(
  query: QueryAdapter,
  run: Pick<MailSyncRun, 'id' | 'phase' | 'revision'>,
  sequence: number,
  now: string,
  retryId?: string,
): Promise<void> {
  await query
    .insertInto<OutboxRow>('mailOutbox')
    .values({
      id: randomUUID(),
      type: 'syncMailbox',
      aggregateId: run.id,
      deduplicationKey: `sync:${run.id}:${sequence}:${run.phase}${retryId ? `:retry:${retryId}` : ''}`,
      payload: JSON.stringify({
        version: 1,
        syncRunId: run.id,
        expectedRevision: run.revision,
        expectedPhase: run.phase,
      }),
      status: 'pending',
      attempts: 0,
      availableAt: now,
      createdAt: now,
    })
    .execute();
}
