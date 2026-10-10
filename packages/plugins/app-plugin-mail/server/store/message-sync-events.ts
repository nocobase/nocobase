import type { DatabaseManager, QueryAdapter, Row } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { MailSyncRun } from '../../shared/mail.js';
import type {
  MailListMessageSyncEventsInput,
  MailMessageSyncEventsPage,
  MailMessagesSyncedEvent,
} from '../contracts/message-sync-events.js';
import { mailInvalidArgument } from '../services/errors.js';
import type { AccountRow, MessageRow } from './rows.js';
import { chunks, parseJson, toIsoString } from './serialization.js';

interface EventStateRow extends Row {
  accountId: string;
  lastSequence: number | string | bigint;
  lastSyncedAt: string;
}

interface EventRow extends Row {
  id: string;
  accountId: string;
  sequence: number | string | bigint;
  ownerId: string;
  syncRunId: string;
  phase: MailMessagesSyncedEvent['phase'];
  syncedAt: string;
  messageIds: string | readonly string[];
}

const sequenceSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const checkpointSchema = z.strictObject({
  version: z.literal(1),
  kind: z.literal('checkpoint'),
  accountId: z.string().min(1),
  sequence: sequenceSchema,
});
const pageSchema = z.strictObject({
  version: z.literal(1),
  kind: z.literal('page'),
  accountId: z.string().min(1),
  afterSequence: sequenceSchema,
  sequence: sequenceSchema,
  upperSequence: sequenceSchema,
  syncedSince: z.iso.datetime({ offset: true }).nullable(),
});
type Checkpoint = z.infer<typeof checkpointSchema>;
type PageToken = z.infer<typeof pageSchema>;

function encode(token: Checkpoint | PageToken): string {
  return Buffer.from(JSON.stringify(token)).toString('base64url');
}

function decode(token: string, field: 'after' | 'pageToken'): unknown {
  // Buffer's decoder is permissive; only canonical, bounded base64url is accepted.
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > 4096 ||
    !/^[A-Za-z0-9_-]+$/.test(token)
  )
    throw mailInvalidArgument('Invalid mail message sync token.', field);
  const bytes = Buffer.from(token, 'base64url');
  if (bytes.toString('base64url') !== token)
    throw mailInvalidArgument('Invalid mail message sync token.', field);
  try {
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    // Reject duplicate keys, alternative encodings and invalid UTF-8, not just unknown keys.
    if (Buffer.from(JSON.stringify(value)).toString('base64url') !== token)
      throw new Error('Noncanonical token.');
    return value;
  } catch (cause) {
    throw mailInvalidArgument('Invalid mail message sync token.', field, cause);
  }
}

function readSequence(value: number | string | bigint): number {
  if (typeof value === 'string' && !/^(0|[1-9][0-9]*)$/.test(value))
    throw new Error('Stored mail message sync sequence is invalid.');
  const sequence = Number(value);
  if (!Number.isSafeInteger(sequence) || sequence < 0)
    throw new Error(
      'Stored mail message sync sequence is outside the supported range.',
    );
  return sequence;
}

function parseTime(value: string, field: string): string {
  if (
    !z.iso.datetime({ offset: true }).safeParse(value).success ||
    !Number.isFinite(Date.parse(value))
  )
    throw mailInvalidArgument(
      'Mail sync time must be an RFC 3339 timestamp.',
      field,
    );
  // Events have millisecond precision. Round a finer lower bound upward, not
  // downward, so an event before the requested instant cannot match it.
  const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1];
  const extraMillisecond = fraction && /[1-9]/.test(fraction.slice(3)) ? 1 : 0;
  const normalized = new Date(
    Date.parse(value) + extraMillisecond,
  ).toISOString();
  if (!z.iso.datetime({ offset: true }).safeParse(normalized).success)
    throw mailInvalidArgument(
      'Mail sync time is outside the supported range.',
      field,
    );
  return normalized;
}

function fromRow(row: EventRow): MailMessagesSyncedEvent {
  return {
    eventId: row.id,
    accountId: row.accountId,
    ownerId: row.ownerId,
    syncRunId: row.syncRunId,
    phase: row.phase,
    syncedAt: toIsoString(row.syncedAt),
    messageIds: parseJson<readonly string[]>(
      row.messageIds,
      'message sync event IDs',
    ),
  };
}

/** Requires the caller's transaction and its existing account write lock. */
export async function appendMessageSyncEvents(
  query: QueryAdapter,
  run: MailSyncRun,
  insertedMessageIds: readonly string[],
): Promise<readonly MailMessagesSyncedEvent[]> {
  if (insertedMessageIds.length === 0) return [];
  const survivingIds = new Set<string>();
  for (const ids of chunks(insertedMessageIds, 100)) {
    const rows = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', run.accountId)
      .where('id', 'in', ids)
      .execute<Pick<MessageRow, 'id'>>();
    for (const row of rows) survivingIds.add(row.id);
  }
  const batches = chunks(
    insertedMessageIds.filter((id) => survivingIds.has(id)),
    100,
  );
  if (batches.length === 0) return [];
  if (
    run.phase !== 'history' &&
    run.phase !== 'catchUp' &&
    run.phase !== 'incremental'
  )
    throw new Error('Mail sync message inserts require a message sync phase.');
  const account = await query
    .selectFrom<AccountRow>('mailAccounts')
    .select('userId')
    .where('id', '=', run.accountId)
    .executeTakeFirst<Pick<AccountRow, 'userId'>>();
  if (!account) throw new Error('Mail sync event account was not found.');
  const state = await query
    .selectFrom<EventStateRow>('mailMessageSyncEventStates')
    .selectAll()
    .where('accountId', '=', run.accountId)
    .executeTakeFirst<EventStateRow>();
  const lastSequence = state ? readSequence(state.lastSequence) : 0;
  if (lastSequence > Number.MAX_SAFE_INTEGER - batches.length)
    throw new Error('Mail message sync event sequence was exhausted.');
  const now = new Date().toISOString();
  const previousTime = state ? toIsoString(state.lastSyncedAt) : undefined;
  const syncedAt =
    previousTime && Date.parse(previousTime) > Date.parse(now)
      ? previousTime
      : now;
  const phase: MailMessagesSyncedEvent['phase'] =
    run.phase === 'history'
      ? 'history'
      : run.phase === 'catchUp'
        ? 'catchUp'
        : 'incremental';
  const events = batches.map((messageIds): MailMessagesSyncedEvent => ({
    eventId: randomUUID(),
    accountId: run.accountId,
    ownerId: account.userId,
    syncRunId: run.id,
    phase,
    syncedAt,
    messageIds,
  }));
  const values: EventStateRow = {
    accountId: run.accountId,
    lastSequence: lastSequence + batches.length,
    lastSyncedAt: syncedAt,
  };
  if (state)
    await query
      .updateTable<EventStateRow>('mailMessageSyncEventStates')
      .set(values)
      .where('accountId', '=', run.accountId)
      .execute();
  else
    await query
      .insertInto<EventStateRow>('mailMessageSyncEventStates')
      .values(values)
      .execute();
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    await query
      .insertInto<EventRow>('mailMessageSyncEvents')
      .values({
        id: event.eventId,
        accountId: event.accountId,
        sequence: lastSequence + index + 1,
        ownerId: event.ownerId,
        syncRunId: event.syncRunId,
        phase: event.phase,
        syncedAt,
        messageIds: JSON.stringify(event.messageIds),
      })
      .execute();
  }
  return events;
}

export class MailMessageSyncEventsStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async listMessageSyncEvents(
    input: MailListMessageSyncEventsInput,
  ): Promise<MailMessageSyncEventsPage> {
    const { accountId } = input;
    const pageSize = input.pageSize ?? 50;
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200)
      throw mailInvalidArgument(
        'Mail message sync page size must be between 1 and 200.',
        'pageSize',
      );
    if (typeof accountId !== 'string' || accountId.length === 0)
      throw mailInvalidArgument(
        'Mail message sync account is required.',
        'accountId',
      );
    if (
      (input.syncedSince !== undefined && input.after !== undefined) ||
      (input.pageToken !== undefined &&
        (input.after !== undefined || input.syncedSince !== undefined))
    )
      throw mailInvalidArgument(
        'Mail message sync paging inputs are mutually exclusive.',
      );
    // This is a committed high-water mark. No transaction spans multiple pages.
    const state = await this.database
      .query()
      .selectFrom<EventStateRow>('mailMessageSyncEventStates')
      .select('lastSequence')
      .where('accountId', '=', accountId)
      .executeTakeFirst<Pick<EventStateRow, 'lastSequence'>>();
    const highest = state ? readSequence(state.lastSequence) : 0;
    let position = 0;
    let afterSequence = 0;
    let upperSequence = highest;
    let syncedSince: string | null =
      input.syncedSince === undefined
        ? null
        : parseTime(input.syncedSince, 'syncedSince');
    if (input.pageToken !== undefined) {
      const parsed = pageSchema.safeParse(decode(input.pageToken, 'pageToken'));
      if (!parsed.success)
        throw mailInvalidArgument(
          'Invalid mail message sync page token.',
          'pageToken',
        );
      const token = parsed.data;
      if (
        token.accountId !== accountId ||
        token.upperSequence > highest ||
        token.sequence <= token.afterSequence ||
        token.sequence >= token.upperSequence ||
        (token.syncedSince !== null &&
          (token.afterSequence !== 0 ||
            parseTime(token.syncedSince, 'pageToken') !== token.syncedSince))
      )
        throw mailInvalidArgument(
          'Mail message sync page token is outside its committed range.',
          'pageToken',
        );
      // A continuation can only point at a row already returned by its filter.
      // A syntactically valid future time combined with an older position would
      // otherwise silently skip the remainder of a round.
      const boundary = await this.database
        .query()
        .selectFrom<EventRow>('mailMessageSyncEvents')
        .select('syncedAt')
        .where('accountId', '=', accountId)
        .where('sequence', '=', token.sequence)
        .executeTakeFirst<Pick<EventRow, 'syncedAt'>>();
      if (
        !boundary ||
        (token.syncedSince !== null &&
          toIsoString(boundary.syncedAt) < token.syncedSince)
      )
        throw mailInvalidArgument(
          'Mail message sync page token does not match its filter.',
          'pageToken',
        );
      position = token.sequence;
      afterSequence = token.afterSequence;
      upperSequence = token.upperSequence;
      syncedSince = token.syncedSince;
    } else if (input.after !== undefined) {
      const parsed = checkpointSchema.safeParse(decode(input.after, 'after'));
      if (
        !parsed.success ||
        parsed.data.accountId !== accountId ||
        parsed.data.sequence > highest
      )
        throw mailInvalidArgument(
          'Invalid mail message sync checkpoint.',
          'after',
        );
      position = parsed.data.sequence;
      afterSequence = position;
    }
    let selection = this.database
      .query()
      .selectFrom<EventRow>('mailMessageSyncEvents')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('sequence', '>', position)
      .where('sequence', '<=', upperSequence);
    if (syncedSince !== null)
      selection = selection.where('syncedAt', '>=', syncedSince);
    const rows = await selection
      .orderBy('sequence', 'asc')
      .limit(pageSize + 1)
      .execute<EventRow>();
    const page = rows.slice(0, pageSize);
    const items = page.map(fromRow);
    if (rows.length > pageSize) {
      return {
        items,
        nextPageToken: encode({
          version: 1,
          kind: 'page',
          accountId,
          afterSequence,
          sequence: readSequence(page[page.length - 1].sequence),
          upperSequence,
          syncedSince,
        }),
      };
    }
    return {
      items,
      checkpoint: encode({
        version: 1,
        kind: 'checkpoint',
        accountId,
        sequence: upperSequence,
      }),
    };
  }
}
