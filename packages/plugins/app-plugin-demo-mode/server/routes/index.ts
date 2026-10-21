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
  mode: z.enum(['off', 'read-only', 'observe']),
});

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get(
      '/demoMode/status',
      describeRoute({
        tags: ['Demo mode'],
        summary: 'Read whether the application is a read-only demo',
        operationId: 'demoModeStatus',
        // The sign-in page shows the demo notice before anyone signs in; the mode is no secret.
        security: [],
        description:
          'The demo mode this application runs in. Needs no session or API key.',
        responses: {
          200: dataResponse(DemoModeStatusSchema),
          500: apiErrorResponse(500),
        },
      }),
      (context) =>
        context.json({
          data: { mode: container.resolve(demoModeServiceToken).mode },
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
