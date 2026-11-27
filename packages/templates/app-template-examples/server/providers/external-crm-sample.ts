import type { Knex } from 'knex';
import type { DatabaseConnection } from '@nocobase/db';

/**
 * Stand in for the external CRM system when the connection points at a local
 * SQLite file. A real CRM creates and evolves its own tables; this does the
 * same with the raw client, deliberately bypassing NocoBase's Builder, which
 * refuses DDL on an external connection. Nothing here runs against another
 * dialect — that is a database someone else owns.
 *
 * Returns `true` when it created the tables, `false` when they already existed.
 */
export async function ensureExternalCrmSampleDatabase(
  connection: DatabaseConnection,
): Promise<boolean> {
  if (connection.dialect !== 'sqlite') return false;
  const knex = await connection.client<Knex>();
  if (await knex.schema.hasTable('crm_customers')) return false;

  await connection.notifySchemaChange(async () => {
    await knex.schema.createTable('crm_customers', (table) => {
      table.increments('id');
      table.string('email', 255).notNullable().unique();
      table.string('display_name', 128).notNullable();
      table.datetime('created_at').notNullable();
    });
    await knex.schema.createTable('crm_orders', (table) => {
      table.increments('id');
      table.integer('customer_id').notNullable();
      table.string('order_no', 64).notNullable().unique();
      table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
      table.string('status', 32).notNullable().defaultTo('draft');
      table.datetime('placed_at').notNullable();
      table.foreign('customer_id').references('id').inTable('crm_customers');
      table.index(['customer_id', 'status']);
    });
  });

  const customers = [
    { id: 1, email: 'ada@example.com', display_name: 'Ada Lovelace' },
    { id: 2, email: 'grace@example.com', display_name: 'Grace Hopper' },
    { id: 3, email: 'linus@example.com', display_name: 'Linus Torvalds' },
  ];
  const orders = [
    {
      id: 1,
      customer_id: 1,
      order_no: 'CRM-1001',
      total_amount: 120.5,
      status: 'paid',
      placed_at: '2026-09-01T09:15:00.000',
    },
    {
      id: 2,
      customer_id: 1,
      order_no: 'CRM-1002',
      total_amount: 48.0,
      status: 'shipped',
      placed_at: '2026-09-03T14:40:00.000',
    },
    {
      id: 3,
      customer_id: 2,
      order_no: 'CRM-1003',
      total_amount: 999.99,
      status: 'paid',
      placed_at: '2026-09-05T11:05:00.000',
    },
    {
      id: 4,
      customer_id: 3,
      order_no: 'CRM-1004',
      total_amount: 15.25,
      status: 'draft',
      placed_at: '2026-09-08T16:30:00.000',
    },
  ];
  await knex.transaction(async (trx) => {
    await trx('crm_customers').insert(
      customers.map((customer) => ({
        ...customer,
        created_at: '2026-08-20T08:00:00.000',
      })),
    );
    await trx('crm_orders').insert(orders);
  });
  return true;
}
