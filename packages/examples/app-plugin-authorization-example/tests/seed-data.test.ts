import path from 'node:path';

import authenticationPlugin from '@nocobase/app-plugin-authentication/server';
import authorizationPlugin from '@nocobase/app-plugin-authorization';
import { createTestDatabase } from '@nocobase/app-testing/server';
import setupSeed from '../database/seeds/202609220002_sales_permissions.js';
import { expect, it } from 'vitest';
import { createFixture } from './helpers.js';
import { permissionSets } from '../database/seed-data/permission-sets.js';
import { defaultAccessRules } from '../database/seed-data/default-access-rules.js';
import { sharingRules } from '../database/seed-data/sharing-rules.js';
import { restrictionRules } from '../database/seed-data/restriction-rules.js';
import { MEMBERS, PROJECTS, QUOTES, ORDERS } from '../catalog.js';

it('persists the fluent declarations and all per-table fixtures with their relationships', async () => {
  const fixture = await createFixture();
  try {
    const query = fixture.database.connection().query;
    const expectedCounts = {
      user: 6,
      account: 6,
      [MEMBERS]: 6,
      authorizationExampleCarriers: 2,
      authorizationPermissionSets: 4,
      authorizationPermissionSetAssignments: 6,
      authorizationDefaultAccessRules: 3,
      authorizationSharingRules: 3,
      authorizationSharingRuleAssignments: 4,
      authorizationRestrictionRules: 3,
      authorizationRestrictionRuleAssignments: 18,
      [PROJECTS]: 5,
      [QUOTES]: 13,
      [ORDERS]: 5,
    };
    for (const [table, count] of Object.entries(expectedCounts)) {
      const rows = await query.selectFrom(table).select('id').execute();
      expect({ table, count: rows.length }).toEqual({ table, count });
      if (table.endsWith('RuleAssignments')) {
        // SQLite accepts IDs longer than the 64-character columns other databases enforce, so check the length here.
        for (const row of rows)
          expect(String(row.id).length).toBeLessThanOrEqual(64);
      }
    }
    await setupSeed.run({
      query,
      connection: fixture.database.connection(),
      repository: (name: string) =>
        fixture.database.connection().repository(name),
    });
    for (const set of permissionSets)
      expect(await fixture.authorization.permissionSets.get(set.key)).toEqual(
        set,
      );
    for (const [table, declarations] of [
      ['authorizationDefaultAccessRules', defaultAccessRules],
      ['authorizationSharingRules', sharingRules],
      ['authorizationRestrictionRules', restrictionRules],
    ] as const) {
      const rows = await query.selectFrom(table).selectAll().execute();
      for (const declaration of declarations) {
        const row = rows.find((entry) =>
          'key' in declaration
            ? entry.key === declaration.key
            : entry.resourceId === declaration.resource.id,
        )!;
        expect(JSON.parse(String(row.actions))).toEqual(declaration.actions);
        expect(row.resourceType).toBe(declaration.resource.type);
        expect(row.resourceId).toBe(declaration.resource.id);
      }
    }
  } finally {
    await fixture.destroy();
  }
});

it('seeds once without overwriting edited example records', async () => {
  const fixture = await createFixture();
  try {
    const connection = fixture.database.connection();
    await connection.query
      .updateTable(PROJECTS)
      .set({ notes: 'Keep this edit' })
      .where('id', '=', 'project-1')
      .execute();
    await setupSeed.run({
      query: connection.query,
      connection,
      repository: (name: string) => connection.repository(name),
    });
    expect(
      await connection.query.selectFrom(PROJECTS).select('id').execute(),
    ).toHaveLength(5);
    expect(
      (
        await connection.query
          .selectFrom(PROJECTS)
          .select('notes')
          .where('id', '=', 'project-1')
          .executeTakeFirst()
      )?.notes,
    ).toBe('Keep this edit');
  } finally {
    await fixture.destroy();
  }
});

it('seeds with permission sets alone when the optional rule plugins are absent', async () => {
  const testDatabase = await createTestDatabase();
  const { database } = testDatabase;
  try {
    for (const plugin of [authenticationPlugin, authorizationPlugin])
      await database
        .createMigrator({
          directory: path.resolve(
            plugin.baseDir!,
            plugin.database!.migrations!,
          ),
          packageName: plugin.packageName,
          tableName: `${plugin.packageName.replace('@nocobase/app-plugin-', '')}Migrations`,
        })
        .latest();
    await database
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-authorization-example',
      })
      .latest();
    const connection = database.connection();
    await setupSeed.run({
      query: connection.query,
      connection,
      repository: (name: string) => connection.repository(name),
    } as unknown as Parameters<typeof setupSeed.run>[0]);
    const query = connection.query;
    expect(
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .execute(),
    ).toHaveLength(permissionSets.length);
    expect(
      await query.selectFrom(PROJECTS).select('id').execute(),
    ).toHaveLength(5);
    expect(
      await connection.collections.get('authorizationSharingRules'),
    ).toBeUndefined();
  } finally {
    await testDatabase.destroy();
  }
});
