import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMigrations } from '@nocobase/db';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect, it, vi } from 'vitest';
import {
  defineCompositeResource,
  selection,
} from '@nocobase/authorization/core';
import {
  createAppAuthorization,
  defineDatabasePermission,
  recordAccess,
} from '@nocobase/app-plugin-authorization/server';
import { restrictionRules } from '../server/authorization.js';
import { DatabaseRestrictionRuleStore } from '../server/stores/restriction-rules.js';

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

it('applies uncommitted restriction rules to a composite authorization policy', async () => {
  const authorizationSource = {
    packageName: '@nocobase/app-plugin-authorization',
    directory: join(
      dirname(
        createRequire(import.meta.url).resolve(
          '@nocobase/app-plugin-authorization/package.json',
        ),
      ),
      'database/migrations',
    ),
  };
  const testDatabase = await createTestDatabase({
    migrations: [authorizationSource, ...migrations],
  });
  try {
    const { connection } = testDatabase;
    await connection.builder.createCollection('orders', (table) => {
      table.string('id', { length: 64 }).primary();
    });
    await connection.query
      .insertInto('orders')
      .values([{ id: 'one' }, { id: 'two' }])
      .execute();
    const authz = createAppAuthorization({
      connection,
      config: { plugins: [restrictionRules()] },
    });
    authz.database.collections.add({ name: 'orders', title: 'Orders' });
    const orders = authz.compositeResources.define(
      defineCompositeResource('sales.orders', (resource) =>
        resource.title('Orders').action('view', (action) =>
          action.title('View').grant(
            'orders',
            defineDatabasePermission((permission) =>
              permission
                .collection('orders')
                .options(recordAccess.allRecords)
                .default(recordAccess.allRecords)
                .read(['id']),
            ),
          ),
        ),
      ),
    );
    const subject = { type: 'user', id: 'alice' };
    await authz.permissionSets.create({
      key: 'reader',
      grants: [orders.grant('view')],
    });
    await authz.permissionSets.assign({ permissionSet: 'reader', subject });

    const resource = { type: 'composite' as const, id: orders.name };
    const read = { resource, action: 'view' };
    const original = authz.for({ principal: subject });
    const baseline = await original.authorize(read);
    expect(baseline).toMatchObject({
      effect: 'conditional',
      conditions: { checks: [{ decision: { conditions: { scope: true } } }] },
    });

    const rollback = new Error('roll back restriction');
    await expect(
      connection.transaction(async (tx) => {
        await authz.restrictionRules.withTransaction(tx).create({
          key: 'one-order',
          resource,
          subjects: [subject],
          actions: [
            {
              action: 'view',
              scopeKey: 'orders',
              selection: selection.records(['one']),
            },
          ],
        });
        const bound = original.withTransaction(tx);
        const reads = vi.spyOn(DatabaseRestrictionRuleStore.prototype, 'list');
        try {
          const decision = await bound.authorize(read);
          expect(decision).toMatchObject({
            effect: 'conditional',
            reasons: expect.arrayContaining([
              expect.objectContaining({ code: 'SELECTION_RESTRICTED' }),
            ]),
          });
          const policy = decision.conditions?.database?.orders;
          expect(policy).toBeDefined();
          await expect(
            tx.repository('orders').withPolicy(policy!).findMany(),
          ).resolves.toEqual([{ id: 'one' }]);
          await expect(bound.authorize(read)).resolves.toEqual(decision);
          expect(reads).toHaveBeenCalledTimes(1);
        } finally {
          reads.mockRestore();
        }
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    await expect(original.authorize(read)).resolves.toEqual(baseline);
    await expect(
      authz.for({ principal: subject }).authorize(read),
    ).resolves.toEqual(baseline);
  } finally {
    await testDatabase.destroy();
  }
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
