import type { MailSyncCursor } from '../../../shared/mail.js';

import type {
  AttachmentLocator,
  ImapFolderCursor,
  ImapSyncCursor,
  MessageLocator,
} from './types.js';

export const MAX_IMAP_UID = 0xffff_ffff;

export function folderCursor(
  uidValidity: bigint | undefined,
  uidNext: number | undefined,
): ImapFolderCursor {
  if (
    uidNext === undefined ||
    !Number.isSafeInteger(uidNext) ||
    uidNext < 1 ||
    uidNext > MAX_IMAP_UID
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
  const record = parsed as { version?: unknown; folders?: unknown };
  if (
    record.version !== 1 ||
    !record.folders ||
    typeof record.folders !== 'object'
  ) {
    throw new Error('Invalid IMAP sync cursor.');
  }
  const folders: Record<string, ImapFolderCursor> = {};
  for (const [path, value] of Object.entries(record.folders)) {
    if (!isImapFolderCursor(value)) {
      throw new Error('Invalid IMAP sync cursor.');
    }
    folders[path] = value;
  }
  return { version: 1, folders };
}

function isImapFolderCursor(value: unknown): value is ImapFolderCursor {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    isUidValidity(record.uidValidity) &&
    Number.isSafeInteger(record.uidNext) &&
    (record.uidNext as number) >= 1 &&
    (record.uidNext as number) <= MAX_IMAP_UID
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
