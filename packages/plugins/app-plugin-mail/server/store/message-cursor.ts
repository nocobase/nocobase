import { Buffer } from 'node:buffer';
import { MailError, mailInvalidArgument } from '../services/errors.js';
import { type MessageRow } from './rows.js';

export interface MessageCursor {
  readonly sortAt: string;
  readonly id: string;
}

export function encodeMessageCursor(row: MessageRow): string {
  return Buffer.from(
    JSON.stringify({ sortAt: row.sortAt, id: row.id } satisfies MessageCursor),
  ).toString('base64url');
}

export function parseMessageCursor(
  cursor: string | undefined,
): MessageCursor | undefined {
  if (!cursor) return undefined;
  try {
    const value = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<MessageCursor>;
    if (
      typeof value.sortAt !== 'string' ||
      value.sortAt.length === 0 ||
      Number.isNaN(Date.parse(value.sortAt)) ||
      typeof value.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.id,
      )
    ) {
      throw mailInvalidArgument('Mail page cursor is invalid.', 'pageToken');
    }
    return { sortAt: value.sortAt, id: value.id };
  } catch (error) {
    if (error instanceof MailError) throw error;
    throw mailInvalidArgument(
      'Mail page cursor is invalid.',
      'pageToken',
      error,
    );
  }
}
