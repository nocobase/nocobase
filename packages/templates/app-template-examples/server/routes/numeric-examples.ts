import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { NumericExamplesService } from '../providers/numeric-examples-service.js';

import { databaseUnavailable } from './database-unavailable.js';
import {
  EXAMPLES_APP_DOMAIN,
  EXAMPLES_APP_TAGS as tags,
  hideDatabaseUnavailable,
} from './domain.js';
import { NumericExamples, NumericExamplesQuery } from './schemas.js';

const DOMAIN = EXAMPLES_APP_DOMAIN;

// Shared read-only learning data is available to every signed-in user.
// No generic query input or write endpoint is exposed.
export const numericExamplesRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono();
    routes.onError(apiErrorHandler);
    if (!app.container.has(databaseManagerToken)) {
      routes.get('/', hideDatabaseUnavailable, (c) =>
        databaseUnavailable(c, DOMAIN),
      );
      return router.route('/numericExamples', routes);
    }
    const auth = app.container.resolve(authenticationToken);
    const service = new NumericExamplesService(
      app.container.resolve(databaseManagerToken),
    );
    routes.get(
      '/',
      auth.required(),
      describeRoute({
        tags,
        summary: 'Read the numeric examples',
        operationId: 'examplesGetNumericExamples',
        description:
          'Numeric columns as the main connection returns them, with their aggregates, read with the query builder or through the Repository. `orderBy` lists fields, each optionally followed by ` desc`, such as `decimalValue desc,id`.',
        responses: {
          200: dataResponse(NumericExamples),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', NumericExamplesQuery),
      async (c) => {
        const { source, sample, orderBy } = c.req.valid('query');
        return c.json({
          data: await service.read(source, sample, orderBy),
        });
      },
    );
    return router.route('/numericExamples', routes);
  });
