import type { Application } from '@nocobase/app-server/application';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono, type Context } from 'hono';

interface RawKnex {
  raw(sql: string, bindings: readonly unknown[]): PromiseLike<unknown>;
}

/** Routes that read and write the way application code does: query builder, raw SQL and transactions. */
export const fixtureRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app: Application): Hono => {
    const router = new Hono();
    const database = () => app.container.resolve(databaseManagerToken);
    const insert = (table: string, name: string) =>
      database()
        .connection()
        .query.insertInto(table)
        .values({ name })
        .execute();

    router.get('/items', async (context) => {
      const rows = await database()
        .connection()
        .query.selectFrom('demoitems')
        .select(['name'])
        .orderBy('name')
        .execute();
      return context.json({ data: rows });
    });
    router.post('/items', async (context) => {
      await insert('demoitems', 'builder');
      return context.json({ data: { saved: true } });
    });
    router.post('/items/raw', async (context) => {
      const knex = await database().connection().client<RawKnex>();
      await knex.raw('INSERT INTO demoitems (name) VALUES (?)', ['raw']);
      return context.json({ data: { saved: true } });
    });
    router.post('/items/transaction', async (context) => {
      await database().transaction((connection) =>
        connection.query
          .insertInto('demoitems')
          .values({ name: 'transaction' })
          .execute(),
      );
      return context.json({ data: { saved: true } });
    });
    // A route that hides the failure behind its own answer.
    router.post('/items/swallowed', async (context) => {
      try {
        await insert('demoitems', 'swallowed');
        return context.json({ data: { saved: true } });
      } catch {
        return context.json({ data: { saved: false } });
      }
    });
    router.post('/items/wrapped', async (context) => {
      try {
        await insert('demoitems', 'wrapped');
        return context.json({ data: { saved: true } });
      } catch {
        return context.json({ error: { message: 'Could not save.' } }, 500);
      }
    });
    // Stand in for Better Auth's and the users plugin's session management, whose only writes go to the always-allowed
    // `session` table.
    const revokeSessions = async (context: Context) => {
      await insert('session', 'revoked');
      return context.json({ data: { revoked: true } });
    };
    router.post('/auth/revoke-other-sessions', revokeSessions);
    router.post('/users/:userId/revokeSessions', revokeSessions);
    router.post('/notes', async (context) => {
      await insert('demonotes', 'note');
      return context.json({ data: { saved: true } });
    });
    return router;
  });
