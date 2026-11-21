import { createRequire } from 'node:module';
import path from 'node:path';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import seed from '../database/seeds/202611210002_api_keys_personal_key_creators.js';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );

describe('the seed keeping every person able to create keys of their own', () => {
  let testDatabase: TestDatabase;

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    for (const packageName of [
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-authorization',
    ])
      await createMigrator({
        database: testDatabase.database,
        packageName,
        directory: migrations(packageName),
      }).latest();
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it('assigns a role holding only personalApiKeys/create to each person, never a service account or member', async () => {
    const { query } = testDatabase.database.connection();
    const now = new Date();
    const user = (id: string, kind: string | null, deleted = false) => ({
      id,
      name: id,
      email: `${id}@example.com`,
      emailVerified: false,
      ...(kind ? { kind } : {}),
      createdAt: now,
      updatedAt: now,
      ...(deleted ? { deletedAt: now } : {}),
    });
    // One at a time, so a user without a kind takes the column's default.
    for (const row of [
      user('ada', 'person'),
      user('bob', null),
      user('ci-bot', 'service'),
      user('gone', 'person', true),
    ])
      await query.insertInto('user').values(row).execute();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: 'member-id',
        key: 'member',
        title: 'Member',
        grants: JSON.stringify([]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    const run = () => seed.run({ query } as never);
    await run();
    // Run again, it adds nothing.
    await run();

    const role = await query
      .selectFrom('authorizationPermissionSets')
      .select(['grants'])
      .where('key', '=', 'personal-api-key-creators')
      .executeTakeFirstOrThrow();
    let grants: unknown = role.grants;
    while (typeof grants === 'string') grants = JSON.parse(grants) as unknown;
    expect(grants).toEqual([
      {
        resource: { type: 'settings', id: 'personalApiKeys' },
        actions: [{ action: 'create' }],
      },
    ]);
    const assignments = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select(['subjectType', 'subjectId', 'permissionSetKey'])
      .orderBy('subjectId')
      .execute();
    expect(assignments).toEqual([
      {
        subjectType: 'user',
        subjectId: 'ada',
        permissionSetKey: 'personal-api-key-creators',
      },
      {
        subjectType: 'user',
        subjectId: 'bob',
        permissionSetKey: 'personal-api-key-creators',
      },
    ]);
    const member = await query
      .selectFrom('authorizationPermissionSets')
      .select(['grants'])
      .where('key', '=', 'member')
      .executeTakeFirstOrThrow();
    expect(JSON.parse(String(member.grants))).toEqual([]);
  });
});
