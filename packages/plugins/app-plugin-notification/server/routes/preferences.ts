import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorResponse,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import {
  notificationApiError,
  notificationErrorHandler,
} from '../http-errors.js';
import { NotificationPreferenceError } from '../manager.js';
import { notificationRuntimeToken } from '../runtime.js';
import { preferencesSchema } from './settings-schemas.js';

const tags = ['Notification'];
const description =
  "Reads and changes only the signed-in user's own preferences; every signed-in user has them, so no permission is checked.";
// A signed-in route without a permission check answers 401 and 500, never 403.
const errorResponses = {
  401: apiErrorResponse(401),
  500: apiErrorResponse(500),
};

const preferencesInput = z.strictObject({
  items: z
    .array(
      z.strictObject({
        kind: z.string().min(1).max(200),
        channelType: z.string().min(1).max(64),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(500),
});

/** Personal settings › Messages › Notifications: what each kind reaches the signed-in user on. */
export function createPreferenceRoutes(
  container: ServiceContainer,
  authenticate: MiddlewareHandler<AuthEnv>,
): Hono {
  const router = new Hono<AuthEnv>();
  router.onError(notificationErrorHandler);
  router.use('/preferences', authenticate, async (context, next) => {
    context.header('Cache-Control', 'no-store');
    await next();
  });
  const runtime = () => container.resolve(notificationRuntimeToken);

  router.get(
    '/preferences',
    describeRoute({
      tags,
      summary: 'Get my notification preferences',
      operationId: 'notificationsGetPreferences',
      description: `Each notification kind with the channel types an enabled channel can reach the user on, the kind's policy and whether the user receives it there. A kind the user never changed follows its defaults. ${description}`,
      responses: { 200: dataResponse(preferencesSchema), ...errorResponses },
    }),
    async (context) =>
      context.json({
        data: await runtime().preferencesFor(context.get('auth')!.user.id),
      }),
  );

  router.put(
    '/preferences',
    describeRoute({
      tags,
      summary: 'Update my notification preferences',
      operationId: 'notificationsUpdatePreferences',
      description: `Turns channel types on or off for kinds, and answers the preferences as \`GET\` does. Only an adjustable channel type can be changed; a required one answers 400 \`NOTIFICATION_PREFERENCE_REQUIRED\` and nothing is saved. ${description}`,
      responses: {
        200: dataResponse(preferencesSchema),
        400: apiErrorResponse(
          400,
          'An item names an unknown kind or channel type (`NOTIFICATION_PREFERENCE_UNKNOWN`), or one that is always sent (`NOTIFICATION_PREFERENCE_REQUIRED`).',
        ),
        ...errorResponses,
      },
    }),
    apiValidator('json', preferencesInput),
    async (context) => {
      try {
        return context.json({
          data: await runtime().savePreferences(
            context.get('auth')!.user.id,
            context.req.valid('json').items,
          ),
        });
      } catch (error) {
        if (!(error instanceof NotificationPreferenceError)) throw error;
        throw notificationApiError(context as Context, {
          status: 'INVALID_ARGUMENT',
          reason: error.code,
          key:
            error.code === 'NOTIFICATION_PREFERENCE_REQUIRED'
              ? 'errors.preferenceRequired'
              : 'errors.preferenceUnknown',
          fieldViolations: [
            { field: `items.${error.index}`, description: error.message },
          ],
          cause: error,
        });
      }
    },
  );

  return new Hono().route('/', router);
}
