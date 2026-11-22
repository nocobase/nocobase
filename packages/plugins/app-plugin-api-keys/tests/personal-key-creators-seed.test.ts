import { createRequire } from 'node:module';
import path from 'node:path';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import seed from '../database/seeds/202611220001_api_keys_personal_key_creators.js';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );
const CREATE = [
  {
    resource: { type: 'settings', id: 'personalApiKeys' },
    actions: [{ action: 'create' }],
  },
];

/** A database with the authentication plugin's tables, and the authorization plugin's unless left out. */
async function database(withAuthorization = true): Promise<TestDatabase> {
  const created = await createTestDatabase();
  for (const packageName of [
    '@nocobase/app-plugin-authentication',
    ...(withAuthorization ? ['@nocobase/app-plugin-authorization'] : []),
  ])
    await createMigrator({
      database: created.database,
      packageName,
      directory: migrations(packageName),
    }).latest();
  return created;
}

type Query = ReturnType<TestDatabase['database']['connection']>['query'];

describe('the seed keeping every person able to create keys of their own', () => {
  let testDatabase: TestDatabase;
  let query: Query;
  const now = new Date();

  const user = async (id: string, kind?: string, deleted = false) => {
    // One at a time, so a user without a kind takes the column's default.
    await query
      .insertInto('user')
      .values({
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: false,
        ...(kind ? { kind } : {}),
        createdAt: now,
        updatedAt: now,
        ...(deleted ? { deletedAt: now } : {}),
      })
      .execute();
  };
  const role = async (key: string, grants: unknown) => {
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: `app-${key}`,
        key,
        title: key,
        grants: JSON.stringify(grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  };
  const grantsOf = async (key: string) => {
    const row = await query
      .selectFrom('authorizationPermissionSets')
      .select(['grants'])
      .where('key', '=', key)
      .executeTakeFirstOrThrow();
    let grants: unknown = row.grants;
    while (typeof grants === 'string') grants = JSON.parse(grants) as unknown;
    return grants;
  };
  const holders = async (key: string) =>
    (
      await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select(['subjectId'])
        .where('permissionSetKey', '=', key)
        .orderBy('subjectId')
        .execute()
    ).map((row) => String(row.subjectId));
  const repository = (name: string) =>
    testDatabase.database.connection().repository(name);
  const run = (on: Query = query, repo = repository) =>
    seed.run({ query: on, repository: repo } as never);

  beforeEach(async () => {
    await testDatabase?.destroy();
    testDatabase = await database();
    query = testDatabase.database.connection().query;
    await user('ada', 'person');
    await user('bob');
    await user('ci-bot', 'service');
    await user('gone', 'person', true);
    await role('member', []);
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it('assigns a role holding only personalApiKeys/create to each person, never a service account or member, once', async () => {
    await run();
    await run();
    expect(await grantsOf('personal-api-key-creators')).toEqual(CREATE);
    expect(await holders('personal-api-key-creators')).toEqual(['ada', 'bob']);
    expect(await grantsOf('member')).toEqual([]);
  });

  it('leaves an application role with the same key as it is, and assigns its own role under the next free key', async () => {
    const theirs = [
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        actions: [{ action: 'update' }],
      },
    ];
    await role('personal-api-key-creators', theirs);
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: 'theirs',
        subjectType: 'user',
        subjectId: 'ada',
        permissionSetKey: 'personal-api-key-creators',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await run();
    await run();
    // Nobody gets the application's grants from the upgrade.
    expect(await grantsOf('personal-api-key-creators')).toEqual(theirs);
    expect(await holders('personal-api-key-creators')).toEqual(['ada']);
    expect(await grantsOf('personal-api-key-creators-2')).toEqual(CREATE);
    expect(await holders('personal-api-key-creators-2')).toEqual([
      'ada',
      'bob',
    ]);
  });

  it('throws when it stops half way, and finishes on the next run', async () => {
    // The assignments fail to write once, as on a lost connection.
    const failing = new Proxy(query, {
      get(target, property, receiver) {
        if (property === 'insertInto')
          return (table: string) =>
            table === 'authorizationPermissionSetAssignments'
              ? {
                  values: () => ({
                    execute: () => Promise.reject(new Error('connection lost')),
                  }),
                }
              : target.insertInto(table as never);
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    await expect(run(failing)).rejects.toThrow('connection lost');
    expect(await holders('personal-api-key-creators')).toEqual([]);
    await run();
    expect(await grantsOf('personal-api-key-creators')).toEqual(CREATE);
    expect(await holders('personal-api-key-creators')).toEqual(['ada', 'bob']);
  });

  it('recognizes its own role by what it grants, whatever the order of the stored keys', async () => {
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: 'api-keys.seed:personal-api-key-creators',
        key: 'personal-api-key-creators',
        title: 'Made by an earlier run',
        grants: JSON.stringify([
          {
            actions: [{ action: 'create' }],
            resource: { id: 'personalApiKeys', type: 'settings' },
          },
        ]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await run();
    expect(await holders('personal-api-key-creators')).toEqual(['ada', 'bob']);
    // No second role was made for it.
    expect(
      await query
        .selectFrom('authorizationPermissionSets')
        .select('key')
        .where('key', '=', 'personal-api-key-creators-2')
        .executeTakeFirst(),
    ).toBeUndefined();
  });

  it('throws any read failure, even one a dialect reports like a missing table, so the upgrade is not recorded as done', async () => {
    // Oracle and SQL Server answer a missing privilege as they answer a missing table.
    const denied = Object.assign(
      new Error('ORA-00942: table or view does not exist'),
      {
        errorNum: 942,
      },
    );
    const failing = new Proxy(query, {
      get(target, property, receiver) {
        if (property === 'selectFrom')
          return () => {
            throw denied;
          };
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    await expect(run(failing)).rejects.toBe(denied);
    // Nor is finding out whether the roles exist taken as their absence.
    const lost = new Error('connection lost');
    await expect(
      run(
        query,
        () =>
          Object.assign(Object.create(null) as object, {
            count: () => Promise.reject(lost),
          }) as never,
      ),
    ).rejects.toBe(lost);
  });

  it('does nothing where the authorization plugin’s roles do not exist', async () => {
    const bare = await database(false);
    try {
      const connection = bare.database.connection();
      await expect(
        seed.run({
          query: connection.query,
          repository: (name: string) => connection.repository(name),
        } as never),
      ).resolves.toBeUndefined();
    } finally {
      await bare.destroy();
    }
  });
});
