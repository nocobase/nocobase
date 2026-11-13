import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { parameterIdentity } from '@nocobase/lifecycle';
import { expect, it } from 'vitest';
import { migrations } from './fixtures.js';

const target = '202611130001_lifecycle_example_start_snapshots';
const before = '202611110002_lifecycle_example_definition_binding';
const at = '2026-10-01T00:00:00.000Z';
const values = {
  notificationPrefix: 'Original',
  waitMinutes: 5,
  reopenDays: 9,
};
const sources = {
  notificationPrefix: {
    group: 'notificationCopy',
    schemaVersion: 1,
    revision: 3,
    origin: 'configuration',
  },
  waitMinutes: {
    group: 'ticketTiming',
    schemaVersion: 1,
    revision: 3,
    origin: 'configuration',
  },
  reopenDays: {
    group: 'ticketPolicy',
    schemaVersion: 1,
    revision: 3,
    origin: 'configuration',
  },
};

async function history(kind: 'complete' | 'partial' | 'later' | 'missing') {
  const testDatabase = await createTestDatabase();
  const { database } = testDatabase;
  const migrator = createMigrator({ database, sources: migrations });
  await migrator.upTo(before);
  const created = await database
    .repository('lifecycleExampleTickets')
    .createOne({
      values: {
        subject: 'History',
        description: 'Historical evidence',
        category: 'account',
        priority: 'high',
        requesterId: 'customer-li',
        assigneeId: 'agent-zhou',
        failNotifications: 0,
        status: 'awaitingCustomer',
        statusChangedAt: at,
        lifecycleVersion: 1,
        lifecycleDefinition: 'tickets',
        createdAt: at,
      },
    });
  const recordId = String(Number(created.record.id));
  const start = await database
    .repository('lifecycleExampleTransitions')
    .createOne({
      values: {
        lifecycle: 'tickets',
        recordId,
        transition: '$create',
        from: null,
        to: 'new',
        actorId: 'customer-li',
        input: {},
        at,
        version: 1,
        requestId: null,
        requestKey: '$v:1',
      },
    });
  const entryId = String(Number(start.record.id));
  const snapshotId = parameterIdentity('demo', 'tickets', recordId);
  if (kind === 'complete' || kind === 'partial')
    await database.repository('lifecycleExampleParameterSnapshots').createOne({
      values: {
        id: snapshotId,
        payload: {
          scope: 'demo',
          lifecycle: 'tickets',
          recordId,
          revision: 3,
          at,
          values: kind === 'complete' ? values : { reopenDays: 9 },
          sources:
            kind === 'complete' ? sources : { reopenDays: sources.reopenDays },
        },
      },
    });
  if (kind === 'partial' || kind === 'later') {
    const associationId = kind === 'later' ? '99999' : entryId;
    await database.repository('lifecycleExampleParameterUsages').createOne({
      values: {
        id: parameterIdentity('tickets', 'transition', associationId, 0),
        recordKey: parameterIdentity('demo', 'tickets', recordId),
        at,
        payload: {
          scope: 'demo',
          lifecycle: 'tickets',
          recordId,
          kind: 'transition',
          associationId,
          revision: 3,
          at,
          values,
          sources,
        },
      },
    });
  }
  return { testDatabase, database, migrator, snapshotId, recordId, entryId };
}

it('preserves complete historical values and computes the deadline from them; repeated upgrades retain evidence', async () => {
  const fixture = await history('complete');
  try {
    await fixture.migrator.upTo(target);
    const first = await fixture.database
      .repository('lifecycleExampleParameterSnapshots')
      .findOne({ filter: { id: fixture.snapshotId } });
    expect(first?.payload).toMatchObject({ values, at, revision: 3 });
    const record = await fixture.database
      .repository('lifecycleExampleTickets')
      .findOne({ filter: { id: Number(fixture.recordId) } });
    expect(new Date(record!.lifecycleDueAt as string).toISOString()).toBe(
      '2026-10-01T00:05:00.000Z',
    );
    await fixture.migrator.latest();
    expect(
      (
        await fixture.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: fixture.snapshotId } })
      )?.payload,
    ).toEqual(first?.payload);
    await expect(fixture.migrator.rollback()).rejects.toThrow(/irreversible/);
  } finally {
    await fixture.testDatabase.destroy();
  }
});

it('recovers missing fields only from the first start entry and retains provenance', async () => {
  const fixture = await history('partial');
  try {
    await fixture.migrator.latest();
    const snapshot = await fixture.database
      .repository('lifecycleExampleParameterSnapshots')
      .findOne({ filter: { id: fixture.snapshotId } });
    expect(snapshot?.payload).toMatchObject({
      values,
      at,
      recoveredFrom: { transitionId: fixture.entryId },
      sources: {
        waitMinutes: { origin: 'recovered' },
        reopenDays: sources.reopenDays,
      },
    });
  } finally {
    await fixture.testDatabase.destroy();
  }
});

it.each(['missing', 'later'] as const)(
  'blocks unrecoverable history (%s) with the record identity and no invented baseline',
  async (kind) => {
    const fixture = await history(kind);
    try {
      await expect(fixture.migrator.latest()).rejects.toThrow(
        'START_PARAMETERS_UNRECOVERABLE',
      );
      expect(
        await fixture.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: fixture.snapshotId } }),
      ).toBeUndefined();
    } finally {
      await fixture.testDatabase.destroy();
    }
  },
);
