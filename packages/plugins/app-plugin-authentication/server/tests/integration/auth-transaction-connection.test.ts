// @vitest-environment node

import assert from 'node:assert/strict';
import type { DatabaseConnection } from '@nocobase/db';
import { afterEach, describe, expect, it } from 'vitest';
import { authTransactionConnection } from '../../index.js';
import { createAuthFixture } from './support.js';

describe('authTransactionConnection', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];

  async function setup(options: Parameters<typeof createAuthFixture>[0]) {
    const fixture = await createAuthFixture(options);
    fixtures.push(fixture);
    return fixture;
  }

  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it.each([false, true])(
    'keeps extension and authentication writes atomic (reject: %s)',
    async (reject) => {
      const afterCommit: (DatabaseConnection | undefined)[] = [];
      const finished = Promise.withResolvers<void>();
      let detachedLookup: Promise<DatabaseConnection | undefined> | undefined;
      const fixture = await setup({
        databaseHooks: {
          session: {
            create: {
              async before(session) {
                const transaction = await authTransactionConnection();
                assert(transaction);
                expect(transaction).not.toBe(fixture.connection);
                expect(await authTransactionConnection()).toBe(transaction);
                expect(
                  await transaction.query
                    .selectFrom('user')
                    .select('email')
                    .where('id', '=', session.userId)
                    .executeTakeFirst(),
                ).toEqual({ email: 'alice@example.com' });
                await transaction.query
                  .insertInto('signInGrant')
                  .values({ userId: session.userId })
                  .execute();
                detachedLookup = finished.promise.then(() =>
                  authTransactionConnection(),
                );
                if (reject) return false;
              },
              async after() {
                afterCommit.push(await authTransactionConnection());
              },
            },
          },
        },
      });
      const { connection } = fixture;
      await connection.builder.createCollection('signInGrant', (collection) => {
        collection.string('userId', { length: 64 }).notNull().unique();
      });

      const { response, cookie } = await fixture.signUp();
      finished.resolve();
      expect(response.status).toBe(reject ? 400 : 200);
      expect(cookie.includes('nocobase3.session_token=')).toBe(!reject);
      await expect(authTransactionConnection()).resolves.toBeUndefined();
      await expect(detachedLookup).resolves.toBeUndefined();
      expect(afterCommit).toEqual(reject ? [] : [undefined]);

      const users = await connection.query
        .selectFrom('user')
        .select('id')
        .execute();
      const userIds = users.map(({ id }) => ({ userId: id }));
      expect(users).toHaveLength(reject ? 0 : 1);
      for (const collection of ['account', 'session', 'signInGrant']) {
        expect(
          await connection.query
            .selectFrom(collection)
            .select('userId')
            .execute(),
        ).toEqual(userIds);
      }
    },
  );

  it('returns undefined outside a transaction, including ordinary sign-in', async () => {
    const seen: (DatabaseConnection | undefined)[] = [];
    const fixture = await setup({
      emailAndPassword: { enabled: true, autoSignIn: false },
      databaseHooks: {
        session: {
          create: {
            async before() {
              seen.push(await authTransactionConnection());
            },
          },
        },
      },
    });
    await expect(authTransactionConnection()).resolves.toBeUndefined();
    expect((await fixture.signUp()).response.status).toBe(200);

    const response = await fixture.router.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'correct horse battery staple',
      }),
    });
    expect(response.status).toBe(200);
    expect(seen).toEqual([undefined]);
  });

  it('isolates overlapping callbacks on independent databases', async () => {
    // Independent databases let both callbacks hold a transaction concurrently on SQLite too.
    const entered = Promise.withResolvers<void>();
    const connections: (DatabaseConnection | undefined)[] = [];
    async function run(email: string) {
      const fixture = await setup({
        databaseHooks: {
          session: {
            create: {
              async before(session) {
                const transaction = await authTransactionConnection();
                connections.push(transaction);
                if (connections.length === 2) entered.resolve();
                await entered.promise;
                assert(transaction);
                expect(await authTransactionConnection()).toBe(transaction);
                expect(
                  await transaction.query
                    .selectFrom('user')
                    .select('email')
                    .where('id', '=', session.userId)
                    .executeTakeFirst(),
                ).toEqual({ email });
              },
            },
          },
        },
      });
      return (await fixture.signUp({ email })).response.status;
    }

    const statuses = await Promise.all([
      run('first@example.com'),
      run('second@example.com'),
    ]);
    expect(statuses).toEqual([200, 200]);
    expect(connections[0]).not.toBe(connections[1]);
  });
});
