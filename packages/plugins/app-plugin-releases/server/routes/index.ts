import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import { releasesToken } from '../tokens.js';
import { createReleasesApi } from './api.js';

/** `/api/releases`, authenticated by the application's authentication and authorization plugins. */
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const services = container.resolve(releasesToken);
    // Scoped API keys are welcome: every service checks the caller, which carries the key's scope (`callerOf`).
    const required = container
      .resolve(authenticationToken)
      .required({ scopedKeys: true }) as unknown as MiddlewareHandler;
    const authorize = container
      .resolve(authorizationToken)
      .middleware() as unknown as MiddlewareHandler;
    const security = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('security')
      : undefined;
    const router = new Hono();
    router.route(
      '/releases',
      createReleasesApi(services, {
        authenticate: async (context, next) => {
          let answer: Response | void = undefined;
          const result = await required(context, async () => {
            answer = await authorize(context, next);
          });
          return result ?? answer;
        },
        callerOf: (context) =>
          services.callerOf(
            (context as Context<AuthorizationEnv>).get('authz').identity,
          ),
        securityLog: (event, details) =>
          security?.info({ event, ...details }, event),
      }),
    );
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
