// @vitest-environment node

import { resolve } from 'node:path';

import {
  createMigrator,
  validateMigrations,
  type DatabaseConnection,
  type Migrator,
  type Row,
} from '@nocobase/db';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';

import migration from '../database/migrations/202608190001_create_notification_tables.js';
import idempotencyMigration from '../database/migrations/202609080001_create_notification_idempotency.js';
import instantMigration from '../database/migrations/202609130001_notification_instant_columns.js';
import namesMigration from '../database/migrations/202609200001_notification_channel_names.js';
import singleProviderMigration from '../database/migrations/202609200003_notification_single_provider.js';
import { notificationMigrations } from './helpers/database.js';

const COLLECTIONS = [
  'notificationDispatches',
  'notificationDeliveries',
  'notificationDeliveryAttempts',
  'notificationDeliveryRetryAudits',
] as const;
const MIGRATIONS_DIRECTORY = resolve(process.cwd(), 'database/migrations');
const MIGRATION_NAMES = [
  '202608190001_create_notification_tables',
  '202609080001_create_notification_idempotency',
  '202609130001_notification_instant_columns',
  '202609200001_notification_channel_names',
  '202609200003_notification_single_provider',
] as const;

interface DispatchRow extends Row {
  readonly id: string;
  readonly sourceType: string;
  readonly idempotencyKey?: string | null;
  readonly requestFingerprint?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const test = createDatabaseTest();

describe('notification database migration', () => {
  test('creates the physical schema, indexes, constraints, and metadata', async ({
    database,
    connection,
    expectCollection,
  }) => {
    await migratorFor(database).upTo(instantMigration.name);

    for (const collection of COLLECTIONS) {
      await expectCollection(collection).toExist();
    }
    for (const [collection, field] of [
      ['notificationDeliveries', 'lastError'],
      ['notificationDeliveryAttempts', 'errorMessage'],
      ['notificationDispatches', 'idempotencyKey'],
      ['notificationDispatches', 'requestFingerprint'],
      ['notificationDeliveries', 'retryResolution'],
      ['notificationDeliveryAttempts', 'retryResolution'],
      ['notificationDeliveries', 'providerIdempotency'],
      ['notificationDeliveryRetryAudits', 'resolution'],
    ] as const) {
      await expectCollection(collection).toHaveField(field);
    }
    await expectCollection('notificationDispatches').toHaveField(
      'idempotencyKey',
      { type: 'string', length: 191, nullable: true },
    );
    await expectCollection('notificationDispatches').toHaveField(
      'requestFingerprint',
      { type: 'string', length: 80, nullable: true },
    );
    await expectCollection('notificationDeliveries').toHaveField(
      'retryResolution',
      { type: 'json', nullable: true },
    );
    await expectCollection('notificationDeliveries').toHaveField(
      'providerIdempotency',
      { type: 'json', nullable: true },
    );
    await expectCollection('notificationDeliveryAttempts').toHaveField(
      'retryResolution',
      { type: 'json', nullable: true },
    );
    const retryAudits = await expectCollection(
      'notificationDeliveryRetryAudits',
    ).toExist();
    expect(retryAudits.primaryKey).toEqual(['id']);
    for (const [field, expected] of Object.entries({
      id: { type: 'string', length: 36, nullable: false },
      deliveryId: { type: 'string', length: 36, nullable: false },
      resolution: { type: 'json', nullable: false },
      providerIdempotency: { type: 'json', nullable: true },
      createdAt: { type: 'datetimeTz', nullable: false },
    })) {
      await expectCollection('notificationDeliveryRetryAudits').toHaveField(
        field,
        expected,
      );
    }
    await expectCollection('notificationDispatches').toHaveIndex(
      ['idempotencyKey'],
      { unique: true },
    );
    await expectCollection('notificationDeliveries').toHaveIndex([
      'notificationId',
    ]);
    await expectCollection('notificationDeliveries').toHaveIndex([
      'status',
      'nextRunAt',
      'createdAt',
    ]);
    await expectCollection('notificationDeliveryAttempts').toHaveIndex(
      ['deliveryId', 'sequence'],
      { unique: true },
    );
    await expectCollection('notificationDeliveryRetryAudits').toHaveIndex([
      'deliveryId',
    ]);
    await expect(
      connection.collections.get('notificationDispatches'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'idempotencyKey',
          type: 'string',
          length: 191,
          nullable: true,
        }),
        expect.objectContaining({
          name: 'requestFingerprint',
          type: 'string',
          length: 80,
          nullable: true,
        }),
      ]),
      constraints: expect.arrayContaining([
        expect.objectContaining({
          name: 'notification_dispatch_idempotency_unique',
          type: 'unique',
          fields: ['idempotencyKey'],
        }),
      ]),
    });
    await expect(
      connection.collections.get('notificationDeliveries'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({ name: 'notificationId' }),
        expect.objectContaining({ name: 'lastError' }),
        expect.objectContaining({
          name: 'retryResolution',
          type: 'json',
          nullable: true,
        }),
        expect.objectContaining({
          name: 'providerIdempotency',
          type: 'json',
          nullable: true,
        }),
      ]),
      indexes: expect.arrayContaining([
        expect.objectContaining({
          name: 'notification_deliveries_notification_idx',
        }),
        expect.objectContaining({ name: 'notification_deliveries_ready_idx' }),
      ]),
    });
    await expect(
      connection.collections.get('notificationDeliveryAttempts'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'retryResolution',
          type: 'json',
          nullable: true,
        }),
      ]),
    });
    await expect(
      connection.collections.get('notificationDeliveryRetryAudits'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'id',
          type: 'string',
          length: 36,
          nullable: false,
        }),
        expect.objectContaining({
          name: 'deliveryId',
          type: 'string',
          length: 36,
          nullable: false,
        }),
        expect.objectContaining({
          name: 'resolution',
          type: 'json',
          nullable: false,
        }),
        expect.objectContaining({
          name: 'providerIdempotency',
          type: 'json',
          nullable: true,
        }),
        expect.objectContaining({
          name: 'createdAt',
          type: 'datetimeTz',
          nullable: false,
        }),
      ]),
      indexes: expect.arrayContaining([
        expect.objectContaining({
          name: 'notification_retry_audits_delivery_idx',
        }),
      ]),
    });
  });

  test('runs through the migration runner and records stable history', async ({
    database,
    expectCollection,
  }) => {
    const historyTable = 'notification_test_migrations';
    const lockTable = 'notification_test_migration_lock';
    const migrator = database.createMigrator({
      directory: MIGRATIONS_DIRECTORY,
      packageName: '@nocobase/app-plugin-notification',
      tableName: historyTable,
      lockTableName: lockTable,
    });
    const loaded = await validateMigrations({
      directory: MIGRATIONS_DIRECTORY,
      packageName: '@nocobase/app-plugin-notification',
    });

    expect(loaded.map(({ name }) => name)).toEqual(MIGRATION_NAMES);
    expect(loaded.map(({ checksum }) => checksum)).toEqual(
      MIGRATION_NAMES.map(() => expect.stringMatching(/^[a-f0-9]{64}$/)),
    );
    await expect(migrator.latest()).resolves.toEqual({
      batch: 1,
      executed: MIGRATION_NAMES,
      skipped: [],
      warnings: [],
    });
    await expect(migrator.latest()).resolves.toEqual({
      batch: 1,
      executed: [],
      skipped: MIGRATION_NAMES,
      warnings: [],
    });

    await expect(history(migrator)).resolves.toEqual(
      loaded.map(({ name, checksum }) => ({
        packageName: '@nocobase/app-plugin-notification',
        name,
        batch: 1,
        checksum,
      })),
    );
    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 1,
      rolledBack: [...MIGRATION_NAMES].reverse(),
      warnings: [],
    });
    for (const collection of COLLECTIONS) {
      await expectCollection(collection).not.toExist();
    }
    await expect(history(migrator)).resolves.toEqual([]);
  });

  test('reverses the incremental migrations and leaves the base schema intact', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(migration.name);
    await migrator.upTo(instantMigration.name);
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [instantMigration.name, idempotencyMigration.name],
    });

    for (const collection of COLLECTIONS.slice(0, 3)) {
      await expectCollection(collection).toExist();
    }
    await expectCollection('notificationDeliveryRetryAudits').not.toExist();
    for (const [collection, field] of [
      ['notificationDispatches', 'idempotencyKey'],
      ['notificationDispatches', 'requestFingerprint'],
      ['notificationDeliveries', 'retryResolution'],
      ['notificationDeliveries', 'providerIdempotency'],
      ['notificationDeliveryAttempts', 'retryResolution'],
    ] as const) {
      await expectCollection(collection).not.toHaveField(field);
    }
    await expect(
      connection.collections.get('notificationDispatches'),
    ).resolves.toMatchObject({
      fields: expect.not.arrayContaining([
        expect.objectContaining({ name: 'idempotencyKey' }),
      ]),
      constraints: expect.not.arrayContaining([
        expect.objectContaining({
          name: 'notification_dispatch_idempotency_unique',
        }),
      ]),
    });
  });

  test('drops the physical schema and metadata in reverse dependency order', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(instantMigration.name);
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [
        instantMigration.name,
        idempotencyMigration.name,
        migration.name,
      ],
    });

    for (const collection of COLLECTIONS) {
      await expectCollection(collection).not.toExist();
      await expect(
        connection.collections.get(collection),
      ).resolves.toBeUndefined();
    }
  });

  test('preserves legacy rows while enforcing uniqueness only for non-null idempotency keys', async ({
    database,
    connection,
    capabilities,
  }) => {
    const migrator = migratorFor(database);
    await migrator.upTo(migration.name);
    await connection.query
      .insertInto<DispatchRow>('notificationDispatches')
      .values([
        {
          id: 'notification-1',
          sourceType: 'legacy',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'notification-2',
          sourceType: 'legacy',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ])
      .execute();

    await migrator.upTo(idempotencyMigration.name);

    const rows = await connection.query
      .selectFrom<DispatchRow>('notificationDispatches')
      .select(['id', 'idempotencyKey', 'requestFingerprint'])
      .orderBy('id', 'asc')
      .execute<DispatchRow>();
    expect(rows).toEqual([
      {
        id: 'notification-1',
        idempotencyKey: null,
        requestFingerprint: null,
      },
      {
        id: 'notification-2',
        idempotencyKey: null,
        requestFingerprint: null,
      },
    ]);
    // A database with partial indexes limits the unique index to rows that
    // have a key; the others take the migration's branch without a predicate.
    await expect(idempotencyIndexPredicate(connection)).resolves.toEqual(
      capabilities.partialIndexes
        ? expect.stringMatching(/\bis not null\b/i)
        : undefined,
    );

    await connection.query
      .insertInto<DispatchRow>('notificationDispatches')
      .values({
        id: 'notification-3',
        sourceType: 'legacy',
        idempotencyKey: null,
        requestFingerprint: null,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      })
      .execute();
    const createWithKey = (id: string) =>
      connection.query
        .insertInto<DispatchRow>('notificationDispatches')
        .values({
          id,
          sourceType: 'current',
          idempotencyKey: 'business:key',
          requestFingerprint: 'v1:fingerprint',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        })
        .execute();
    await createWithKey('notification-4');
    await expect(createWithKey('notification-5')).rejects.toThrow();
  });

  test('supports the non-partial-index migration branch and its rollback', async ({
    database,
    connection,
    expectCollection,
  }) => {
    await migratorFor(database).upTo(migration.name);
    const withoutPartialIndexes = new Proxy(connection, {
      get(target, property, receiver) {
        if (property === 'capabilities') {
          return { ...target.capabilities, partialIndexes: false };
        }
        return Reflect.get(target, property, receiver);
      },
    });

    await idempotencyMigration.up({
      builder: connection.builder,
      query: connection.query,
      connection: withoutPartialIndexes,
    });
    await expectCollection('notificationDispatches').toHaveIndex(
      ['idempotencyKey'],
      { unique: true },
    );
    await expect(
      idempotencyIndexPredicate(connection),
    ).resolves.toBeUndefined();

    await idempotencyMigration.down?.({
      builder: connection.builder,
      query: connection.query,
      connection: withoutPartialIndexes,
    });
    await expectCollection('notificationDispatches').not.toHaveField(
      'idempotencyKey',
    );
  });
});

describeMigration(namesMigration.name, {
  sources: notificationMigrations,
  before: async ({ connection }) => {
    // Through the Repository so the JSON snapshots are encoded the way each dialect stores them.
    await connection.repository('notificationDeliveries').createOne({
      values: {
        id: 'legacy',
        notificationId: 'notice',
        channel: 'email',
        recipientSnapshot: {},
        messageSnapshot: {},
        providerName: 'primary',
        providerType: 'smtp',
        attemptCount: 0,
        status: 'pending',
        createdAt: '2026-09-20T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    expect(
      await connection.query
        .selectFrom('notificationDeliveries')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({
      id: 'legacy',
      channelName: 'email',
      channelType: 'email',
      providerName: 'primary',
    });
    await expectCollection('notificationDeliveries').not.toHaveField('channel');
    expect(
      (await connection.collections.get('notificationDeliveries'))?.fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'channelName', nullable: false }),
        expect.objectContaining({ name: 'channelType', nullable: false }),
      ]),
    );
  },
  down: async ({ connection, expectCollection }) => {
    expect(
      await connection.query
        .selectFrom('notificationDeliveries')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({ id: 'legacy', channel: 'email' });
    await expectCollection('notificationDeliveries').not.toHaveField(
      'channelName',
    );
  },
});

describeMigration(singleProviderMigration.name, {
  sources: notificationMigrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of [
      'notificationDeliveries',
      'notificationDeliveryAttempts',
    ]) {
      expect(
        (await connection.collections.get(name))?.fields?.some(
          (field) => field.name === 'providerName',
        ),
      ).toBe(false);
      await expectCollection(name).not.toHaveField('providerName');
    }
  },
  down: async ({ connection, expectCollection }) => {
    for (const name of [
      'notificationDeliveries',
      'notificationDeliveryAttempts',
    ]) {
      expect((await connection.collections.get(name))?.fields).toContainEqual(
        expect.objectContaining({ name: 'providerName' }),
      );
      await expectCollection(name).toHaveField('providerName', {
        nullable: false,
      });
    }
  },
});

function migratorFor(database: {
  connection(name?: string): DatabaseConnection;
}): Migrator {
  return createMigrator({ database, sources: notificationMigrations });
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

/**
 * The predicate of the physical uniqueness over `idempotencyKey`, as the
 * database reports it. A partial unique index is always reported as an index.
 * Without a predicate, the migration's `table.unique` is a unique constraint:
 * SQLite backs it with a unique index and reports it among the indexes, while
 * PostgreSQL and MySQL report it only among the constraints.
 */
async function idempotencyIndexPredicate(
  connection: DatabaseConnection,
): Promise<unknown> {
  connection.collections.invalidate('notificationDispatches');
  const resolution = await connection.collections.getResolution(
    'notificationDispatches',
  );
  const collection = resolution?.collection;
  const index = collection?.indexes?.find(
    ({ fields, db }) =>
      db?.unique === true &&
      fields?.length === 1 &&
      fields[0] === 'idempotencyKey',
  );
  if (index) {
    return index.db?.predicate;
  }
  const constraint = collection?.constraints?.find(
    (candidate) =>
      candidate.type === 'unique' &&
      candidate.fields.length === 1 &&
      candidate.fields[0] === 'idempotencyKey',
  );
  expect(
    constraint,
    'the unique index or constraint over idempotencyKey',
  ).toBeDefined();
  return constraint?.type === 'unique' ? constraint.predicate : undefined;
}
