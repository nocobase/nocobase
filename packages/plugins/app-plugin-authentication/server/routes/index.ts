import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { authenticationToken } from '../tokens.js';
import type { AuthenticationProviderConfig } from '../providers/authentication.js';

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<AuthenticationProviderConfig>
> = defineApiRoutes((app) => {
  const router = new Hono();

  const auth = app.container.resolve(authenticationToken);
  router.on(
    ['GET', 'POST'],
    '/auth/*',
    // A catch-all handing every request to Better Auth; its endpoints are documented one by one from Better Auth's own
    // generator, through the fragment the provider adds.
    describeRoute({ hide: true }),
    (context) => auth.handler(context.req.raw),
  );
  return router;
});

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<AuthenticationProviderConfig>
>[] = [apiRoutes];

export default routes;
