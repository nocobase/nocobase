import { fileURLToPath } from 'node:url';
import { validateMigrations } from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';
import { selection } from '@nocobase/authorization/core';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import { defaultAccess } from '../server/authorization.js';

const migrations = [
  {
    packageName: '@nocobase/app-plugin-authz-default-access',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

const collections = ['authorizationDefaultAccessRules'];

describe('@nocobase/app-plugin-authz-default-access migration', () => {
  it('owns its rule migration', async () => {
    const migrationsDirectory = fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    );
    await expect(
      validateMigrations(migrationsDirectory),
    ).resolves.toMatchObject([
      { name: '202608210002_create_default_access_rules' },
    ]);
  });

  it('persists a rule with per-scope record ids through authz.defaultAccess', async () => {
    const testDatabase = await createTestDatabase({ migrations });
    try {
      const { connection } = testDatabase;
      const authz = createAppAuthorization({
        connection,
        config: { plugins: [defaultAccess()] },
      });
      const resource = { type: 'composite', id: 'sales.submit' };
      const actions = [
        {
          action: 'submit',
          scopeKey: 'projects',
          selection: selection.records(['shared-id', 'project-2']),
        },
        {
          action: 'submit',
          scopeKey: 'quotes',
          selection: selection.records(['shared-id', 'quote-2']),
        },
      ];

      await authz.defaultAccess.create({
        key: 'scoped',
        resource,
        actions,
      });
      await expect(authz.defaultAccess.get('scoped')).resolves.toMatchObject({
        resource,
        actions,
      });
      await authz.defaultAccess.delete('scoped');
      await expect(authz.defaultAccess.get('scoped')).resolves.toBeUndefined();
    } finally {
      await testDatabase.destroy();
    }
  });
});

describeMigration('202608210002_create_default_access_rules', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of collections) await expectCollection(name).toExist();
    const row = (id: string, key: string) => ({
      id,
      key,
      resourceType: 'composite',
      resourceId: 'sales.quotes',
      actions: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const rules = 'authorizationDefaultAccessRules';
    await connection.query.insertInto(rules).values(row('1', 'a')).execute();
    // One rule per resource, and one per key.
    await expect(
      connection.query.insertInto(rules).values(row('2', 'b')).execute(),
    ).rejects.toThrow();
    await expect(
      connection.query
        .insertInto(rules)
        .values({ ...row('3', 'a'), resourceId: 'sales.orders' })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    for (const name of collections) await expectCollection(name).not.toExist();
  },
});
