import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { createPracticeRoutes } from './practice.js';
import { createSalesListRoutes } from './lists.js';
import { createProjectRoutes } from './projects.js';
import { createQuoteRoutes } from './quotes.js';
import { createOrderRoutes } from './orders.js';
import { handleRouteError } from './errors.js';
import { AUTHORIZATION_EXAMPLE_DOMAIN } from './mutations.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes<AppPluginApplication>(async (app) => {
    const router = new Hono<AuthorizationEnv>();
    const authz = app.container.resolve(authorizationToken);
    const database = app.container.resolve(databaseManagerToken);

    router.use(
      '*',
      app.container.resolve(authenticationToken).required(),
      authz.middleware(),
      bodyLimit({
        maxSize: 4096,
        onError: (c) =>
          apiErrorHandler(
            new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'BODY_TOO_LARGE',
              domain: AUTHORIZATION_EXAMPLE_DOMAIN,
              message: 'The request body exceeds 4 KiB.',
              httpStatus: 413,
            }),
            c,
          ),
      }),
    );

    router.route('/', createPracticeRoutes(database, authz));
    router.route('/', createSalesListRoutes(database));
    router.route('/', await createProjectRoutes(app));
    router.route('/', createQuoteRoutes(database));
    router.route('/', createOrderRoutes(database));
    router.onError(handleRouteError);

    return new Hono().route('/authorizationExample', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
