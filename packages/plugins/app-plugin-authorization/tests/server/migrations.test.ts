// @vitest-environment node

import { fileURLToPath } from 'node:url';

import {
  createMigrator,
  createSeeder,
  validateMigrations,
  validateSeeds,
} from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';
import { pluginMigrations } from '../helpers/database-fixture.js';

const PERMISSION_SET_COLLECTIONS = [
  'authorizationPermissionSets',
  'authorizationPermissionSetAssignments',
] as const;

describe('@nocobase/app-plugin-authorization database', () => {
  it('loads the permission set migrations and the built-in role seeds', async () => {
    const migrationsDirectory = fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    );
    const seedsDirectory = fileURLToPath(
      new URL('../../database/seeds', import.meta.url),
    );

    await expect(
      validateMigrations(migrationsDirectory),
    ).resolves.toMatchObject([
      { name: '202608210001_create_permission_set_tables' },
    ]);
    await expect(validateSeeds(seedsDirectory)).resolves.toMatchObject([
      {
        name: '202608240001_authorization_create_root_set',
      },
      {
        name: '202608250002_authorization_create_member_set',
      },
    ]);
  });

  it('assigns the root permission set to the configured initial administrator', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    const source = (plugin: string, kind: 'migrations' | 'seeds') => ({
      packageName: `@nocobase/${plugin}`,
      directory: fileURLToPath(
        new URL(`../../../${plugin}/database/${kind}`, import.meta.url),
      ),
    });
    try {
      await createMigrator({
        database,
        sources: [
          source('app-plugin-authentication', 'migrations'),
          source('app-plugin-authorization', 'migrations'),
        ],
      }).latest();
      const query = database.connection().query;
      await query
        .insertInto('user')
        .values({
          id: 'initial-admin',
          name: 'Custom administrator',
          username: 'custom.admin',
          email: 'admin@example.com',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
      const seeder = createSeeder({
        database,
        sources: [source('app-plugin-authorization', 'seeds')],
        config: {
          get<T>(key: string): T | undefined {
            return (
              key === 'users.initialAdmin.username' ? 'Custom.Admin' : undefined
            ) as T | undefined;
          },
        },
      });
      await seeder.run();
      await seeder.run();
      expect(
        await query
          .selectFrom('authorizationPermissionSetAssignments')
          .select(['subjectId', 'permissionSetKey'])
          .where('permissionSetKey', '=', 'root')
          .execute(),
      ).toEqual([{ subjectId: 'initial-admin', permissionSetKey: 'root' }]);
    } finally {
      await testDatabase.destroy();
    }
  });
});

describeMigration('202608210001_create_permission_set_tables', {
  sources: [pluginMigrations('app-plugin-authorization')],
  up: async ({ expectCollection }) => {
    for (const name of PERMISSION_SET_COLLECTIONS) {
      await expectCollection(name).toExist();
    }
  },
  down: async ({ expectCollection }) => {
    for (const name of PERMISSION_SET_COLLECTIONS) {
      await expectCollection(name).not.toExist();
    }
  },
});
