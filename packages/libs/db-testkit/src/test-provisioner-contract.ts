import { createDatabaseManager, type DatabaseManager } from '@nocobase/db';
import type {
  ProvisionedTestDatabase,
  TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { describe, expect, it } from 'vitest';

/**
 * The behaviour `@nocobase/db-testing` relies on from a dialect's
 * `testDatabaseProvisioner`, run by each dialect's integration suite against
 * its own server: two provisioned databases do not see each other's tables,
 * the server lists what was provisioned, and both ways of dropping remove it.
 */
export function describeTestDatabaseProvisioner(
  label: string,
  provisioner: TestDatabaseProvisioner,
): void {
  const env = process.env;

  describe(`${label} test database provisioner`, () => {
    it('isolates each test database and drops it', async () => {
      const prefix = `nbt_provisioner_${process.pid}_`;
      const names = [`${prefix}a`, `${prefix}b`];
      const provisioned: ProvisionedTestDatabase[] = [];
      const databases: DatabaseManager[] = [];
      try {
        for (const name of names) {
          const database = await provisioner.provision({ name, env });
          provisioned.push(database);
          databases.push(
            createDatabaseManager({
              connections: { main: database.connection },
            }),
          );
        }
        const [first, second] = databases.map((database) =>
          database.connection(),
        );
        await first.builder.createCollection('provisionedItems', (c) => {
          c.string('id', { primaryKey: true, nullable: false });
        });
        await first
          .repository('provisionedItems')
          .createOne({ values: { id: 'one' } });
        await expect(
          first.repository('provisionedItems').count(),
        ).resolves.toBe(1);
        const tables = async (connection: typeof first) =>
          (
            await connection.schemaInspector.listPhysicalCollections({
              tableNamePrefixes: ['provisioned_items'],
            })
          ).items.length;
        await expect(tables(first)).resolves.toBe(1);
        await expect(tables(second)).resolves.toBe(0);
        // Listing is optional: a dialect whose databases do not outlive the process has nothing to list.
        if (provisioner.listProvisioned) {
          await expect(
            provisioner.listProvisioned({ prefix, env }),
          ).resolves.toEqual(expect.arrayContaining(names));
        }
      } finally {
        for (const database of databases) await database.destroy();
        for (const database of provisioned) await database.drop();
      }
      if (provisioner.listProvisioned) {
        await expect(
          provisioner.listProvisioned({ prefix, env }),
        ).resolves.toEqual([]);
      }
    });

    it('lists and drops a database another run left behind', async () => {
      const prefix = `nbt_provisioner_stale_${process.pid}_`;
      const name = `${prefix}a`;
      const provisioned = await provisioner.provision({ name, env });
      try {
        // Removed the way a later run removes a leftover, before the run that created it drops it itself.
        await provisioner.dropProvisioned?.({ name, env });
        if (provisioner.listProvisioned) {
          await expect(
            provisioner.listProvisioned({ prefix, env }),
          ).resolves.toEqual([]);
        }
      } finally {
        // Also proves that dropping an already removed database is harmless, and cleans up when an assertion
        // above failed.
        await provisioned.drop();
      }
    });
  });
}
