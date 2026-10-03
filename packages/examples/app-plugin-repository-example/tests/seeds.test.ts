// @vitest-environment node
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detailSelect, entities, repository } from '../client/model.js';
import { loadRelationProjectState } from '../client/relation-mutations.js';
import { createFixture } from './helpers.js';

describe('Repository example seeds', () => {
  let f: Awaited<ReturnType<typeof createFixture>>;
  beforeEach(async () => {
    f = await createFixture();
  });
  afterEach(async () => {
    await f.destroy();
  });
  function seeder(tableName?: string) {
    return f.database.createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-repository-example',
      ...(tableName ? { tableName } : {}),
    });
  }
  it('seeds all entities, exposes related data through HTTP, and preserves edits on replay', async () => {
    const runner = seeder();
    expect((await runner.run()).executed).toHaveLength(4);
    for (const [key, count] of [
      ['customers', 4],
      ['contacts', 5],
      ['products', 6],
      ['orders', 4],
      ['items', 8],
    ] as const) {
      expect(await repository(f.api, key).count()).toBe(count);
    }
    const findManyRecords = await f.api
      .repository('repositoryExampleFindManyRecords')
      .findMany({ limit: 100 });
    expect(findManyRecords).toHaveLength(24);
    expect(findManyRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'find-many-01',
          sequence: 1,
          title: 'FindMany record 01',
          category: 'alpha',
        }),
        expect.objectContaining({
          id: 'find-many-24',
          sequence: 24,
          category: 'gamma',
        }),
      ]),
    );
    const relationState = await loadRelationProjectState(f.api, 'project-1');
    expect(relationState).toMatchObject({
      project: {
        name: 'Repository guide',
        owner: { name: 'Ada' },
        profile: { id: 'profile-current' },
        tasks: expect.arrayContaining([
          expect.objectContaining({ id: 'task-edit' }),
          expect.objectContaining({ id: 'task-detached' }),
          expect.objectContaining({ id: 'task-obsolete' }),
        ]),
        tags: [{ id: 'tag-docs', label: 'Documentation' }],
      },
      through: [
        { projectId: 'project-1', tagId: 'tag-docs', role: 'secondary' },
      ],
    });
    const orders = repository(f.api, 'orders');
    const paid = await orders.findOne({
      filter: { id: 'demo-order-1' },
      select: detailSelect(entities.orders),
    });
    expect(paid).toMatchObject({
      status: 'paid',
      version: 1,
      customer: { name: 'Ada Chen' },
      items: expect.arrayContaining([
        {
          id: 'demo-item-1',
          orderId: 'demo-order-1',
          productId: 'demo-product-1',
          product: {
            id: 'demo-product-1',
            name: 'Mechanical Keyboard',
            sku: 'DEMO-KEYBOARD',
            unitPriceCents: 12900,
          },
          quantity: 2,
          unitPriceCents: 11900,
        },
      ]),
    });
    await orders.updateOne({
      filter: { id: 'demo-order-1' },
      values: { number: 'EDITED-SO' },
      ifVersion: paid?.version,
    });
    // Normal reruns also preserve deliberately deleted sample data.
    await repository(f.api, 'contacts').deleteOne({
      filter: { id: 'demo-contact-5' },
    });
    expect((await runner.run()).executed).toEqual([]);
    expect(await repository(f.api, 'contacts').count()).toBe(4);
    // A fresh history simulates explicit seed replay: missing IDs are inserted,
    // while existing customer data and order versions remain untouched.
    await seeder('replayedSeedHistory').run();
    expect(await repository(f.api, 'contacts').count()).toBe(5);
    expect(await orders.count()).toBe(4);
    expect(
      await orders.findOne({ filter: { id: 'demo-order-1' } }),
    ).toMatchObject({ number: 'EDITED-SO', version: 2 });
  });
  it('rolls back all inserts on a unique collision and can retry after correction', async () => {
    const products = repository(f.api, 'products');
    await products.createOne({
      values: {
        id: 'existing-product',
        name: 'User product',
        sku: 'DEMO-KEYBOARD',
        unitPriceCents: 100,
      },
    });
    const runner = seeder();
    await expect(runner.run()).rejects.toThrow();
    for (const key of ['customers', 'contacts', 'orders', 'items'] as const)
      expect(await repository(f.api, key).count()).toBe(0);
    expect(await products.findMany()).toMatchObject([
      { id: 'existing-product', name: 'User product' },
    ]);
    await products.updateOne({
      filter: { id: 'existing-product' },
      values: { sku: 'USER-KEYBOARD' },
    });
    expect((await runner.run()).executed).toHaveLength(4);
    expect(await products.count()).toBe(7);
  });
});
