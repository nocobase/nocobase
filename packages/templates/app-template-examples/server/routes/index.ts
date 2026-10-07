import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  defineRootRoutes,
  describeRoute,
  type AppApiRouteContribution,
  type AppRouteContribution,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { articlesRoutes } from './articles.js';
import { numericExamplesRoutes } from './numeric-examples.js';
import { analyticsRoutes } from './analytics.js';
import { externalCrmRoutes } from './external-crm.js';
import { quotationReviewTaskRoutes } from './quotation-review-tasks.js';
import { EXAMPLES_APP_TAGS as tags } from './domain.js';
import { ExampleGreeting } from './schemas.js';

import { appExampleServiceToken } from '../providers/index.js';

export const apiRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  (app) => {
    const router = new Hono();

    router.get(
      '/example',
      // Every `/api` route declares itself for the API document at /api/swagger/docs.
      describeRoute({
        tags,
        summary: 'Get the application greeting',
        operationId: 'examplesGetGreeting',
        description:
          "The message of the application's own service provider. Intentionally public, so it needs no session or API key.",
        // An empty security requirement documents a route that needs no credentials.
        security: [],
        responses: {
          200: dataResponse(ExampleGreeting),
          500: apiErrorResponse(500),
        },
      }),
      (context) => {
        const exampleService = app.container.resolve(appExampleServiceToken);

        return context.json({
          data: { scope: 'api', message: exampleService.getMessage() },
        });
      },
    );

    return router;
  },
);

export const rootRoutes: AppRootRouteContribution<Application> =
  defineRootRoutes((app) => {
    const router = new Hono();

    router.get('/example', (context) => {
      const exampleService = app.container.resolve(appExampleServiceToken);

      return context.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Route Example</title>
  </head>
  <body>
    <main>
      <h1>Application Route Example</h1>
      <p>${exampleService.getMessage()}</p>
    </main>
  </body>
</html>`);
    });

    return router;
  });

const routes: readonly AppRouteContribution<Application>[] = [
  apiRoutes,
  rootRoutes,
  articlesRoutes,
  analyticsRoutes,
  externalCrmRoutes,
  numericExamplesRoutes,
  quotationReviewTaskRoutes,
];

export default routes;
