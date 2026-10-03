import { createDatabaseManager, rawRows } from '@nocobase/db';
import type { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../../src/index.js';
import {
  mysqlTestConnection,
  testDatabaseProvisioner,
} from '../../src/testing.js';

describe('MySQL test database provisioner', () => {
  it('isolates a test database in its own database and drops it', async () => {
    const name = `nbt_provisioner_${process.pid}`;
    const provisioned = await testDatabaseProvisioner.provision({
      name,
      env: process.env,
    });
    const database = createDatabaseManager({
      connections: { main: provisioned.connection },
    });
    try {
      const connection = database.connection();
      await connection.builder.createCollection('provisionedItems', (c) => {
        c.string('id', { primaryKey: true, nullable: false });
      });
      await connection
        .repository('provisionedItems')
        .createOne({ values: { id: 'one' } });
      const page = await connection.schemaInspector.listPhysicalCollections({
        tableNamePrefixes: ['provisioned_items'],
      });
      expect(page.items.map((item) => item.schema)).toEqual([name]);
      await expect(
        testDatabaseProvisioner.listProvisioned?.({
          prefix: 'nbt_provisioner_',
          env: process.env,
        }),
      ).resolves.toContain(name);
    } finally {
      await database.destroy();
      await provisioned.drop();
    }
    await expect(databaseExists(name)).resolves.toBe(false);
  });

  it('lists and drops a database another run left behind', async () => {
    const name = `nbt_provisioner_stale_${process.pid}`;
    const provisioned = await testDatabaseProvisioner.provision({
      name,
      env: process.env,
    });
    // Removed the way a later run removes a leftover, before the run that created it drops it itself.
    await testDatabaseProvisioner.dropProvisioned?.({ name, env: process.env });
    await expect(
      testDatabaseProvisioner.listProvisioned?.({
        prefix: 'nbt_provisioner_stale_',
        env: process.env,
      }),
    ).resolves.not.toContain(name);
    await provisioned.drop();
  });
});

async function databaseExists(name: string): Promise<boolean> {
  const admin = createDatabaseManager({
    connections: { main: mysql(mysqlTestConnection(process.env)) },
  });
  try {
    const client = await admin.connection().client<Knex>();
    const rows = rawRows<{ found: number }>(
      await client.raw(
        'select 1 as found from information_schema.schemata where schema_name = ?',
        [name],
      ),
    );
    return rows.length > 0;
  } finally {
    await admin.destroy();
  }
}
