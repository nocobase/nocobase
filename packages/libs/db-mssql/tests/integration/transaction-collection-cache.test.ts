import { createHash, randomBytes } from 'node:crypto';
import { createDatabaseManager } from '@nocobase/db';
import type { Knex } from 'knex';
import { expect, it } from 'vitest';
import mssql from '../../src/index.js';
import {
  mssqlTestConnection,
  testDatabaseProvisioner,
} from '../../src/testing.js';

it('reads an unrelated Collection within one second while the version row is locked', async () => {
  const name = `cache_${randomBytes(6).toString('hex')}`;
  const database = await testDatabaseProvisioner.provision({
    name,
    env: process.env,
  });
  const manager = () =>
    createDatabaseManager({
      connections: {
        main: mssql({ ...mssqlTestConnection(process.env), database: name }),
      },
    });
  const first = manager();
  const second = manager();
  const reader = first.connection();
  const writer = second.connection();
  const table = '__nocobase_collection_metadata';
  const version = `${table}_cache_${createHash('sha256').update(table).digest('hex').slice(0, 8)}`;
  try {
    const client = await reader.client<Knex>();
    const [settings] = await client.raw(
      'select is_read_committed_snapshot_on as enabled from sys.databases where name = db_name()',
    );
    expect(Number(settings.enabled)).toBe(0);
    await reader.builder.createCollection('orders', (columns) =>
      columns.increments('id'),
    );
    await reader.transaction(async (transaction) =>
      transaction.collections.get('orders'),
    );
    await writer.connect();
    const statements: string[] = [];
    client.on('query', (query: { sql: string }) => statements.push(query.sql));
    const blocker = await writer.client<Knex>();
    let reading: Promise<unknown> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await blocker.transaction(async (transaction) => {
        await transaction(version)
          .where({ id: 1 })
          .update({ version: 'locked' });
        reading = reader.transaction(async (connection) => {
          const transactionClient = await connection.client<Knex>();
          await transactionClient.raw(
            'SET TRANSACTION ISOLATION LEVEL READ COMMITTED',
          );
          expect(await connection.collections.get('orders')).toMatchObject({
            name: 'orders',
          });
          expect(await connection.repository('orders').findMany()).toEqual([]);
        });
        await Promise.race([
          reading,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(
                    'Unrelated Collection waited for the locked version row.',
                  ),
                ),
              1000,
            );
          }),
        ]);
      });
    } finally {
      clearTimeout(timer);
      await reading;
    }
    expect(statements.some((sql) => sql.includes(version))).toBe(false);
  } finally {
    await Promise.all([first.destroy(), second.destroy()]);
    await database.drop();
  }
});
