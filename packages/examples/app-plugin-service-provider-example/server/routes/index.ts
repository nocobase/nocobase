import { Hono } from 'hono';
import {
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { heartbeatServiceToken } from '../tokens.js';
import { HeartbeatStatus } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();

    router.get(
      '/serviceProviderExample/status',
      describeRoute({
        tags: ['ServiceProviderExample'],
        summary: 'Get the heartbeat service status',
        operationId: 'serviceProviderExampleGetStatus',
        description:
          'The lifecycle state of the service this plugin registers through its ServiceProvider. Intentionally public, so it needs no session or API key.',
        // An empty security requirement documents a route that needs no credentials.
        security: [],
        responses: {
          200: dataResponse(HeartbeatStatus),
          500: apiErrorResponse(500),
        },
      }),
      (context) => {
        const heartbeat = container.resolve(heartbeatServiceToken);

        return context.json({
          data: {
            service: '@nocobase/app-plugin-service-provider-example',
            ...heartbeat.getState(),
          },
        });
      },
    );

    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
