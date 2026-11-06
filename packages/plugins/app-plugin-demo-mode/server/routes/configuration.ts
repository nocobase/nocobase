import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  type AppApiRouteContribution,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import { createMiddleware } from 'hono/factory';
import {
  ConfigurationInput,
  ConfigurationView,
} from '../configuration/schemas.js';
import { demoConfigurationToken } from '../tokens.js';
import { demoWriteGuardToken } from '../guard.js';

export const DEMO_CONFIGURATION_SETTINGS = 'demoMode.configuration';
export const configurationRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes<AppPluginApplication>(({ container }) => {
    const router = new Hono();
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken)
    )
      return router;
    const service = container.resolve(demoConfigurationToken);
    const routes = new Hono<AuthorizationEnv>();
    routes.onError(apiErrorHandler);
    routes.use(
      '*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
    );
    const allowed = (action: 'read' | 'configure') =>
      createMiddleware<AuthorizationEnv>(async (c, next) => {
        service.requireEnabled();
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_CONFIGURATION_SETTINGS },
          action: 'read',
        });
        if (action !== 'read')
          await c.get('authz').require({
            resource: { type: 'settings', id: DEMO_CONFIGURATION_SETTINGS },
            action,
          });
        await next();
      });
    const responses = {
      200: dataResponse(ConfigurationView),
      ...apiErrorResponses,
      404: apiErrorResponse(404),
    };
    routes.get(
      '/',
      allowed('read'),
      describeRoute({
        tags: ['DemoMode'],
        summary: 'Read demo configuration and registered adapters',
        operationId: 'demoModeGetConfiguration',
        responses,
      }),
      async (c) => c.json({ data: await service.read() }),
    );
    routes.get(
      '/collections',
      allowed('read'),
      describeRoute({
        tags: ['DemoMode'],
        summary: 'List selectable collections in the default database',
        operationId: 'demoModeListCollections',
        responses: {
          ...apiErrorResponses,
          404: apiErrorResponse(404),
          200: dataResponse(
            z.array(
              z.object({ name: z.string(), title: z.string().optional() }),
            ),
          ),
        },
      }),
      async (c) => c.json({ data: await service.availableCollections() }),
    );
    for (const section of ['collections', 'mocks', 'chat'] as const) {
      routes.put(
        `/${section}`,
        allowed('configure'),
        describeRoute({
          tags: ['DemoMode'],
          summary: `Configure demo ${section}`,
          operationId: `demoModeConfigure${section}`,
          responses: {
            ...responses,
            400: apiErrorResponse(400),
            409: apiErrorResponse(409),
          },
        }),
        apiValidator('json', ConfigurationInput[section]),
        async (c) => {
          const input = c.req.valid('json');
          return c.json({
            data: await container
              .resolve(demoWriteGuardToken)
              .runDemoData(() =>
                service.save(section, input.expectedRevision, input.value),
              ),
          });
        },
      );
    }
    router.route('/demoMode/configuration', routes);
    return router;
  });
