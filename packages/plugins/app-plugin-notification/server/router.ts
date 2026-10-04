import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import {
  NOTIFICATION_ERROR_DOMAIN,
  notificationApiError,
  notificationErrorHandler,
} from './http-errors.js';
import type { NotificationLogDetails, NotificationLogs } from './logs.js';
import {
  NotificationLogListQuery,
  NotificationLogParams,
} from './routes/schemas.js';
import type { NotificationLogCursor } from './store.js';

export interface NotificationRouterOptions {
  readonly logs: Pick<NotificationLogs, 'get' | 'listDetails'>;
}

export function createNotificationRouter({
  logs,
}: NotificationRouterOptions): Hono {
  const router = new Hono();

  router.onError(notificationErrorHandler);

  router.get(
    '/logs',
    validator('query', (value) =>
      parseApiInput(NotificationLogListQuery, value),
    ),
    async (context) => {
      const { pageSize, pageToken } = context.req.valid('query');
      const before =
        pageToken === undefined ? undefined : parseLogPageToken(pageToken);
      const rows = await logs.listDetails(pageSize + 1, before);
      const data = rows.slice(0, pageSize);
      const last = data.at(-1);
      return context.json({
        data,
        meta:
          rows.length > pageSize && last
            ? { nextPageToken: encodeLogPageToken(last) }
            : {},
      });
    },
  );

  router.get(
    '/logs/:logId',
    validator('param', (value) => parseApiInput(NotificationLogParams, value)),
    async (context) => {
      const { logId } = context.req.valid('param');
      const details = await logs.get(logId);
      if (!details)
        throw notificationApiError(context, {
          status: 'NOT_FOUND',
          reason: 'NOTIFICATION_LOG_NOT_FOUND',
          key: 'errors.logNotFound',
        });
      return context.json({ data: details });
    },
  );

  return router;
}

function encodeLogPageToken(details: NotificationLogDetails): string {
  return Buffer.from(
    JSON.stringify({ createdAt: details.log.createdAt, id: details.log.id }),
  ).toString('base64url');
}

function parseLogPageToken(value: string): NotificationLogCursor {
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
