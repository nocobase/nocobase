// Three levels of transactions on a real database: a caller's transaction, a
// transition joining it as a savepoint, and a child created in that
// transition's onTransition as a savepoint of the savepoint. What the
// innermost level registered after commit must follow the middle level when
// it rolls back, even though the innermost level itself succeeded.
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createRepositoryLifecycleStore,
  defineEffect,
  defineLifecycle,
  LIFECYCLE_COLLECTIONS,
  LifecycleRuntime,
  type LifecycleRecord,
} from '../src/index.js';

interface Order extends LifecycleRecord {
  readonly status: 'draft' | 'submitted';
  readonly refuse: boolean;
}

interface Task extends LifecycleRecord {
  readonly status: 'open' | 'done';
  readonly orderId: string;
}

interface Services {
  readonly runtime: () => LifecycleRuntime;
  readonly assigned: string[];
}

let testDatabase: TestDatabase;
let database: DatabaseManager;

async function createTables(): Promise<void> {
  const builder = database.builder();
  for (const name of ['orders', 'tasks', 'steps'])
    await builder.createCollection(name, (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      if (name === 'orders') table.boolean('refuse').notNull().defaultTo(false);
      else if (name === 'tasks') table.string('orderId').notNull();
    });
  await builder.createCollection('notes', (table) => {
    table.bigInt('id').primary().autoIncrement().notNull();
    table.string('text').notNull();
  });
  await builder.createCollection(LIFECYCLE_COLLECTIONS.transitions, (table) => {
    table.bigInt('id').primary().autoIncrement().notNull();
    table.string('lifecycle').notNull();
    table.string('recordId').notNull();
    table.string('transition').notNull();
    table.string('from');
    table.string('to').notNull();
    table.string('actorId').notNull();
    table.json('input').notNull().defaultTo({});
    table.datetimeTz('at').notNull();
    table.integer('version').notNull();
    table.string('requestId');
    table.string('requestKey').notNull();
    table.unique(['lifecycle', 'recordId', 'version']);
    table.unique(['lifecycle', 'recordId', 'requestKey']);
  });
  await builder.createCollection(LIFECYCLE_COLLECTIONS.effectRuns, (table) => {
    table.bigInt('id').primary().autoIncrement().notNull();
    table.bigInt('transitionId').notNull();
    table.string('lifecycle').notNull();
    table.string('recordId').notNull();
    table.string('effect').notNull();
    table.boolean('stayBound').notNull();
    table.string('status').notNull();
    table.integer('attempts').notNull().defaultTo(0);
    table.integer('maxAttempts').notNull().defaultTo(1);
    table.json('result');
    table.text('error');
    table.datetimeTz('createdAt').notNull();
    table.datetimeTz('updatedAt').notNull();
    table.datetimeTz('claimedAt');
    table.datetimeTz('runAfter');
    // A continuation waiting to be tried again, and when it is due: null
    // exactly when nothing is pending, so the sweep finds the due ones.
    table.json('continuation');
    table.datetimeTz('continuationDueAt');
    // When the sweep gave up on it: null unless it did.
    table.datetimeTz('continuationAbandonedAt');
  });
}

const assign = defineEffect<{
  record: Task;
  state: Task['status'];
  services: Services;
}>({
  name: 'tasks.assign',
  run: ({ record, services }) => {
    services.assigned.push(record.orderId);
  },
});

function setup() {
  const runtime = new LifecycleRuntime({
    store: createRepositoryLifecycleStore(database),
    clock: () => new Date('2026-10-01T09:00:00.000Z'),
  });
  const services: Services = { runtime: () => runtime, assigned: [] };
  runtime.register(
    defineLifecycle<{
      record: Order;
      state: Order['status'];
      services: Services;
    }>({
      name: 'orders',
      initial: 'draft',
      states: ['draft', { name: 'submitted', final: true }],
      transitions: {
        submit: {
          from: 'draft',
          to: 'submitted',
          // The child is created first and succeeds; the order refuses after.
          onTransition: async ({ record, services, transactionHandle }) => {
            await services
              .runtime()
              .create(
                'tasks',
                { orderId: String(record.id) },
                { actor: { id: 'system' }, transaction: transactionHandle },
              );
            if (record.refuse) throw new Error('The order is refused.');
          },
        },
      },
    }),
    { services },
  );
  runtime.register(
    defineLifecycle<{
      record: Task;
      state: Task['status'];
      services: Services;
    }>({
      name: 'tasks',
      initial: 'open',
      states: ['open', { name: 'done', final: true }],
      transitions: { finish: { from: 'open', to: 'done' } },
      onEnter: { open: [assign] },
    }),
    { services },
  );
  const heard: string[] = [];
  runtime.on('completed', {}, (event) => {
    heard.push(`${event.lifecycle}.${event.transition}`);
  });
  return { runtime, services, heard };
}

async function createOrder(refuse: boolean): Promise<string> {
  const created = await database.repository('orders').createOne({
    values: {
      status: 'draft',
      statusChangedAt: '2026-10-01T08:00:00.000Z',
      refuse,
    },
  });
  return String(created.record.id);
}

/** The caller's transaction: a note of its own, then the order's transition. */
function submitInCallerTransaction(
  runtime: LifecycleRuntime,
  id: string,
): Promise<unknown> {
  return database.transaction(async (tx: DatabaseConnection) => {
    await tx.repository('notes').createOne({ values: { text: 'asked' } });
    return runtime
      .fire('orders', id, 'submit', {
        actor: { id: 'lin' },
        transaction: tx,
      })
      .then(
        () => 'submitted',
        // The caller catches the refusal and commits its own write.
        (error: unknown) => error,
      );
  });
}

beforeEach(async () => {
  // Whichever dialect the environment selects, SQLite by default.
  testDatabase = await createTestDatabase();
  database = testDatabase.database;
  await createTables();
});

afterEach(async () => {
  await testDatabase.destroy();
});

describe('savepoints three levels deep', () => {
  it('runs the child’s effect and listeners once the caller commits', async () => {
    const { runtime, services, heard } = setup();
    const id = await createOrder(false);
    expect(await submitInCallerTransaction(runtime, id)).toBe('submitted');

    expect(services.assigned).toEqual([id]);
    expect(heard.sort()).toEqual(['orders.submit', 'tasks.$create']);
    expect(await database.repository('tasks').count()).toBe(1);
  });

  it('drops the child’s effect and listeners when the middle level rolls back', async () => {
    const { runtime, services, heard } = setup();
    const id = await createOrder(true);
    expect(await submitInCallerTransaction(runtime, id)).toMatchObject({
      message: 'The order is refused.',
    });

    // The caller's own write committed.
    expect(
      (await database.repository('notes').findMany({})).map((row) => row.text),
    ).toEqual(['asked']);
    // Neither the order's transition nor the child it created survived.
    expect(
      await database.repository('orders').findOne({
        filter: { id: Number(id) },
      }),
    ).toMatchObject({ status: 'draft', lifecycleVersion: 0 });
    expect(await database.repository('tasks').count()).toBe(0);
    expect(
      await database.repository(LIFECYCLE_COLLECTIONS.transitions).count(),
    ).toBe(0);
    expect(
      await database.repository(LIFECYCLE_COLLECTIONS.effectRuns).count(),
    ).toBe(0);
    // Nothing the child registered after commit ran.
    expect(services.assigned).toEqual([]);
    expect(heard).toEqual([]);
  });
});

describe('a state hook that moves its own record on', () => {
  it('stops the transition that ran it and returns the record as it moved', async () => {
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(database),
      clock: () => new Date('2026-10-01T09:00:00.000Z'),
    });
    const ran: string[] = [];
    const entering = (state: string) =>
      defineEffect<{ record: LifecycleRecord; state: 'a' | 'b' | 'c' }>({
        name: `enter.${state}`,
        run: () => void ran.push(`effect:${state}`),
      });
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'a' | 'b' | 'c' }>({
        name: 'steps',
        initial: 'a',
        states: [
          'a',
          {
            name: 'b',
            onEnterState: async ({ tx, lifecycle, record }) => {
              ran.push('state-enter:b');
              await tx.fire(lifecycle, record.id, 'onward', {
                actor: { id: 'system' },
              });
            },
          },
          { name: 'c', final: true },
        ],
        transitions: {
          start: { from: 'a', to: 'b' },
          onward: { from: 'b', to: 'c' },
        },
        onEnterState: { b: () => void ran.push('lifecycle-enter:b') },
        onEnter: { b: [entering('b')], c: [entering('c')] },
      }),
    );
    const { record } = await runtime.create(
      'steps',
      {},
      { actor: { id: 'lin' } },
    );

    const fired = await runtime.fire('steps', record.id, 'start', {
      actor: { id: 'lin' },
    });

    expect(ran).toEqual(['state-enter:b', 'effect:c']);
    expect(fired.record).toMatchObject({ status: 'c' });
    expect(Number(fired.record.lifecycleVersion)).toBe(3);
    expect(fired.entry).toMatchObject({ from: 'a', to: 'b', version: 2 });
    expect(fired.effectRuns).toEqual([]);
    const history = await runtime.history('steps', record.id);
    expect(history.transitions.map((entry) => [entry.from, entry.to])).toEqual([
      [null, 'a'],
      ['a', 'b'],
      ['b', 'c'],
    ]);
    expect(history.effectRuns.map((run) => run.effect)).toEqual(['enter.c']);
  });

  it('carries on when a hook only advances the version, as a fence does', async () => {
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(database),
      clock: () => new Date('2026-10-01T09:00:00.000Z'),
    });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'a' | 'b' | 'c' }>({
        name: 'steps',
        initial: 'a',
        states: ['a', 'b', { name: 'c', final: true }],
        transitions: {
          start: { from: 'a', to: 'b' },
          onward: { from: 'b', to: 'c' },
        },
        onEnterState: {
          b: [
            async ({ tx, record }) => {
              await (tx.handle as DatabaseConnection)
                .repository('steps')
                .updateMany({
                  filter: { id: Number(record.id) },
                  values: {
                    lifecycleVersion: Number(record.lifecycleVersion) + 1,
                  },
                });
              ran.push('fence');
            },
            () => void ran.push('second'),
          ],
        },
        onEnter: {
          b: [
            defineEffect({
              name: 'enter.b',
              run: () => void ran.push('effect:b'),
            }),
          ],
        },
      }),
    );
    const { record } = await runtime.create(
      'steps',
      {},
      { actor: { id: 'lin' } },
    );

    const fired = await runtime.fire('steps', record.id, 'start', {
      actor: { id: 'lin' },
    });

    expect(ran).toEqual(['fence', 'second', 'effect:b']);
    expect(fired.record).toMatchObject({ status: 'b' });
    expect(fired.effectRuns.map((run) => run.effect)).toEqual(['enter.b']);
    const stored = await database
      .repository('steps')
      .findOne({ filter: { id: Number(record.id) } });
    expect(Number(stored?.lifecycleVersion)).toBe(3);
  });
});
