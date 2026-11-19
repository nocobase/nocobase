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
import { z } from 'zod';
import { stringify } from 'yaml';
import { access } from '../../shared/access.js';

const schema = z.object({
  settings: z.array(
    z.object({
      path: z.string(),
      value: z.string(),
      source: z.string(),
      variable: z.string().optional(),
    }),
  ),
  yaml: z.string(),
});
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
          'Requires page:config-inspector/access. Returns reviewed configuration fields only.',
        responses: { 200: dataResponse(schema), ...apiErrorResponses },
      }),
      (ctx) => {
        const rows = app.config.inspectSettings?.() ?? [];
        const file: Record<string, unknown> = {};
        for (const { path, fileValue } of rows) {
          if (fileValue === undefined) continue;
          const keys = path.split('.');
          let node = file;
          for (const key of keys.slice(0, -1))
            node = (node[key] ??= {}) as Record<string, unknown>;
          node[keys[keys.length - 1]] = fileValue;
        }
        ctx.header('Cache-Control', 'no-store');
        return ctx.json({
          data: {
            settings: rows.map(({ path, value, source, variable }) => ({
              path,
              value,
              source,
              variable,
            })),
            yaml: stringify(file),
          },
        });
      },
    );
    return new Hono().route('/', router);
  });
const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];
export default routes;
