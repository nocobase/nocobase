import type { AuthorizationContext } from '@nocobase/authorization/core';
import { expect, it } from 'vitest';

import { createAppAuthorization } from '../../server/authorization.js';
import { createRuleSupportRoutes } from '../../server/extension/index.js';
import { createTestDatabase } from '@nocobase/app-testing/server';

it('offers a settings page the labelled records of a collection, and nothing for a registered one the database does not hold', async () => {
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
    const routes = createRuleSupportRoutes(authz, 'sharing-rules');
    const authorization = {
      require: () => Promise.resolve(),
    } as unknown as AuthorizationContext;
    const records = async (collection: string): Promise<unknown> =>
      (
        await routes.request(
          `/sharing-rules/records/${collection}`,
          {},
          { authorization },
        )
      ).json();

    await expect(records('customers')).resolves.toEqual({
      data: [
        { id: 'alice', label: 'Alice', description: 'alice' },
        { id: 'bob', label: 'Bob', description: 'bob' },
      ],
    });
    await expect(records('orders')).resolves.toEqual({ data: [] });
  } finally {
    await testDatabase.destroy();
  }
});
