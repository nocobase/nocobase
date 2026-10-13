/**
 * `/api/inbox`, the caller's own inbox: `GET /items` (its items, newest first, with what Studio knows about each; what
 * `inbox list` reads, for the person and for an agent's run acting for them), `GET /notices?ids=a,b` (what Studio knows
 * about those inbox items), `GET /pending` (how many decisions still wait on the caller) and `GET /waiting` (those
 * decisions with their items, newest first, at most `INBOX_WAITING_MAX`; `?subject=issue:<id>` for those about one
 * thing, as an issue page lists them). An item's read state and deletion are the in-app notification plugin's
 * (`/api/notificationInApp`). Deciding is never here: each contributor decides through its own API and settles the
 * item through Studio's inbox port.
 */
import { INBOX_READ_ACTION } from '../agents/capabilities.js';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import type { InboxPending } from '../../shared/inbox.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { boundedList } from '../http/input.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { decodeItemToken, encodeItemToken, itemView } from './items.js';
import {
  InboxItemSchema,
  InboxNoticeSchema,
  InboxPendingSchema,
  InboxWaitingSchema,
  ItemsQuery,
  NoticesQuery,
  WaitingQuery,
} from './schemas.js';
import { studioInboxSourceToken, studioInboxToken } from './token.js';

const tags = ['Studio'];
const errors = { 401: apiErrorResponse(401), 500: apiErrorResponse(500) };

export const inboxRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    // Without authentication (an application's own tests) there is nothing to serve.
    if (!container.has(authenticationToken)) return new Hono();
    const authentication = container.resolve(authenticationToken);
    const required = authentication.required() as unknown as MiddlewareHandler;

    const routes = new Hono();
    routes.onError(studioErrorHandler);
    const userId = (context: Context) =>
      (context.get('auth' as never) as { user: { id: string } }).user.id;

    if (
      container.has(authorizationToken) &&
      container.has(studioInboxSourceToken)
    ) {
      const source = container.resolve(studioInboxSourceToken);
      routes.get(
        '/items',
        // A scoped key reads its person's inbox, and so does an agent's run for the person who woke it.
        authentication.required({
          scopedKeys: true,
        }) as unknown as MiddlewareHandler,
        container
          .resolve(authorizationToken)
          .middleware() as unknown as MiddlewareHandler,
        describeRoute({
          tags,
          summary: 'List the caller’s inbox',
          operationId: 'inboxListItems',
          description:
            'Decisions waiting on the caller and news, newest first, with what each is about. An agent’s run reads the inbox of the person who woke it.',
          security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, { runToken: [] }],
          ...cliRoute({
            command: 'inbox list',
            flags: { pageSize: { name: 'limit' } },
            columns: ['id', 'kind', 'pending', 'issue', 'title', 'createdAt'],
            action: INBOX_READ_ACTION,
            examples: ['inbox list --unread true'],
          }),
          responses: {
            200: listResponse(InboxItemSchema),
            400: apiErrorResponse(
              400,
              'The `pageToken` was not issued by this list (`INBOX_INVALID_PAGE_TOKEN`).',
            ),
            ...errors,
          },
        }),
        apiValidator('query', ItemsQuery),
        async (context) => {
          const { unread, pageSize, pageToken } = context.req.valid('query');
          const before =
            pageToken === undefined ? undefined : decodeItemToken(pageToken);
          if (pageToken !== undefined && !before)
            throw studioError(
              'INVALID_ARGUMENT',
              'INBOX_INVALID_PAGE_TOKEN',
              'The page token was not issued by this list.',
              {
                fieldViolations: [
                  {
                    field: 'pageToken',
                    description: 'Not a token of this list.',
                  },
                ],
              },
            );
          const caller = callerOfRequest(context as unknown as Context);
          const entries = await source.list(caller?.userId ?? userId(context), {
            limit: pageSize + 1,
            ...(unread === 'true' ? { unreadOnly: true } : {}),
            ...(before ? { before } : {}),
          });
          const page = entries.slice(0, pageSize);
          const last = page.at(-1);
          return context.json({
            data: page.map(itemView),
            meta:
              entries.length > pageSize && last
                ? { nextPageToken: encodeItemToken(last) }
                : {},
          });
        },
      );
    }

    if (container.has(studioInboxToken)) {
      const inbox = container.resolve(studioInboxToken);
      routes.get(
        '/notices',
        required,
        describeRoute({
          tags,
          summary: 'List what Studio knows about the caller’s inbox items',
          operationId: 'inboxListNotices',
          description:
            'Items are named by their in-app notification ids (`ids=a,b`); ids the caller does not have are left out.',
          // The browser's inbox joins it to the in-app items it lists; `inbox list` answers both at once.
          ...cliRoute(false),
          responses: { 200: listResponse(InboxNoticeSchema), ...errors },
        }),
        apiValidator('query', NoticesQuery),
        async (context) =>
          context.json(
            boundedList(
              await inbox.notices(
                userId(context),
                context.req.valid('query').ids,
              ),
            ),
          ),
      );
      routes.get(
        '/pending',
        required,
        describeRoute({
          tags,
          summary: 'Count waiting decisions and unread notifications',
          operationId: 'inboxGetPending',
          ...cliRoute({ command: 'inbox pending' }),
          responses: { 200: dataResponse(InboxPendingSchema), ...errors },
        }),
        async (context) =>
          context.json({
            data: {
              decision: await inbox.pending(userId(context)),
              info: await inbox.unreadNotifications(userId(context)),
            } satisfies InboxPending,
          }),
      );
      routes.get(
        '/waiting',
        required,
        describeRoute({
          tags,
          summary: 'List the decisions waiting on the caller',
          operationId: 'inboxListWaiting',
          description:
            'Newest first, with their in-app items; `subject=<type>:<id>` keeps those about one thing.',
          ...cliRoute({
            command: 'inbox waiting',
            columns: [
              'item.id',
              'notice.type',
              'notice.subject.label',
              'item.title',
              'item.createdAt',
            ],
            examples: ['inbox waiting --subject issue:123'],
          }),
          responses: { 200: listResponse(InboxWaitingSchema), ...errors },
        }),
        apiValidator('query', WaitingQuery),
        async (context) =>
          context.json(
            boundedList(
              await inbox.waitingFor(
                userId(context),
                context.req.valid('query').subject,
              ),
            ),
          ),
      );
    }

    const router = new Hono();
    router.route('/inbox', routes);
    return router;
  });
