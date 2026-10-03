import { fileURLToPath } from 'node:url';
import { createCaching } from '@nocobase/caching';
import {
  createDatabaseManager,
  createMigrator,
  type DatabaseManager,
  type MigrationSource,
} from '@nocobase/db';
import { provisionTestDatabases } from '@nocobase/app-testing/server';
import { Hono } from 'hono';
import { Auth, type AuthEnv, type AuthOptions } from '../../auth.js';
import { createAuthStorage } from '../../auth-storage.js';

export const testSecret = 'development-secret-at-least-32-characters';

export const authenticationMigrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-authentication',
    directory: fileURLToPath(
      new URL('../../../database/migrations', import.meta.url),
    ),
  },
];

export interface AuthTestDatabase {
  readonly database: DatabaseManager;
  /** Closes the connection and drops the isolated database. */
  destroy(): Promise<void>;
}

/**
 * A migrated database of its own on the dialect `NOCOBASE_TEST_DB_DIALECT`
 * selects. The manager is built here rather than by `createTestDatabase`
 * because some tests choose the connection's naming strategy.
 */
export async function createAuthTestDatabase(naming?: {
  readonly underscored: boolean;
}): Promise<AuthTestDatabase> {
  const databases = await provisionTestDatabases();
  const database = createDatabaseManager({
    default: 'main',
    connections: {
      main: {
        ...databases.connectionConfig(),
        ...(naming ? { naming } : {}),
      },
    },
  });
  const destroy = async (): Promise<void> => {
    try {
      await database.destroy();
    } finally {
      await databases.drop();
    }
  };
  try {
    await createMigrator({
      database,
      sources: authenticationMigrations,
    }).latest();
  } catch (error) {
    await destroy();
    throw error;
  }
  return { database, destroy };
}

export async function createAuthFixture(
  options: Partial<Omit<AuthOptions, 'connection'>> = {},
  naming?: { readonly underscored: boolean },
) {
  const { database, destroy } = await createAuthTestDatabase(naming);
  const caching = createCaching();
  const connection = database.connection();
  const auth = new Auth({
    connection,
    baseURL: 'http://localhost/api/auth',
    secret: testSecret,
    advanced: { cookiePrefix: 'nocobase3' },
    secondaryStorage: createAuthStorage(caching),
    session: { storeSessionInDatabase: true },
    ...options,
  });
  const router = new Hono<AuthEnv>();
  router.on(['GET', 'POST'], '/api/auth/*', (context) =>
    auth.handler(context.req.raw),
  );
  router.get('/private', auth.required(), (context) =>
    context.json({ auth: context.get('auth') }),
  );
  router.post('/private', auth.required(), (context) =>
    context.json({ ok: true }),
  );
  router.get('/optional', auth.optional(), (context) =>
    context.json({ auth: context.get('auth') }),
  );
  router.post('/optional', auth.optional(), (context) =>
    context.json({ ok: true }),
  );
  router.post('/skipped', auth.required({ skip: () => true }), (context) =>
    context.json({ ok: true }),
  );

  async function signUp(
    input: { email?: string; username?: string; password?: string } = {},
  ) {
    const response = await router.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: input.email ?? 'alice@example.com',
        username: input.username ?? 'Alice.Admin',
        password: input.password ?? 'correct horse battery staple',
        name: 'Alice',
      }),
    });
    return { response, cookie: response.headers.get('set-cookie') ?? '' };
  }

  return {
    auth,
    connection,
    database,
    router,
    signUp,
    async dispose() {
      await caching.dispose();
      await destroy();
    },
  };
}
