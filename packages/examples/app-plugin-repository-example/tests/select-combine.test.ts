import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  combineExamples,
  runCombineExample,
} from '../client/select-combine.js';
import { createFixture } from './helpers.js';

let f: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  f = await createFixture();
  await f.database
    .createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-repository-example',
    })
    .run();
});
afterEach(async () => {
  await f.destroy();
});
async function run(key: string) {
  const definition = combineExamples.find((item) => item.key === key)!;
  const before = f.requests.length;
  const result = await runCombineExample(f.api, definition);
  expect(f.requests.slice(before)).toEqual([
    expect.objectContaining({
      path: `http://example.test/main/api/${definition.repository}:findMany`,
      body: definition.options,
    }),
  ]);
  return result;
}
it('keeps preview, status filters, counts and parent scopes independent', async () => {
  const rows = await run('preview');
  expect(rows[0]).toMatchObject({
    id: 'demo-customer-1',
    orders: {
      preview: [{ id: 'demo-order-1', number: 'DEMO-SO-001', status: 'paid' }],
      total: 2,
      paid: 1,
      cancelled: [{ id: 'demo-order-4', number: 'DEMO-SO-004' }],
    },
  });
  expect(rows[1]).toMatchObject({
    orders: { total: 1, paid: 0, cancelled: [] },
  });
  expect(rows[3]).toMatchObject({
    orders: { preview: [], total: 0, paid: 0, cancelled: [] },
  });
});
it('aggregates all items despite record limits and preserves empty-set nulls', async () => {
  await f.api.repository('repositoryExampleOrders').createOne({
    values: {
      id: 'zz-empty',
      number: 'EMPTY',
      status: 'draft',
      customer: { connect: { id: 'demo-customer-1' } },
    },
  });
  const rows = await run('statistics');
  expect(rows[0]).toMatchObject({
    items: {
      records: [
        expect.objectContaining({ id: 'demo-item-1' }),
        expect.objectContaining({ id: 'demo-item-2' }),
      ],
      count: 3,
      quantity: '5',
      // 36700 / 3: AVG keeps the database's own scale (SQLite 18 decimal
      // places, PostgreSQL 16, MySQL 4), so require the exact integer part and
      // the repeating fraction to at least the 4 places every dialect keeps.
      averagePrice: expect.stringMatching(/^12233\.3{4,}$/),
      minimumPrice: 5900,
      maximumPrice: 18900,
    },
  });
  expect(rows.at(-1)).toMatchObject({
    items: {
      records: [],
      count: 0,
      quantity: null,
      averagePrice: null,
      minimumPrice: null,
      maximumPrice: null,
    },
  });
});
it('returns nested combine results and product includes in each parent scope', async () => {
  const rows = await run('nested');
  expect(rows[0]).toMatchObject({
    orders: {
      count: 2,
      records: [
        {
          id: 'demo-order-1',
          items: {
            count: 3,
            quantity: '5',
            preview: [
              { quantity: 2, product: { name: 'Mechanical Keyboard' } },
            ],
          },
        },
        {
          id: 'demo-order-4',
          items: {
            count: 1,
            quantity: '1',
            preview: [
              { quantity: 1, product: { name: 'Mechanical Keyboard' } },
            ],
          },
        },
      ],
    },
  });
  expect(rows[3]).toMatchObject({ orders: { count: 0, records: [] } });
});
it('inherits shared filters and counts only non-null assignees', async () => {
  expect((await run('scoped'))[0]).toMatchObject({
    tasks: {
      total: 3,
      assigned: 1,
      preview: [{ id: 'task-detached' }],
      unassigned: [{ id: 'task-detached' }, { id: 'task-obsolete' }],
    },
  });
  await f.api
    .repository('repositoryExampleRelationTasks')
    .updateOne({ filter: { id: 'task-obsolete' }, values: { status: 'done' } });
  const rows = await run('scoped');
  expect(rows[0]).toMatchObject({
    tasks: { total: 2, assigned: 1, unassigned: [{ id: 'task-detached' }] },
  });
  expect(rows[1]).toMatchObject({
    tasks: { total: 1, assigned: 1, unassigned: [] },
  });
});
it('counts only linked tags and filters each many-to-many branch independently', async () => {
  const rows = await run('tags');
  expect(rows[0]).toMatchObject({
    tags: {
      records: [{ id: 'tag-docs', label: 'Documentation' }],
      total: 1,
      documentation: 1,
    },
  });
  expect(rows[1]).toMatchObject({
    tags: {
      records: [{ id: 'tag-orm', label: 'ORM' }],
      total: 1,
      documentation: 0,
    },
  });
});
