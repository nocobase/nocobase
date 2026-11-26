import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );

describeMigration('202611220004_api_keys_prefix_exemptions', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-authentication',
      directory: migrations('@nocobase/app-plugin-authentication'),
    },
    {
      packageName: '@nocobase/app-plugin-authorization',
      directory: migrations('@nocobase/app-plugin-authorization'),
    },
    {
      packageName: '@nocobase/app-plugin-api-keys',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  // An application role named in the prefix before it was reserved, which stays while the migration rolls back.
  before: async ({ connection }) => {
    const now = new Date();
    await connection.query
      .insertInto('authorizationPermissionSets')
      .values({
        id: 'app-system-key-sales',
        key: 'system-key-sales',
        title: 'Sales',
        grants: '[]',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('apiKeyPrefixExemptions').toHaveField(
      'permissionSetKey',
      { type: 'string', nullable: false },
    );
    await expectCollection('apiKeyPrefixExemptions').toHaveField('createdAt', {
      nullable: false,
    });
    expect(
      (
        await connection.query
          .selectFrom('apiKeyPrefixExemptions')
          .select(['permissionSetKey'])
          .execute()
      ).map((row) => String(row.permissionSetKey)),
    ).toEqual(['system-key-sales']);
  },
  down: async ({ connection }) => {
    expect(await connection.collections.get('apiKeyPrefixExemptions')).toBe(
      undefined,
    );
  },
});
