import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';

/** The fields `orders` carries, in the order db reports them. */
export const orderFields: readonly string[] = [
  'id',
  'ownerId',
  'createdById',
  'amount',
  'regionId',
];

/**
 * A real database, on the dialect the test environment selects, holding the
 * `orders` Collection these tests grant on. Collection metadata comes from db
 * now, so a test that authorizes a Collection has to create it. `destroy()`
 * drops it again.
 */
export async function createOrdersDatabase(): Promise<TestDatabase> {
  const testDatabase = await createTestDatabase();
  try {
    await testDatabase.connection.builder.createCollection(
      'orders',
      (orders) => {
        orders.increments('id').primary();
        orders.string('ownerId', { length: 64 });
        orders.string('createdById', { length: 64 });
        orders.integer('amount');
        orders.string('regionId', { length: 64 });
      },
    );
  } catch (error) {
    await testDatabase.destroy();
    throw error;
  }
  return testDatabase;
}
