import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

import { createTemplatePrintRoutes } from './template-print.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app) => {
    const router = new Hono<AuthorizationEnv>();
    const authentication = app.container.resolve(authenticationToken);
    const authorization = app.container.resolve(authorizationToken);
    const database = app.container.resolve(databaseManagerToken);

    router.use('*', authentication.required(), authorization.middleware());
    router.route('/', createTemplatePrintRoutes(database));
    router.onError(apiErrorHandler);

    return new Hono().route('/templatePrintExample', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
