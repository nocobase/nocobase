// @vitest-environment node
import { fileURLToPath } from 'node:url';
import type { MigrationSource } from '@nocobase/db';
import {
  createDatabaseTest,
  describeMigration,
  expectCollection,
} from '@nocobase/db-testing/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ORDERS, MEMBERS, PROJECTS, QUOTES } from '../catalog.js';
import { createFixture } from './helpers.js';
import migration from '../database/migrations/202609220001_sales_permissions.js';

const migrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-authorization-example',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

const salesCollections = [
  'authorizationExampleCarriers',
  'authorizationExampleSalesMembers',
  'authorizationExampleProjects',
  'authorizationExampleQuotes',
  'authorizationExampleOrders',
];

describeMigration(migration.name, {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of salesCollections) {
      expect(await connection.collections.get(name)).toBeDefined();
      await expectCollection(name).toExist();
    }
    const quotes = await connection.collections.get(
      'authorizationExampleQuotes',
    );
    expect(quotes?.fields?.map((field) => field.name)).toEqual(
      expect.arrayContaining(['preparedById', 'preparedByName']),
    );
    await expectCollection('authorizationExampleQuotes').toHaveField(
      'preparedById',
    );
    await expectCollection('authorizationExampleQuotes').toHaveField(
      'preparedByName',
    );
  },
  down: async ({ connection, expectCollection }) => {
    for (const name of salesCollections) {
      expect(await connection.collections.get(name)).toBeUndefined();
      await expectCollection(name).not.toExist();
    }
  },
});

const test = createDatabaseTest();

test('upgrades delivery references without losing orders and safely restores the constraint', async ({
  database,
  connection,
  expectCollection,
}) => {
  const orders = 'authorizationExampleOrders';
  const migrator = database.createMigrator({ sources: migrations });
  const assertNullable = async (nullable: boolean) => {
    expect((await connection.collections.get(orders))?.fields).toContainEqual(
      expect.objectContaining({ name: 'deliveryReference', nullable }),
    );
    await expectCollection(orders).toHaveField('deliveryReference', {
      nullable,
    });
  };
  await migrator.upTo(migration.name);
  await assertNullable(false);
  await connection.query
    .insertInto(orders)
    .values({
      id: 'existing-order',
      projectId: 'project',
      quoteId: 'quote',
      title: 'Existing order',
      status: 'ready',
      deliveryReference: 'SHIP-1',
    })
    .execute();
  await migrator.latest();
  await assertNullable(true);
  expect(
    await connection.query.selectFrom(orders).selectAll().executeTakeFirst(),
  ).toMatchObject({
    id: 'existing-order',
    deliveryReference: 'SHIP-1',
  });
  await connection.query
    .updateTable(orders)
    .where('id', '=', 'existing-order')
    .set({ deliveryReference: null })
    .execute();
  await expect(migrator.rollback()).rejects.toThrow(
    'Fill missing order delivery references',
  );
  await assertNullable(true);
  expect(
    await connection.query.selectFrom(orders).selectAll().executeTakeFirst(),
  ).toMatchObject({
    id: 'existing-order',
    deliveryReference: null,
  });
  await connection.query
    .updateTable(orders)
    .where('id', '=', 'existing-order')
    .set({ deliveryReference: 'SHIP-2' })
    .execute();
  await migrator.rollback();
  await assertNullable(false);
  await expect(
    connection.query
      .updateTable(orders)
      .where('id', '=', 'existing-order')
      .set({ deliveryReference: null })
      .execute(),
  ).rejects.toThrow();
  await migrator.rollback();
  await expectCollection(orders).not.toExist();
});

describe('against the seeded example', () => {
  let fixture: Awaited<ReturnType<typeof createFixture>>;
  beforeEach(async () => {
    fixture = await createFixture();
  });
  afterEach(async () => {
    await fixture.destroy();
  });

  it('reverses the relation migration and restores metadata on reapplication', async () => {
    const connection = fixture.database.connection();
    const context = {
      connection,
      builder: connection.builder,
      query: connection.query,
    };
    expect(
      (await connection.collections.get(ORDERS))?.fields?.find(
        (field) => field.name === 'checks',
      ),
    ).toMatchObject({ type: 'hasMany' });
    await expectCollection(connection, ORDERS).toHaveField('carrierId');
    await migration.down!(context);
    await expectCollection(
      connection,
      'authorizationExampleOrderChecks',
    ).not.toExist();
    expect(await connection.collections.get(ORDERS)).toBeUndefined();
    await migration.up(context);
    await expectCollection(
      connection,
      'authorizationExampleOrderChecks',
    ).toExist();
    expect(
      (await connection.collections.get(ORDERS))?.fields?.find(
        (field) => field.name === 'collaborators',
      ),
    ).toMatchObject({ type: 'belongsToMany' });
  });

  it('creates and removes all example schema through the real migrator', async () => {
    const connection = fixture.database.connection();
    await expectCollection(connection, ORDERS).toExist();
    const migrator = fixture.database.createMigrator({ sources: migrations });
    await connection.query
      .updateTable(ORDERS)
      .set({ deliveryReference: 'ROLLBACK-TEST' })
      .where('deliveryReference', 'is', null)
      .execute();
    await migrator.rollback();
    for (const name of [
      MEMBERS,
      PROJECTS,
      QUOTES,
      ORDERS,
      'authorizationExampleCarriers',
      'authorizationExampleOrderCarriers',
    ])
      await expectCollection(connection, name).not.toExist();
  });
});
