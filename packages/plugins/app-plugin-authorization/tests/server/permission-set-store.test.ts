import revisionMigration from '../../database/migrations/202610150001_authorization_permission_set_revision.js';
import { createAuthorization } from '../helpers/authorization-fixture.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import permissionSetMigration from '../../database/migrations/202608210001_create_permission_set_tables.js';
import {
  permissionSetsPlugin,
  PermissionSetConflictError,
  PermissionSetLastAssignmentError,
} from '@nocobase/authorization/permission-sets';
import { databasePlugin } from '../../server/database/plugin.js';
import { defineDatabasePermission } from '../../server/database/builders.js';
import { DatabasePermissionSetStore } from '../../server/stores/permission-sets.js';
import { createAppAuthorization } from '../../server/authorization.js';
import type { DatabaseManager } from '@nocobase/db';
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
    await revisionMigration.up(migrationContext(database.connection()));
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it('reads only requested permission sets in one query, also inside a transaction', async () => {
    const conn = database.connection();
    const store = new DatabasePermissionSetStore(() => conn);
    await store.create({ key: 'batch-one', grants: [] });
    await store.create({ key: 'batch-two', grants: [] });
    const client = await conn.client<import('knex').Knex>();
    const statements: string[] = [];
    const capture = (query: { sql: string }) => statements.push(query.sql);
    client.on('query', capture);
    try {
      expect(
        (await store.getMany(['batch-two', 'missing', 'batch-two'])).map(
          (set) => set.key,
        ),
      ).toEqual(['batch-two']);
      expect(statements).toHaveLength(1);
      expect(await store.getMany([])).toEqual([]);
      expect(statements).toHaveLength(1);
    } finally {
      client.removeListener('query', capture);
    }
    await conn.transaction(async (tx) => {
      const bound = store.withTransaction(tx) as DatabasePermissionSetStore;
      await bound.create({ key: 'batch-uncommitted', grants: [] });
      expect(
        (await bound.getMany(['batch-uncommitted'])).map((set) => set.key),
      ).toEqual(['batch-uncommitted']);
    });
  });

  it('reports a duplicate assignment as a conflict, also inside a transaction, and lets other failures through', async () => {
    const conn = database.connection();
    const store = new DatabasePermissionSetStore(() => conn);
    await store.create({ key: 'duplicate-check', grants: [] });
    const held = {
      id: 'user:carol:duplicate-check',
      subject: { type: 'user', id: 'carol' },
      permissionSet: 'duplicate-check',
    };
    await store.assign(held);
    await expect(store.assign(held)).rejects.toBeInstanceOf(
      PermissionSetConflictError,
    );
    await expect(
      store.assign({ ...held, id: 'carol-again' }),
    ).rejects.toBeInstanceOf(PermissionSetConflictError);
    // The insert fails in its own savepoint, so the caller's transaction stays usable.
    await conn.transaction(async (tx) => {
      const bound = store.withTransaction(tx);
      await expect(bound.assign(held)).rejects.toBeInstanceOf(
        PermissionSetConflictError,
      );
      expect(await bound.listAssignments('duplicate-check')).toEqual([held]);
    });
    // An id taken by another grant and a NOT NULL failure are not duplicate grants.
    const collision = await store
      .assign({ ...held, subject: { type: 'user', id: 'dave' } })
      .catch((error: unknown) => error);
    expect(collision).toBeInstanceOf(Error);
    expect(collision).not.toBeInstanceOf(PermissionSetConflictError);
    // With the grant also held, the error follows the key the database reports for the failed write: PostgreSQL
    // reports the primary key, SQLite the grant. It holds when the grant holding the id is revoked right after the
    // failure, before the error is classified.
    const reportsGrant = conn.dialect === 'sqlite';
    const daves = {
      ...held,
      id: 'user:dave:duplicate-check',
      subject: { type: 'user', id: 'dave' },
    };
    await store.assign(daves);
    let revokeIdHolder = false;
    const hooked = new Proxy(conn, {
      get(target, key) {
        if (key === 'transaction')
          return async (...args: Parameters<typeof conn.transaction>) => {
            try {
              return await target.transaction(...args);
            } catch (error) {
              if (revokeIdHolder) await store.revoke(daves.id);
              throw error;
            }
          };
        const value: unknown = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    const hookedStore = new DatabasePermissionSetStore(() => hooked);
    for (const revoked of [false, true]) {
      revokeIdHolder = revoked;
      const both = await hookedStore
        .assign({ ...held, id: daves.id })
        .catch((error: unknown) => error);
      expect(both).toBeInstanceOf(Error);
      if (reportsGrant) expect(both).toBeInstanceOf(PermissionSetConflictError);
      else expect(both).not.toBeInstanceOf(PermissionSetConflictError);
    }
    const notNull = await store
      .assign({
        id: 'broken',
        subject: { type: 'user', id: null as unknown as string },
        permissionSet: 'duplicate-check',
      })
      .catch((error: unknown) => error);
    expect(notNull).toBeInstanceOf(Error);
    expect(notNull).not.toBeInstanceOf(PermissionSetConflictError);
    expect(await store.listAssignments('duplicate-check')).toEqual([held]);
  });

  it('rejects a stale role revision atomically without losing a saved grant', async () => {
    const store = new DatabasePermissionSetStore(() => database.connection());
    const original = await store.create({ key: 'revision-check', grants: [] });
    const changed = await store.update(
      original.key,
      {
        key: original.key,
        grants: [
          {
            resource: { type: 'page', id: 'orders' },
            actions: [{ action: 'access' }],
          },
        ],
      },
      original.revision,
    );
    expect(changed.revision).not.toBe(original.revision);
    await expect(
      store.update(
        original.key,
        { key: original.key, grants: [] },
        original.revision,
      ),
    ).rejects.toThrow('changed');
    expect((await store.get(original.key))?.grants).toEqual(changed.grants);
    // Existing API clients can continue to write without a precondition.
    await expect(
      store.update(original.key, { key: original.key, grants: [] }),
    ).resolves.toMatchObject({ grants: [] });
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
