import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import {
  DISTRIBUTED_NAMESPACE,
  DISTRIBUTED_STATUS_ACCESS,
} from '../../shared/types.js';
import { collectDistributedStatus } from '../status.js';
import { DistributedStatusSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const router = new Hono();
    const routes = new Hono<{
      Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
    }>();
    routes.onError(apiErrorHandler);
    const logger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('distributed')
      : undefined;

    routes.use(
      '*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
      async (context, next) => {
        // The page grant the settings route declares: hiding the entry and refusing the API are one grant.
        if (!(await context.get('authz').can(DISTRIBUTED_STATUS_ACCESS)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'DISTRIBUTED_STATUS_FORBIDDEN',
            domain: DISTRIBUTED_NAMESPACE,
            message: 'Cluster and distributed page access is required.',
          });
        context.header('Cache-Control', 'no-store');
        await next();
      },
    );

    routes.get(
      '/status',
      describeRoute({
        tags: ['Distributed'],
        summary: 'Read how this instance can run alongside others',
        operationId: 'distributedGetStatus',
        description:
          'The backends this instance selected for caching, concurrency, jobs, queue and realtime, whether each is shared between instances, and the checks that decide whether the application can run on several instances. Reflects only the instance that answers. Never returns connection addresses, user names, passwords or tokens. Requires the `page:distributed.status/access` grant.',
        responses: {
          200: dataResponse(DistributedStatusSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const status = await collectDistributedStatus(app, logger);
        return context.json({ data: DistributedStatusSchema.parse(status) });
      },
    );

    router.route(`/${DISTRIBUTED_NAMESPACE}`, routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
