import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorResponse,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import {
  inAppNotificationApiError,
  inAppNotificationErrorHandler,
} from './http-errors.js';
import {
  InboxListQuery,
  InboxMarkAllReadSchema,
  InboxMessageParams,
  InboxMessageSchema,
  InboxUnreadCountSchema,
} from './routes/schemas.js';
import type { InAppStore } from './store.js';
import type { InAppItem } from './types.js';

export interface CreateInAppRouterOptions {
  /**
   * Authenticates every inbox request and sets `auth` on the context, answering 401 itself when nobody is signed in.
   * The plugin passes the authentication plugin's `auth.required()`, which also rejects a cookie-authenticated write from an
   * untrusted origin (`INVALID_CSRF_ORIGIN`); the inbox has no CSRF mechanism of its own.
   */
  readonly authenticate: MiddlewareHandler<AuthEnv>;
}

const tags = ['NotificationInApp'];
const inboxDescription =
  "Reads and changes only the signed-in user's inbox; another user's message answers 404.";
// The inbox checks no permission: every signed-in user has one, and reaches only their own messages.
const inboxErrorResponses = {
  401: apiErrorResponse(401),
  500: apiErrorResponse(500),
};
const messageNotFoundResponse = apiErrorResponse(
  404,
  "No message with this id is in the signed-in user's inbox (`IN_APP_NOTIFICATION_NOT_FOUND`).",
);

type InAppRouterEnv = {
  Variables: AuthEnv['Variables'] & { notificationUserId: string };
};

/**
 * The current user's inbox, mounted at `/notificationInApp`. Fixed segments are registered before `/messages/:messageId`
 * so they are never read as a message id.
 */
export function createInAppRouter(
  store: InAppStore,
  options: CreateInAppRouterOptions,
): Hono<InAppRouterEnv> {
  const router = new Hono<InAppRouterEnv>();
  router.onError(inAppNotificationErrorHandler);
  router.use('*', options.authenticate);
  router.use('*', async (context, next) => {
    // The user comes only from the authenticated session; nothing is read from or written to the NocoBase session.
    const userId = context.get('auth')?.user.id;
    if (!userId)
      throw inAppNotificationApiError(context as Context, {
        status: 'UNAUTHENTICATED',
        reason: 'IN_APP_NOTIFICATION_AUTHENTICATION_REQUIRED',
        key: 'authenticationRequired',
      });
    context.set('notificationUserId', userId);
    await next();
  });
  router.get(
    '/messages',
    describeRoute({
      tags,
      summary: 'List the messages in the inbox',
      operationId: 'notificationInAppListMessages',
      description:
        "The signed-in user's messages, newest first. `unreadOnly=true` lists only unread ones. Pages by `pageToken`: pass `meta.nextPageToken` back unchanged; it is absent on the last page, and a token this list did not issue answers 400 `IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`.",
      responses: {
        200: listResponse(InboxMessageSchema),
        ...inboxErrorResponses,
        400: apiErrorResponse(
          400,
          'The `pageToken` was not issued by this list (`IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`).',
        ),
      },
    }),
    apiValidator('query', InboxListQuery),
    async (context) => {
      const { pageSize, pageToken, unreadOnly } = context.req.valid('query');
      const before =
        pageToken === undefined ? undefined : parsePageToken(pageToken);
      if (pageToken !== undefined && !before)
        throw inAppNotificationApiError(context, {
          status: 'INVALID_ARGUMENT',
          reason: 'IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN',
          key: 'invalidPageToken',
          field: 'pageToken',
        });
      const rows = await store.list({
        userId: context.var.notificationUserId,
        unreadOnly: unreadOnly === 'true',
        limit: pageSize + 1,
        before,
      });
      const data = rows.slice(0, pageSize);
      const last = data.at(-1);
      return context.json({
        data,
        meta:
          rows.length > pageSize && last
            ? { nextPageToken: encodePageToken(last) }
            : {},
      });
    },
  );
  router.get(
    '/messages/unreadCount',
    describeRoute({
      tags,
      summary: 'Count the unread messages in the inbox',
      operationId: 'notificationInAppCountUnreadMessages',
      description: inboxDescription,
      responses: {
        200: dataResponse(InboxUnreadCountSchema),
        ...inboxErrorResponses,
      },
    }),
    async (context) =>
      context.json({
        data: {
          count: await store.countUnread(context.var.notificationUserId),
        },
      }),
  );
  router.post(
    '/messages/markAllRead',
    describeRoute({
      tags,
      summary: 'Mark every message in the inbox read',
      operationId: 'notificationInAppMarkAllMessagesRead',
      description: inboxDescription,
      responses: {
        200: dataResponse(InboxMarkAllReadSchema),
        ...inboxErrorResponses,
      },
    }),
    async (context) =>
      context.json({
        data: {
          updated: await store.markAllRead(context.var.notificationUserId),
        },
      }),
  );
  for (const [verb, action, summary, operationId] of [
    [
      'markRead',
      'read',
      'Mark a message read',
      'notificationInAppMarkMessageRead',
    ],
    [
      'markUnread',
      'unread',
      'Mark a message unread',
      'notificationInAppMarkMessageUnread',
    ],
  ] as const) {
    router.post(
      `/messages/:messageId/${verb}`,
      describeRoute({
        tags,
        summary,
        operationId,
        description: inboxDescription,
        responses: {
          200: dataResponse(
            InboxMessageSchema,
            'The message after the change.',
          ),
          ...inboxErrorResponses,
          404: messageNotFoundResponse,
        },
      }),
      apiValidator('param', InboxMessageParams),
      async (context) => {
        const { messageId } = context.req.valid('param');
        const updated = await store.update({
          id: messageId,
          userId: context.var.notificationUserId,
          action,
        });
        if (!updated) throw messageNotFound(context);
        return context.json({ data: updated });
      },
    );
  }
  router.delete(
    '/messages/:messageId',
    describeRoute({
      tags,
      summary: 'Delete a message from the inbox',
      operationId: 'notificationInAppDeleteMessage',
      description: inboxDescription,
      responses: {
        204: emptyResponse('The message was deleted.'),
        ...inboxErrorResponses,
        404: messageNotFoundResponse,
      },
    }),
    apiValidator('param', InboxMessageParams),
    async (context) => {
      const { messageId } = context.req.valid('param');
      const deleted = await store.update({
        id: messageId,
        userId: context.var.notificationUserId,
        action: 'delete',
      });
      if (!deleted) throw messageNotFound(context);
      return context.body(null, 204);
    },
  );
  return router;
}

function messageNotFound(context: Context): Error {
  return inAppNotificationApiError(context, {
    status: 'NOT_FOUND',
    reason: 'IN_APP_NOTIFICATION_NOT_FOUND',
    key: 'notFound',
  });
}

function encodePageToken(item: InAppItem): string {
  return Buffer.from(
    JSON.stringify({ createdAt: item.createdAt, id: item.id }),
  ).toString('base64url');
}

function parsePageToken(
  value: string,
): { readonly createdAt: string; readonly id: string } | undefined {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (
      !isRecord(parsed) ||
      typeof parsed.createdAt !== 'string' ||
      !isCanonicalTimestamp(parsed.createdAt) ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    )
      return undefined;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return undefined;
  }
}

function isCanonicalTimestamp(value: string): boolean {
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
