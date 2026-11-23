import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import {
  NOTIFICATION_SETTINGS_RESOURCE,
  type NotificationSettingsAction,
} from '../../shared/access.js';
import {
  notificationApiError,
  notificationErrorHandler,
  notificationText,
} from '../http-errors.js';
import {
  NotificationChannelTestError,
  NotificationDeliveryRetryError,
} from '../manager.js';
import { notificationRuntimeToken } from '../runtime.js';
import type { NotificationDeliveryStatus } from '../store.js';
import {
  notificationTemplateDefaultText,
  notificationTemplateRegistryToken,
} from '../templates.js';
import { encodePageToken, parsePageToken } from './page-token.js';
import { DEFAULT_LOG_PAGE_SIZE, MAX_LOG_PAGE_SIZE } from './schemas.js';
import {
  DELIVERY_OUTCOMES,
  OUTCOME_STATUSES,
  channelParams,
  channelSchema,
  deliveryListMeta,
  deliveryLogEntrySchema,
  deliveryLogDetailsSchema,
  deliveryParams,
  deliverySettingsSchema,
  testResultSchema,
  type NotificationDeliveryOutcome,
} from './settings-schemas.js';
import {
  previewInput,
  previewSchema,
  templateQuery,
  templateSchema,
} from './template-schemas.js';

type SettingsEnv = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

const tags = ['Notification'];
const readAccess =
  'Requires the `read` action of the `notification` settings item.';
const manageAccess =
  'Requires the `manage` action of the `notification` settings item.';

const kindParams = z.object({ kindId: z.string().min(1).max(200) });

const deliveryListQuery = z.object({
  status: z.enum(DELIVERY_OUTCOMES).optional().meta({
    description:
      '`pending` covers deliveries waiting, preparing or being submitted.',
  }),
  channel: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .meta({ description: 'A channel name.' }),
  kind: z.string().min(1).max(200).optional(),
  q: z.string().trim().min(1).max(200).optional().meta({
    description:
      'An exact recipient (user id, address or device id), source reference id or idempotency key.',
  }),
  from: z.iso
    .datetime({ offset: true })
    .optional()
    .meta({ description: 'Created at or after this instant.' }),
  to: z.iso
    .datetime({ offset: true })
    .optional()
    .meta({ description: 'Created before this instant.' }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LOG_PAGE_SIZE)
    .default(DEFAULT_LOG_PAGE_SIZE),
  pageToken: z.string().min(1).max(2_048).optional(),
});

const retryInput = z.strictObject({
  reason: z.string().trim().min(1).max(500).meta({
    description: 'Why the delivery is retried; kept in its retry audit.',
  }),
});

const kindSchema = z
  .object({
    sentLast7Days: z.number().int().min(0).meta({
      description: 'Sends made for the kind in the last seven days.',
    }),
  })
  .and(templateSchema);

/**
 * System settings › Messages › Notifications: channels, notification kinds and the delivery log. Every route checks
 * the `notification` settings item: `read` to look, `manage` to send a test or retry.
 */
export function createSettingsRoutes(
  container: ServiceContainer,
  middleware: readonly MiddlewareHandler[],
): Hono {
  const router = new Hono<SettingsEnv>();
  router.onError(notificationErrorHandler);
  const runtime = () => container.resolve(notificationRuntimeToken);
  const kinds = () => container.resolve(notificationTemplateRegistryToken);
  const access =
    (action: NotificationSettingsAction): MiddlewareHandler<SettingsEnv> =>
    async (context, next) => {
      await context
        .get('authz')
        .require({ resource: NOTIFICATION_SETTINGS_RESOURCE, action });
      context.header('Cache-Control', 'no-store');
      await next();
    };
  for (const path of [
    '/channels',
    '/channels/*',
    '/kinds',
    '/kinds/*',
    '/deliveries',
    '/deliveries/*',
  ])
    router.use(path, ...(middleware as MiddlewareHandler<SettingsEnv>[]));

  router.get(
    '/channels',
    access('read'),
    describeRoute({
      tags,
      summary: 'List notification channels',
      operationId: 'notificationsListChannels',
      description: `Every channel in \`notification.channels\` with its type, a summary of its configuration with secrets masked, and its deliveries in the last 24 hours. \`meta\` carries the retry and jobs settings deliveries use. A bounded configuration list, not paginated. ${readAccess}`,
      responses: {
        200: listResponse(
          channelSchema,
          z.object({
            total: z.number().int().min(0),
            delivery: deliverySettingsSchema,
          }),
        ),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await runtime().channels();
      return context.json({
        data,
        meta: { total: data.length, delivery: runtime().deliverySettings() },
      });
    },
  );

  router.post(
    '/channels/:name/test',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Send a test notification',
      operationId: 'notificationsTestChannel',
      description: `Sends a test message through the channel to the signed-in administrator alone: to their inbox, account address or enabled browser devices; a group channel posts a short text to its group. The send appears in the delivery log with source \`notification.test\`. ${manageAccess}`,
      responses: {
        200: dataResponse(testResultSchema),
        400: apiErrorResponse(
          400,
          'The channel cannot send a test (`NOTIFICATION_CHANNEL_TEST_UNSUPPORTED`) or has no address or device for the administrator (`NOTIFICATION_CHANNEL_NO_RECIPIENT`).',
        ),
        404: apiErrorResponse(
          404,
          'No enabled channel has this name (`NOTIFICATION_CHANNEL_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', channelParams),
    async (context) => {
      const { name } = context.req.valid('param');
      const userId = context.get('auth')!.user.id;
      try {
        const sent = await runtime().testChannel(name, {
          userId,
          title: notificationText(context as Context, 'test.title'),
          body: notificationText(context as Context, 'test.body', {
            channel: name,
          }),
        });
        return context.json({
          data: { notificationId: sent.notificationId, status: sent.status },
        });
      } catch (error) {
        if (!(error instanceof NotificationChannelTestError)) throw error;
        throw notificationApiError(context as Context, {
          status:
            error.code === 'NOTIFICATION_CHANNEL_NOT_FOUND'
              ? 'NOT_FOUND'
              : 'FAILED_PRECONDITION',
          reason: error.code,
          key: {
            NOTIFICATION_CHANNEL_NOT_FOUND: 'errors.channelNotFound',
            NOTIFICATION_CHANNEL_TEST_UNSUPPORTED:
              'errors.channelTestUnsupported',
            NOTIFICATION_CHANNEL_NO_RECIPIENT: 'errors.channelNoRecipient',
          }[error.code],
          params: { name },
          cause: error,
        });
      }
    },
  );

  router.get(
    '/kinds',
    access('read'),
    describeRoute({
      tags,
      summary: 'List notification kinds',
      operationId: 'notificationsListKinds',
      description: `The notification kinds plugins registered, with their channel policies and sends in the last seven days. Notifications sent by \`send()\` directly, such as by a workflow, are not listed. A bounded configuration directory, not paginated. ${readAccess}`,
      responses: { 200: listResponse(kindSchema), ...apiErrorResponses },
    }),
    apiValidator('query', templateQuery),
    async (context) => {
      const query = context.req.valid('query');
      const since = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const sent =
        (await runtime().store.countSendsByKind?.(since)) ??
        new Map<string, number>();
      const data = kinds()
        .list()
        .filter(
          (item) =>
            (!query.category ||
              item.categoryKey === query.category ||
              notificationTemplateDefaultText(item.category) ===
                query.category) &&
            (!query.channel ||
              item.channels.some(
                (channel) =>
                  channel.name === query.channel ||
                  channel.type === query.channel,
              ) ||
              Boolean(
                item.policies?.some(({ type }) => type === query.channel),
              )) &&
            (!query.search ||
              [
                item.id,
                item.contributor,
                ...[
                  item.name,
                  item.category,
                  item.trigger,
                  item.recipients,
                  item.contributorLabel ?? '',
                ].map(notificationTemplateDefaultText),
              ]
                .join(' ')
                .toLowerCase()
                .includes(query.search.toLowerCase())),
        )
        .map((item) => ({ ...item, sentLast7Days: sent.get(item.id) ?? 0 }));
      return context.json({ data, meta: { total: data.length } });
    },
  );

  const kindNotFound = (context: Context): never => {
    throw notificationApiError(context, {
      status: 'NOT_FOUND',
      reason: 'NOTIFICATION_KIND_NOT_FOUND',
      key: 'errors.kindNotFound',
    });
  };

  router.get(
    '/kinds/:kindId',
    access('read'),
    describeRoute({
      tags,
      summary: 'Get a notification kind',
      operationId: 'notificationsGetKind',
      description: readAccess,
      responses: {
        200: dataResponse(templateSchema),
        404: apiErrorResponse(
          404,
          'No kind has this id (`NOTIFICATION_KIND_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', kindParams),
    (context) =>
      context.json({
        data:
          kinds().get(context.req.valid('param').kindId) ??
          kindNotFound(context as Context),
      }),
  );

  router.post(
    '/kinds/:kindId/preview',
    access('read'),
    describeRoute({
      tags,
      summary: 'Preview a notification kind',
      operationId: 'notificationsPreviewKind',
      description: `Renders the kind with its registered sample data only, never a business record. An unsupported locale uses the kind's first locale. Never sends a message or changes anything. ${readAccess}`,
      responses: {
        200: dataResponse(previewSchema),
        404: apiErrorResponse(
          404,
          'No kind has this id (`NOTIFICATION_KIND_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', kindParams),
    apiValidator('json', previewInput),
    async (context) =>
      context.json({
        data:
          (await kinds().preview(
            context.req.valid('param').kindId,
            context.req.valid('json').locale,
          )) ?? kindNotFound(context as Context),
      }),
  );

  router.get(
    '/deliveries',
    access('read'),
    describeRoute({
      tags,
      summary: 'List notification deliveries',
      operationId: 'notificationsListDeliveries',
      description: `The delivery log: one row per channel delivery, newest first, filtered by outcome, channel, kind, recipient or source, and creation time. \`meta.statusCounts\` counts the deliveries matching every filter but \`status\`. Pages by \`pageToken\`: pass \`meta.nextPageToken\` back with the same filters; it is absent on the last page. Message content and recipient snapshots are never included. ${readAccess}`,
      responses: {
        200: listResponse(deliveryLogEntrySchema, deliveryListMeta),
        400: apiErrorResponse(
          400,
          'The `pageToken` was not issued by this list (`INVALID_PAGE_TOKEN`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', deliveryListQuery),
    async (context) => {
      const { status, channel, kind, q, from, to, pageSize, pageToken } =
        context.req.valid('query');
      const before =
        pageToken === undefined ? undefined : parsePageToken(pageToken);
      const filter = {
        ...(status
          ? {
              statuses: OUTCOME_STATUSES[
                status
              ] as readonly NotificationDeliveryStatus[],
            }
          : {}),
        ...(channel ? { channelName: channel } : {}),
        ...(kind ? { kind } : {}),
        ...(q ? { search: q } : {}),
        ...(from ? { from: new Date(from).toISOString() } : {}),
        ...(to ? { to: new Date(to).toISOString() } : {}),
      };
      const logs = runtime().logs;
      const [rows, counts] = await Promise.all([
        logs.listDeliveryLog(filter, pageSize + 1, before),
        logs.countDeliveryStatuses(filter),
      ]);
      const data = rows.slice(0, pageSize);
      const last = data.at(-1);
      const statusCounts = Object.fromEntries(
        DELIVERY_OUTCOMES.map((outcome: NotificationDeliveryOutcome) => [
          outcome,
          OUTCOME_STATUSES[outcome].reduce(
            (total, item) =>
              total + (counts[item as NotificationDeliveryStatus] ?? 0),
            0,
          ),
        ]),
      );
      return context.json({
        data,
        meta: {
          statusCounts,
          ...(rows.length > pageSize && last
            ? { nextPageToken: encodePageToken(last.delivery) }
            : {}),
        },
      });
    },
  );

  const deliveryNotFound = (context: Context): never => {
    throw notificationApiError(context, {
      status: 'NOT_FOUND',
      reason: 'NOTIFICATION_DELIVERY_NOT_FOUND',
      key: 'errors.deliveryNotFound',
    });
  };

  router.get(
    '/deliveries/:deliveryId',
    access('read'),
    describeRoute({
      tags,
      summary: 'Get a notification delivery',
      operationId: 'notificationsGetDelivery',
      description: `One delivery with what its send was about, every attempt and every retry audit. ${readAccess}`,
      responses: {
        200: dataResponse(deliveryLogDetailsSchema),
        404: apiErrorResponse(
          404,
          'No delivery has this id (`NOTIFICATION_DELIVERY_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', deliveryParams),
    async (context) =>
      context.json({
        data:
          (await runtime().logs.getDelivery(
            context.req.valid('param').deliveryId,
          )) ?? deliveryNotFound(context as Context),
      }),
  );

  router.post(
    '/deliveries/:deliveryId/retry',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Retry a failed notification delivery',
      operationId: 'notificationsRetryDelivery',
      description: `Sends a failed delivery again as a new attempt and records \`reason\` in its retry audit. Only a failed delivery whose channel and provider are unchanged can be retried; a delivery whose outcome is unknown may already have arrived and is not retried here. ${manageAccess}`,
      responses: {
        200: dataResponse(deliveryLogDetailsSchema),
        404: apiErrorResponse(
          404,
          'No delivery has this id (`NOTIFICATION_DELIVERY_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'The delivery cannot be retried now (`NOTIFICATION_DELIVERY_RETRY_NOT_ALLOWED`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', deliveryParams),
    apiValidator('json', retryInput),
    async (context) => {
      const { deliveryId } = context.req.valid('param');
      const logs = runtime().logs;
      if (!(await logs.getDelivery(deliveryId)))
        deliveryNotFound(context as Context);
      try {
        await runtime().retryDelivery({
          deliveryId,
          reason: context.req.valid('json').reason,
        });
      } catch (error) {
        if (!(error instanceof NotificationDeliveryRetryError)) throw error;
        throw notificationApiError(context as Context, {
          status: 'ABORTED',
          reason: error.code,
          key: 'errors.deliveryNotRetryable',
          params: { detail: error.message },
          cause: error,
        });
      }
      return context.json({
        data:
          (await logs.getDelivery(deliveryId)) ??
          deliveryNotFound(context as Context),
      });
    },
  );

  return new Hono().route('/', router);
}
