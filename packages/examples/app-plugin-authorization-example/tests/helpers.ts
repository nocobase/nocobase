import defaultAccessPlugin, {
  defaultAccess,
} from '@nocobase/app-plugin-authz-default-access/server';
import sharingRulesPlugin, {
  sharingRules,
} from '@nocobase/app-plugin-authz-sharing-rules/server';
import restrictionRulesPlugin, {
  restrictionRules,
} from '@nocobase/app-plugin-authz-restriction-rules/server';
import authenticationPlugin from '@nocobase/app-plugin-authentication/server';
import path from 'node:path';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import authorizationPlugin, {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { expect, vi } from 'vitest';
import setupSeed from '../database/seeds/202609220002_sales_permissions.js';
import { AuthorizationExampleProvider } from '../server/providers/authorization-example.js';
import { apiRoutes } from '../server/routes/index.js';
/**
 * The seeded sales example on its own database, on the dialect
 * `NOCOBASE_TEST_DB_DIALECT` selects. Call `destroy()` when the test is done:
 * on a database server it drops the database the fixture created.
 */
export async function createFixture() {
  const testDatabase = await createTestDatabase();
  try {
    const fixture = await seedFixture(testDatabase.database);
    return { ...fixture, destroy: () => testDatabase.destroy() };
  } catch (error) {
    await testDatabase.destroy();
    throw error;
  }
}

async function seedFixture(database: DatabaseManager) {
  // Each plugin's own migrations, located through its published server plugin.
  for (const plugin of [
    authenticationPlugin,
    authorizationPlugin,
    defaultAccessPlugin,
    sharingRulesPlugin,
    restrictionRulesPlugin,
  ])
    await database
      .createMigrator({
        directory: path.resolve(plugin.baseDir!, plugin.database!.migrations!),
        packageName: plugin.packageName,
        tableName: `${plugin.packageName.replace('@nocobase/app-plugin-', '')}Migrations`,
      })
      .latest();
  await database
    .createMigrator({
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
      packageName: '@nocobase/app-plugin-authorization-example',
    })
    .latest();
  const connection = database.connection();
  await setupSeed.run({
    query: connection.query,
    connection,
    repository: (name: string) => connection.repository(name),
  });
  const users = Object.fromEntries(
    (
      await connection.query
        .selectFrom('user')
        .select(['id', 'username'])
        .execute()
    ).map((row) => [
      String(row.username).replace('sales_', ''),
      String(row.id),
    ]),
  );
  const authorization = createAppAuthorization({
    connection,
    config: { plugins: [defaultAccess(), sharingRules(), restrictionRules()] },
  });
  users.admin = 'test-administrator';
  const authentication = new Auth({
    connection,
    secret: 'authorization-example-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) => {
    const id = headers.get('x-test-user');
    if (!id) return null;
    return {
      user: {
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: `session-${id}`,
        token: `token-${id}`,
        userId: id,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(authorizationToken, authorization);
  container.instance(authenticationToken, authentication);
  const router = new Hono();
  const app = {
    appName: 'example',
    publicBasePath: '/main',
    config: { app: { name: 'example', publicBasePath: '/main' } },
    paths: createAppPaths({ rootDir: '/tmp/authorization-example' }),
    container,
    router,
  };
  await new AuthorizationExampleProvider(app).boot();
  router.route('/api', await apiRoutes.createRouter(app));
  for (const routes of authorizationPlugin.routes ?? [])
    router.route('/api', await routes.createRouter(app));
  return {
    database,
    authorization,
    users,
    router,
    request: (user: string, path: string, body?: unknown) =>
      router.request(`/api/authorization-example/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'x-test-user': users[user] ?? user,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
  };
}

export type SalesFixture = Awaited<ReturnType<typeof createFixture>>;

/** A request to `/api/authz/<path>` as the seeded administrator. */
export function adminRequest(
  fixture: SalesFixture,
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<Response> {
  return fixture.router.request(`/api/authz/${path}`, {
    method,
    headers: {
      'x-test-user': fixture.users.admin,
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** The ids a sales list answers `user` with, once it has answered 200. */
export async function listIds(
  fixture: SalesFixture,
  user: string,
  path = 'projects',
): Promise<string[]> {
  const response = await fixture.request(user, `sales/${path}`);
  expect(response.status).toBe(200);
  const body = await response.json();
  return body.data.items.map((item: { id: string }) => item.id);
}
