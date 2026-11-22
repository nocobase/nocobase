import { existsSync } from 'node:fs';
import path from 'node:path';

import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { FOUNDATION_NAMESPACE, PLUGINS_ACCESS } from '../../shared/access.js';
import { FoundationPluginCatalog } from '../plugins.js';
import { PluginSchema, PluginsMetaSchema, PluginsQuery } from './schemas.js';

const tags = ['Foundation'];

/** The directory holding the application's `package.json`. */
export function applicationRoot(app: AppPluginApplication): string {
  // A hosted archive can keep the application package under dist/ while rootDir points to the extraction root.
  return (
    [app.paths.rootDir, app.paths.server('..')].find((directory) =>
      existsSync(path.join(directory, 'package.json')),
    ) ?? app.paths.rootDir
  );
}

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const catalog = new FoundationPluginCatalog({
      rootDir: applicationRoot(app),
      serverPlugins: () => app.registeredServerPlugins,
    });
    const router = new Hono();
    const routes = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);

    routes.onError((error, context) => apiErrorHandler(error, context));

    routes.get(
      '/plugins',
      authentication.required(),
      authorization.middleware(),
      async (context, next) => {
        await context.get('authz').require(PLUGINS_ACCESS);
        await next();
      },
      describeRoute({
        tags,
        summary: 'List the plugins the application uses',
        operationId: 'foundationListPlugins',
        description:
          'Lists the application plugins the application declares or registers, with their installed versions, the names and descriptions their package.json declares under `nocobase`, and the registration state `pnpm nocobase plugin inspect` reports. Reads installed manifests only; nothing is scanned or written. Requires the `read` action of the `foundation.plugins` settings item.',
        responses: {
          200: listResponse(PluginSchema, PluginsMetaSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', PluginsQuery),
      async (context) => {
        const { client } = context.req.valid('query');
        return context.json(
          await catalog.list(
            client === undefined
              ? undefined
              : Array.isArray(client)
                ? client
                : [client],
          ),
        );
      },
    );

    router.route(`/${FOUNDATION_NAMESPACE}`, routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
