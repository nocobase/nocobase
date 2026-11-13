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

it('rejects an initial-state record whose creation survives but first submit history is missing', async () => {
  const fixture = await history('missing');
  try {
    await fixture.database
      .repository('lifecycleExampleTickets')
      .deleteMany({ filter: { id: Number(fixture.recordId) } });
    await fixture.database
      .repository('lifecycleExampleTransitions')
      .deleteMany({
        filter: { lifecycle: 'tickets', recordId: fixture.recordId },
      });
    const created = await fixture.database
      .repository('lifecycleExampleExpenses')
      .createOne({
        values: {
          title: 'Lost startup history',
          purpose: '',
          items: [],
          amountCents: 0,
          applicantId: 'lin',
          approverId: null,
          failPayments: 0,
          status: 'draft',
          statusChangedAt: at,
          lifecycleVersion: 3,
          createdAt: at,
          lifecycleDefinition: 'expenses',
          parameterContract: 1,
        },
      });
    const recordId = String(Number(created.record.id));
    await fixture.database.repository('lifecycleExampleTransitions').createOne({
      values: {
        lifecycle: 'expenses',
        recordId,
        transition: '$create',
        from: null,
        to: 'draft',
        actorId: 'lin',
        input: {},
        at,
        version: 1,
        requestId: null,
        requestKey: '$v:1',
      },
    });
    await fixture.database.repository('lifecycleExampleTransitions').createOne({
      values: {
        lifecycle: 'expenses',
        recordId,
        transition: 'withdraw',
        from: 'awaitingManager',
        to: 'draft',
        actorId: 'lin',
        input: {},
        at,
        version: 3,
        requestId: null,
        requestKey: '$v:3',
      },
    });
    await expect(fixture.migrator.latest()).rejects.toThrow(
      'START_HISTORY_UNKNOWN',
    );
  } finally {
    await fixture.testDatabase.destroy();
  }
});

const firstExpenseValues = {
  autoApproveLimit: 5000,
  financeLimit: 50000,
  escalateAfterMinutes: 3,
};
const laterExpenseValues = {
  autoApproveLimit: 5000,
  financeLimit: 50000,
  escalateAfterMinutes: 30,
};

async function expenseStartHistory(options: {
  missingFirst?: boolean;
  missingCreation?: boolean;
  editGap?: boolean;
  partial?: boolean;
  corruptUsage?: boolean;
  complete?: boolean;
}) {
  const fixture = await createTestDatabase();
  const { database } = fixture;
  const migrator = createMigrator({ database, sources: migrations });
  await migrator.upTo(before);
  const startVersion = options.editGap ? 3 : 2;
  const firstAt = '2026-10-01T00:01:00.000Z';
  const laterAt = '2026-10-02T00:01:00.000Z';
  const created = await database
    .repository('lifecycleExampleExpenses')
    .createOne({
      values: {
        title: 'Repeated submission history',
        purpose: '',
        items: [],
        amountCents: 600000,
        applicantId: 'lin',
        approverId: 'chen',
        failPayments: 0,
        status: 'awaitingManager',
        statusChangedAt: laterAt,
        lifecycleVersion: startVersion + 2,
        createdAt: at,
        lifecycleDefinition: 'expenses',
        parameterContract: 1,
      },
    });
  const recordId = String(Number(created.record.id));
  const snapshotId = parameterIdentity('demo', 'expenses', recordId);
  const append = async (
    transition: string,
    version: number,
    from: string | null,
    to: string,
    time: string,
  ) => {
    const result = await database
      .repository('lifecycleExampleTransitions')
      .createOne({
        values: {
          lifecycle: 'expenses',
          recordId,
          transition,
          version,
          from,
          to,
          actorId: 'lin',
          input: {},
          at: time,
          requestId: null,
          requestKey: '$v:' + version,
        },
      });
    return String(Number(result.record.id));
  };
  if (!options.missingCreation) await append('$create', 1, null, 'draft', at);
  const firstId = options.missingFirst
    ? undefined
    : await append('submit', startVersion, 'draft', 'awaitingManager', firstAt);
  await append(
    'withdraw',
    startVersion + 1,
    'awaitingManager',
    'draft',
    laterAt,
  );
  const laterId = await append(
    'submit',
    startVersion + 2,
    'draft',
    'awaitingManager',
    laterAt,
  );
  const sources = Object.fromEntries(
    Object.keys(firstExpenseValues).map((field) => [
      field,
      {
        group:
          field === 'escalateAfterMinutes'
            ? 'expenseTiming'
            : 'expenseThresholds',
        revision: 3,
        schemaVersion: 1,
        origin: 'configuration',
      },
    ]),
  );
  for (const [associationId, effective, time] of [
    ...(firstId ? [[firstId, firstExpenseValues, firstAt] as const] : []),
    [laterId, laterExpenseValues, laterAt] as const,
  ]) {
    await database.repository('lifecycleExampleParameterUsages').createOne({
      values: {
        id: parameterIdentity('expenses', 'transition', associationId, 0),
        recordKey: parameterIdentity('demo', 'expenses', recordId),
        at: time,
        payload: {
          scope: 'demo',
          lifecycle: 'expenses',
          recordId:
            options.corruptUsage && associationId === firstId
              ? 'another-record'
              : recordId,
          kind: 'transition',
          associationId,
          attempt: 0,
          revision: 3,
          at: time,
          values: effective,
          sources,
        },
      },
    });
  }
  if (options.partial || options.complete)
    await database.repository('lifecycleExampleParameterSnapshots').createOne({
      values: {
        id: snapshotId,
        payload: {
          scope: 'demo',
          lifecycle: 'expenses',
          recordId,
          revision: 3,
          at: firstAt,
          values: options.complete
            ? firstExpenseValues
            : { autoApproveLimit: 5000 },
          sources: options.complete
            ? sources
            : { autoApproveLimit: sources.autoApproveLimit },
        },
      },
    });
  return {
    fixture,
    database,
    migrator,
    snapshotId,
    recordId,
    firstId,
    laterId,
    firstAt,
  };
}

it.each([false, true])(
  'rejects later submit usage when the first submit log is lost (partial snapshot: %s)',
  async (partial) => {
    const run = await expenseStartHistory({ missingFirst: true, partial });
    try {
      const snapshots = run.database.repository(
        'lifecycleExampleParameterSnapshots',
      );
      const original = await snapshots.findOne({
        filter: { id: run.snapshotId },
      });
      await expect(run.migrator.latest()).rejects.toThrow(
        'FIRST_START_UNPROVEN',
      );
      expect(
        await snapshots.findOne({ filter: { id: run.snapshotId } }),
      ).toEqual(original);
      await expect(run.migrator.latest()).rejects.toThrow(
        'FIRST_START_UNPROVEN',
      );
      expect(
        await snapshots.findOne({ filter: { id: run.snapshotId } }),
      ).toEqual(original);
    } finally {
      await run.fixture.destroy();
    }
  },
);

it.each([false, true])(
  'recovers only from a proven first submit and remains unchanged on repeated migration (partial snapshot: %s)',
  async (partial) => {
    const run = await expenseStartHistory({ partial });
    try {
      await run.migrator.latest();
      const snapshots = run.database.repository(
        'lifecycleExampleParameterSnapshots',
      );
      const first = await snapshots.findOne({ filter: { id: run.snapshotId } });
      expect(first?.payload).toMatchObject({
        values: firstExpenseValues,
        at: run.firstAt,
        recoveredFrom: {
          transitionId: run.firstId,
          usageId: parameterIdentity('expenses', 'transition', run.firstId!, 0),
        },
      });
      const record = await run.database
        .repository('lifecycleExampleExpenses')
        .findOne({ filter: { id: Number(run.recordId) } });
      expect(new Date(record!.lifecycleDueAt as string).toISOString()).toBe(
        '2026-10-02T00:04:00.000Z',
      );
      await run.migrator.latest();
      expect(
        (await snapshots.findOne({ filter: { id: run.snapshotId } }))?.payload,
      ).toEqual(first?.payload);
    } finally {
      await run.fixture.destroy();
    }
  },
);

it.each(['missingCreation', 'editGap'] as const)(
  'requires positive first-start evidence when history has %s',
  async (reason) => {
    const run = await expenseStartHistory({ [reason]: true });
    try {
      await expect(run.migrator.latest()).rejects.toThrow(
        'FIRST_START_UNPROVEN',
      );
    } finally {
      await run.fixture.destroy();
    }
  },
);

it('rejects a first-submit usage whose payload belongs to another record', async () => {
  const run = await expenseStartHistory({ corruptUsage: true });
  try {
    await expect(run.migrator.latest()).rejects.toThrow(
      'START_PARAMETERS_UNRECOVERABLE',
    );
  } finally {
    await run.fixture.destroy();
  }
});

it('preserves a complete snapshot even when first-submit history is missing and a later usage differs', async () => {
  const run = await expenseStartHistory({ missingFirst: true, complete: true });
  try {
    const snapshots = run.database.repository(
      'lifecycleExampleParameterSnapshots',
    );
    const original = await snapshots.findOne({
      filter: { id: run.snapshotId },
    });
    await run.migrator.latest();
    expect(
      (await snapshots.findOne({ filter: { id: run.snapshotId } }))?.payload,
    ).toEqual(original!.payload);
  } finally {
    await run.fixture.destroy();
  }
});
