import type { AuthorizationContext } from '@nocobase/authorization/core';
import { expect, it } from 'vitest';

import { createAppAuthorization } from '../../server/authorization.js';
import { createRuleSupportRoutes } from '../../server/extension/index.js';
import { createTestDatabase } from '@nocobase/app-testing/server';

it('offers a settings page the labelled records of a collection a page at a time, and 404 for a registered one the database does not hold', async () => {
  const testDatabase = await createTestDatabase();
  try {
    const { connection, database } = testDatabase;
    await connection.builder.createCollection('customers', (customers) => {
      customers.string('id', { length: 64 }).primary();
      customers.string('name', { length: 120 });
    });
    await connection.query
      .insertInto('customers')
      .values([
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ])
      .execute();
    const authz = createAppAuthorization({ connection, database });
    authz.database.collections.add({ name: 'customers', title: 'Customers' });
    authz.database.collections.add({ name: 'orders', title: 'Orders' });
    const routes = createRuleSupportRoutes(authz, {
      path: '/sharingRules',
      settings: 'authorization.sharing-rules',
    });
    const authorization = {
      require: () => Promise.resolve(),
    } as unknown as AuthorizationContext;
    const request = (path: string): Promise<Response> =>
      Promise.resolve(
        routes.request(`/sharingRules/records/${path}`, {}, { authorization }),
      );
    const records = async (path: string): Promise<unknown> =>
      (await request(path)).json();

    await expect(records('customers')).resolves.toEqual({
      data: [
        { id: 'alice', label: 'Alice', description: 'alice' },
        { id: 'bob', label: 'Bob', description: 'bob' },
      ],
      meta: { page: 1, pageSize: 20, total: 2 },
    });
    // Paged rather than truncated: the second page of one holds the second record, and `total` counts them all.
    await expect(records('customers?page=2&pageSize=1')).resolves.toEqual({
      data: [{ id: 'bob', label: 'Bob', description: 'bob' }],
      meta: { page: 2, pageSize: 1, total: 2 },
    });
    const tooLarge = await request('customers?pageSize=101');
    expect(tooLarge.status).toBe(400);
    const missing = await request('orders');
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'COLLECTION_NOT_FOUND',
        domain: 'authorization',
      },
    });
    expect((await request('nothingNamedThis')).status).toBe(404);
  } finally {
    await testDatabase.destroy();
  }
});
