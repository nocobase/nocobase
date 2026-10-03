import { fileURLToPath } from 'node:url';

import { validateMigrations, validateSeeds } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import { schedulerMigrations } from './support/migrations.js';

const COLLECTIONS = [
  'scheduleSyncLocks',
  'scheduleDefinitions',
  'scheduleOccurrences',
] as const;

// The queue's tables belong to @nocobase/jobs; this plugin must not create them.
const QUEUE_COLLECTIONS = ['queueJobs', 'queueSchedules'] as const;

describe('@nocobase/app-plugin-scheduler database', () => {
  it('provides the scheduler schema migrations and no seeds', async () => {
    const migrationsDirectory = fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    );
    const seedsDirectory = fileURLToPath(
      new URL('../database/seeds', import.meta.url),
    );

    await expect(validateMigrations(migrationsDirectory)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '202609020001_scheduler_create_definitions',
        }),
      ]),
    );
    await expect(validateSeeds(seedsDirectory)).resolves.toEqual([]);
  });
});

describeMigration('202609020001_scheduler_create_definitions', {
  sources: schedulerMigrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).toExist();
    for (const name of QUEUE_COLLECTIONS) {
      await expectCollection(name).not.toExist();
      await expect(
        connection.collectionMetadata.get(name),
      ).resolves.toBeUndefined();
    }
    await expectCollection('scheduleDefinitions').toHaveIndex(
      ['appName', 'key'],
      { unique: true },
    );
    await expectCollection('scheduleOccurrences').toHaveForeignKey(
      ['scheduleId'],
      'scheduleDefinitions',
      { referencedFields: ['id'], onDelete: 'restrict' },
    );
    await expectCollection('scheduleOccurrences').toHaveIndex([
      'targetReferenceType',
      'targetReferenceId',
    ]);

    for (const [name, fields] of Object.entries({
      scheduleSyncLocks: ['createdAt', 'updatedAt'],
      scheduleDefinitions: [
        'fromDate',
        'toDate',
        'deactivatedAt',
        'createdAt',
        'updatedAt',
      ],
      scheduleOccurrences: [
        'startedAt',
        'lastStartedAt',
        'acceptedAt',
        'lastObservedAt',
        'observationDeadlineAt',
        'finishedAt',
        'createdAt',
        'updatedAt',
      ],
    })) {
      await expect(
        connection.collectionMetadata.get(name),
      ).resolves.toMatchObject({
        document: {
          fields: Object.fromEntries(
            fields.map((field) => [field, { type: 'datetimeTz' }]),
          ),
        },
      });
    }
    await expect(
      connection.collectionMetadata
        .get('scheduleOccurrences')
        .then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: {
        executionCount: { type: 'integer' },
        targetReferenceType: { type: 'string' },
        targetReferenceId: { type: 'string' },
        resultSummary: { type: 'json' },
      },
      relations: {
        schedule: { target: 'scheduleDefinitions' },
      },
    });

    const instant = '2026-09-17T08:00:00.123+08:00';
    const locks = connection.repository('scheduleSyncLocks');
    await locks.createOne({
      values: {
        appName: 'timezone-test',
        createdAt: instant,
        updatedAt: instant,
      },
    });
    await expect(
      locks.findOne({ filter: { appName: 'timezone-test' } }),
    ).resolves.toMatchObject({
      createdAt: '2026-09-17T00:00:00.123Z',
      updatedAt: '2026-09-17T00:00:00.123Z',
    });
  },
  down: async ({ connection, expectCollection }) => {
    for (const name of [...COLLECTIONS, ...QUEUE_COLLECTIONS]) {
      await expectCollection(name).not.toExist();
      await expect(
        connection.collectionMetadata.get(name),
      ).resolves.toBeUndefined();
    }
  },
});
