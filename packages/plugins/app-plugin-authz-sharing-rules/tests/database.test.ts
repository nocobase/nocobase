import { fileURLToPath } from 'node:url';
import { validateMigrations } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/db-testing';
import { describeMigration } from '@nocobase/db-testing/vitest';
import { describe, expect, it } from 'vitest';
import { selection } from '@nocobase/authorization/core';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import { sharingRules } from '../server/authorization.js';

const migrations = [
  {
    packageName: '@nocobase/app-plugin-authz-sharing-rules',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

const collections = [
  'authorizationSharingRules',
  'authorizationSharingRuleAssignments',
];

describe('@nocobase/app-plugin-authz-sharing-rules migration', () => {
  it('owns its rule migration', async () => {
    const migrationsDirectory = fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    );
    await expect(
      validateMigrations(migrationsDirectory),
    ).resolves.toMatchObject([{ name: '202608210003_create_sharing_rules' }]);
  });

  it('persists a rule with per-scope record ids through authz.sharingRules', async () => {
    const testDatabase = await createTestDatabase({ migrations });
    try {
      const { connection } = testDatabase;
      const authz = createAppAuthorization({
        connection,
        config: { plugins: [sharingRules()] },
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

      await authz.sharingRules.create({
        key: 'scoped',
        resource,
        actions,
        subjects: [],
      });
      await expect(authz.sharingRules.get('scoped')).resolves.toMatchObject({
        resource,
        actions,
      });
      await authz.sharingRules.delete('scoped');
      await expect(authz.sharingRules.get('scoped')).resolves.toBeUndefined();
    } finally {
      await testDatabase.destroy();
    }
  });
});

describeMigration('202608210003_create_sharing_rules', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    for (const name of collections) await expectCollection(name).toExist();
  },
  down: async ({ expectCollection }) => {
    for (const name of collections) await expectCollection(name).not.toExist();
  },
});
