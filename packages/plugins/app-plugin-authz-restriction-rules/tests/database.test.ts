import { fileURLToPath } from 'node:url';
import { validateMigrations } from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';
import { selection } from '@nocobase/authorization/core';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import { restrictionRules } from '../server/authorization.js';

const migrations = [
  {
    packageName: '@nocobase/app-plugin-authz-restriction-rules',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

const collections = [
  'authorizationRestrictionRules',
  'authorizationRestrictionRuleAssignments',
];

describe('@nocobase/app-plugin-authz-restriction-rules migration', () => {
  it('owns its rule migration', async () => {
    const migrationsDirectory = fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    );
    await expect(
      validateMigrations(migrationsDirectory),
    ).resolves.toMatchObject([
      { name: '202608210004_create_restriction_rules' },
    ]);
  });

  it('persists a rule with per-scope record ids through authz.restrictionRules', async () => {
    const testDatabase = await createTestDatabase({ migrations });
    try {
      const { connection } = testDatabase;
      const authz = createAppAuthorization({
        connection,
        config: { plugins: [restrictionRules()] },
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

      await authz.restrictionRules.create({
        key: 'scoped',
        resource,
        actions,
        subjects: [],
      });
      await expect(authz.restrictionRules.get('scoped')).resolves.toMatchObject(
        {
          resource,
          actions,
        },
      );
      await authz.restrictionRules.delete('scoped');
      await expect(
        authz.restrictionRules.get('scoped'),
      ).resolves.toBeUndefined();
    } finally {
      await testDatabase.destroy();
    }
  });
});

describeMigration('202608210004_create_restriction_rules', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    for (const name of collections) await expectCollection(name).toExist();
  },
  down: async ({ expectCollection }) => {
    for (const name of collections) await expectCollection(name).not.toExist();
  },
});
