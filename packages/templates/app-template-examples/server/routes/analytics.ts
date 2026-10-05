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
import { hideDatabaseUnavailable } from './domain.js';

// These stand in for Repository data endpoints, which the framework defines, so they answer in its domain.
const DOMAIN = appErrorDomain;

const actions: RepositoryApiActions = {
  findMany: { maxLimit: 100 },
  findOne: {},
  count: {},
  exists: {},
  aggregate: {},
  groupBy: {},
  createOne: {},
  updateOne: {},
  deleteOne: {},
};
const repositories: readonly RepositoryApiExposure[] = [
  {
    name: 'analyticsChannels',
    collection: 'channels',
    connection: 'analytics',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) => create.scope(true).fields('id', 'name', 'code'))
        .update((update) => update.scope(true).fields('name', 'code'))
        .delete(true),
    ),
    actions,
  },
  {
    name: 'analyticsCampaigns',
    collection: 'campaigns',
    connection: 'analytics',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'name', 'status', 'budgetCents')
            .relation('channel', (channel) => channel.connect()),
        )
        .update((update) =>
          update
            .scope(true)
            .fields('name', 'status', 'budgetCents')
            .relation('channel', (channel) => channel.connect()),
        )
        .delete(true),
    ),
    actions,
  },
  {
    name: 'analyticsDailyMetrics',
    collection: 'dailyMetrics',
    connection: 'analytics',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields(
              'id',
              'date',
              'impressions',
              'clicks',
              'conversions',
              'spendCents',
              'revenueCents',
            )
            .relation('campaign', (campaign) => campaign.connect()),
        )
        .update((update) =>
          update
            .scope(true)
            .fields(
              'date',
              'impressions',
              'clicks',
              'conversions',
              'spendCents',
              'revenueCents',
            )
            .relation('campaign', (campaign) => campaign.connect()),
        )
        .delete(true),
    ),
    actions,
  },
];
const repositoryRoutes = defineRepositoryApiRoutes({ repositories });

// Like the Repository example plugin, this is a shared demonstration workspace:
// every signed-in user may manage sample records. Each exposure's Policy
// restricts writable fields and relation operations; middleware guards only
// these owned endpoints.
export const analyticsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(async (app) => {
    const router = new Hono();
    // Match the application's database-disabled mode without requiring plugin
    // services or exposing any data, and keep unrelated routes operational.
    if (!app.container.has(databaseManagerToken)) {
      for (const { name, actions: enabledActions } of repositories) {
        for (const action of Object.keys(enabledActions)) {
          router.post(`/${name}/${action}`, hideDatabaseUnavailable, (c) =>
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
