import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import {
  NOTIFICATION_ERROR_DOMAIN,
  notificationApiError,
  notificationErrorHandler,
} from './http-errors.js';
import type { NotificationLogDetails, NotificationLogs } from './logs.js';
import {
  NotificationLogDetailsSchema,
  NotificationLogListQuery,
  NotificationLogParams,
} from './routes/schemas.js';
import type { NotificationLogCursor } from './store.js';

const tags = ['Notification'];
const logsAccess =
  'Requires the `page:notification.logs/access` grant; without it the route answers 403 `NOTIFICATION_LOGS_FORBIDDEN`.';

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
    describeRoute({
      tags,
      summary: 'List notification logs',
      operationId: 'notificationsListLogs',
      description: `Every notification the application sent, newest first, with its deliveries and attempts. Message content and recipients are never included. Pages by \`pageToken\`: pass \`meta.nextPageToken\` back unchanged; it is absent on the last page, and a token this list did not issue answers 400 \`INVALID_PAGE_TOKEN\`. ${logsAccess}`,
      responses: {
        200: listResponse(NotificationLogDetailsSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The `pageToken` was not issued by this list (`INVALID_PAGE_TOKEN`).',
        ),
      },
    }),
    apiValidator('query', NotificationLogListQuery),
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
    describeRoute({
      tags,
      summary: 'Get a notification log',
      operationId: 'notificationsGetLog',
      description: `One notification with its deliveries, attempts and retry audits. ${logsAccess}`,
      responses: {
        200: dataResponse(NotificationLogDetailsSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No notification log has this id (`NOTIFICATION_LOG_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', NotificationLogParams),
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
