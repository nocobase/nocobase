import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  cliRoute,
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
  router.get(
    '/authentication/capabilities',
    describeRoute({
      ...cliRoute(false),
      summary: 'Read public authentication capabilities',
      description: 'Returns whether password reset by email is configured.',
      tags: ['Authentication'],
      responses: {
        200: {
          description: 'Public authentication capabilities.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['data'],
                properties: {
                  data: {
                    type: 'object',
                    required: ['passwordResetAvailable'],
                    properties: {
                      passwordResetAvailable: {
                        type: 'boolean',
                        description:
                          'Whether email-based password reset is configured.',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    (context) =>
      context.json({
        data: { passwordResetAvailable: auth.passwordResetAvailable() },
      }),
  );
  return router;
});

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<AuthenticationProviderConfig>
>[] = [apiRoutes];

export default routes;
