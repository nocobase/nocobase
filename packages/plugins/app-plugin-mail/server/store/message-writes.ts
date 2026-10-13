import { acceptDraftWrite } from './draft-states.js';
import { assertDraftEditable } from './scheduled-drafts.js';
import { type QueryAdapter } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { MAIL_LOCAL_DRAFT_FOLDER_ID } from '../../shared/mail.js';
import { type NormalizedMailMessage } from '../contracts/provider.js';
import { toMessageRow } from './mappers.js';
import {
  type FolderRow,
  type ImapLocationRow,
  type MessageFolderRow,
  type MessageLabelRow,
  type MessageRow,
} from './rows.js';
import type {
  ImapCopyEvidence,
  ImapLocationChange,
  ImapStoredLocation,
  ImapLocationTuple,
  ImapIdSource,
} from '../adapters/imap-smtp/types.js';
import { chunks } from './serialization.js';
import {
  deleteMessageParticipants,
  replaceMessageParticipants,
} from './message-participants.js';

export async function upsertMessages(
  query: QueryAdapter,
  accountId: string,
  messages: readonly NormalizedMailMessage[],
  preserveUpdatedAfter?: string,
  replaceFolders = true,
): Promise<void> {
  const uniqueMessages = [
    ...new Map(
      messages.map((message) => [message.providerMessageId, message]),
    ).values(),
  ];
  if (uniqueMessages.length === 0) return;
  const now = new Date().toISOString();
  const existingRows = await query
    .selectFrom<MessageRow>('mailMessages')
    .select([
      'id',
      'providerMessageId',
      'createdAt',
      'updatedAt',
      'contentStatus',
      'note',
      'todo',
    ])
    .where('accountId', '=', accountId)
    .where(
      'providerMessageId',
      'in',
      uniqueMessages.map((message) => message.providerMessageId),
    )
    .execute<
      Pick<
        MessageRow,
        | 'id'
        | 'providerMessageId'
        | 'createdAt'
        | 'updatedAt'
        | 'contentStatus'
        | 'note'
        | 'todo'
      >
    >();
  const existingByProviderId = new Map(
    existingRows.map((row) => [row.providerMessageId, row]),
  );
  const rows: MessageRow[] = [];
  const draftIds = uniqueMessages
    .filter((message) => message.draft)
    .map((message) => message.providerMessageId);
  const acceptedDrafts = draftIds.length
    ? await query
        .selectFrom('mailSubmissions')
        .select('providerMessageId')
        .where('accountId', '=', accountId)
        .where('status', '=', 'accepted')
        .where('providerMessageId', 'in', draftIds)
        .execute<{ providerMessageId: string }>()
    : [];
  const acceptedIds = new Set(
    acceptedDrafts.map((row) => row.providerMessageId),
  );
  for (const message of uniqueMessages) {
    // Graph can still return its pre-send draft briefly after accepting delivery.
    if (message.draft && acceptedIds.has(message.providerMessageId)) continue;
    if (
      message.draft &&
      !(await acceptDraftWrite(
        query,
        accountId,
        message.providerMessageId,
        message.draftRevision,
      ))
    )
      continue;
    const existing = existingByProviderId.get(message.providerMessageId);
    if (
      existing &&
      ((preserveUpdatedAfter && existing.updatedAt >= preserveUpdatedAfter) ||
        (existing.contentStatus === 'complete' &&
          message.contentStatus &&
          message.contentStatus !== 'complete'))
    )
      continue;
    const row = toMessageRow(
      accountId,
      message,
      existing?.id ?? randomUUID(),
      existing?.createdAt ?? now,
      now,
      existing,
    );
    rows.push(row);
    if (existing) {
      await assertDraftEditable(query, accountId, existing.id);
      await query
        .updateTable<MessageRow>('mailMessages')
        .set(row)
        .where('id', '=', existing.id)
        .execute();
    }
  }
  const newRows = rows.filter(
    (row) => !existingByProviderId.has(row.providerMessageId),
  );
  for (const batch of chunks(newRows, 25)) {
    await query.insertInto<MessageRow>('mailMessages').values(batch).execute();
  }
  if (rows.length === 0) return;
  await replaceMessageParticipants(query, rows);
  // IMAP derives folders from every stored copy instead of the latest one.
  if (!replaceFolders) return;
  const messageIds = rows.map((row) => row.id);
  await query
    .deleteFrom<MessageFolderRow>('mailMessageFolders')
    .where('messageId', 'in', messageIds)
    .execute();
  const foldersByProviderMessageId = new Map(
    uniqueMessages.map((message) => [
      message.providerMessageId,
      message.providerFolderIds,
    ]),
  );
  const folderRows = rows.flatMap((row) =>
    [
      ...new Set(foldersByProviderMessageId.get(row.providerMessageId) ?? []),
    ].map((providerFolderId): MessageFolderRow => ({
      accountId,
      messageId: row.id,
      providerFolderId,
    })),
  );
  for (const batch of chunks(folderRows, 100)) {
    await query
      .insertInto<MessageFolderRow>('mailMessageFolders')
      .values(batch)
      .execute();
  }
}

export async function removeStaleMessageFolders(
  query: QueryAdapter,
  accountId: string,
  completeProviderFolderIds: readonly string[],
): Promise<void> {
  let deleteQuery = query
    .deleteFrom<MessageFolderRow>('mailMessageFolders')
    .where('accountId', '=', accountId)
    .where('providerFolderId', '!=', MAIL_LOCAL_DRAFT_FOLDER_ID);
  if (completeProviderFolderIds.length > 0) {
    deleteQuery = deleteQuery.where(
      'providerFolderId',
      'not in',
      completeProviderFolderIds,
    );
  }
  await deleteQuery.execute();
}

export async function upsertFolders(
  query: QueryAdapter,
  accountId: string,
  folders: readonly import('../contracts/provider.js').NormalizedMailFolder[],
): Promise<void> {
  for (const folder of folders) {
    const existing = await query
      .selectFrom<FolderRow>('mailFolders')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', folder.providerFolderId)
      .executeTakeFirst<Pick<FolderRow, 'id'>>();
    const row: FolderRow = {
      id: existing?.id ?? randomUUID(),
      accountId,
      ...folder,
    };
    if (existing) {
      await assertDraftEditable(query, accountId, existing.id);
      await query
        .updateTable<FolderRow>('mailFolders')
        .set(row)
        .where('id', '=', existing.id)
        .execute();
    } else {
      await query.insertInto<FolderRow>('mailFolders').values(row).execute();
    }
  }
}

export async function deleteMessages(
  query: QueryAdapter,
  accountId: string,
  providerMessageIds: readonly string[],
): Promise<void> {
  if (providerMessageIds.length === 0) return;
  for (const providerIds of chunks(providerMessageIds, 100)) {
    const messages = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerMessageId', 'in', providerIds)
      .execute<Pick<MessageRow, 'id'>>();
    if (messages.length > 0) {
      const messageIds = messages.map((message) => message.id);
      await deleteMessageParticipants(query, messageIds, accountId);
      for (const ids of chunks(messageIds, 100)) {
        await query
          .deleteFrom<MessageFolderRow>('mailMessageFolders')
          .where('messageId', 'in', ids)
          .execute();
        await query
          .deleteFrom<MessageLabelRow>('mailMessageLabels')
          .where('messageId', 'in', ids)
          .execute();
      }
      await query
        .deleteFrom<MessageRow>('mailMessages')
        .where('accountId', '=', accountId)
        .where('providerMessageId', 'in', providerIds)
        .execute();
    }
  }
}

export async function removeMessagesFromFolders(
  query: QueryAdapter,
  accountId: string,
  removals: readonly import('../contracts/provider.js').MailProviderFolderRemoval[],
): Promise<void> {
  for (const removal of removals) {
    const row = await query
      .selectFrom<MessageRow>('mailMessages')
      .select('id')
      .where('accountId', '=', accountId)
      .where('providerMessageId', '=', removal.providerMessageId)
      .executeTakeFirst<Pick<MessageRow, 'id'>>();
    if (!row) continue;
    await query
      .deleteFrom<MessageFolderRow>('mailMessageFolders')
      .where('messageId', '=', row.id)
      .where('providerFolderId', '=', removal.providerFolderId)
      .execute();
  }
}

const IMAP_LOCATIONS = 'mailMessageImapLocations';

export function validateImapLocation(
  tuple: ImapLocationTuple,
  source?: ImapIdSource,
): void {
  if (
    typeof tuple.folder !== 'string' ||
    !tuple.folder.length ||
    tuple.folder.length > 500 ||
    !Number.isSafeInteger(tuple.uid) ||
    tuple.uid < 1 ||
    tuple.uid > 4294967295 ||
    typeof tuple.uidValidity !== 'string' ||
    !/^[1-9]\d{0,9}$/.test(tuple.uidValidity) ||
    BigInt(tuple.uidValidity) > 4294967295n ||
    (source !== undefined &&
      !['objectid', 'x-gm-msgid', 'rfc-message-id', 'locator'].includes(source))
  ) {
    throw new Error('Invalid IMAP location evidence.');
  }
}

function unchanged(
  row: ImapLocationRow | undefined,
  observed: ImapStoredLocation | undefined,
): boolean {
  return row
    ? Boolean(
        observed &&
        row.id === observed.id &&
        row.messageId === observed.messageId &&
        row.providerFolderId === observed.folder &&
        row.uidValidity === observed.uidValidity &&
        Number(row.uid) === observed.uid &&
        new Date(row.updatedAt).toISOString() === observed.updatedAt &&
        row.status === observed.status,
      )
    : !observed;
}

function validImapIdentity(value: unknown, source?: ImapIdSource): boolean {
  if (typeof value !== 'string' || !value || value.length > 500) return false;
  if (source === 'objectid') return /^[A-Za-z0-9_-]{1,255}$/.test(value);
  if (source === 'x-gm-msgid')
    return (
      /^(0|[1-9]\d{0,19})$/.test(value) &&
      BigInt(value) <= 18446744073709551615n
    );
  return true;
}

export function validateImapStoredLocation(location: ImapStoredLocation): void {
  validateImapLocation(location, location.source);
  if (
    !['valid', 'pending', 'invalid'].includes(location.status) ||
    !location.id ||
    !location.messageId ||
    !validImapIdentity(location.providerMessageId, location.source) ||
    !Number.isFinite(Date.parse(location.updatedAt))
  )
    throw new Error('Invalid stored IMAP location.');
}

export function validateImapCopyEvidence(copy: ImapCopyEvidence): void {
  validateImapLocation(copy, copy.source);
  if (
    typeof copy.locationId !== 'string' ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(copy.locationId) ||
    !validImapIdentity(copy.providerMessageId, copy.source) ||
    !['objectid', 'x-gm-msgid', 'rfc-message-id', 'locator'].includes(
      copy.source,
    ) ||
    (copy.flagsOnly !== undefined && typeof copy.flagsOnly !== 'boolean') ||
    (copy.flagsOnly && !copy.observed) ||
    typeof copy.read !== 'boolean' ||
    typeof copy.starred !== 'boolean' ||
    (copy.receivedAt !== undefined &&
      (typeof copy.receivedAt !== 'string' ||
        !Number.isFinite(Date.parse(copy.receivedAt))))
  )
    throw new Error('Invalid IMAP copy evidence.');
}

/**
 * Write one sync step's IMAP copies: one business message per identity, a
 * location per copy, and aggregates derived from every verified copy.
 */
export async function upsertImapMessages(
  query: QueryAdapter,
  accountId: string,
  messages: readonly NormalizedMailMessage[],
  copies: readonly ImapCopyEvidence[],
  runId: string,
  preserveUpdatedAfter?: string,
): Promise<void> {
  const safe: ImapCopyEvidence[] = [];
  const mirrors = new Map<string, string>();
  for (const copy of copies) {
    validateImapCopyEvidence(copy);
    const row = await query
      .selectFrom<ImapLocationRow>(IMAP_LOCATIONS)
      .selectAll()
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', copy.folder)
      .where('uidValidity', '=', copy.uidValidity)
      .where('uid', '=', copy.uid)
      .executeTakeFirst<ImapLocationRow>();
    if (!unchanged(row, copy.observed))
      throw Object.assign(
        new Error('The IMAP copy changed during synchronization.'),
        { code: 'IMAP_MESSAGE_COPY_CHANGED' },
      );
    const candidates = await query
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('accountId', '=', accountId)
      .where((builder) =>
        builder.or([
          builder('providerMessageId', '=', copy.providerMessageId),
          builder('providerDraftMessageId', '=', copy.providerMessageId),
        ]),
      )
      .execute<MessageRow>();
    if (candidates.length > 1)
      throw new Error('The IMAP identity has conflicting owners.');
    const owner = candidates[0];
    const mirror =
      owner?.providerMessageId.startsWith('local-draft:') &&
      owner.providerDraftMessageId === copy.providerMessageId;
    const source = mirror
      ? owner.providerDraftMessageIdSource
      : owner?.imapIdSource;
    if (owner && source !== copy.source)
      throw new Error(
        'The IMAP identity source conflicts with a stored message.',
      );
    if (row && owner?.id !== row.messageId)
      throw new Error('The IMAP copy belongs to another message.');
    if (mirror) mirrors.set(copy.providerMessageId, owner.id);
    if (owner?.scheduledSubmissionId) continue;
    safe.push(copy);
  }
  copies = safe;
  const representatives = new Map<string, NormalizedMailMessage>();
  for (const message of messages) {
    // A remote draft mirror never overwrites locally authored content or UUID.
    if (
      mirrors.has(message.providerMessageId) ||
      !safe.some(
        (copy) =>
          !copy.flagsOnly &&
          copy.providerMessageId === message.providerMessageId,
      )
    )
      continue;
    const current = representatives.get(message.providerMessageId);
    // An incomplete copy never replaces complete content from another copy.
    if (
      !current ||
      (current.contentStatus !== undefined &&
        current.contentStatus !== 'complete' &&
        (message.contentStatus ?? 'complete') === 'complete')
    )
      representatives.set(message.providerMessageId, message);
  }
  await upsertMessages(
    query,
    accountId,
    [...representatives.values()],
    preserveUpdatedAfter,
    false,
  );
  const owners = new Map<string, string>(mirrors);
  for (const ids of chunks(
    [...new Set(copies.map((copy) => copy.providerMessageId))],
    100,
  )) {
    const rows = await query
      .selectFrom<MessageRow>('mailMessages')
      .select(['id', 'providerMessageId'])
      .where('accountId', '=', accountId)
      .where('providerMessageId', 'in', ids)
      .execute<Pick<MessageRow, 'id' | 'providerMessageId'>>();
    for (const row of rows) owners.set(row.providerMessageId, row.id);
  }
  const now = new Date().toISOString();
  const touched = new Set<string>();
  for (const copy of copies) {
    const messageId = owners.get(copy.providerMessageId);
    // Skipped writes, such as a closed or accepted draft, keep no location.
    if (!messageId) continue;
    const existing = await query
      .selectFrom<ImapLocationRow>(IMAP_LOCATIONS)
      .selectAll()
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', copy.folder)
      .where('uidValidity', '=', copy.uidValidity)
      .where('uid', '=', copy.uid)
      .executeTakeFirst<ImapLocationRow>();
    // A stored copy keeps its owner; a new identity never takes it over.
    if (existing && existing.messageId !== messageId) continue;
    const values = {
      status: 'valid' as const,
      invalidationReason: null,
      read: copy.read,
      starred: copy.starred,
      receivedAt: copy.flagsOnly
        ? (existing?.receivedAt ?? null)
        : (copy.receivedAt ?? null),
      updatedAt: existing
        ? new Date(
            Math.max(Date.now(), Date.parse(existing.updatedAt) + 1),
          ).toISOString()
        : now,
    };
    if (existing) {
      await query
        .updateTable<ImapLocationRow>(IMAP_LOCATIONS)
        .set(values)
        .where('id', '=', existing.id)
        .execute();
    } else {
      await query
        .insertInto<ImapLocationRow>(IMAP_LOCATIONS)
        .values({
          id: copy.locationId,
          accountId,
          messageId,
          providerFolderId: copy.folder,
          uidValidity: copy.uidValidity,
          uid: copy.uid,
          ...values,
          createdAt: now,
        })
        .execute();
    }
    await query
      .updateTable<MessageRow>('mailMessages')
      .set(
        mirrors.has(copy.providerMessageId)
          ? { providerDraftMessageIdSource: copy.source }
          : { imapIdSource: copy.source },
      )
      .where('id', '=', messageId)
      .execute();
    touched.add(messageId);
  }
  await refreshImapMessages(query, accountId, [...touched], runId);
}

/** Apply verified status changes of stored copies. */
export async function applyImapLocationChanges(
  query: QueryAdapter,
  accountId: string,
  changes: readonly ImapLocationChange[],
  runId: string,
): Promise<void> {
  const touched = new Set<string>();
  for (const change of changes) {
    validateImapStoredLocation(change.observed);
    if (
      change.id !== change.observed.id ||
      !['valid', 'pending', 'invalid'].includes(change.status) ||
      (change.reason !== undefined &&
        ![
          'uid-missing',
          'folder-unavailable',
          'generation-changed',
          'generation-replaced',
        ].includes(change.reason))
    )
      throw new Error('Invalid IMAP location change.');
    const row = await query
      .selectFrom<ImapLocationRow>(IMAP_LOCATIONS)
      .selectAll()
      .where('accountId', '=', accountId)
      .where('id', '=', change.id)
      .executeTakeFirst<ImapLocationRow>();
    if (!unchanged(row, change.observed))
      throw new Error('The IMAP copy changed during verification.');
    if (!row) continue;
    const owner = await query
      .selectFrom<MessageRow>('mailMessages')
      .selectAll()
      .where('accountId', '=', accountId)
      .where('id', '=', row.messageId)
      .executeTakeFirst<MessageRow>();
    const remote = owner?.providerMessageId.startsWith('local-draft:')
      ? owner.providerDraftMessageId
      : owner?.providerMessageId;
    const source =
      remote === owner?.providerDraftMessageId
        ? owner?.providerDraftMessageIdSource
        : owner?.imapIdSource;
    if (
      !owner ||
      remote !== change.observed.providerMessageId ||
      source !== change.observed.source
    )
      throw new Error('The IMAP identity changed during verification.');
    await query
      .updateTable<ImapLocationRow>(IMAP_LOCATIONS)
      .set({
        status: change.status,
        invalidationReason: change.reason ?? null,
        updatedAt: new Date(
          Math.max(Date.now(), Date.parse(row.updatedAt) + 1),
        ).toISOString(),
      })
      .where('id', '=', change.id)
      .execute();
    touched.add(row.messageId);
  }
  await refreshImapMessages(query, accountId, [...touched], runId);
}

/**
 * Derive message state from its copies: read when every verified copy is read,
 * starred when any is, received at the earliest verified copy. A message with
 * no verified copy keeps its state and is marked as an orphan of this run.
 */
export async function refreshImapMessages(
  query: QueryAdapter,
  accountId: string,
  messageIds: readonly string[],
  runId?: string,
  updatedAt?: string,
): Promise<void> {
  if (messageIds.length === 0) return;
  const folders = new Set(
    (
      await query
        .selectFrom<FolderRow>('mailFolders')
        .select('providerFolderId')
        .where('accountId', '=', accountId)
        .execute<Pick<FolderRow, 'providerFolderId'>>()
    ).map((row) => row.providerFolderId),
  );
  for (const ids of chunks(messageIds, 100)) {
    const locations = await query
      .selectFrom<ImapLocationRow>(IMAP_LOCATIONS)
      .select(['messageId', 'providerFolderId', 'status', 'read', 'starred'])
      .select('receivedAt')
      .where('accountId', '=', accountId)
      .where('messageId', 'in', ids)
      .execute<ImapLocationRow>();
    const messages = await query
      .selectFrom<MessageRow>('mailMessages')
      .select(['id', 'receivedAt', 'sentAt', 'createdAt', 'providerMessageId'])
      .where('accountId', '=', accountId)
      .where('id', 'in', ids)
      .execute<
        Pick<
          MessageRow,
          'id' | 'receivedAt' | 'sentAt' | 'createdAt' | 'providerMessageId'
        >
      >();
    for (const message of messages) {
      const own = locations.filter(
        (location) => location.messageId === message.id,
      );
      const valid = own.filter((location) => location.status === 'valid');
      const times = valid
        .map((location) =>
          location.receivedAt ? Date.parse(String(location.receivedAt)) : NaN,
        )
        .filter((time) => Number.isFinite(time));
      const receivedAt =
        !message.providerMessageId.startsWith('local-draft:') && times.length
          ? new Date(Math.min(...times)).toISOString()
          : message.receivedAt;
      const values: Partial<MessageRow> = valid.length
        ? {
            read: valid.every((location) => Boolean(location.read)),
            starred: valid.some((location) => Boolean(location.starred)),
            receivedAt,
            sortAt: receivedAt ?? message.sentAt ?? message.createdAt,
            imapOrphanRunId: null,
          }
        : runId
          ? { imapOrphanRunId: runId }
          : {};
      if (updatedAt) values.updatedAt = updatedAt;
      if (Object.keys(values).length > 0)
        await query
          .updateTable<MessageRow>('mailMessages')
          .set(values)
          .where('id', '=', message.id)
          .execute();
      // Unconfirmed copies keep their folder until verification decides.
      const folderIds = new Set(
        own
          .filter(
            (location) =>
              location.status === 'valid' ||
              (location.status === 'pending' &&
                folders.has(location.providerFolderId)),
          )
          .map((location) => location.providerFolderId),
      );
      await query
        .deleteFrom<MessageFolderRow>('mailMessageFolders')
        .where('messageId', '=', message.id)
        .where('providerFolderId', '!=', MAIL_LOCAL_DRAFT_FOLDER_ID)
        .execute();
      if (folderIds.size > 0)
        await query
          .insertInto<MessageFolderRow>('mailMessageFolders')
          .values(
            [...folderIds].map((providerFolderId) => ({
              accountId,
              messageId: message.id,
              providerFolderId,
            })),
          )
          .execute();
    }
  }
}

/**
 * Delete IMAP messages with no valid or pending copy after a complete,
 * twice-verified run. Local, submitted and scheduled messages are never IMAP
 * orphans: they carry no IMAP identity source or are locked by a schedule.
 */
export async function deleteImapOrphans(
  query: QueryAdapter,
  accountId: string,
  runId: string,
): Promise<void> {
  const orphans = await query
    .selectFrom<MessageRow>('mailMessages')
    .select(['id', 'providerMessageId'])
    .where('accountId', '=', accountId)
    .where('imapIdSource', 'is not', null)
    .where('imapOrphanRunId', '=', runId)
    .where('providerMessageId', 'not like', 'local-draft:%')
    .where('scheduledSubmissionId', 'is', null)
    .where((builder) =>
      builder.not(
        builder.exists(
          builder
            .selectFrom(IMAP_LOCATIONS)
            .select('id')
            .whereRef(`${IMAP_LOCATIONS}.messageId`, '=', 'mailMessages.id')
            .where(`${IMAP_LOCATIONS}.status`, 'in', ['valid', 'pending']),
        ),
      ),
    )
    .execute<Pick<MessageRow, 'id' | 'providerMessageId'>>();
  await deleteMessages(
    query,
    accountId,
    orphans.map((row) => row.providerMessageId),
  );
}
