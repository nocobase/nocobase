import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  appErrorDomain,
  defineApiRoutes,
  defineRepositoryApiRoutes,
  type AppApiRouteContribution,
  type RepositoryApiActions,
  type RepositoryApiExposure,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { buildRepositoryPolicy, databaseManagerToken } from '@nocobase/db';

import { databaseUnavailable } from './database-unavailable.js';

// These stand in for Repository data endpoints, which the framework defines, so they answer in its domain.
const DOMAIN = appErrorDomain;

/**
 * The CRM owns its data. This application reads it — the database account a
 * real deployment uses would typically be read-only anyway — so only query
 * actions are exposed and the Policy grants nothing but reads. The Repository
 * resolves logical names (`orders`, `customer`, `orderNo`) through the
 * connection's naming and metadata, exactly as it does for a managed table.
 */
const actions: RepositoryApiActions = {
  findMany: { maxLimit: 100 },
  findOne: {},
  count: {},
  exists: {},
  aggregate: {},
  groupBy: {},
};
const readOnly = buildRepositoryPolicy((policy) => policy.read(true));
const repositories: readonly RepositoryApiExposure[] = [
  {
    name: 'crmCustomers',
    collection: 'customers',
    connection: 'externalCrm',
    policy: readOnly,
    actions,
  },
  {
    name: 'crmOrders',
    collection: 'orders',
    connection: 'externalCrm',
    policy: readOnly,
    actions,
  },
];
const repositoryRoutes = defineRepositoryApiRoutes({ repositories });

export const externalCrmRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(async (app) => {
    const router = new Hono();
    if (!app.container.has(databaseManagerToken)) {
      for (const { name, actions: enabledActions } of repositories) {
        for (const action of Object.keys(enabledActions)) {
          router.post(`/${name}/${action}`, (c) =>
            databaseUnavailable(c, DOMAIN),
          );
        }
      }
      return router;
    }
    const authentication = app.container.resolve(authenticationToken);
    for (const { name, actions: enabledActions } of repositories) {
      for (const action of Object.keys(enabledActions)) {
        router.use(`/${name}/${action}`, authentication.required());
      }
    }
    router.route('/', await repositoryRoutes.createRouter(app));
    return router;
  });
