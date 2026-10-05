import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { getRequestTranslator, type Translator } from '@nocobase/i18n/server';

import { notificationRuntimeToken } from '../runtime.js';
import { NotificationTransportUnavailableError } from '../manager.js';
import {
  notificationApiError,
  notificationErrorHandler,
} from '../http-errors.js';
import type { NotificationProviderApplicationConfig } from '../providers/notification.js';
import type {
  NotificationI18nText,
  NotificationTestTargetDescriptor,
} from '../types.js';
import {
  NotificationLogDetailsSchema,
  NotificationSendResultSchema,
  NotificationTestSendBody,
  NotificationTestSendParams,
  NotificationTestTargetSchema,
} from './schemas.js';

type NotificationRoutesEnv = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

const TEST_HEADER = 'x-nocobase-notification-test';
/** The test-send routes, guarded by the test header; logs share the `/notifications` prefix but not the guard. */
const TEST_PATHS = ['/testTargets', '/testSends', '/testSends/:testSendId'];

const tags = ['Notification'];

/** The test-send routes refuse a request without the test header, so a page or script cannot send one by accident. */
const testHeaderParameter: OpenAPIV3_1.ParameterObject = {
  in: 'header',
  name: TEST_HEADER,
  required: true,
  schema: { type: 'string', enum: ['1'] },
  description:
    'Must be `1`. Without it the route answers 403 `NOTIFICATION_TEST_HEADER_REQUIRED`, so a test is never sent by accident.',
};

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<NotificationProviderApplicationConfig>
> = defineApiRoutes(({ container }) => {
  const router = new Hono();
  const notification = container.resolve(notificationRuntimeToken);
  const auth = container.resolve(authenticationToken);
  const authorization = container.resolve(authorizationToken);

  const logs = new Hono<NotificationRoutesEnv>();
  logs.onError(notificationErrorHandler);
  logs.use('/logs/:logId?', auth.required(), authorization.middleware());
  logs.use('/logs/:logId?', async (context, next) => {
    const allowed = await context.get('authz').can({
      resource: { type: 'page', id: 'notification.logs' },
      action: 'access',
    });
    if (!allowed) {
      throw notificationApiError(context as Context, {
        status: 'PERMISSION_DENIED',
        reason: 'NOTIFICATION_LOGS_FORBIDDEN',
        key: 'errors.logsForbidden',
      });
    }
    await next();
  });
  logs.route('/', notification.router);

  const tests = new Hono<NotificationRoutesEnv>();
  tests.onError(notificationErrorHandler);
  for (const path of TEST_PATHS) {
    tests.use(path, auth.required(), authorization.middleware());
    tests.use(path, async (context, next) => {
      if (context.req.header(TEST_HEADER) !== '1') {
        throw notificationApiError(context as Context, {
          status: 'PERMISSION_DENIED',
          reason: 'NOTIFICATION_TEST_HEADER_REQUIRED',
          key: 'errors.testHeaderRequired',
        });
      }
      await next();
    });
  }
  tests.use('/testSends', async (context, next) => {
    if (context.req.method !== 'POST') return next();
    const allowed = await context.get('authz').can({
      resource: { type: 'notification', id: 'test' },
      action: 'send',
    });
    if (!allowed) {
      throw notificationApiError(context as Context, {
        status: 'PERMISSION_DENIED',
        reason: 'NOTIFICATION_TEST_FORBIDDEN',
        key: 'errors.testForbidden',
      });
    }
    await next();
  });
  // The targets come from configuration, so the list is short and bounded: it is not paged but still reports its total.
  tests.get(
    '/testTargets',
    describeRoute({
      tags,
      summary: 'List the channels a test notification can be sent to',
      operationId: 'notificationsListTestTargets',
      description:
        'Every configured channel whose provider supports a test send, with the fields its test form takes, in one unpaged response with `meta.total`. Labels are in the request locale.',
      parameters: [testHeaderParameter],
      responses: {
        200: listResponse(NotificationTestTargetSchema),
        ...apiErrorResponses,
      },
    }),
    (context) => {
      const t = getRequestTranslator(context);
      const data = notification
        .listTestTargets()
        .map((target) => localizeTestTarget(target, t));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  tests.post(
    '/testSends',
    describeRoute({
      tags,
      summary: 'Send a test notification',
      operationId: 'notificationsCreateTestSend',
      description:
        'Sends a test through one configured channel to the recipient given in `values`, whose keys are the `fields` of that channel in `GET /api/notifications/testTargets`. Requires the `notification:test/send` permission (403 `NOTIFICATION_TEST_FORBIDDEN`). An unknown channel or field, a missing required value or one over its `maxLength` answers 400 with a field violation.',
      parameters: [testHeaderParameter],
      responses: {
        202: dataResponse(
          NotificationSendResultSchema,
          'Accepted, not yet delivered. Follow it with `GET /api/notifications/testSends/{testSendId}`.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The channel cannot be tested (`NOTIFICATION_TEST_TARGET_UNAVAILABLE`), or `values` names an unknown field, misses a required one or exceeds its `maxLength` (`NOTIFICATION_TEST_UNKNOWN_FIELD`, `NOTIFICATION_TEST_REQUIRED_FIELD`, `NOTIFICATION_TEST_FIELD_TOO_LONG`).',
        ),
        503: apiErrorResponse(
          503,
          'The channel transport cannot be reached (`NOTIFICATION_TEST_FAILED`).',
        ),
      },
    }),
    apiValidator('json', NotificationTestSendBody),
    async (context) => {
      const request = context.req.valid('json');
      try {
        const result = await notification.sendTest(request, {
          userId: context.get('auth')!.user.id,
        });
        // Accepted, not yet delivered: `GET /notifications/testSends/{notificationId}` reads its progress.
        return context.json({ data: result }, 202);
      } catch (error) {
        // Only a transport that cannot be reached is the test's own failure; validation errors are translated by
        // `onError`, and anything else is a defect the application answers.
        if (!(error instanceof NotificationTransportUnavailableError))
          throw error;
        throw notificationApiError(context, {
          status: 'UNAVAILABLE',
          reason: 'NOTIFICATION_TEST_FAILED',
          key: 'errors.testFailed',
          cause: error,
        });
      }
    },
  );
  tests.get(
    '/testSends/:testSendId',
    describeRoute({
      tags,
      summary: 'Get the progress of a test notification',
      operationId: 'notificationsGetTestSend',
      description:
        'The log of a test the signed-in user sent, with every delivery and attempt. `testSendId` is the `notificationId` the send answered.',
      parameters: [testHeaderParameter],
      responses: {
        200: dataResponse(NotificationLogDetailsSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No test the signed-in user sent has this id (`NOTIFICATION_TEST_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', NotificationTestSendParams),
    async (context) => {
      const { testSendId } = context.req.valid('param');
      const details = await notification.getTestStatus(testSendId, {
        userId: context.get('auth')!.user.id,
      });
      if (!details) {
        throw notificationApiError(context, {
          status: 'NOT_FOUND',
          reason: 'NOTIFICATION_TEST_NOT_FOUND',
          key: 'errors.testNotFound',
        });
      }
      return context.json({ data: details });
    },
  );

  router.route('/notifications', logs);
  router.route('/notifications', tests);
  return router;
});

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<NotificationProviderApplicationConfig>
>[] = [apiRoutes];

export default routes;

function localizeTestTarget(
  target: NotificationTestTargetDescriptor,
  t: Translator,
): NotificationTestTargetDescriptor<string> {
  return {
    channel: {
      name: target.channel.name,
      type: target.channel.type,
      label: translateText(target.channel.label, t),
    },
    provider: {
      type: target.provider.type,
      label: translateText(target.provider.label, t),
    },
    fields: target.fields.map((field) => ({
      name: field.name,
      label: translateText(field.label, t),
      type: field.type,
      ...(field.required === undefined ? {} : { required: field.required }),
      ...(field.placeholder === undefined
        ? {}
        : { placeholder: translateText(field.placeholder, t) }),
      ...(field.defaultValue === undefined
        ? {}
        : { defaultValue: translateText(field.defaultValue, t) }),
      ...(field.maxLength === undefined ? {} : { maxLength: field.maxLength }),
    })),
  };
}

function translateText(
  text: string | NotificationI18nText,
  t: Translator,
): string {
  return typeof text === 'string'
    ? text
    : t(text.key, { ns: text.ns, defaultValue: text.defaultValue });
}
