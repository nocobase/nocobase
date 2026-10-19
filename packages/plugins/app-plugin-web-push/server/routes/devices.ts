import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication as Application } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  describeRoute,
  cliRoute,
  apiValidator,
  dataResponse,
  apiErrorResponses,
  apiErrorResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import { Device, Id, Changed, Done } from './schemas.js';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type { PushConfig } from '../config.js';
import { vapidKeys } from '../keys.js';
import { SubscriptionInput, PushError } from '../subscriptions.js';
import { webPushServiceToken } from '../tokens.js';

export function createDeviceRoutes(
  options: {
    path?: string;
    operationPrefix?: string;
    subscribed?: (userId: string) => Promise<void>;
  } = {},
): AppApiRouteContribution<Application> {
  return defineApiRoutes((app) => {
    const router = new Hono();
    router.onError((error, context) => {
      if (error instanceof PushError) {
        const status =
          error.code === 'missing'
            ? 'NOT_FOUND'
            : error.code === 'owned'
              ? 'PERMISSION_DENIED'
              : error.code === 'unavailable'
                ? 'UNAVAILABLE'
                : error.code === 'limited'
                  ? 'RESOURCE_EXHAUSTED'
                  : 'INVALID_ARGUMENT';
        return apiErrorHandler(
          new ApiError({
            status,
            reason: `PUSH_${error.code.toUpperCase()}`,
            domain: 'webPush',
            message: error.message,
          }),
          context,
        );
      }
      return apiErrorHandler(error, context);
    });
    router.use('*', app.container.resolve(authenticationToken).required());
    const service = () => app.container.resolve(webPushServiceToken);
    const owner = (context: { get: (key: never) => unknown }): string => {
      const auth = context.get('auth' as never) as
        { user?: { id?: string } } | undefined;
      const userId = auth?.user?.id;
      if (!userId)
        throw new ApiError({
          status: 'UNAUTHENTICATED',
          reason: 'USER_REQUIRED',
          domain: 'webPush',
          message: 'Sign in as a user to manage devices.',
        });
      return userId;
    };
    const describe = (
      operationId: string,
      summary: string,
      schema: z.ZodType,
    ) =>
      describeRoute({
        operationId: `${options.operationPrefix ?? 'webPush'}${operationId.slice(6)}`,
        summary,
        tags: ['WebPush'],
        ...cliRoute(false),
        responses: {
          200: dataResponse(schema),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
          429: apiErrorResponse(429),
          503: apiErrorResponse(503),
        },
      });
    router.get(
      '/key',
      describe(
        'studioReadPushKey',
        'Read the Web Push public key',
        z.object({ publicKey: z.string().nullable() }),
      ),
      (context) => {
        const config = app.config.get<PushConfig>('push');
        return context.json({
          data: {
            publicKey:
              config?.privateKey && service().subscriptions.ready
                ? vapidKeys(config.privateKey).publicKey
                : null,
          },
        });
      },
    );
    router.get(
      '/subscriptions',
      describe(
        'studioListPushSubscriptions',
        'List the caller’s subscribed devices',
        z.array(Device),
      ),
      async (context) =>
        context.json({
          data: await service().subscriptions.list(owner(context)),
        }),
    );
    router.post(
      '/subscriptions',
      describe(
        'studioSavePushSubscription',
        'Subscribe this browser for the caller',
        Device,
      ),
      apiValidator('json', SubscriptionInput),
      async (context) => {
        if (!app.config.get<PushConfig>('push')?.privateKey)
          throw new PushError('unavailable');
        const device = await service().subscriptions.save(
          owner(context),
          context.req.valid('json'),
        );
        await options.subscribed?.(owner(context));
        return context.json({ data: device });
      },
    );
    router.patch(
      '/subscriptions/:id',
      describe(
        'studioUpdatePushSubscription',
        'Enable or disable the caller’s device',
        Done,
      ),
      apiValidator('param', Id),
      apiValidator('json', Changed),
      async (context) => {
        await service().subscriptions.update(
          owner(context),
          context.req.valid('param').id,
          context.req.valid('json').enabled,
        );
        return context.json({ data: { ok: true } });
      },
    );
    router.delete(
      '/subscriptions/:id',
      describe(
        'studioDeletePushSubscription',
        'Remove the caller’s device',
        Done,
      ),
      apiValidator('param', Id),
      async (context) => {
        await service().subscriptions.remove(
          owner(context),
          context.req.valid('param').id,
        );
        return context.json({ data: { ok: true } });
      },
    );
    router.post(
      '/subscriptions/:id/test',
      describe(
        'studioTestPushSubscription',
        'Send a test notification to the caller’s device',
        Done,
      ),
      apiValidator('param', Id),
      async (context) => {
        await service().test(owner(context), context.req.valid('param').id);
        return context.json({ data: { ok: true } });
      },
    );
    return new Hono().route(options.path ?? '/webPush', router);
  });
}
