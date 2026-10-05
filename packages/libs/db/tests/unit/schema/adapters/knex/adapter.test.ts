import knex from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import type { DatabaseDriverRuntime } from '../../../../../src/database/runtime.js';
import { KnexSchemaAdapter } from '../../../../../src/schema/internal/knex/adapter.js';

describe('KnexSchemaAdapter', () => {
  const clients: Array<ReturnType<typeof knex>> = [];

  afterEach(async () => {
    await Promise.all(clients.map((client) => client.destroy()));
    clients.length = 0;
  });

  function createClient(clientName = 'better-sqlite3') {
    // SQL compilation does not need a native driver or a connection pool.
    const client = knex({
      client: clientName,
      useNullAsDefault: true,
    });
    clients.push(client);
    return client;
  }

  it.each(['better-sqlite3', 'pg', 'mysql2', 'oracledb', 'mssql'])(
    'declares a named primary key exactly once on %s',
    async (clientName) => {
      const adapter = new KnexSchemaAdapter(createClient(clientName), {
        dialect: clientName === 'oracledb' ? 'oracle' : clientName,
      });
      const sql = await adapter.compile([
        {
          type: 'createTable',
          table: {
            name: 'accounts',
            columns: [
              {
                name: 'code',
                type: 'string',
                primaryKey: true,
                nullable: false,
              },
            ],
            constraints: [
              { type: 'primary', name: 'accounts_pk', columns: ['code'] },
            ],
            indexes: [],
          },
        },
      ]);
      expect(sql.join('\n').match(/primary key/gi)).toHaveLength(1);
      if (clientName !== 'better-sqlite3')
        expect(sql.join('\n')).toContain('accounts_pk');
    },
  );

  it('compiles predicate filters for regular indexes and unique constraints', async () => {
    const adapter = new KnexSchemaAdapter(createClient());

    const sql = await adapter.compile([
      {
        type: 'createTable',
        table: {
          name: 'jobs',
          columns: [
            { name: 'id', type: 'integer', autoIncrement: true },
            { name: 'account_id', type: 'integer' },
            { name: 'program_id', type: 'integer' },
            { name: 'status', type: 'string' },
          ],
          indexes: [
            {
              columns: ['status'],
              name: 'idx_jobs_status_ready',
              predicate: {
                status: { $eq: 'ready' },
                account_id: { $notNull: true },
              },
            },
          ],
          constraints: [
            {
              type: 'unique',
              columns: ['account_id', 'program_id'],
              name: 'uk_jobs_account_program',
              predicate: {
                account_id: { $notNull: true },
                program_id: { $gt: 0 },
              },
            },
          ],
        },
      },
    ]);

    expect(sql.join('\n')).toContain('create index `idx_jobs_status_ready`');
    expect(sql.join('\n')).toContain('where `status` =');
    expect(sql.join('\n')).toContain('`account_id` is not null');
    expect(sql.join('\n')).toContain(
      'create unique index `uk_jobs_account_program`',
    );
    expect(sql.join('\n')).toContain('`program_id` >');
  });

  it('uses the constraint-specific MySQL drop operation', async () => {
    const adapter = new KnexSchemaAdapter(createClient('mysql2'), {
      dialect: 'mysql',
    });

    const sql = await adapter.compile([
      {
        type: 'alterTable',
        tableName: 'orders',
        operations: [
          {
            type: 'dropConstraint',
            name: 'orders_reference_unique',
            constraintType: 'unique',
          },
          {
            type: 'dropConstraint',
            name: 'orders_customer_foreign',
            constraintType: 'foreignKey',
          },
        ],
      },
    ]);

    expect(sql).toEqual([
      'alter table `orders` drop index `orders_reference_unique`',
      'alter table `orders` drop foreign key `orders_customer_foreign`',
    ]);
  });

  it('compiles raw views and structured filters with supported operators', async () => {
    const adapter = new KnexSchemaAdapter(createClient());

    const structuredSql = await adapter.compile([
      {
        type: 'createView',
        view: {
          name: 'adult_users',
          columns: ['first_name'],
          query: {
            from: 'users',
            select: ['first_name'],
            filter: {
              age: { $gte: 18, $lt: 65, $ne: 40 },
              deleted_at: { $is: null },
            },
          },
        },
      },
    ]);
    const rawSql = await adapter.compile([
      {
        type: 'createView',
        view: {
          name: 'raw_users',
          columns: ['first_name'],
          raw: {
            sql: 'select first_name from users where age > ?',
            bindings: [18],
          },
        },
      },
    ]);

    expect(structuredSql.join('\n')).toContain('where `age` >=');
    expect(structuredSql.join('\n')).toContain('and `age` <');
    expect(structuredSql.join('\n')).toContain('and `age` !=');
    expect(structuredSql.join('\n')).toContain('`deleted_at` is null');
    expect(rawSql.join('\n')).toContain(
      'select first_name from users where age >',
    );
  });

  it('compiles column defaults and SQLite-supported table alterations', async () => {
    const adapter = new KnexSchemaAdapter(createClient());

    const sql = await adapter.compile([
      {
        type: 'alterTable',
        tableName: 'orders',
        operations: [
          {
            type: 'addColumn',
            column: {
              name: 'status',
              type: 'string',
              nullable: false,
              defaultValue: 'draft',
              db: {
                comment: 'Order status',
              },
            },
          },
          {
            type: 'alterColumn',
            column: 'amount',
            changes: {
              name: 'amount',
              type: 'decimal',
              precision: 12,
              scale: 2,
              nullable: true,
            },
          },
          {
            type: 'dropIndex',
            name: 'idx_orders_status',
          },
        ],
      },
    ]);

    const output = sql.join('\n');
    expect(output).toContain('alter table `orders`');
    expect(output).toContain('`status` varchar(255) not null default');
    expect(output).toContain('drop index `idx_orders_status`');
  });

  it('takes a column default from the runtime as an expression, and keeps the literal otherwise', async () => {
    const schema: NonNullable<DatabaseDriverRuntime['schema']> = {
      columnType: ({ column }) => (column.name === 'body' ? 'text' : undefined),
      columnDefault: ({ client, column }) =>
        column.name === 'body'
          ? client.raw('(?)', [String(column.defaultValue)])
          : undefined,
    };
    const adapter = new KnexSchemaAdapter(createClient('mysql2'), {
      dialect: 'mysql',
      runtime: { schema } as DatabaseDriverRuntime,
    });

    const sql = await adapter.compile([
      {
        type: 'createTable',
        table: {
          name: 'notes',
          columns: [
            {
              name: 'body',
              type: 'text',
              nullable: false,
              defaultValue: 'draft',
            },
            {
              name: 'status',
              type: 'string',
              nullable: false,
              defaultValue: 'open',
            },
          ],
          constraints: [],
          indexes: [],
        },
      },
    ]);

    const output = sql.join('\n');
    expect(output).toContain("`body` text not null default ('draft')");
    expect(output).toContain("`status` varchar(255) not null default 'open'");
    expect(output.match(/default/gu)).toHaveLength(2);

    // Altering a column rebuilds its whole definition, so the expression has to survive that path as well.
    const altered = await adapter.compile([
      {
        type: 'alterTable',
        tableName: 'notes',
        operations: [
          {
            type: 'alterColumn',
            column: 'body',
            changes: {
              name: 'body',
              type: 'text',
              nullable: false,
              defaultValue: 'pending',
            },
          },
        ],
      },
    ]);
    expect(altered.join('\n')).toContain(
      "modify `body` text not null default ('pending')",
    );
  });

  it('compiles named SQLite primary constraints without object option artifacts', async () => {
    const adapter = new KnexSchemaAdapter(createClient());

    const sql = await adapter.compile([
      {
        type: 'createTable',
        table: {
          name: 'jobs',
          columns: [{ name: 'email', type: 'string' }],
          indexes: [],
          constraints: [
            {
              type: 'primary',
              columns: ['email'],
              name: 'jobs_primary_key',
            },
          ],
        },
      },
    ]);

    const output = sql.join('\n');
    expect(output).toContain(
      'constraint `jobs_primary_key` primary key (`email`)',
    );
    expect(output).not.toContain('constraintName');
  });

  it('compiles idempotent create and drop table operations', async () => {
    const adapter = new KnexSchemaAdapter(createClient());

    const sql = await adapter.compile([
      {
        type: 'createTable',
        ifNotExists: true,
        table: {
          name: 'app_settings',
          columns: [{ name: 'id', type: 'integer', autoIncrement: true }],
          indexes: [],
          constraints: [],
        },
      },
      {
        type: 'dropTable',
        tableName: 'app_settings',
        ifExists: true,
      },
    ]);

    const output = sql.join('\n').toLowerCase();
    expect(output).toContain('create table if not exists');
    expect(output).toContain('drop table if exists');
  });

  it('compiles standard alter table operations for PostgreSQL', async () => {
    const adapter = new KnexSchemaAdapter(createClient('pg'));

    const sql = await adapter.compile([
      {
        type: 'alterTable',
        tableName: 'orders',
        operations: [
          {
            type: 'dropColumn',
            column: 'legacy_status',
          },
          {
            type: 'addConstraint',
            constraint: {
              type: 'foreignKey',
              columns: ['customer_id'],
              name: 'fk_orders_customer_id',
              references: {
                table: 'customers',
                columns: ['id'],
              },
              onDelete: 'cascade',
              onUpdate: 'restrict',
            },
          },
          {
            type: 'dropConstraint',
            name: 'fk_orders_customer_id',
          },
        ],
      },
    ]);

    const output = sql.join('\n');
    expect(output).toContain(
      'alter table "orders" drop column "legacy_status"',
    );
    expect(output).toContain(
      'foreign key ("customer_id") references "customers" ("id")',
    );
    expect(output).toContain('on update RESTRICT on delete CASCADE');
    expect(output).toContain(
      'alter table "orders" drop constraint "fk_orders_customer_id"',
    );
  });

  it('returns an empty SQL list for adapter commands without sql payloads', async () => {
    const adapter = new KnexSchemaAdapter(createClient());
    await expect(adapter.compile([])).resolves.toEqual([]);
  });
});
