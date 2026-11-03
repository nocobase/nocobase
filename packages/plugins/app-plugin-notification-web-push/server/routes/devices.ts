import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication as Application } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  describeRoute,
  cliRoute,
  apiValidator,
  dataResponse,
  listResponse,
  emptyResponse,
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

export function createDeviceRoutes(): AppApiRouteContribution<Application> {
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
      response: ReturnType<typeof dataResponse>,
      errors: Parameters<typeof apiErrorResponse>[0][] = [],
      status: number = 200,
    ) =>
      describeRoute({
        operationId,
        summary,
        tags: ['WebPush'],
        ...cliRoute(false),
        responses: {
          [status]: response,
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
          ...Object.fromEntries(
            errors.map((code) => [code, apiErrorResponse(code)]),
          ),
        },
      });
    router.get(
      '/key',
      describe(
        'webPushReadPushKey',
        'Read the Web Push public key',
        dataResponse(z.object({ publicKey: z.string().nullable() })),
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
        'webPushListPushSubscriptions',
        'List the caller’s subscribed devices',
        listResponse(
          Device,
          z.object({ total: z.number().int().nonnegative() }),
        ),
      ),
      async (context) => {
        const data = await service().subscriptions.list(owner(context));
        return context.json({ data, meta: { total: data.length } });
      },
    );
    router.post(
      '/subscriptions',
      describe(
        'webPushSavePushSubscription',
        'Subscribe this browser for the caller',
        dataResponse(Device),
        [400, 403, 503],
      ),
      apiValidator('json', SubscriptionInput),
      async (context) => {
        if (!app.config.get<PushConfig>('push')?.privateKey)
          throw new PushError('unavailable');
        const device = await service().subscribe(
          owner(context),
          context.req.valid('json'),
        );
        return context.json({ data: device });
      },
    );
    router.patch(
      '/subscriptions/:id',
      describe(
        'webPushUpdatePushSubscription',
        'Enable or disable the caller’s device',
        dataResponse(Device),
        [404],
      ),
      apiValidator('param', Id),
      apiValidator('json', Changed),
      async (context) => {
        const device = await service().subscriptions.update(
          owner(context),
          context.req.valid('param').id,
          context.req.valid('json').enabled,
        );
        return context.json({ data: device });
      },
    );
    router.delete(
      '/subscriptions/:id',
      describe(
        'webPushDeletePushSubscription',
        'Remove the caller’s device',
        emptyResponse(),
        [404],
        204,
      ),
      apiValidator('param', Id),
      async (context) => {
        const removed = await service().subscriptions.remove(
          owner(context),
          context.req.valid('param').id,
        );
        if (!removed) throw new PushError('missing');
        return context.body(null, 204);
      },
    );
    router.post(
      '/subscriptions/:id/test',
      describe(
        'webPushTestPushSubscription',
        'Send a test notification to the caller’s device',
        dataResponse(Done),
        [404, 429, 503],
        202,
      ),
      apiValidator('param', Id),
      async (context) => {
        await service().test(owner(context), context.req.valid('param').id);
        return context.json({ data: { ok: true } }, 202);
      },
    );
    return new Hono().route('/webPush', router);
  });
}
