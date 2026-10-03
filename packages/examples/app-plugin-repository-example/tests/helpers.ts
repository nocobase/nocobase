import path from 'node:path';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { createApiClient } from '@nocobase/app-client';
import { Hono } from 'hono';
import { vi } from 'vitest';
import { apiRoutes } from '../server/routes/index.js';

/**
 * The example's routes on a migrated database of their own, on the dialect
 * `NOCOBASE_TEST_DB_DIALECT` selects. Call `destroy()` when the test is done:
 * on a database server it drops the database the fixture created.
 */
export async function createFixture() {
  const testDatabase = await createTestDatabase();
  try {
    const fixture = await routeFixture(testDatabase.database);
    return { ...fixture, destroy: () => testDatabase.destroy() };
  } catch (error) {
    await testDatabase.destroy();
    throw error;
  }
}

async function routeFixture(database: DatabaseManager) {
  const migrator = database.createMigrator({
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
    packageName: '@nocobase/app-plugin-repository-example',
  });
  await migrator.latest();
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const authentication = new Auth({
    connection: database.connection(),
    secret: 'repository-example-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) =>
    headers.get('x-test-user')
      ? {
          user: {
            id: 'tester',
            name: 'Tester',
            email: 'tester@example.test',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: 'test-session',
            token: 'test-token',
            userId: 'tester',
            expiresAt: new Date(Date.now() + 60000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      : null,
  );
  container.instance(authenticationToken, authentication);
  const router = new Hono();
  const app = {
    appName: 'example',
    publicBasePath: '/main',
    config: { app: { name: 'example', publicBasePath: '/main' } },
    paths: createAppPaths({ rootDir: '/tmp/repository-example' }),
    container,
    router,
  };
  router.route('/main/api', await apiRoutes.createRouter(app));
  router.get('/main/api/unrelated', (context) => context.json({ ok: true }));
  const requests: { path: string; body: unknown; accept: string | null }[] = [];
  const api = createApiClient({
    baseURL: 'http://example.test/main/api',
    headers: { 'x-test-user': 'tester' },
    fetch: async (input, init) => {
      requests.push({
        path: String(input),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        accept: new Headers(init?.headers).get('accept'),
      });
      return router.fetch(new Request(input, init));
    },
  });
  return { database, migrator, router, api, requests };
}
