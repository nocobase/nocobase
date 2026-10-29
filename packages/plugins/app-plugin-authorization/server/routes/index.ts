import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  repositoryIdempotencyToken,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

import { createAuthorizationRoutes } from './authorization.js';
import { authorizationToken } from '../tokens.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    router.route(
      '/authorization',
      createAuthorizationRoutes(
        container.resolve(authenticationToken),
        container.resolve(authorizationToken),
        container.has(databaseManagerToken)
          ? {
              connection: container.resolve(databaseManagerToken).connection(),
              protection: container.has(repositoryIdempotencyToken)
                ? container.resolve(repositoryIdempotencyToken)
                : undefined,
            }
          : undefined,
      ),
    );
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
