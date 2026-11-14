import path from 'node:path';
import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { parameterIdentity } from '@nocobase/lifecycle';
import { expect, it } from 'vitest';
import { migrations } from './fixtures.js';

const before = '202611130002_lifecycle_example_definition_binding';
const at = '2026-10-01T00:00:00.000Z';
const later = '2026-10-02T00:00:00.000Z';
const ticketValues = {
  notificationPrefix: 'Original',
  waitMinutes: 5,
  reopenDays: 9,
};
const expenseValues = {
  autoApproveLimit: 5000,
  financeLimit: 50000,
  escalateAfterMinutes: 3,
};
function sources(name: string) {
  const groups =
    name === 'tickets'
      ? {
          notificationPrefix: 'notificationCopy',
          waitMinutes: 'ticketTiming',
          reopenDays: 'ticketPolicy',
        }
      : {
          autoApproveLimit: 'expenseThresholds',
          financeLimit: 'expenseThresholds',
          escalateAfterMinutes: 'expenseTiming',
        };
  return Object.fromEntries(
    Object.entries(groups).map(([field, group]) => [
      field,
      { group, schemaVersion: 1, revision: 3, origin: 'configuration' },
    ]),
  );
}
async function history(
  name: 'tickets' | 'expenses' = 'tickets',
  creationUsage = true,
  snapshot = false,
) {
  const fixture = await createTestDatabase();
  const { database } = fixture;
  const owner = createMigrator({ database, sources: migrations });
  await owner.upTo(before);
  const collection =
    name === 'tickets' ? 'lifecycleExampleTickets' : 'lifecycleExampleExpenses';
  const values = name === 'tickets' ? ticketValues : expenseValues;
  const created = await database.repository(collection).createOne({
    values: {
      ...(name === 'tickets'
        ? {
            subject: 'History',
            description: 'Original creation facts',
            category: 'account',
            priority: 'high',
            requesterId: 'customer-li',
            assigneeId: 'agent-zhou',
            failNotifications: 0,
          }
        : {
            title: 'Expense',
            purpose: 'History',
            items: [],
            amountCents: 600000,
            applicantId: 'lin',
            approverId: null,
            failPayments: 0,
            parameterContract: 1,
          }),
      status: name === 'tickets' ? 'awaitingCustomer' : 'draft',
      statusChangedAt: at,
      lifecycleVersion: 1,
      lifecycleDefinition: name,
      createdAt: at,
    },
  });
  const recordId = String(Number(created.record.id));
  const entry = await database
    .repository('lifecycleExampleTransitions')
    .createOne({
      values: {
        lifecycle: name,
        recordId,
        transition: '$create',
        from: null,
        to: name === 'tickets' ? 'new' : 'draft',
        actorId: 'lin',
        input: {},
        at,
        version: 1,
        requestId: null,
        requestKey: '$v:1',
      },
    });
  const entryId = String(Number(entry.record.id));
  const payload = {
    scope: 'demo',
    lifecycle: name,
    recordId,
    revision: 3,
    at,
    values,
    sources: sources(name),
  };
  const snapshotId = parameterIdentity('demo', name, recordId);
  if (snapshot)
    await database
      .repository('lifecycleExampleParameterSnapshots')
      .createOne({ values: { id: snapshotId, payload } });
  const usageId = parameterIdentity(name, 'transition', entryId, 0);
  if (creationUsage)
    await database.repository('lifecycleExampleParameterUsages').createOne({
      values: {
        id: usageId,
        recordKey: snapshotId,
        at,
        payload: {
          ...payload,
          kind: 'transition',
          associationId: entryId,
          attempt: 0,
        },
      },
    });
  // Execute the real migration without an outer transaction: a conflict must never rely on DDL rollback.
  const migrator = createMigrator({
    database,
    sources: [
      {
        packageName: 'creation-snapshot-preflight-test',
        directory: path.resolve(
          import.meta.dirname,
          'fixtures/nontransactional-snapshot',
        ),
      },
    ],
  });
  return {
    fixture,
    database,
    owner,
    migrator,
    name,
    collection,
    recordId,
    entryId,
    usageId,
    snapshotId,
    payload,
  };
}

it('preserves the exact valid historical creation snapshot, computes its state deadline and reapplies safely', async () => {
  const run = await history('tickets', false, true);
  try {
    await run.migrator.latest();
    expect(
      (
        await run.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: run.snapshotId } })
      )?.payload,
    ).toEqual(run.payload);
    const record = await run.database
      .repository(run.collection)
      .findOne({ filter: { id: Number(run.recordId) } });
    expect(new Date(record!.lifecycleDueAt as string).toISOString()).toBe(
      '2026-10-01T00:05:00.000Z',
    );
    await run.migrator.latest();
    expect(
      await run.database
        .repository('lifecycleExampleParameterSnapshots')
        .count(),
    ).toBe(1);
    await expect(run.migrator.rollback()).rejects.toThrow(/irreversible/);
  } finally {
    await run.fixture.destroy();
  }
});

it.each(['tickets', 'expenses'] as const)(
  'recovers %s only from complete creation usage, preserving actual values, revisions and timestamp',
  async (name) => {
    const run = await history(name);
    try {
      await run.migrator.latest();
      expect(
        (
          await run.database
            .repository('lifecycleExampleParameterSnapshots')
            .findOne({ filter: { id: run.snapshotId } })
        )?.payload,
      ).toEqual({
        ...run.payload,
        recoveredFrom: { transitionId: run.entryId, usageId: run.usageId },
      });
      expect(
        await run.database
          .repository('lifecycleExampleCreationRequests')
          .count(),
      ).toBe(0);
    } finally {
      await run.fixture.destroy();
    }
  },
);

it('never recovers from a second submission when first-submit history is lost, even with complete later usage', async () => {
  const run = await history('expenses', false);
  try {
    const submitted = await run.database
      .repository('lifecycleExampleTransitions')
      .createOne({
        values: {
          lifecycle: 'expenses',
          recordId: run.recordId,
          transition: 'submit',
          from: 'draft',
          to: 'awaitingManager',
          actorId: 'lin',
          input: {},
          at: later,
          version: 4,
          requestId: null,
          requestKey: '$v:4',
        },
      });
    const associationId = String(Number(submitted.record.id));
    await run.database.repository('lifecycleExampleParameterUsages').createOne({
      values: {
        id: parameterIdentity('expenses', 'transition', associationId, 0),
        recordKey: run.snapshotId,
        at: later,
        payload: {
          ...run.payload,
          at: later,
          values: { ...expenseValues, escalateAfterMinutes: 30 },
          kind: 'transition',
          associationId,
        },
      },
    });
    await expect(run.migrator.latest()).rejects.toThrow(
      'CREATION_PARAMETERS_UNRECOVERABLE',
    );
    expect(
      await run.database
        .repository('lifecycleExampleParameterSnapshots')
        .count(),
    ).toBe(0);
  } finally {
    await run.fixture.destroy();
  }
});

it('reports a submission-only historical snapshot without modifying it or pretending its timestamp is creation time', async () => {
  const run = await history('expenses', false, true);
  try {
    const submitted = { ...run.payload, at: later };
    await run.database
      .repository('lifecycleExampleParameterSnapshots')
      .updateMany({
        filter: { id: run.snapshotId },
        values: { payload: submitted },
      });
    await expect(run.migrator.latest()).rejects.toThrow(
      'LEGACY_SUBMISSION_SNAPSHOT',
    );
    expect(
      (
        await run.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: run.snapshotId } })
      )?.payload,
    ).toEqual(submitted);
    expect(
      await run.database
        .connection()
        .collections.get('lifecycleExampleCreationRequests'),
    ).toBeUndefined();
  } finally {
    await run.fixture.destroy();
  }
});

it('reports a submission freeze time even when creation values agree, without relabeling its provenance', async () => {
  const run = await history('expenses', true, true);
  try {
    const submitted = { ...run.payload, at: later };
    await run.database
      .repository('lifecycleExampleParameterSnapshots')
      .updateMany({
        filter: { id: run.snapshotId },
        values: { payload: submitted },
      });
    await expect(run.migrator.latest()).rejects.toThrow(
      'LEGACY_SUBMISSION_SNAPSHOT',
    );
    expect(
      (
        await run.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: run.snapshotId } })
      )?.payload,
    ).toEqual(submitted);
  } finally {
    await run.fixture.destroy();
  }
});

it('reports conflicting creation and submission values and preserves both evidence sources', async () => {
  const run = await history('expenses', true, true);
  try {
    const submitted = {
      ...run.payload,
      at: later,
      values: { ...expenseValues, escalateAfterMinutes: 30 },
    };
    await run.database
      .repository('lifecycleExampleParameterSnapshots')
      .updateMany({
        filter: { id: run.snapshotId },
        values: { payload: submitted },
      });
    await expect(run.migrator.latest()).rejects.toThrow(
      'SNAPSHOT_CREATION_CONFLICT',
    );
    expect(
      (
        await run.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: run.snapshotId } })
      )?.payload,
    ).toEqual(submitted);
  } finally {
    await run.fixture.destroy();
  }
});

it.each([
  'identity',
  'revision',
  'at',
  'values',
  'sources',
  'schemaVersion',
  'group',
  'sourceRevision',
  'origin',
  'unknownSource',
  'nonIsoTime',
  'recovery',
])(
  'preflights invalid complete snapshot %s before configuration or schema writes',
  async (field) => {
    const run = await history('tickets', true, true);
    try {
      const payload = structuredClone(run.payload) as unknown as Record<
        string,
        unknown
      >;
      const source = payload.sources as Record<string, Record<string, unknown>>;
      if (field === 'nonIsoTime') payload.at = 'January 1, 2026';
      else if (field === 'recovery')
        payload.recoveredFrom = { transitionId: 12 };
      else if (field === 'identity') payload.recordId = 'other';
      else if (field === 'revision') payload.revision = -1;
      else if (field === 'at') payload.at = 'invalid';
      else if (field === 'values')
        payload.values = { ...ticketValues, waitMinutes: 'wrong' };
      else if (field === 'sources') payload.sources = {};
      else if (field === 'unknownSource')
        source.extra = { ...source.waitMinutes };
      else
        source.waitMinutes[field === 'sourceRevision' ? 'revision' : field] =
          field === 'schemaVersion'
            ? 2
            : field === 'sourceRevision'
              ? -1
              : 'wrong';
      await run.database
        .repository('lifecycleExampleParameterSnapshots')
        .updateMany({ filter: { id: run.snapshotId }, values: { payload } });
      const config = run.database.repository(
        'lifecycleExampleWorkflowParameters',
      );
      const prior = await config.findOne({
        filter: { id: 'lifecycle.expenses' },
      });
      const schema = await run.database
        .connection()
        .collections.getPhysical(run.collection);
      await expect(run.migrator.latest()).rejects.toThrow(
        'PARAMETER_SNAPSHOT_INVALID',
      );
      run.database.connection().collections.invalidate();
      expect(
        await run.database.connection().collections.getPhysical(run.collection),
      ).toEqual(schema);
      expect(
        await config.findOne({ filter: { id: 'lifecycle.expenses' } }),
      ).toEqual(prior);
      expect(
        await run.database
          .connection()
          .collections.get('lifecycleExampleCreationRequests'),
      ).toBeUndefined();
    } finally {
      await run.fixture.destroy();
    }
  },
);

it('collects configuration and history conflicts, then succeeds after repairing data and reapplying', async () => {
  const run = await history('tickets', false);
  try {
    const config = run.database.repository(
      'lifecycleExampleWorkflowParameters',
    );
    await config.updateMany({
      filter: { id: 'lifecycle.orders' },
      values: { revision: 1, values: { paymentWindowMinutes: -1 } },
    });
    const failure = await run.migrator
      .latest()
      .catch((error: unknown) => error);
    expect(String(failure)).toContain('configuration');
    expect(String(failure)).toContain('CREATION_PARAMETERS_UNRECOVERABLE');
    await config.updateMany({
      filter: { id: 'lifecycle.orders' },
      values: { revision: 1, values: { paymentWindowMinutes: 3 } },
    });
    await run.database.repository('lifecycleExampleParameterUsages').createOne({
      values: {
        id: run.usageId,
        recordKey: run.snapshotId,
        at,
        payload: {
          ...run.payload,
          kind: 'transition',
          associationId: run.entryId,
          attempt: 0,
        },
      },
    });
    await run.migrator.latest();
    await run.migrator.latest();
    expect(
      await run.database
        .repository('lifecycleExampleParameterSnapshots')
        .count(),
    ).toBe(1);
  } finally {
    await run.fixture.destroy();
  }
});

it('recovers creation usage written after its associated entry and preserves the real usage timestamp', async () => {
  const run = await history('expenses');
  try {
    const usageAt = '2026-10-01T00:00:00.013Z';
    await run.database
      .repository('lifecycleExampleParameterUsages')
      .updateMany({
        filter: { id: run.usageId },
        values: {
          at: usageAt,
          payload: {
            ...run.payload,
            at: usageAt,
            kind: 'transition',
            associationId: run.entryId,
            attempt: 0,
          },
        },
      });
    await run.migrator.latest();
    expect(
      (
        await run.database
          .repository('lifecycleExampleParameterSnapshots')
          .findOne({ filter: { id: run.snapshotId } })
      )?.payload,
    ).toMatchObject({
      at: usageAt,
      values: expenseValues,
      recoveredFrom: { transitionId: run.entryId, usageId: run.usageId },
    });
  } finally {
    await run.fixture.destroy();
  }
});
