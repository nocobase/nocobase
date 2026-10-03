// @vitest-environment node
import { fileURLToPath } from 'node:url';
import {
  createSeeder,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../../auth.js';

const sources = (kind: string) => [
  {
    packageName: '@nocobase/app-plugin-authentication',
    directory: fileURLToPath(
      new URL(`../../../database/${kind}`, import.meta.url),
    ),
  },
];

describe('configured initial administrator', () => {
  const databases: TestDatabase[] = [];
  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      databases.splice(0).map((testDatabase) => testDatabase.destroy()),
    );
  });
  async function setup() {
    const testDatabase = await createTestDatabase({
      migrations: sources('migrations'),
    });
    databases.push(testDatabase);
    return testDatabase.database;
  }
  function seed(database: DatabaseManager, initialAdmin?: unknown) {
    return createSeeder({
      database,
      sources: sources('seeds'),
      config: {
        get<T>(key: string): T | undefined {
          return (
            key === 'users.initialAdmin'
              ? initialAdmin
              : key === 'users.initialAdmin.username' &&
                  initialAdmin &&
                  typeof initialAdmin === 'object'
                ? (initialAdmin as { username?: unknown }).username
                : undefined
          ) as T | undefined;
        },
      },
    }).run();
  }

  it.each([
    {
      initialAdmin: undefined,
      username: 'nocobase',
      email: 'admin@nocobase.com',
      password: 'admin123',
    },
    {
      initialAdmin: {
        username: 'Custom.Admin',
        email: 'Owner@Example.com',
        password: 'custom-password',
      },
      username: 'custom.admin',
      email: 'owner@example.com',
      password: 'custom-password',
    },
    {
      initialAdmin: { password: 'only-password' },
      username: 'nocobase',
      email: 'admin@nocobase.com',
      password: 'only-password',
    },
  ])(
    'creates working credentials for $username',
    async ({ initialAdmin, username, email, password }) => {
      const database = await setup();
      await seed(database, initialAdmin);
      const connection = database.connection();
      const users = await connection.query
        .selectFrom('user')
        .selectAll()
        .execute();
      expect(users).toHaveLength(1);
      expect(users[0]?.username).toBe(username);
      expect(users[0]?.email).toBe(email);
      const accounts = await connection.query
        .selectFrom('account')
        .selectAll()
        .execute();
      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.password).not.toBe(password);
      const auth = new Auth({
        connection,
        baseURL: 'http://localhost/api/auth',
        secret: 'initial-admin-test-secret-at-least-32-characters',
      });
      const response = await auth.handler(
        new Request('http://localhost/api/auth/sign-in/username', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }),
      );
      expect(response.status).toBe(200);
      const emailResponse = await auth.handler(
        new Request('http://localhost/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }),
      );
      expect(emailResponse.status).toBe(200);
      await seed(database, {
        username: 'changed',
        password: 'changed-password',
      });
      expect(
        await connection.query.selectFrom('account').selectAll().execute(),
      ).toEqual(accounts);
      expect(
        await connection.query.selectFrom('user').selectAll().execute(),
      ).toEqual(users);
    },
  );

  it.each([
    {},
    { username: 'admin' },
    { password: '   ' },
    { password: 123 },
    null,
    { username: 'x', password: 'secret' },
    { email: 'not-an-email', password: 'secret' },
    { email: 42, password: 'secret' },
  ])(
    'rejects invalid explicit config without falling back, and permits retry: %j',
    async (initialAdmin) => {
      const database = await setup();
      await expect(seed(database, initialAdmin)).rejects.toThrow(
        'users.initialAdmin',
      );
      expect(
        await database
          .connection()
          .query.selectFrom('user')
          .selectAll()
          .execute(),
      ).toEqual([]);
      expect(
        await database
          .connection()
          .query.selectFrom('account')
          .selectAll()
          .execute(),
      ).toEqual([]);
      await seed(database, { username: 'valid', password: 'valid-password' });
      expect(
        await database
          .connection()
          .query.selectFrom('user')
          .select('username')
          .execute(),
      ).toEqual([{ username: 'valid' }]);
    },
  );

  it('rolls back the user if credential insertion fails and can retry', async () => {
    const database = await setup();
    const connection = database.connection();
    // The seed writes the user and then its credential in one transaction;
    // make the credential insert fail inside the transactions it opens.
    const transaction = connection.transaction.bind(connection);
    const failCredentialInsert = vi
      .spyOn(connection, 'transaction')
      .mockImplementation(((
        fn: (trx: DatabaseConnection) => Promise<unknown>,
      ) =>
        transaction(async (trx) => {
          const insertInto = trx.query.insertInto.bind(trx.query);
          const failInsert = vi
            .spyOn(trx.query, 'insertInto')
            .mockImplementation(((table: string) => {
              if (table === 'account') {
                throw new Error('credential insert failed');
              }
              return insertInto(table);
            }) as typeof trx.query.insertInto);
          try {
            return await fn(trx);
          } finally {
            failInsert.mockRestore();
          }
        })) as typeof connection.transaction);
    await expect(
      seed(database, { username: 'admin', password: 'custom-password' }),
    ).rejects.toThrow('credential insert failed');
    expect(
      await connection.query.selectFrom('user').selectAll().execute(),
    ).toEqual([]);
    failCredentialInsert.mockRestore();
    await seed(database, { username: 'admin', password: 'custom-password' });
    expect(
      await connection.query.selectFrom('account').selectAll().execute(),
    ).toHaveLength(1);
  });

  it('does not reset an existing account when credentials are configured', async () => {
    const database = await setup();
    const query = database.connection().query;
    const now = new Date();
    await query
      .insertInto('user')
      .values({
        id: 'existing',
        name: 'Existing',
        username: 'existing',
        email: 'existing@example.com',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await seed(database, { username: 'existing', password: 'new-password' });
    expect(await query.selectFrom('account').selectAll().execute()).toEqual([]);
    expect(
      await query.selectFrom('user').select(['id', 'username']).execute(),
    ).toEqual([{ id: 'existing', username: 'existing' }]);
  });
});
