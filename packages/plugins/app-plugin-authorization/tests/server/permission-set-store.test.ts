import { createAuthorization } from '../helpers/authorization-fixture.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import permissionSetMigration from '../../database/migrations/202608210001_create_permission_set_tables.js';
import {
  permissionSetsPlugin,
  PermissionSetLastAssignmentError,
} from '@nocobase/authorization/permission-sets';
import { databasePlugin } from '../../server/database/plugin.js';
import { defineDatabasePermission } from '../../server/database/builders.js';
import { DatabasePermissionSetStore } from '../../server/stores/permission-sets.js';
import { createAppAuthorization } from '../../server/authorization.js';
import type { DatabaseManager } from '@nocobase/db';
import type { Knex } from 'knex';
import { writeFileSync } from 'node:fs';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { migrationContext } from '../helpers/database-fixture.js';

describe('authorization plugin database stores', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    await permissionSetMigration.up(migrationContext(database.connection()));
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it.each(['revoke', 'replace', 'mixed'] as const)(
    'retains the last administrator during concurrent %s operations',
    async (operation) => {
      const key = `concurrent-${operation}`;
      const authorization = createAuthorization({
        plugins: [
          permissionSetsPlugin({
            store: new DatabasePermissionSetStore(() => database.connection()),
            rootSet: key,
          }),
        ],
      });
      await authorization.permissionSets.create({ key, grants: [] });
      for (const id of ['alice', 'bob']) {
        await authorization.permissionSets.assign({
          id: `${key}-${id}`,
          subject: { type: 'user', id },
          permissionSet: key,
        });
      }
      const notifications: string[] = [];
      const off = authorization.onGrantsChanged(async (subject) => {
        // An independent connection read can complete only after the writer
        // commits and releases SQLite's single pooled connection.
        expect(
          await authorization.permissionSets.listAssignments(key),
        ).toHaveLength(1);
        notifications.push(subject.id);
      });
      const results = await Promise.allSettled(
        ['alice', 'bob'].map((id, index) =>
          operation === 'revoke' || (operation === 'mixed' && index === 0)
            ? authorization.permissionSets.revoke(`${key}-${id}`)
            : authorization.permissionSets.replaceSubjectAssignments({
                subject: { type: 'user', id },
                managedPermissionSets: [key],
                permissionSets: [],
              }),
        ),
      );
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.find((result) => result.status === 'rejected'),
      ).toMatchObject({
        reason: expect.any(PermissionSetLastAssignmentError),
      });
      expect(
        await authorization.permissionSets.listAssignments(key),
      ).toHaveLength(1);
      expect(notifications).toHaveLength(1);
      // The bound API notifies after its commit too, and the listener's
      // assertion is about the operations above, not about the cleanup.
      off();
      await database.connection().transaction(async (connection) => {
        await authorization.permissionSets
          .withTransaction(connection)
          .delete(key);
      });
    },
  );

  it('rolls back an assignment replacement and emits no change on failure', async () => {
    const key = 'rollback-assignment';
    const authorization = createAuthorization({
      plugins: [
        permissionSetsPlugin({
          store: new DatabasePermissionSetStore(() => database.connection()),
        }),
      ],
    });
    await authorization.permissionSets.create({ key, grants: [] });
    await authorization.permissionSets.create({
      key: `${key}-other`,
      grants: [],
    });
    await authorization.permissionSets.assign({
      id: key,
      subject: { type: 'user', id: 'alice' },
      permissionSet: key,
    });
    // Collide with the generated assignment id after the old row was deleted.
    await authorization.permissionSets.assign({
      id: `user:alice:${key}-other`,
      subject: { type: 'user', id: 'bob' },
      permissionSet: `${key}-other`,
    });
    const notifications: string[] = [];
    authorization.onGrantsChanged((subject) => {
      notifications.push(subject.id);
    });
    await expect(
      authorization.permissionSets.replaceSubjectAssignments({
        subject: { type: 'user', id: 'alice' },
        managedPermissionSets: [key, `${key}-other`],
        permissionSets: [`${key}-other`],
      }),
    ).rejects.toThrow();
    expect(
      await authorization.permissionSets.listAssignments(key),
    ).toHaveLength(1);
    expect(notifications).toEqual([]);
    await authorization.permissionSets.delete(key);
    await authorization.permissionSets.delete(`${key}-other`);
  });

  it('leaves commit and notification ownership with the caller of withTransaction', async () => {
    const key = 'outer-transaction';
    const authorization = createAuthorization({
      plugins: [
        permissionSetsPlugin({
          store: new DatabasePermissionSetStore(() => database.connection()),
        }),
      ],
    });
    await authorization.permissionSets.create({ key, grants: [] });
    await authorization.permissionSets.assign({
      id: key,
      subject: { type: 'user', id: key },
      permissionSet: key,
    });
    const notifications: string[] = [];
    authorization.onGrantsChanged((subject) => {
      notifications.push(subject.id);
    });
    await expect(
      database.connection().transaction(async (connection) => {
        const api = authorization.permissionSets.withTransaction(connection);
        await api.revoke(key);
        expect(await api.listAssignments(key)).toEqual([]);
        throw new Error('outer rollback');
      }),
    ).rejects.toThrow('outer rollback');
    expect(
      await authorization.permissionSets.listAssignments(key),
    ).toHaveLength(1);
    expect(notifications).toEqual([]);
    await authorization.permissionSets.delete(key);
  });

  it('rolls back writes made by bound replacement validation', async () => {
    const authorization = createAppAuthorization({
      database,
      connection: database.connection(),
    });
    const key = 'replacement-validation-rollback';
    await authorization.permissionSets.create({ key, grants: [] });
    await expect(
      database.transaction(async (connection) => {
        const sets = authorization.permissionSets.withTransaction(connection);
        await sets.replaceSubjectAssignments({
          subject: { type: 'user', id: 'validation-target' },
          managedPermissionSets: [key],
          permissionSets: [key],
          async beforeReplace() {
            await sets.create({ key: `${key}-temporary`, grants: [] });
            throw new Error('validation denied');
          },
        });
      }),
    ).rejects.toThrow('validation denied');
    expect(
      await authorization.permissionSets.get(`${key}-temporary`),
    ).toBeUndefined();
    expect(await authorization.permissionSets.listAssignments(key)).toEqual([]);
    await authorization.permissionSets.delete(key);
  });

  it('adds no database operations for an empty bound validation callback', async () => {
    const authorization = createAuthorization({
      plugins: [
        permissionSetsPlugin({
          store: new DatabasePermissionSetStore(() => database.connection()),
          rootSet: 'validation-cost',
        }),
      ],
    });
    await authorization.permissionSets.create({
      key: 'validation-cost',
      grants: [],
    });
    const client = await database.connection().client<Knex>();
    const counts = async (validate: boolean) => {
      const queries: string[] = [];
      const record = (query: { sql: string }) => {
        queries.push(query.sql);
      };
      client.on('query', record);
      try {
        await database.transaction(async (connection) => {
          await authorization.permissionSets
            .withTransaction(connection)
            .replaceSubjectAssignments({
              subject: { type: 'user', id: 'validation-cost-target' },
              managedPermissionSets: [],
              permissionSets: [],
              ...(validate ? { beforeReplace: async () => {} } : {}),
            });
        });
      } finally {
        client.off('query', record);
      }
      return {
        reads: queries.filter((sql) => /^select\b/i.test(sql.trim())).length,
        writes: queries.filter((sql) =>
          /^(insert|update|delete)\b/i.test(sql.trim()),
        ).length,
        locks: queries.filter((sql) =>
          /for update|^update .*authorization.*permission.*sets/i.test(
            sql.trim(),
          ),
        ).length,
        begins: queries.filter((sql) => /^begin\b/i.test(sql.trim())).length,
        commits: queries.filter((sql) => /^commit\b/i.test(sql.trim())).length,
      };
    };
    // Warm metadata resolution before comparing the same request twice.
    await counts(false);
    const baseline = await counts(false);
    const validated = await counts(true);
    expect(validated).toEqual(baseline);
    const costOutput = process.env.NOCOBASE_TEST_REPLACEMENT_COST_OUTPUT;
    if (costOutput)
      writeFileSync(
        costOutput,
        JSON.stringify(
          { dialect: database.connection().dialect, baseline, validated },
          null,
          2,
        ),
      );
    await authorization.permissionSets.delete('validation-cost');
  });

  it('persists Permission Sets independently from database access rules', async () => {
    const connection = database.connection();
    const authorization = createAuthorization({
      connection,
      plugins: [
        permissionSetsPlugin({
          store: new DatabasePermissionSetStore(() => connection),
        }),
        databasePlugin(),
      ],
    });

    await authorization.permissionSets.create({
      key: 'order-reader',
      grants: [
        defineDatabasePermission((permission) =>
          permission.collection('orders').read(['id', 'amount']),
        ).build(),
      ],
    });
    await authorization.permissionSets.assign({
      id: 'assignment-1',
      subject: { type: 'user', id: 'alice' },
      permissionSet: 'order-reader',
    });

    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'alice' },
      }),
    ).resolves.toMatchObject([
      {
        key: 'order-reader',
        grants: [
          {
            resource: {
              type: 'database.collection',
              id: 'orders',
            },
          },
        ],
      },
    ]);

    await authorization.permissionSets.update('order-reader', {
      key: 'order-viewer',
      grants: [],
    });
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'alice' },
      }),
    ).resolves.toMatchObject([{ key: 'order-viewer' }]);

    await authorization.permissionSets.delete('order-viewer');
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'alice' },
      }),
    ).resolves.toEqual([]);
  });

  it('passes the store transaction to filterActive', async () => {
    await database.connection().builder.createCollection('user', (user) => {
      user.string('id', { length: 64 }).primary();
      user.date('disabledAt', { nullable: true });
    });
    await database
      .connection()
      .query.insertInto('user')
      .values([
        { id: 'root', disabledAt: null },
        { id: 'retired', disabledAt: new Date() },
      ])
      .execute();
    const authorization = createAppAuthorization({
      connection: database.connection(),
      config: { permissionSets: { rootSet: 'active-root' } },
    });
    const received: unknown[] = [];
    authorization.subjects.add('user', {
      filterActive: async (ids, connection) => {
        received.push(connection);
        // SQLite has one pooled connection, so a read outside the
        // transaction would wait for the writer that is waiting on it.
        const rows = await (connection ?? database.connection()).query
          .selectFrom('user')
          .select(['id'])
          .where('id', 'in', [...ids])
          .where('disabledAt', 'is', null)
          .execute();
        return rows.map((row) => String(row.id));
      },
    });
    await authorization.permissionSets.create({
      key: 'active-root',
      grants: [],
    });
    for (const id of ['root', 'retired'])
      await authorization.permissionSets.assign({
        subject: { type: 'user', id },
        permissionSet: 'active-root',
      });

    // Two assignments exist, but only one of them belongs to an account that
    // can still sign in.
    await expect(
      authorization.permissionSets.revoke('user:root:active-root'),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
    await expect(
      authorization.permissionSets.revoke('user:retired:active-root'),
    ).resolves.toBeUndefined();
    expect(received.length).toBeGreaterThan(0);
    for (const connection of received) {
      expect(connection).toBeDefined();
      expect(connection).not.toBe(database.connection());
    }
  });
});
