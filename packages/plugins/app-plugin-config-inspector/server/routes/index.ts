import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { inspectConfiguration } from '../snapshot.js';
import { snapshotSchema } from './schemas.js';
import { access } from '../../shared/access.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const router = new Hono<AuthorizationEnv>();
    router.onError(apiErrorHandler);
    router.get(
      '/configInspector',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
      async (ctx, next) => {
        if (!(await ctx.get('authz').can(access)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'configInspector',
            reason: 'ACCESS_DENIED',
            message: 'Configuration inspection permission is required.',
          });
        await next();
      },
      describeRoute({
        tags: ['ConfigInspector'],
        operationId: 'configInspectorReadSettings',
        summary: 'Inspect application configuration',
        description:
          'Requires page:config-inspector/access. Returns the running settings with their sources, the configuration file and config.example.yml, with every credential redacted.',
        responses: { 200: dataResponse(snapshotSchema), ...apiErrorResponses },
      }),
      async (ctx) => {
        const data = await inspectConfiguration(app);
        ctx.header('Cache-Control', 'no-store');
        return ctx.json({ data });
      },
    );
    return new Hono().route('/', router);
  });
const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];
export default routes;
