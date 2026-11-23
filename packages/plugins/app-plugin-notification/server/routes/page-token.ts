import { ApiError } from '@nocobase/app-server/router';

import { NOTIFICATION_ERROR_DOMAIN } from '../http-errors.js';
import type { NotificationLogCursor } from '../store.js';

/** An opaque cursor: the creation time and id of the last item of a page, newest first. */
export function encodePageToken(item: NotificationLogCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: item.createdAt, id: item.id }),
  ).toString('base64url');
}

export function parsePageToken(value: string): NotificationLogCursor {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'createdAt' in parsed &&
      'id' in parsed &&
      typeof parsed.createdAt === 'string' &&
      typeof parsed.id === 'string' &&
      parsed.id.length > 0 &&
      Number.isFinite(Date.parse(parsed.createdAt))
    )
      return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    // Reported below as an invalid token.
  }
  throw new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_PAGE_TOKEN',
    domain: NOTIFICATION_ERROR_DOMAIN,
    message: 'pageToken is not a token this list returned.',
    fieldViolations: [
      {
        field: 'pageToken',
        description: 'pageToken is not a token this list returned.',
      },
    ],
  });
}
