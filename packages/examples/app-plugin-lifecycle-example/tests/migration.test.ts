// The migration against a real database: up creates the example records and
// the lifecycle log with their metadata, and down removes all of them.
import { describeMigration } from '@nocobase/app-testing/server';
import type { DatabaseConnection } from '@nocobase/db';
import { expect } from 'vitest';

import { migrations } from './fixtures.js';

const COLLECTIONS = [
  'lifecycleExampleTickets',
  'lifecycleExampleExpenses',
  'lifecycleExampleTransitions',
  'lifecycleExampleEffectRuns',
];

const TRANSITIONS = 'lifecycleExampleTransitions';

/**
 * Writes log entries for one record as the lifecycle store does: the request
 * id as the caller sent it, and a request key that is never null.
 */
async function expectRequestKeysUnique(
  connection: DatabaseConnection,
): Promise<void> {
  const log = connection.repository(TRANSITIONS);
  const entry = (
    version: number,
    requestId: string | null,
    requestKey: string,
  ) => ({
    values: {
      lifecycle: 'expenses',
      recordId: '1',
      transition: 'submit',
      from: 'draft',
      to: 'awaitingManager',
      actorId: 'lin',
      input: {},
      at: new Date(Date.UTC(2026, 9, 1, 9, version)).toISOString(),
      version,
      requestId,
      requestKey,
    },
  });
  // Two transitions without a request id, and one with: keys differ, so all fit.
  await log.createOne(entry(1, null, '$v:1'));
  await log.createOne(entry(2, null, '$v:2'));
  await log.createOne(entry(3, 'click-1', 'click-1'));
  // The same key on the same record is the same request, and is refused.
  await expect(log.createOne(entry(4, 'click-1', 'click-1'))).rejects.toThrow();
  // The same key on another record is another request.
  await log.createOne({
    values: { ...entry(4, 'click-1', 'click-1').values, recordId: '2' },
  });
  expect(await log.count({ filter: { recordId: '1' } })).toBe(3);
}

describeMigration('202610010001_lifecycle_example_create_collections', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).toExist();
    for (const name of ['lifecycleExampleTickets', 'lifecycleExampleExpenses'])
      await expectCollection(name).toHaveField('lifecycleVersion', {
        nullable: false,
      });
    await expectCollection(TRANSITIONS).toHaveIndex(
      ['lifecycle', 'recordId', 'version'],
      { unique: true },
    );
    await expectCollection(TRANSITIONS).toHaveField('requestKey', {
      nullable: false,
    });
    await expectCollection(TRANSITIONS).toHaveIndex(
      ['lifecycle', 'recordId', 'requestKey'],
      { unique: true },
    );
    await expectRequestKeysUnique(connection);
    await expectCollection('lifecycleExampleEffectRuns').toHaveField(
      'stayBound',
      { nullable: false },
    );
    // A continuation waiting on its run, and when the sweep tries it next:
    // both null while nothing waits, and the sweep reads the due time.
    await expectCollection('lifecycleExampleEffectRuns').toHaveField(
      'continuation',
      {
        nullable: true,
      },
    );
    await expectCollection('lifecycleExampleEffectRuns').toHaveField(
      'continuationDueAt',
      {
        nullable: true,
      },
    );
    await expectCollection('lifecycleExampleEffectRuns').toHaveIndex([
      'continuationDueAt',
    ]);
    // When the sweep gave up on it: null unless it did.
    await expectCollection('lifecycleExampleEffectRuns').toHaveField(
      'continuationAbandonedAt',
      {
        nullable: true,
      },
    );
    await expectCollection('lifecycleExampleEffectRuns').toHaveIndex([
      'continuationAbandonedAt',
    ]);
  },
  down: async ({ expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).not.toExist();
  },
});

const FLOW_COLLECTIONS = [
  'lifecycleExampleOrders',
  'lifecycleExampleExports',
  'lifecycleExamplePurchases',
  'lifecycleExampleFulfilments',
  'lifecycleExampleSubscriptions',
];

describeMigration('202610090001_lifecycle_example_create_durable_flows', {
  sources: migrations,
  up: async ({ connection, expectCollection }) => {
    for (const name of FLOW_COLLECTIONS) {
      await expectCollection(name).toExist();
      await expectCollection(name).toHaveField('lifecycleVersion', {
        nullable: false,
      });
      // What the trigger sweep reads.
      await expectCollection(name).toHaveIndex(['status', 'statusChangedAt']);
    }
    // What the renewal sweep reads.
    await expectCollection('lifecycleExampleSubscriptions').toHaveIndex([
      'status',
      'currentPeriodEnd',
    ]);
    // A simulated system's object is found by its kind and key, once.
    await expectCollection('lifecycleExampleSandboxObjects').toHaveIndex(
      ['kind', 'key'],
      { unique: true },
    );
    const objects = connection.repository('lifecycleExampleSandboxObjects');
    const object = {
      values: {
        kind: 'checkout',
        key: 'cs_1',
        status: 'open',
        data: {},
        version: 0,
        createdAt: '2026-10-09T09:00:00.000Z',
        updatedAt: '2026-10-09T09:00:00.000Z',
      },
    };
    await objects.createOne(object);
    await expect(objects.createOne(object)).rejects.toThrow();
    // An event is sent under one id, however often it is delivered.
    await expectCollection('lifecycleExampleWebhookEvents').toHaveIndex(
      ['eventId'],
      { unique: true },
    );
    await expectCollection('lifecycleExampleWebhookEvents').toHaveField(
      'outcome',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      ...FLOW_COLLECTIONS,
      'lifecycleExampleSandboxObjects',
      'lifecycleExampleWebhookEvents',
    ])
      await expectCollection(name).not.toExist();
  },
});
