import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { describe, expect, it } from 'vitest';

import seed from '../database/seeds/202611210005_api_keys_release_reserved_sets.js';

const require = createRequire(import.meta.url);

describe('the seed releasing roles named in the prefix reserved for system keys', () => {
  it('renames an application’s role out of the prefix with its members, leaves system keys’ sets, and renames nothing again', async () => {
    const testDatabase = await createTestDatabase();
    try {
      const { database } = testDatabase;
      for (const [packageName, directory] of [
        [
          '@nocobase/app-plugin-authorization',
          path.join(
            path.dirname(
              require.resolve('@nocobase/app-plugin-authorization/package.json'),
            ),
            'database/migrations',
          ),
        ],
        [
          '@nocobase/app-plugin-api-keys',
          fileURLToPath(new URL('../database/migrations', import.meta.url)),
        ],
      ] as const)
        await createMigrator({ database, packageName, directory }).latest();
      const { query } = database.connection();
      const now = new Date();
      for (const key of [
        'system-key-old-role',
        'role-system-key-old-role',
        'system-key-svc-1',
        'sales',
      ])
        await query
          .insertInto('authorizationPermissionSets')
          .values({
            id: `id-${key}`,
            key,
            title: key,
            grants: JSON.stringify([]),
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      for (const [subject, key] of [
        ['ada', 'system-key-old-role'],
        ['svc-1', 'system-key-svc-1'],
      ])
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values({
            id: `user:${subject}:${key}`,
            subjectType: 'user',
            subjectId: subject,
            permissionSetKey: key,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      // A system key's own set, which stays.
      await query
        .insertInto('apiKeySystemKeys')
        .values({
          identityId: 'svc-1',
          keyId: 'key-1',
          ownerId: null,
          managedBy: null,
          createdById: null,
          remindedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      const run = () =>
        seed.run({
          query,
          repository: (name: string) => database.connection().repository(name),
        } as never);
      await run();
      await run();
      const keys = (
        await query
          .selectFrom('authorizationPermissionSets')
          .select(['key'])
          .orderBy('key')
          .execute()
      ).map((row) => String(row.key));
      // `role-system-key-old-role` was taken, so the next free name is used.
      expect(keys).toEqual([
        'role-system-key-old-role',
        'role-system-key-old-role-2',
        'sales',
        'system-key-svc-1',
      ]);
      expect(
        await query
          .selectFrom('authorizationPermissionSetAssignments')
          .select(['id', 'subjectId', 'permissionSetKey'])
          .orderBy('id')
          .execute(),
      ).toEqual([
        {
          id: 'user:ada:role-system-key-old-role-2',
          subjectId: 'ada',
          permissionSetKey: 'role-system-key-old-role-2',
        },
        {
          id: 'user:svc-1:system-key-svc-1',
          subjectId: 'svc-1',
          permissionSetKey: 'system-key-svc-1',
        },
      ]);
    } finally {
      await testDatabase.destroy();
    }
  });
});
