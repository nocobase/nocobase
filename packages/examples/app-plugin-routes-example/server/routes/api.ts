import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);

    router.use('/routesExample', authentication.required());
    router.get('/routesExample', (context) =>
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
