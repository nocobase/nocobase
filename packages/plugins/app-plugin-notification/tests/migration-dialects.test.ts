// @vitest-environment node

import { fileURLToPath } from 'node:url';

import { createMigrator, type MigrationSource, type Row } from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';

import baseMigration from '../database/migrations/202608190001_create_notification_tables.js';
import idempotencyMigration from '../database/migrations/202609080001_create_notification_idempotency.js';
import instantMigration from '../database/migrations/202609130001_notification_instant_columns.js';
import namesMigration from '../database/migrations/202609200001_notification_channel_names.js';
import singleProviderMigration from '../database/migrations/202609200003_notification_single_provider.js';

interface DispatchRow extends Row {
  readonly id: string;
  readonly sourceType: string;
  readonly idempotencyKey?: string | null;
  readonly requestFingerprint?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-notification',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

const test = createDatabaseTest();

// The idempotency key is unique only among rows that have one. A database
// with partial indexes enforces that with one; on the others the migration
// has to reach the same result another way, so this runs on every dialect
// NOCOBASE_TEST_DB_DIALECT selects.
describe('notification migrations through the migration runner', () => {
  test('keep legacy dispatches, reject a repeated idempotency key, and roll back', async ({
    database,
    connection,
    expectCollection,
  }) => {
    const migrator = createMigrator({ database, sources });

    await expect(migrator.upTo(baseMigration.name)).resolves.toEqual({
      batch: 1,
      executed: [baseMigration.name],
      skipped: [],
      warnings: [],
    });
    await connection.query
      .insertInto<DispatchRow>('notificationDispatches')
      .values([
        legacyDispatch('notification-dialect-legacy-1'),
        legacyDispatch('notification-dialect-legacy-2'),
      ])
      .execute();

    await expect(migrator.latest()).resolves.toEqual({
      batch: 2,
      executed: [
        idempotencyMigration.name,
        instantMigration.name,
        namesMigration.name,
        singleProviderMigration.name,
      ],
      skipped: [baseMigration.name],
      warnings: [],
    });
    await expectCollection('notificationDispatches').toHaveField(
      'idempotencyKey',
      { type: 'string', length: 191, nullable: true },
    );
    await expectCollection('notificationDispatches').toHaveField(
      'requestFingerprint',
      { type: 'string', length: 80, nullable: true },
    );
    await expectCollection('notificationDeliveryRetryAudits').toHaveField(
      'id',
      { type: 'string', length: 36, nullable: false },
    );
    await expect(
      connection.collections.get('notificationDeliveryRetryAudits'),
    ).resolves.toMatchObject({
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'resolution',
          type: 'json',
          nullable: false,
        }),
      ]),
    });

    await connection.query
      .insertInto<DispatchRow>('notificationDispatches')
      .values(legacyDispatch('notification-dialect-legacy-3'))
      .execute();
    await connection.query
      .insertInto<DispatchRow>('notificationDispatches')
      .values(currentDispatch('notification-dialect-current-1'))
      .execute();
    await expect(
      connection.query
        .insertInto<DispatchRow>('notificationDispatches')
        .values(currentDispatch('notification-dialect-current-2'))
        .execute(),
    ).rejects.toThrow();

    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 2,
      rolledBack: [
        singleProviderMigration.name,
        namesMigration.name,
        instantMigration.name,
        idempotencyMigration.name,
      ],
      warnings: [],
    });
    await expectCollection('notificationDeliveryRetryAudits').not.toExist();
    for (const field of ['idempotencyKey', 'requestFingerprint']) {
      await expectCollection('notificationDispatches').not.toHaveField(field);
    }
    for (const field of ['retryResolution', 'providerIdempotency']) {
      await expectCollection('notificationDeliveries').not.toHaveField(field);
    }
    await expectCollection('notificationDeliveryAttempts').not.toHaveField(
      'retryResolution',
    );
    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 1,
      rolledBack: [baseMigration.name],
      warnings: [],
    });
  });
});

function legacyDispatch(id: string): DispatchRow {
  const createdAt = new Date('2026-09-01T00:00:00.000Z');
  return {
    id,
    sourceType: 'legacy',
    createdAt,
    updatedAt: createdAt,
  };
}

function currentDispatch(id: string): DispatchRow {
  return {
    ...legacyDispatch(id),
    sourceType: 'current',
    idempotencyKey: 'notification-dialect-business-key',
    requestFingerprint: 'v1:notification-dialect-fingerprint',
  };
}
