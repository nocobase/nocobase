import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { RoutesExampleGreeting } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);

    router.use('/routesExample', authentication.required());
    router.get(
      '/routesExample',
      // Declares the route for the application's API document, served at /api/swagger/docs.
      describeRoute({
        tags: ['RoutesExample'],
        summary: 'Get the routes example greeting',
        operationId: 'routesExampleGetGreeting',
        responses: {
          200: dataResponse(RoutesExampleGreeting),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      (context) =>
        context.json({
          data: {
            scope: 'api',
            plugin: '@nocobase/app-plugin-routes-example',
            message: 'Hello from the routes example API route',
          },
        }),
    );

    return router;
  });
