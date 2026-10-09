import type {
  MailProviderResult,
  MailSyncCursor,
} from '../../../shared/mail.js';
import type { NormalizedMailMessage } from '../../contracts/provider.js';

import type { ChangeCursor, FolderCursor, InitialCursor } from './types.js';
import { failure } from './errors.js';

export function graphCursor(value: ChangeCursor): MailSyncCursor {
  return {
    value: {
      checkpoints: JSON.stringify(value.checkpoints),
      folders: JSON.stringify(value.folders ?? []),
      folderIndex: String(value.folderIndex ?? 0),
      ...(value.nextLink ? { nextLink: value.nextLink } : {}),
    },
    version: 'microsoft-graph-v1',
  };
}

export function parseGraphCursor(
  cursor: MailSyncCursor | undefined,
): ChangeCursor | undefined {
  const value = cursor?.value;
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.checkpoints !== 'string'
  )
    return undefined;
  try {
    const checkpoints: unknown = JSON.parse(value.checkpoints);
    const folders: unknown =
      typeof value.folders === 'string' ? JSON.parse(value.folders) : undefined;
    const folderIndex = Number(value.folderIndex ?? 0);
    if (
      !isStringRecord(checkpoints) ||
      (folders !== undefined && !isStringArray(folders)) ||
      !Number.isSafeInteger(folderIndex) ||
      folderIndex < 0
    ) {
      return undefined;
    }
    return {
      checkpoints,
      folders,
      folderIndex,
      nextLink: typeof value.nextLink === 'string' ? value.nextLink : undefined,
    };
  } catch {
    return undefined;
  }
}

export function filterReceivedAfter(
  messages: readonly NormalizedMailMessage[],
  receivedAfter: string | undefined,
): readonly NormalizedMailMessage[] {
  if (!receivedAfter) return messages;
  const cutoff = Date.parse(receivedAfter);
  if (!Number.isFinite(cutoff)) return messages;
  return messages.filter(
    (message) =>
      (message.contentStatus === 'failed' &&
        message.receivedAt === undefined) ||
      (message.receivedAt !== undefined &&
        Date.parse(message.receivedAt) >= cutoff),
  );
}

export function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

export function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeFolderCursor(value: string): FolderCursor | undefined {
  const decoded = decode(value);
  if (!decoded || typeof decoded !== 'object') return undefined;
  const record = decoded as Record<string, unknown>;
  return isStringArray(record.pending) &&
    isStringArray(record.providerFolderIds)
    ? {
        pending: record.pending,
        providerFolderIds: record.providerFolderIds,
      }
    : undefined;
}

export function decodeInitialCursor(value: string): InitialCursor | undefined {
  const decoded = decode(value);
  if (!decoded || typeof decoded !== 'object') return undefined;
  const record = decoded as Record<string, unknown>;
  const { phase, folders, folderIndex, checkpoints } = record;
  if (
    (phase !== 'baseline' && phase !== 'history') ||
    !isStringArray(folders) ||
    typeof folderIndex !== 'number' ||
    !Number.isSafeInteger(folderIndex) ||
    folderIndex < 0 ||
    !isStringRecord(checkpoints)
  ) {
    return undefined;
  }
  const { nextLink, receivedAfter } = record;
  if (
    (nextLink !== undefined && typeof nextLink !== 'string') ||
    (receivedAfter !== undefined && typeof receivedAfter !== 'string')
  ) {
    return undefined;
  }
  return { phase, folders, folderIndex, checkpoints, nextLink, receivedAfter };
}

function decode(value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isStringRecord(
  value: unknown,
): value is Readonly<Record<string, string>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

export function invalidSyncCursor<T>(): MailProviderResult<T> {
  return failure(
    'MICROSOFT_SYNC_CURSOR_INVALID',
    'Microsoft sync cursor is invalid.',
    'provider',
    false,
  );
}
