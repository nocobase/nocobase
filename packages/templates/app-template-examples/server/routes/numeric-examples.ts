import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { NumericExamplesService } from '../providers/numeric-examples-service.js';

import { databaseUnavailable } from './database-unavailable.js';
import { EXAMPLES_APP_DOMAIN } from './domain.js';
import { NumericExamplesQuery } from './schemas.js';

const DOMAIN = EXAMPLES_APP_DOMAIN;

// Shared read-only learning data is available to every signed-in user.
// No generic query input or write endpoint is exposed.
export const numericExamplesRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono();
    routes.onError(apiErrorHandler);
    if (!app.container.has(databaseManagerToken)) {
      routes.get('/', (c) => databaseUnavailable(c, DOMAIN));
      return router.route('/numericExamples', routes);
    }
    const auth = app.container.resolve(authenticationToken);
    const service = new NumericExamplesService(
      app.container.resolve(databaseManagerToken),
    );
    routes.get(
      '/',
      auth.required(),
      validator('query', (value) => parseApiInput(NumericExamplesQuery, value)),
      async (c) => {
        const { source, sample, orderBy } = c.req.valid('query');
        return c.json({
          data: await service.read(source, sample, orderBy),
        });
      },
    );
    return router.route('/numericExamples', routes);
  });
