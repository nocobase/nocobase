import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { FOUNDATION_NAMESPACE } from '../../shared/foundation.js';
import { foundationServiceToken } from '../tokens.js';
import {
  OverviewQuery,
  OverviewSchema,
  CollectionsQuery,
  CollectionItemSchema,
} from './schemas.js';

const tags = ['Foundation'];

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const router = new Hono();
    const routes = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);

    routes.onError((error, context) => apiErrorHandler(error, context));

    routes.use('*', authentication.required(), authorization.middleware());

    // Only an identity with unrestricted access, such as a holder of the root Permission Set, reads the overview. It is
    // not a grant anyone can be given: the page shows every capability's internals, settings and statistics at once.
    routes.use('*', async (context, next) => {
      const { unrestricted } = await context.get('authz').snapshot();
      if (!unrestricted) {
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'FOUNDATION_FORBIDDEN',
          domain: FOUNDATION_NAMESPACE,
          message:
            'Only an administrator with unrestricted access can read the App Foundation.',
        });
      }
      await next();
    });

    routes.get(
      '/overview',
      describeRoute({
        tags,
        summary: 'Get what the application uses of NocoBase Core',
        operationId: 'foundationGetOverview',
        description:
          'Every NocoBase Core capability with its status, evidence, statistics and providing packages. Failed reads leave information pending or retain reliable observations with their original checkedAt; incomplete file discovery never produces exact current totals. Unknown extensions do not discard observed statistics or create read failures; data-modeling statistics exclude known system tables without asserting ownership or exhaustive coverage. Collected read-only and cached for 30 seconds; refresh=true collects again. History is application-service-local and cleared on restart or a changed scope. Requires unrestricted access, such as the root Permission Set.',
        responses: {
          200: dataResponse(OverviewSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', OverviewQuery),
      async (context) => {
        const { refresh, countRecords } = context.req.valid('query');
        const data = await container.resolve(foundationServiceToken).overview({
          refresh: refresh === true,
          countRecords: countRecords === true,
        });
        return context.json({ data });
      },
    );

    routes.get(
      '/collections',
      describeRoute({
        tags,
        summary: 'List observed data Collections on demand',
        operationId: 'foundationListCollections',
        responses: {
          200: listResponse(CollectionItemSchema),
          ...apiErrorResponses,
          503: apiErrorResponse(503),
        },
      }),
      apiValidator('query', CollectionsQuery),
      async (context) => {
        const data = await container
          .resolve(foundationServiceToken)
          .collections(context.req.valid('query'));
        if (!data)
          throw new ApiError({
            status: 'UNAVAILABLE',
            reason: 'FOUNDATION_COLLECTIONS_UNAVAILABLE',
            domain: FOUNDATION_NAMESPACE,
            message: 'The data Collection catalog could not be read.',
          });
        return context.json({ data: data.items, meta: { total: data.total } });
      },
    );

    router.route(`/${FOUNDATION_NAMESPACE}`, routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
