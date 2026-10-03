import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { schedulerMigrations } from './support/migrations.js';

const DEFINITION_FIELDS = {
  nextRunAt: { type: 'datetimeTz', nullable: true },
  lastRunAt: { type: 'datetimeTz', nullable: true },
  runCount: { type: 'integer', nullable: false },
  appliedLimit: { type: 'integer', nullable: true },
  lastOccurrenceId: { type: 'string', nullable: true },
} as const;

describeMigration('202609240001_scheduler_add_run_state', {
  sources: schedulerMigrations,
  before: async ({ connection }) => {
    await connection
      .repository('scheduleDefinitions')
      .createOne({ values: definitionRow('before-migration') });
  },
  up: async ({ connection, expectCollection }) => {
    for (const [name, expected] of Object.entries(DEFINITION_FIELDS)) {
      await expectCollection('scheduleDefinitions').toHaveField(name, {
        nullable: expected.nullable,
      });
    }
    await expectCollection('scheduleOccurrences').toHaveField('scheduledAt', {
      nullable: true,
    });
    await expect(
      connection.collectionMetadata
        .get('scheduleDefinitions')
        .then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: Object.fromEntries(
        Object.entries(DEFINITION_FIELDS).map(([name, { type }]) => [
          name,
          { type },
        ]),
      ),
    });
    await expect(
      connection.collectionMetadata
        .get('scheduleOccurrences')
        .then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: { scheduledAt: { type: 'datetimeTz' } },
    });

    const definitions = connection.repository('scheduleDefinitions');
    // The row written before the migration gets the defaults of the new fields.
    await expect(
      definitions.findOne({ filter: { id: 'before-migration' } }),
    ).resolves.toMatchObject({
      runCount: 0,
      nextRunAt: null,
      lastRunAt: null,
      appliedLimit: null,
      lastOccurrenceId: null,
    });

    const instant = '2026-09-24T08:00:00.000+08:00';
    await definitions.createOne({
      values: {
        ...definitionRow('after-migration'),
        nextRunAt: instant,
        lastRunAt: instant,
        runCount: 3,
        appliedLimit: 7,
        lastOccurrenceId: 'occurrence-3',
      },
    });
    await expect(
      definitions.findOne({ filter: { id: 'after-migration' } }),
    ).resolves.toMatchObject({
      nextRunAt: '2026-09-24T00:00:00.000Z',
      lastRunAt: '2026-09-24T00:00:00.000Z',
      runCount: 3,
      appliedLimit: 7,
      lastOccurrenceId: 'occurrence-3',
    });
    await definitions.deleteOne({ filter: { id: 'after-migration' } });
  },
  down: async ({ connection, expectCollection }) => {
    for (const name of Object.keys(DEFINITION_FIELDS)) {
      await expectCollection('scheduleDefinitions').not.toHaveField(name);
    }
    await expectCollection('scheduleDefinitions').toHaveField('runLimit');
    await expectCollection('scheduleOccurrences').not.toHaveField(
      'scheduledAt',
    );
    const definitions = await connection.collectionMetadata.get(
      'scheduleDefinitions',
    );
    expect(Object.keys(definitions?.document.fields ?? {})).not.toContain(
      'runCount',
    );
    const occurrences = await connection.collectionMetadata.get(
      'scheduleOccurrences',
    );
    expect(Object.keys(occurrences?.document.fields ?? {})).not.toContain(
      'scheduledAt',
    );
  },
});

function definitionRow(id: string): Record<string, unknown> {
  const now = '2026-09-24T00:00:00.000Z';
  return {
    id,
    appName: 'main',
    key: id,
    sourceType: 'code',
    title: 'Definition',
    definitionHash: 'hash',
    cron: '0 0 * * *',
    timezone: 'UTC',
    enabled: true,
    targetType: 'report',
    targetConfig: {},
    lifecycleState: 'active',
    syncStatus: 'synced',
    createdAt: now,
    updatedAt: now,
  };
}
