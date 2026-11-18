import type { MailSyncCursor } from '../../../shared/mail.js';

import type {
  AttachmentLocator,
  ImapFolderCursor,
  ImapSyncCursor,
  ImapVerifyFolder,
  ImapVerifyState,
  MessageLocator,
} from './types.js';
import {
  MAX_IMAP_PROVIDER_ID_LENGTH,
  MAX_IMAP_RECHECK_IDENTITIES,
  IMAP_RECHECK_BATCH_SIZE,
} from './constants.js';

export const MAX_IMAP_UID = 0xffff_ffff;

export function folderCursor(
  uidValidity: bigint | undefined,
  uidNext: number | undefined,
): ImapFolderCursor {
  if (
    uidNext === undefined ||
    !Number.isSafeInteger(uidNext) ||
    uidNext < 1 ||
    uidNext > MAX_IMAP_UID + 1
  ) {
    throw Object.assign(
      new Error('The IMAP server returned an invalid UIDNEXT.'),
      { code: 'IMAP_INVALID_UIDNEXT' },
    );
  }
  if (
    uidValidity === undefined ||
    uidValidity < 1n ||
    uidValidity > BigInt(MAX_IMAP_UID)
  ) {
    throw Object.assign(
      new Error('The IMAP server returned an invalid UIDVALIDITY.'),
      { code: 'IMAP_INVALID_UIDVALIDITY' },
    );
  }
  return {
    uidValidity: String(uidValidity),
    uidNext,
  };
}

export function syncCursor(value: ImapSyncCursor): MailSyncCursor {
  return { value: JSON.stringify(value), version: 'imap-v1' };
}

export function parseSyncCursor(
  cursor: MailSyncCursor | undefined,
): ImapSyncCursor {
  if (!cursor) return { version: 1, folders: {} };
  const value = typeof cursor.value === 'string' ? cursor.value : undefined;
  if (!value) return { version: 1, folders: {} };
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object')
    throw new Error('Invalid IMAP sync cursor.');
  const record = parsed as {
    version?: unknown;
    receivedAfter?: unknown;
    folders?: unknown;
    verify?: unknown;
  };
  if (
    record.version !== 1 ||
    !record.folders ||
    typeof record.folders !== 'object'
  ) {
    throw new Error('Invalid IMAP sync cursor.');
  }
  if (
    record.receivedAfter !== undefined &&
    (typeof record.receivedAfter !== 'string' ||
      !Number.isFinite(Date.parse(record.receivedAfter)))
  )
    throw new Error('Invalid IMAP sync cursor.');
  const receivedAfter = record.receivedAfter;
  const folders: Record<string, ImapFolderCursor> = {};
  for (const [path, value] of Object.entries(record.folders)) {
    if (!isImapFolderCursor(value)) {
      throw new Error('Invalid IMAP sync cursor.');
    }
    folders[path] = value;
  }
  if (record.verify === undefined)
    return { version: 1, folders, receivedAfter };
  if (!isVerifyState(record.verify))
    throw new Error('Invalid IMAP sync cursor.');
  return {
    version: 1,
    receivedAfter,
    folders,
    verify: {
      ...record.verify,
      // Old tuple arrays are deliberately re-screened rather than migrated.
      excluded: Array.isArray(record.verify.excluded)
        ? undefined
        : record.verify.excluded,
    },
  };
}

function isVerifyState(value: unknown): value is ImapVerifyState {
  if (!value || typeof value !== 'object') return false;
  const record = value as {
    attempts?: unknown;
    folders?: unknown;
    excluded?: unknown;
    rechecks?: unknown;
  };
  if (record.rechecks !== undefined && !isRechecks(record.rechecks))
    return false;
  if (
    record.excluded !== undefined &&
    !(Array.isArray(record.excluded)
      ? record.excluded.every((value) => typeof value === 'string')
      : record.excluded &&
        typeof record.excluded === 'object' &&
        Object.values(record.excluded).every(isExcludedFolder))
  )
    return false;
  if (
    record.attempts !== undefined &&
    (!Number.isSafeInteger(record.attempts) || (record.attempts as number) < 0)
  )
    return false;
  if (record.folders === undefined) return true;
  if (!record.folders || typeof record.folders !== 'object') return false;
  return Object.values(record.folders).every(
    (folder: unknown) =>
      isImapFolderCursor(folder) &&
      typeof (folder as Partial<ImapVerifyFolder>).uids === 'string' &&
      /^[\d:,]*$/.test((folder as ImapVerifyFolder).uids),
  );
}

function isRechecks(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > MAX_IMAP_RECHECK_IDENTITIES)
    return false;
  let count = 0;
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return false;
    const batch = entry as Record<string, unknown>;
    if (
      !Array.isArray(batch.folders) ||
      !batch.folders.length ||
      !batch.folders.every((folder: unknown) => typeof folder === 'string') ||
      !Array.isArray(batch.identities) ||
      !batch.identities.length ||
      batch.identities.length > IMAP_RECHECK_BATCH_SIZE
    )
      return false;
    count += batch.identities.length;
    return (
      count <= MAX_IMAP_RECHECK_IDENTITIES &&
      batch.identities.every((identity: unknown) => {
        if (!identity || typeof identity !== 'object') return false;
        const id = identity as Record<string, unknown>;
        return (
          (typeof id.emailId === 'string' &&
            /^[A-Za-z0-9_-]{1,255}$/.test(id.emailId) &&
            id.rfcMessageId === undefined) ||
          (id.emailId === undefined &&
            typeof id.rfcMessageId === 'string' &&
            id.rfcMessageId.length <= MAX_IMAP_PROVIDER_ID_LENGTH &&
            /^<[\x21-\x3b\x3d\x3f-\x7e]+@[\x21-\x3b\x3d\x3f-\x7e]+>$/.test(
              id.rfcMessageId,
            ))
        );
      })
    );
  });
}

function isExcludedFolder(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const folder = value as Record<string, unknown>;
  return isUidValidity(folder.uidValidity) && isUidRanges(folder.uids);
}

function isUidRanges(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value) return true;
  let previous = 0;
  return value.split(',').every((range) => {
    if (!/^[1-9]\d*(?::[1-9]\d*)?$/.test(range)) return false;
    const [first, last = first] = range.split(':').map(Number);
    const valid = first > previous && last >= first && last <= MAX_IMAP_UID;
    previous = last;
    return valid;
  });
}

/** Intersect a SEARCH result with compressed ranges without expanding the cursor. */
export function matchingUids(
  uids: readonly number[],
  ranges: string,
): number[] {
  const intervals = ranges
    ? ranges.split(',').map((range) => {
        const [first, last = first] = range.split(':').map(Number);
        return [first, last] as const;
      })
    : [];
  let index = 0;
  return [...uids]
    .sort((a, b) => a - b)
    .filter((uid) => {
      while (index < intervals.length && intervals[index][1] < uid) index += 1;
      return index < intervals.length && intervals[index][0] <= uid;
    });
}

/** Remove a small UID set without expanding potentially huge exclusion ranges. */
export function subtractUids(
  ranges: string,
  removed: readonly number[],
): string {
  const sorted = [...new Set(removed)].sort((a, b) => a - b);
  const kept: string[] = [];
  let index = 0;
  for (const range of ranges.split(',')) {
    if (!range) continue;
    const [first, last = first] = range.split(':').map(Number);
    let start = first;
    while (index < sorted.length && sorted[index] < first) index += 1;
    while (index < sorted.length && sorted[index] <= last) {
      const uid = sorted[index++];
      if (start < uid) kept.push(rangeFor(start, uid - 1));
      start = uid + 1;
    }
    if (start <= last) kept.push(rangeFor(start, last));
  }
  return kept.join(',');
}

/** Compress a UID set into sorted IMAP ranges; equal sets give equal strings. */
export function compressUids(uids: Iterable<number>): string {
  const sorted = [...new Set(uids)].sort((left, right) => left - right);
  const ranges: string[] = [];
  for (let index = 0; index < sorted.length;) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1)
      end += 1;
    ranges.push(rangeFor(sorted[index], sorted[end]));
    index = end + 1;
  }
  return ranges.join(',');
}

function isImapFolderCursor(value: unknown): value is ImapFolderCursor {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    isUidValidity(record.uidValidity) &&
    Number.isSafeInteger(record.uidNext) &&
    (record.uidNext as number) >= 1 &&
    (record.uidNext as number) <= MAX_IMAP_UID + 1
  );
}

function isUidValidity(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length > 10 ||
    !/^[1-9]\d*$/.test(value)
  )
    return false;
  return BigInt(value) <= BigInt(MAX_IMAP_UID);
}

export function parseHistoryCursor(cursor: string | undefined): {
  readonly folderIndex: number;
  readonly upperUid?: number;
  readonly legacyOffset?: number;
} {
  if (!cursor) return { folderIndex: 0 };
  const parsed: unknown = JSON.parse(
    Buffer.from(cursor, 'base64url').toString('utf8'),
  );
  if (!parsed || typeof parsed !== 'object')
    throw new Error('Invalid IMAP history cursor.');
  const value = parsed as {
    folderIndex?: unknown;
    offset?: unknown;
    upperUid?: unknown;
  };
  if (!Number.isSafeInteger(value.folderIndex)) {
    throw new Error('Invalid IMAP history cursor.');
  }
  const upperUid = value.upperUid;
  const offset = value.offset;
  if (
    upperUid !== undefined &&
    (!Number.isSafeInteger(upperUid) ||
      (upperUid as number) < 0 ||
      (upperUid as number) > MAX_IMAP_UID)
  ) {
    throw new Error('Invalid IMAP history cursor.');
  }
  if (
    upperUid === undefined &&
    offset !== undefined &&
    (!Number.isSafeInteger(offset) || (offset as number) < 0)
  ) {
    throw new Error('Invalid IMAP history cursor.');
  }
  return {
    folderIndex: Math.max(0, value.folderIndex as number),
    ...(upperUid !== undefined
      ? { upperUid: upperUid as number }
      : offset !== undefined
        ? { legacyOffset: offset as number }
        : {}),
  };
}

export function encodeHistoryCursor(value: {
  readonly folderIndex: number;
  readonly upperUid?: number;
}): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function rangeFor(start: number, end: number): string {
  return start === end ? String(start) : `${start}:${end}`;
}

export function encodeMessageLocator(locator: MessageLocator): string {
  return `imap:${Buffer.from(JSON.stringify(locator)).toString('base64url')}`;
}

/**
 * Location identity of one copy. A locator too long for providerMessageId
 * names the persisted location row instead; reads resolve it to its tuple.
 */
export function encodeCopyLocator(
  locator: MessageLocator,
  locationId: string,
): string {
  const value = encodeMessageLocator({
    folder: locator.folder,
    uidValidity: locator.uidValidity,
    uid: locator.uid,
  });
  return value.length <= MAX_IMAP_PROVIDER_ID_LENGTH
    ? value
    : `imap-loc:${locationId}`;
}

export function encodeAttachmentLocator(locator: AttachmentLocator): string {
  return `imap-attachment:${Buffer.from(JSON.stringify(locator)).toString('base64url')}`;
}

export function parseMessageLocator(value: string): MessageLocator | undefined {
  if (!value.startsWith('imap:')) return undefined;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value.slice('imap:'.length), 'base64url').toString('utf8'),
    );
    return isMessageLocator(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function parseAttachmentLocator(
  value: string,
): AttachmentLocator | undefined {
  if (!value.startsWith('imap-attachment:')) return undefined;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value.slice('imap-attachment:'.length), 'base64url').toString(
        'utf8',
      ),
    );
    if (!isMessageLocator(parsed)) return undefined;
    const attachment = (parsed as { attachment?: unknown }).attachment;
    return Number.isSafeInteger(attachment) && (attachment as number) >= 0
      ? (parsed as AttachmentLocator)
      : undefined;
  } catch {
    return undefined;
  }
}

export function requireMessageLocator(value: string): MessageLocator {
  const locator = parseMessageLocator(value);
  if (!locator) throw new Error('Invalid IMAP message identifier.');
  return locator;
}

export function requireAttachmentLocator(value: string): AttachmentLocator {
  const locator = parseAttachmentLocator(value);
  if (!locator) throw new Error('Invalid IMAP attachment identifier.');
  return locator;
}

function isMessageLocator(value: unknown): value is MessageLocator {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.folder === 'string' &&
    record.folder.length > 0 &&
    isUidValidity(record.uidValidity) &&
    Number.isSafeInteger(record.uid) &&
    (record.uid as number) > 0 &&
    (record.uid as number) <= MAX_IMAP_UID
  );
}
