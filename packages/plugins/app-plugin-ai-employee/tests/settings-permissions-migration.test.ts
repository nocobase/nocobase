import type { DatabaseConnection } from '@nocobase/db';
import {
  describeMigration,
  verifyMigration,
  type MigrationTestContext,
} from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import { aiEmployeeMigrations } from './support/migrations.js';

const MIGRATION_NAME = '202610070001_ai_employee_settings_permissions';

type Grant = {
  resource: { type: string; id: string };
  actions: { action: string }[];
};

const page = (id: string): Grant => ({
  resource: { type: 'page', id },
  actions: [{ action: 'access' }],
});

const settings = (id: string, ...actions: string[]): Grant => ({
  resource: { type: 'settings', id },
  actions: actions.map((action) => ({ action })),
});

const AI_ITEMS: readonly Grant[] = [
  settings('ai.employees', 'read', 'manage'),
  settings('ai.skills', 'read'),
  settings('ai.tools', 'read'),
  settings('ai.llmServices', 'read', 'manage'),
  settings('ai.mcpServers', 'read', 'manage'),
  settings('ai.usage', 'read'),
  settings('ai.conversations', 'read'),
];

const BEFORE: Readonly<Record<string, readonly Grant[]>> = {
  // Held the AI settings page, beside another page.
  'ai-admin': [page('reports'), page('ai.settings')],
  // Every page: never AI administration, and left as it is.
  everything: [page('*')],
  // Held the page and already one of the items.
  mixed: [settings('ai.employees', 'read'), page('ai.settings')],
  // Holds one item and never held the page.
  partial: [settings('ai.usage', 'read')],
};

async function seedPermissionSets(
  connection: DatabaseConnection,
): Promise<void> {
  const now = new Date();
  await connection.query
    .insertInto('authorizationPermissionSets')
    .values(
      Object.entries(BEFORE).map(([key, grants]) => ({
        id: key,
        key,
        title: key,
        grants: JSON.stringify(grants),
        createdAt: now,
        updatedAt: now,
      })),
    )
    .execute();
}

async function readGrants(
  connection: DatabaseConnection,
): Promise<Record<string, Grant[]>> {
  const rows = await connection.query
    .selectFrom('authorizationPermissionSets')
    .select(['key', 'grants'])
    .execute<{ key: string; grants: unknown }>();
  return Object.fromEntries(
    rows.map((row) => [
      row.key,
      (typeof row.grants === 'string'
        ? JSON.parse(row.grants)
        : row.grants) as Grant[],
    ]),
  );
}

describeMigration(MIGRATION_NAME, { sources: aiEmployeeMigrations });

describe(`${MIGRATION_NAME} grants`, () => {
  it('replaces the AI settings page grant with every AI settings item, and restores it on rollback', async () => {
    await verifyMigration(MIGRATION_NAME, {
      sources: aiEmployeeMigrations,
      before: ({ connection }: MigrationTestContext) =>
        seedPermissionSets(connection),
      // Runs after the first application and again after the migration is rolled back and reapplied.
      up: async ({ connection }: MigrationTestContext) => {
        const grants = await readGrants(connection);
        expect(grants['ai-admin']).toEqual([page('reports'), ...AI_ITEMS]);
        expect(grants.everything).toEqual([page('*')]);
        expect(grants.mixed).toEqual(AI_ITEMS);
      },
      down: async ({ connection }: MigrationTestContext) => {
        const grants = await readGrants(connection);
        expect(grants['ai-admin']).toEqual([
          page('reports'),
          page('ai.settings'),
        ]);
        expect(grants.everything).toEqual([page('*')]);
        expect(grants.mixed).toEqual([page('ai.settings')]);
        // A rollback never widens a set: one item does not bring the whole page back.
        expect(grants.partial).toEqual([]);
      },
    });
  });

  it('leaves a set that never held the page as it is', async () => {
    await verifyMigration(MIGRATION_NAME, {
      sources: aiEmployeeMigrations,
      before: ({ connection }: MigrationTestContext) =>
        seedPermissionSets(connection),
      reversible: false,
      up: async ({ connection }: MigrationTestContext) => {
        expect((await readGrants(connection)).partial).toEqual(BEFORE.partial);
      },
    });
  });
});
