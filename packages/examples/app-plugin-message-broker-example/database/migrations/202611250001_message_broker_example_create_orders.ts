import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The example's business tables.
 *
 * - `messageBrokerExampleOrders`: an order placed by the example's service. Placing it publishes `order.placed` in
 *   the same transaction; a payment message from the outside marks it paid.
 * - `messageBrokerExampleShipments`: one row per order, written by the `orderShipments` subscription.
 * - `messageBrokerExampleCustomerStats`: per-customer counters the `customerOrderStats` subscription increments. An
 *   increment is not idempotent on its own, so a repeated message would count twice without the inbox.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611250001_message_broker_example_create_orders',

  async up({ builder }) {
    await builder.createCollection(
      'messageBrokerExampleOrders',
      (collection) => {
        collection.string('id', { length: 64 }).primary().notNull();
        collection.string('customer', { length: 120 }).notNull();
        collection.integer('total').notNull();
        collection.string('status', { length: 20 }).notNull();
      },
    );
    await builder.createCollection(
      'messageBrokerExampleShipments',
      (collection) => {
        collection.string('orderId', { length: 64 }).primary().notNull();
        collection.string('customer', { length: 120 }).notNull();
      },
    );
    await builder.createCollection(
      'messageBrokerExampleCustomerStats',
      (collection) => {
        collection.string('customer', { length: 120 }).primary().notNull();
        collection.integer('orderCount').notNull().defaultTo(0);
        collection.integer('totalSpent').notNull().defaultTo(0);
      },
    );
  },

  async down({ builder }) {
    await builder.dropCollection('messageBrokerExampleCustomerStats');
    await builder.dropCollection('messageBrokerExampleShipments');
    await builder.dropCollection('messageBrokerExampleOrders');
  },
});

export default migration;
