import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createFixture } from './helpers.js';
import { loadGroupByExamples } from '../client/group-by.js';
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
it('groups customer totals and composite enum/price keys with readable names', async () => {
  const { examples, calls } = await loadGroupByExamples(f.api, {
    status: 'all',
    minimumQuantity: 0,
  });
  expect(examples[0]?.rows).toEqual([
    { id: 'demo-customer-1', name: 'Ada Chen', count: 2 },
    { id: 'demo-customer-2', name: 'Ben Lin', count: 1 },
    { id: 'demo-customer-3', name: 'Clara Wu', count: 1 },
  ]);
  expect(examples[1]?.rows).toHaveLength(4);
  expect(
    examples[1]?.rows.filter((row) => row.id === 'demo-customer-1'),
  ).toEqual(
    expect.arrayContaining([
      { id: 'demo-customer-1', name: 'Ada Chen', status: 'paid', count: 1 },
      {
        id: 'demo-customer-1',
        name: 'Ada Chen',
        status: 'cancelled',
        count: 1,
      },
    ]),
  );
  expect(examples[2]?.rows).toHaveLength(7);
  expect(
    examples[2]?.rows.filter((row) => row.id === 'demo-product-1'),
  ).toEqual([
    {
      id: 'demo-product-1',
      name: 'Mechanical Keyboard',
      price: 11900,
      count: 1,
      quantity: '2',
    },
    {
      id: 'demo-product-1',
      name: 'Mechanical Keyboard',
      price: 12900,
      count: 1,
      quantity: '1',
    },
  ]);
  expect(examples[2]?.rows[0]).toMatchObject({
    name: '27-inch Monitor',
    count: 1,
    quantity: '3',
  });
  expect(calls.filter((call) => call.action === 'groupBy')).toHaveLength(3);
});
it('applies HAVING to each group instead of the customer total or unit quantity', async () => {
  const { examples } = await loadGroupByExamples(f.api, {
    status: 'all',
    minimumQuantity: 999,
    minimumGroupCount: 2,
  });
  expect(examples[0]?.rows).toEqual([
    { id: 'demo-customer-1', name: 'Ada Chen', count: 2 },
  ]);
  expect(examples[1]?.rows).toEqual([]);
  expect(examples[2]?.rows).toEqual([
    {
      id: 'demo-product-3',
      name: 'USB-C Dock',
      price: 18900,
      count: 2,
      quantity: '2',
    },
  ]);
});
it('filters source rows by order status before grouping', async () => {
  const { examples } = await loadGroupByExamples(f.api, {
    status: 'confirmed',
    minimumQuantity: 0,
    minimumGroupCount: 1,
  });
  expect(examples[0]?.rows).toEqual([
    { id: 'demo-customer-2', name: 'Ben Lin', count: 1 },
  ]);
  expect(examples[1]?.rows).toEqual([
    { id: 'demo-customer-2', name: 'Ben Lin', status: 'confirmed', count: 1 },
  ]);
  expect(examples[2]?.rows.map((row) => row.name)).toEqual([
    '27-inch Monitor',
    'Laptop Stand',
  ]);
  const empty = await loadGroupByExamples(f.api, {
    status: 'paid',
    minimumQuantity: 0,
    minimumGroupCount: 2,
  });
  expect(empty.examples.every((example) => example.rows.length === 0)).toBe(
    true,
  );
});
