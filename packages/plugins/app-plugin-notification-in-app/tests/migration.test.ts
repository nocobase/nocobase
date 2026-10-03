// @vitest-environment node

import { resolve } from 'node:path';

import {
  createMigrator,
  validateMigrations,
  type DatabaseConnection,
  type MigrationSource,
  type Migrator,
} from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';

import { DatabaseInAppStore } from '../server/store.js';

import instantMigration from '../database/migrations/202609180001_notification_in_app_instant_columns.js';

const MIGRATIONS_DIRECTORY = resolve(process.cwd(), 'database/migrations');
const MIGRATION_NAME = '202608190002_create_notification_in_app_items' as const;
const TARGET_MIGRATION_NAME = '202609200002_notification_in_app_target';
const INSTANT_MIGRATION_NAME =
  '202609180001_notification_in_app_instant_columns';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-notification-in-app',
    directory: MIGRATIONS_DIRECTORY,
  },
];

const test = createDatabaseTest();

describe('in-app notification database migration', () => {
  test('reads existing UTC timestamps through the database inbox', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(MIGRATION_NAME);
    await connection.query
      .insertInto('notificationInAppItems')
      .values({
        id: 'legacy',
        deliveryId: 'delivery-legacy',
        notificationId: 'notification-legacy',
        userId: 'user-1',
        body: 'Test',
        // A UTC wall clock with no zone, as rows were stored before the
        // columns became instants; an ISO string with `Z` would be converted
        // to the host's wall clock on the way in.
        createdAt: '2026-09-17 12:00:00.123',
        updatedAt: '2026-09-17 12:00:00.123',
      })
      .execute();
    await migrator.latest();
    const store = new DatabaseInAppStore(database);
    await expect(store.list({ userId: 'user-1' })).resolves.toMatchObject([
      { id: 'legacy', createdAt: '2026-09-17T12:00:00.123Z' },
    ]);
    await expect(
      connection.collections.get('notificationInAppItems'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining(
        ['createdAt', 'updatedAt', 'readAt'].map((name) =>
          expect.objectContaining({ name, type: 'datetimeTz' }),
        ),
      ),
    });
    const delivered = await store.deliver({
      deliveryId: 'new-delivery',
      notificationId: 'new-notification',
      userId: 'user-1',
      message: { body: 'New message' },
      createdAt: '2026-09-18T12:00:00.456Z',
    });
    await expect(
      store.update({ id: delivered.id, userId: 'user-1', action: 'read' }),
    ).resolves.toMatchObject({ readAt: expect.stringMatching(/Z$/) });
    await expect(store.markAllRead('user-1')).resolves.toBe(1);
    await expect(store.countUnread('user-1')).resolves.toBe(0);
    await expect(store.list({ userId: 'other-user' })).resolves.toEqual([]);
    const page = await store.list({ userId: 'user-1', limit: 1 });
    await expect(
      store.list({
        userId: 'user-1',
        before: { id: page[0].id, createdAt: page[0].createdAt },
      }),
    ).resolves.toMatchObject([{ id: 'legacy' }]);
    // Only the instant migration is reverted, while the target migration after
    // it stays applied, so its `down` runs by hand; inside a transaction, as the
    // runner would run it, because PostgreSQL pins the session time zone there.
    await connection.transaction(async (transaction) => {
      await instantMigration.down?.(migrationContext(transaction));
    });
    await expect(
      connection.collections.get('notificationInAppItems'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining(
        ['createdAt', 'updatedAt', 'readAt'].map((name) =>
          expect.objectContaining({ name, type: 'datetime' }),
        ),
      ),
    });
    await expectCollection('notificationInAppItems').toHaveField('readAt');
    await expect(
      connection.repository('notificationInAppItems').count(),
    ).resolves.toBe(2);
  });

  test('adds structured targets without converting historical actionUrl values, and rolls back', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(INSTANT_MIGRATION_NAME);
    await connection.query
      .insertInto('notificationInAppItems')
      .values({
        id: 'old',
        deliveryId: 'old',
        notificationId: 'old',
        userId: 'u',
        body: 'Old',
        actionUrl: '/main/topics/123',
        createdAt: '2026-09-20T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      })
      .execute();
    await migrator.upTo(TARGET_MIGRATION_NAME);
    await expectCollection('notificationInAppItems').toHaveField('target');
    expect(
      await connection.collections.get('notificationInAppItems'),
    ).toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({ name: 'target', type: 'json' }),
      ]),
    });
    const store = new DatabaseInAppStore(database);
    const [old] = await store.list({ userId: 'u' });
    expect(old.target).toBeUndefined();
    expect(old).not.toHaveProperty('actionUrl');
    for (const target of [
      { type: 'route', path: '/topics/123?q=1#reply' },
      { type: 'url', url: 'https://example.com/main/topics/123' },
    ] as const) {
      const item = await store.deliver({
        deliveryId: target.type,
        notificationId: 'n',
        userId: 'u',
        message: { body: 'New', target },
        createdAt: '2026-09-20T00:00:00.000Z',
      });
      expect(
        (await store.list({ userId: 'u' })).find((row) => row.id === item.id)
          ?.target,
      ).toEqual(target);
      expect(
        (await store.update({ id: item.id, userId: 'u', action: 'read' }))
          ?.target,
      ).toEqual(target);
    }
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [TARGET_MIGRATION_NAME],
    });
    await expectCollection('notificationInAppItems').not.toHaveField('target');
    await expect(
      connection.repository('notificationInAppItems').count(),
    ).resolves.toBe(3);
  });

  test('creates the physical schema, indexes, constraints, and metadata', async ({
    database,
    connection,
    expectCollection,
  }) => {
    await migratorFor(database).upTo(MIGRATION_NAME);

    await expectCollection('notificationInAppItems').toExist();
    await expectCollection('notificationInAppItems').toHaveField('deliveryId');
    await expectCollection('notificationInAppItems').toHaveField('readAt');
    await expectCollection('notificationInAppItems').not.toHaveField('version');
    await expectCollection('notificationInAppItems').toHaveIndex(
      ['deliveryId'],
      { unique: true },
    );
    await expectCollection('notificationInAppItems').toHaveIndex([
      'userId',
      'readAt',
      'createdAt',
    ]);
    await expect(
      connection.collections.get('notificationInAppItems'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({ name: 'deliveryId' }),
        expect.objectContaining({ name: 'readAt' }),
      ]),
      // The migration declares a unique constraint. PostgreSQL and MySQL
      // report it only as a constraint; SQLite backs it with a unique index
      // and reports both, so the constraint is the portable place to look.
      constraints: expect.arrayContaining([
        expect.objectContaining({
          type: 'unique',
          name: 'notification_in_app_delivery_unique',
          fields: ['deliveryId'],
        }),
      ]),
      indexes: expect.arrayContaining([
        expect.objectContaining({
          name: 'notification_in_app_user_idx',
          fields: ['userId', 'readAt', 'createdAt'],
          db: expect.objectContaining({ unique: false }),
        }),
      ]),
    });

    const row = {
      id: 'item-1',
      deliveryId: 'delivery-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      body: 'Message',
      createdAt: '2026-08-31T00:00:00.000',
      updatedAt: '2026-08-31T00:00:00.000',
    };
    await database
      .query()
      .insertInto('notificationInAppItems')
      .values(row)
      .execute();
    await expect(
      database
        .query()
        .insertInto('notificationInAppItems')
        .values({ ...row, id: 'item-2' })
        .execute(),
    ).rejects.toThrow(/unique/i);
  });

  test('drops the physical schema and metadata', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(MIGRATION_NAME);
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [MIGRATION_NAME],
    });

    await expectCollection('notificationInAppItems').not.toExist();
    await expect(
      connection.collections.get('notificationInAppItems'),
    ).resolves.toBeUndefined();
  });

  test('runs through the migration runner and records stable history', async ({
    database,
    expectCollection,
  }) => {
    const historyTable = 'notification_in_app_test_migrations';
    const lockTable = 'notification_in_app_test_migration_lock';
    const migrator = database.createMigrator({
      directory: MIGRATIONS_DIRECTORY,
      packageName: '@nocobase/app-plugin-notification-in-app',
      tableName: historyTable,
      lockTableName: lockTable,
    });
    const loaded = await validateMigrations({
      directory: MIGRATIONS_DIRECTORY,
      packageName: '@nocobase/app-plugin-notification-in-app',
    });

    expect(loaded.map(({ name }) => name)).toEqual([
      MIGRATION_NAME,
      INSTANT_MIGRATION_NAME,
      TARGET_MIGRATION_NAME,
    ]);
    expect(loaded.map(({ checksum }) => checksum)).toEqual([
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    ]);
    await expect(migrator.latest()).resolves.toEqual({
      batch: 1,
      executed: [MIGRATION_NAME, INSTANT_MIGRATION_NAME, TARGET_MIGRATION_NAME],
      skipped: [],
      warnings: [],
    });
    await expect(migrator.latest()).resolves.toEqual({
      batch: 1,
      executed: [],
      skipped: [MIGRATION_NAME, INSTANT_MIGRATION_NAME, TARGET_MIGRATION_NAME],
      warnings: [],
    });

    await expect(history(migrator)).resolves.toEqual([
      {
        packageName: '@nocobase/app-plugin-notification-in-app',
        name: MIGRATION_NAME,
        batch: 1,
        checksum: loaded[0]?.checksum,
      },
      {
        packageName: '@nocobase/app-plugin-notification-in-app',
        name: INSTANT_MIGRATION_NAME,
        batch: 1,
        checksum: loaded[1]?.checksum,
      },
      {
        packageName: '@nocobase/app-plugin-notification-in-app',
        name: TARGET_MIGRATION_NAME,
        batch: 1,
        checksum: loaded[2]?.checksum,
      },
    ]);
    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 1,
      rolledBack: [
        TARGET_MIGRATION_NAME,
        INSTANT_MIGRATION_NAME,
        MIGRATION_NAME,
      ],
      warnings: [],
    });
    await expectCollection('notificationInAppItems').not.toExist();
    await expect(history(migrator)).resolves.toEqual([]);
  });
});

function migratorFor(database: {
  connection(name?: string): DatabaseConnection;
}): Migrator {
  return createMigrator({ database, sources });
}

/** The recorded history, without the columns that differ on every run. */
async function history(migrator: Migrator) {
  return (await migrator.history()).map(
    ({ packageName, name, batch, checksum }) => ({
      packageName,
      name,
      batch,
      checksum,
    }),
  );
}

function migrationContext(connection: DatabaseConnection) {
  return {
    builder: connection.builder,
    query: connection.query,
    connection,
  };
}
