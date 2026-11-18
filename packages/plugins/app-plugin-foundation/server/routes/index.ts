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
  SnapshotSchema,
  ScanStatusSchema,
  CollectionsQuery,
  CollectionItemSchema,
  RegistrationsSchema,
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
      '/registrations',
      describeRoute({
        tags,
        summary: 'Read current server plugin registrations',
        operationId: 'foundationGetRegistrations',
        description:
          'Reads static runtime registration facts without scanning, constructing providers or accessing configuration values. Requires unrestricted access.',
        responses: {
          200: dataResponse(RegistrationsSchema),
          ...apiErrorResponses,
        },
      }),
      (context) =>
        context.json({
          data: {
            serverPlugins: app.registeredServerPlugins
              ? [
                  ...new Set(
                    app.registeredServerPlugins.map(
                      (plugin) => plugin.packageName,
                    ),
                  ),
                ]
              : null,
          },
        }),
    );

    routes.get(
      '/overview',
      describeRoute({
        tags,
        summary: 'Get what the application uses of NocoBase Core',
        operationId: 'foundationGetOverview',
        description:
          'Reads the saved snapshot without scanning. Results retain their actual completion time and scanned kernel version. Only first use, a changed running kernel or an explicit POST starts a background scan. Requires unrestricted access. GET refresh and countRecords flags are no longer supported.',
        responses: {
          200: dataResponse(SnapshotSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', OverviewQuery),
      async (context) => {
        const data = await container.resolve(foundationServiceToken).snapshot();
        return context.json({ data });
      },
    );

    routes.get(
      '/scanStatus',
      describeRoute({
        tags,
        summary: 'Read the background scan status',
        operationId: 'foundationGetScanStatus',
        responses: {
          200: dataResponse(ScanStatusSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await container.resolve(foundationServiceToken).scanStatus(),
        }),
    );

    for (const action of ['ensureScan', 'refresh', 'countRecords'] as const) {
      routes.post(
        `/${action}`,
        describeRoute({
          tags,
          summary:
            action === 'ensureScan'
              ? 'Ensure the first or changed-kernel background scan'
              : action === 'refresh'
                ? 'Refresh the saved foundation in the background'
                : 'Count observed records explicitly in the background',
          operationId: `foundation${action[0].toUpperCase()}${action.slice(1)}`,
          description:
            'Returns after enqueueing. Concurrent submissions reuse an active scan. A failed attempt retains the last reliable snapshot. Counts run only through countRecords; retry a count after any active structural scan finishes.',
          responses: {
            200: dataResponse(ScanStatusSchema),
            ...apiErrorResponses,
          },
        }),
        async (context) =>
          context.json({
            data: await container.resolve(foundationServiceToken).ensureScan({
              ...(action === 'refresh' ? { refresh: true } : {}),
              ...(action === 'countRecords' ? { countRecords: true } : {}),
            }),
          }),
      );
    }

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
