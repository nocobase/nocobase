import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  sortExamples,
  runSortExample,
  sortExampleRequest,
} from '../client/sort.js';
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
const definition = (key: string) =>
  sortExamples.find((example) => example.key === key)!;
const ids = (rows: Record<string, unknown>[]) => rows.map((row) => row.id);
const run = (key: string) => runSortExample(f.api, definition(key));

it('runs every valid builder and its displayed AST with identical results', async () => {
  for (const example of sortExamples.filter((item) => !item.expectedError)) {
    const rows = await runSortExample(f.api, example);
    const options = sortExampleRequest(example);
    expect(f.requests.at(-1)?.body).toEqual(options);
    expect(
      await f.api.repository(example.repository).findMany(options),
    ).toEqual(rows);
  }
});
it('sorts ascending, descending, default and multiple fields with stable ties', async () => {
  expect(ids(await run('default'))).toEqual([
    'demo-customer-1',
    'demo-customer-2',
    'demo-customer-3',
    'demo-customer-4',
  ]);
  expect(ids(await run('asc'))).toEqual(
    [2, 5, 6, 1, 3, 4].map((id) => `demo-product-${id}`),
  );
  expect(ids(await run('desc'))).toEqual(
    [4, 3, 1, 6, 5, 2].map((id) => `demo-product-${id}`),
  );
  expect(ids(await run('multi'))).toEqual(
    [5, 4, 2, 1, 6, 8, 3, 7].map((id) => `demo-item-${id}`),
  );
});
it('places NULLs explicitly and sorts across to-one paths without dropping missing targets', async () => {
  expect(ids(await run('nulls-first'))).toEqual([
    'task-detached',
    'task-obsolete',
    'task-edit',
    'task-existing',
    'task-outside',
  ]);
  expect(ids(await run('nulls-last'))).toEqual([
    'task-edit',
    'task-existing',
    'task-outside',
    'task-detached',
    'task-obsolete',
  ]);
  const rows = await run('to-one');
  expect(ids(rows)).toEqual([
    'task-outside',
    'task-edit',
    'task-existing',
    'task-detached',
    'task-obsolete',
  ]);
  expect(rows[0]).toMatchObject({ assignee: { name: 'Bob' } });
  expect(rows.at(-1)?.assignee).toBeNull();
});
it('keeps aggregate sort scope separate from a filtered select and local include ordering', async () => {
  const count = await run('count');
  expect(ids(count)).toEqual([1, 2, 3, 4].map((id) => `demo-customer-${id}`));
  expect(count[0]).toMatchObject({ orders: { count: 2, paidCount: 1 } });
  expect(count[3]).toMatchObject({ orders: { count: 0, paidCount: 0 } });
  const rows = await run('include');
  expect(ids(rows)).toEqual(ids(count));
  expect(rows[0]).toMatchObject({
    orders: [{ id: 'demo-order-4' }, { id: 'demo-order-1' }],
  });
});
it('ranks every numeric relation aggregate and distinguishes empty SUM sorting from projection', async () => {
  await f.api.repository('repositoryExampleProducts').createOne({
    values: {
      id: 'zz-empty',
      name: 'No items',
      sku: 'EMPTY',
      unitPriceCents: 0,
    },
  });
  const sum = await run('sum');
  expect(ids(sum)).toEqual(
    [1, 4, 5, 2, 3, 6].map((id) => `demo-product-${id}`).concat('zz-empty'),
  );
  expect(sum.at(-1)).toMatchObject({
    items: { count: 0, value: null, records: [] },
  });
  for (const key of ['avg', 'min', 'max']) {
    const rows = await run(key);
    expect(rows[0]).toMatchObject({
      id: 'zz-empty',
      items: { count: 0, value: null, records: [] },
    });
    const expected =
      key === 'avg'
        ? [4, 5, 2, 1, 3, 6]
        : key === 'min'
          ? [4, 5, 2, 1, 3, 6]
          : [4, 5, 1, 2, 3, 6];
    expect(ids(rows.slice(1))).toEqual(
      expected.map((id) => `demo-product-${id}`),
    );
  }
});
it.each(sortExamples.filter((example) => example.expectedError))(
  'rejects $key with the documented error',
  async (example) => {
    expect(() => sortExampleRequest(example)).not.toThrow();
    await expect(runSortExample(f.api, example)).rejects.toMatchObject({
      code: example.expectedError,
    });
  },
);
