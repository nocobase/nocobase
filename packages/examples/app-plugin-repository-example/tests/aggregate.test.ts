import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadAggregate } from '../client/aggregate.js';
import { createFixture } from './helpers.js';
import { type AggregateResponse } from '../shared/aggregate.js';

let f: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  f = await createFixture();
});
afterEach(async () => {
  await f.destroy();
});
async function seed() {
  await f.database
    .createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-repository-example',
    })
    .run();
}
async function aggregate(
  query: Partial<import('../shared/aggregate.js').AggregateRequest> = {},
): Promise<AggregateResponse> {
  return (
    await loadAggregate(f.api, { status: 'all', minimumQuantity: 0, ...query })
  ).data;
}
// AVG over an integer column is a string in the database's own format: the
// value is exact, but trailing zeros differ (SQLite '14900', PostgreSQL
// '14900.000000000000', MySQL '14900.0000'), so match the value, not the scale.
function exactDecimal(integerPart: string) {
  return expect.stringMatching(new RegExp(`^${integerPart}(?:\\.0+)?$`));
}
it('aggregates all rows, groups products with names, and includes zero relation counts', async () => {
  await seed();
  const result = await aggregate();
  expect(result.summary).toEqual({
    count: 8,
    quantity: '14',
    averagePrice: exactDecimal('14900'),
    minimumPrice: 5900,
    maximumPrice: 32900,
  });
  expect(result.statuses).toEqual(
    ['cancelled', 'confirmed', 'draft', 'paid'].map((status) => ({
      status,
      count: 1,
    })),
  );
  expect(result.products).toHaveLength(6);
  expect(
    result.products.find((row) => row.sku === 'DEMO-KEYBOARD'),
  ).toMatchObject({
    name: 'Mechanical Keyboard',
    count: 2,
    quantity: '3',
    averagePrice: exactDecimal('12400'),
  });
  expect(result.customers.map((row) => row.orders)).toEqual([2, 1, 1, 0]);
  const statusCalls = f.requests.filter(
    (entry) =>
      /repositoryExampleOrders:groupBy$/.test(entry.path) &&
      JSON.stringify(entry.body).includes('"by":["status"]'),
  );
  expect(statusCalls).toHaveLength(1);
  expect(statusCalls[0]?.path).toContain(':groupBy');
  expect(statusCalls[0]?.body).toMatchObject({ by: ['status'] });
});
it('applies status to all queries and HAVING only to grouped products', async () => {
  await seed();
  const result = await aggregate({ status: 'paid', minimumQuantity: 2 });
  expect(result.summary).toMatchObject({
    count: 3,
    quantity: '5',
    minimumPrice: 5900,
    maximumPrice: 18900,
  });
  expect(Number(result.summary.averagePrice)).toBeCloseTo(36700 / 3);
  expect(result.statuses).toEqual([{ status: 'paid', count: 1 }]);
  expect(result.products.map((row) => row.sku)).toEqual([
    'DEMO-KEYBOARD',
    'DEMO-MOUSE',
  ]);
  expect(result.customers.map((row) => row.orders)).toEqual([1, 0, 0, 0]);
  const grouped = await aggregate({ minimumQuantity: 3 });
  expect(grouped.products.map((row) => row.sku)).toEqual([
    'DEMO-KEYBOARD',
    'DEMO-MONITOR',
    'DEMO-STAND',
  ]);
  expect(grouped.summary.count).toBe(8);
});
it('preserves SQL empty-set semantics', async () => {
  expect(await aggregate()).toEqual({
    summary: {
      count: 0,
      quantity: null,
      averagePrice: null,
      minimumPrice: null,
      maximumPrice: null,
    },
    statuses: [],
    products: [],
    customers: [],
    customerLimit: 50,
  });
});
it('requires authentication for both aggregate actions and leaves unrelated routes public', async () => {
  for (const action of ['aggregate', 'groupBy']) {
    expect(
      (
        await f.router.request(
          `/main/api/repositoryExampleOrderItems:${action}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          },
        )
      ).status,
    ).toBe(401);
  }
  expect((await f.router.request('/main/api/unrelated')).status).toBe(200);
});
