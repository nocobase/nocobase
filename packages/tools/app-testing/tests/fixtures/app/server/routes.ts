import type { Application } from '@nocobase/app-server/application';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

export const itemsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app: Application): Hono => {
    const router = new Hono();
    router.get('/items', async (context) => {
      const database = app.container.resolve(databaseManagerToken);
      const rows = await database
        .connection()
        .query.selectFrom('fixtureItems')
        .select(['name'])
        .orderBy('name')
        .execute();
      return context.json({ data: rows });
    });
    return router;
  });
