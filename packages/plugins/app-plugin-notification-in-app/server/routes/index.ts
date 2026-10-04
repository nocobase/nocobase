import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { createInAppRouter } from '../router.js';
import { inAppNotificationStoreToken } from '../tokens.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const store = container.resolve(inAppNotificationStoreToken);
    const auth = container.resolve(authenticationToken);

    router.route(
      '/notificationInApp',
      createInAppRouter(store, { authenticate: auth.required() }),
    );
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
