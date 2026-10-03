// @vitest-environment node
import { expectCollection } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { createFixture } from './helpers.js';
it('creates physical collections and relation metadata and rolls them back', async () => {
  const { database, migrator, destroy } = await createFixture();
  try {
    const connection = database.connection();
    const collections = connection.collections;
    const orders = await collections.get('repositoryExampleOrders');
    expect(orders?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'customer',
          type: 'belongsTo',
          target: 'repositoryExampleCustomers',
        }),
        expect.objectContaining({
          name: 'items',
          type: 'hasMany',
          target: 'repositoryExampleOrderItems',
        }),
      ]),
    );
    expect(orders?.fields).toContainEqual(
      expect.objectContaining({ name: 'version', type: 'integer' }),
    );
    // The example's naming: Collection names map to snake_case tables.
    for (const [name, table] of Object.entries({
      repositoryExampleOrders: 'repository_example_orders',
      repositoryExampleCustomers: 'repository_example_customers',
      repositoryExampleAtomicCounters: 'repository_example_atomic_counters',
      repositoryExampleFindManyRecords: 'repository_example_find_many_records',
      repositoryExampleRelationProjects: 'repository_example_relation_projects',
    })) {
      expect((await collections.getPhysical(name))?.tableName).toBe(table);
    }
    const physicalOrders = await expectCollection(
      connection,
      'repositoryExampleOrders',
    ).toExist();
    expect(physicalOrders.foreignKeys).toEqual([
      expect.objectContaining({
        fields: ['customerId'],
        collection: 'repositoryExampleCustomers',
        onDelete: 'restrict',
      }),
    ]);
    const items = expectCollection(connection, 'repositoryExampleOrderItems');
    await items.toHaveForeignKey(['orderId'], 'repositoryExampleOrders', {
      onDelete: 'cascade',
    });
    await items.toHaveForeignKey(['productId'], 'repositoryExampleProducts', {
      onDelete: 'restrict',
    });
    await expectCollection(connection, 'repositoryExampleProducts').toHaveIndex(
      ['sku'],
      { unique: true },
    );
    await expectCollection(
      connection,
      'repositoryExampleAtomicCounters',
    ).toHaveField('value', { type: 'integer', nullable: false });
    const findMany = expectCollection(
      connection,
      'repositoryExampleFindManyRecords',
    );
    await findMany.toHaveField('sequence', {
      type: 'integer',
      nullable: false,
    });
    for (const field of ['title', 'category', 'description'])
      await findMany.toHaveField(field, { nullable: false });
    await findMany.toHaveIndex(['sequence'], { unique: true });
    const relationProjects = await collections.get(
      'repositoryExampleRelationProjects',
    );
    expect(relationProjects?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'owner',
          type: 'belongsTo',
          target: 'repositoryExampleRelationUsers',
        }),
        expect.objectContaining({
          name: 'profile',
          type: 'hasOne',
          target: 'repositoryExampleRelationProjectProfiles',
        }),
        expect.objectContaining({
          name: 'tasks',
          type: 'hasMany',
          target: 'repositoryExampleRelationTasks',
        }),
        expect.objectContaining({
          name: 'tags',
          type: 'belongsToMany',
          target: 'repositoryExampleRelationTags',
          through: 'repositoryExampleRelationProjectTags',
        }),
      ]),
    );
    await expectCollection(
      connection,
      'repositoryExampleRelationProjects',
    ).toExist();
    await expectCollection(
      connection,
      'repositoryExampleRelationProjectProfiles',
    ).toHaveIndex(['projectId'], { unique: true });
    await expectCollection(
      connection,
      'repositoryExampleRelationProjectTags',
    ).toHaveIndex(['projectId', 'tagId'], { unique: true });
    const result = await migrator.rollback();
    expect(result.rolledBack).toHaveLength(4);
    for (const name of [
      'repositoryExampleRelationProjects',
      'repositoryExampleRelationProjectTags',
      'repositoryExampleRelationTasks',
      'repositoryExampleRelationProjectProfiles',
      'repositoryExampleRelationTags',
      'repositoryExampleRelationUsers',
      'repositoryExampleFindManyRecords',
      'repositoryExampleAtomicCounters',
      'repositoryExampleCustomers',
      'repositoryExampleContacts',
      'repositoryExampleProducts',
      'repositoryExampleOrders',
      'repositoryExampleOrderItems',
    ]) {
      expect(await collections.get(name)).toBeUndefined();
      await expectCollection(connection, name).not.toExist();
    }
  } finally {
    await destroy();
  }
});
