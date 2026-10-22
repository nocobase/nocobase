import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import { demoModeServiceToken } from '../tokens.js';
import { accountRoutes } from './accounts.js';
import { configurationRoutes } from './configuration.js';
import { dataRoutes } from './data.js';
import { modelRoutes } from './models.js';

const DemoModeStatusSchema = z.object({
  enabled: z.boolean(),
});

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get(
      '/demoMode/status',
      describeRoute({
        tags: ['Demo mode'],
        summary: 'Read whether the application is a demo',
        operationId: 'demoModeStatus',
        // The sign-in page shows the demo notice before anyone signs in; this flag is public.
        security: [],
        description:
          'Whether Demo Mode is enabled. Needs no session or API key.',
        responses: {
          200: dataResponse(DemoModeStatusSchema),
          500: apiErrorResponse(500),
        },
      }),
      (context) =>
        context.json({
          data: { enabled: container.resolve(demoModeServiceToken).enabled },
        }),
    );
    return router;
  }),
  accountRoutes,
  configurationRoutes,
  dataRoutes,
  modelRoutes,
];

export default routes;
