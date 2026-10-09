// A hook may fire its own record onward through `tx`. Once it has, the
// transition that ran the hook stops: the record has left the state it
// entered, so the hooks still to come, the effects that state owes and the
// announcements of what it allows would all describe a stay that is over.
import { describe, expect, it } from 'vitest';

import {
  CREATE_TRANSITION,
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleRecord,
  type MemoryRows,
} from '../src/index.js';

type State = 'a' | 'b' | 'c';

function setup() {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const ran: string[] = [];
  const effect = (state: State) =>
    defineEffect<{ record: LifecycleRecord; state: State }>({
      name: `enter.${state}`,
      run: () => void ran.push(`effect:${state}`),
    });
  runtime.register(
    defineLifecycle<{ record: LifecycleRecord; state: State }>({
      name: 'work',
      initial: ['a', 'b'],
      states: [
        'a',
        {
          name: 'b',
          // The state's own hook concludes the stay at once.
          onEnterState: async ({ tx, lifecycle, record }) => {
            ran.push('state-enter:b');
            await tx.fire(lifecycle, record.id, 'onward', {
              actor: { id: 'system' },
            });
          },
          onLeaveState: () => void ran.push('leave:b'),
        },
        { name: 'c', final: true },
      ],
      transitions: {
        start: { from: 'a', to: 'b' },
        onward: { from: 'b', to: 'c' },
      },
      onEnterState: {
        b: () => void ran.push('lifecycle-enter:b'),
        c: () => void ran.push('enter:c'),
      },
      onEnter: { b: [effect('b')], c: [effect('c')] },
    }),
  );
  const heard: string[] = [];
  runtime.on('completed', {}, (event) => {
    heard.push(`completed:${event.transition}:${String(event.record.status)}`);
  });
  runtime.on('entered', {}, (event) => {
    heard.push(`entered:${event.to}:${String(event.record.status)}`);
  });
  runtime.on('announce', {}, (event) => {
    heard.push(`announce:${event.next}`);
  });
  return { store, runtime, ran, heard };
}

describe('a hook that moves its own record on', () => {
  it('stops the transition that ran it', async () => {
    const { store, runtime, ran, heard } = setup();
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );
    heard.length = 0;

    const fired = await runtime.fire('work', record.id, 'start', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual(['state-enter:b', 'leave:b', 'enter:c', 'effect:c']);
    expect(fired.record).toMatchObject({ status: 'c', lifecycleVersion: 3 });
    expect(fired.entry).toMatchObject({
      transition: 'start',
      from: 'a',
      to: 'b',
      version: 2,
    });
    expect(fired.effectRuns).toEqual([]);
    expect(store.record('work', record.id)).toMatchObject({
      status: 'c',
      lifecycleVersion: 3,
    });
    const history = await runtime.history('work', record.id);
    expect(history.transitions.map((entry) => [entry.from, entry.to])).toEqual([
      [null, 'a'],
      ['a', 'b'],
      ['b', 'c'],
    ]);
    expect(history.effectRuns.map((run) => run.effect)).toEqual(['enter.c']);
    // Entering b is told as it happened, before what followed it; nothing
    // announces what b allows, because the record is no longer there.
    expect(heard).toEqual([
      'completed:start:b',
      'entered:b:b',
      'completed:onward:c',
      'entered:c:c',
    ]);
  });

  it('stops a creation whose initial state moves the record on', async () => {
    const { store, runtime, ran, heard } = setup();

    const created = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' }, state: 'b' },
    );

    expect(ran).toEqual(['state-enter:b', 'leave:b', 'enter:c', 'effect:c']);
    expect(created.record).toMatchObject({ status: 'c', lifecycleVersion: 2 });
    expect(created.entry).toMatchObject({
      transition: CREATE_TRANSITION,
      to: 'b',
      version: 1,
    });
    expect(created.effectRuns).toEqual([]);
    expect(store.record('work', created.record.id)).toMatchObject({
      status: 'c',
    });
    const history = await runtime.history('work', created.record.id);
    expect(history.transitions.map((entry) => [entry.from, entry.to])).toEqual([
      [null, 'b'],
      ['b', 'c'],
    ]);
    expect(history.effectRuns.map((run) => run.effect)).toEqual(['enter.c']);
    expect(heard).toEqual([
      'completed:$create:b',
      'entered:b:b',
      'completed:onward:c',
      'entered:c:c',
    ]);
  });

  it('carries on when a hook moves only other records', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'open' | 'done' }>({
        name: 'child',
        initial: 'open',
        states: ['open', { name: 'done', final: true }],
        transitions: { finish: { from: 'open', to: 'done' } },
      }),
    );
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: State }>({
        name: 'parent',
        initial: 'a',
        states: ['a', 'b', { name: 'c', final: true }],
        transitions: {
          start: { from: 'a', to: 'b' },
          finish: { from: 'b', to: 'c' },
        },
        onEnterState: {
          b: [
            async ({ tx }) => {
              const child = await tx.create(
                'child',
                {},
                { actor: { id: 'system' } },
              );
              await tx.fire('child', child.record.id, 'finish', {
                actor: { id: 'system' },
              });
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
      'parent',
      {},
      { actor: { id: 'person' } },
    );

    const fired = await runtime.fire('parent', record.id, 'start', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual(['second', 'effect:b']);
    expect(fired.record).toMatchObject({ status: 'b', lifecycleVersion: 2 });
    expect(fired.effectRuns).toHaveLength(1);
  });

  it("still owes the transition's own effects", async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    const effect = (name: string) =>
      defineEffect<{ record: LifecycleRecord; state: State }>({
        name,
        run: () => void ran.push(name),
      });
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: State }>({
        name: 'approval',
        initial: 'a',
        states: ['a', 'b', { name: 'c', final: true }],
        transitions: {
          // The transition happened, so what it owes is still owed even
          // though the stay it began in b is over at once.
          start: { from: 'a', to: 'b', effects: [effect('started')] },
          onward: { from: 'b', to: 'c' },
        },
        onEnterState: {
          b: async ({ tx, lifecycle, record }) => {
            await tx.fire(lifecycle, record.id, 'onward', {
              actor: { id: 'system' },
            });
          },
        },
        onEnter: { b: [effect('waiting')] },
      }),
    );
    const { record } = await runtime.create(
      'approval',
      {},
      { actor: { id: 'person' } },
    );

    const fired = await runtime.fire('approval', record.id, 'start', {
      actor: { id: 'person' },
    });

    expect(fired.record).toMatchObject({ status: 'c' });
    expect(fired.effectRuns.map((run) => run.effect)).toEqual(['started']);
    expect(ran).toEqual(['started']);
  });
});

describe('a hook that changes its record without moving it', () => {
  type Stage = 'draft' | 'review' | 'done';
  interface StageTypes {
    record: LifecycleRecord;
    state: Stage;
  }

  it('carries on when it advances the version itself, as a fence or an edit does', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<StageTypes>({
        name: 'reports',
        initial: 'draft',
        states: ['draft', 'review', { name: 'done', final: true }],
        transitions: {
          submit: { from: 'draft', to: 'review' },
          approve: { from: 'review', to: 'done' },
        },
        onEnterState: {
          review: [
            // A fence: stale answers for an earlier stay are refused by the version.
            ({ tx, record }) => {
              (tx.handle as MemoryRows).patchRecord('reports', record.id, {
                lifecycleVersion: Number(record.lifecycleVersion) + 1,
              });
              ran.push('fence');
            },
            () => void ran.push('second'),
          ],
        },
        onEnter: {
          review: [
            defineEffect<StageTypes>({
              name: 'reports.notify',
              run: () => void ran.push('effect:review'),
            }),
          ],
        },
      }),
    );
    const { record } = await runtime.create(
      'reports',
      {},
      { actor: { id: 'person' } },
    );

    const fired = await runtime.fire('reports', record.id, 'submit', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual(['fence', 'second', 'effect:review']);
    expect(fired.record).toMatchObject({ status: 'review' });
    expect(fired.effectRuns.map((run) => run.effect)).toEqual([
      'reports.notify',
    ]);
    expect(store.record('reports', record.id)).toMatchObject({
      status: 'review',
      lifecycleVersion: 3,
    });
  });

  it('carries on when it fires another lifecycle sharing the record and its version field', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'unpaid' | 'paid' }>({
        name: 'orderPayments',
        collection: 'orders',
        stateField: 'paymentStatus',
        changedAtField: 'paymentStatusChangedAt',
        versionField: 'lifecycleVersion',
        initial: 'unpaid',
        states: ['unpaid', { name: 'paid', final: true }],
        transitions: { settle: { from: 'unpaid', to: 'paid' } },
      }),
    );
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'packed' | 'shipped' }>(
        {
          name: 'orders',
          collection: 'orders',
          versionField: 'lifecycleVersion',
          initial: 'packed',
          states: ['packed', { name: 'shipped', final: true }],
          transitions: { ship: { from: 'packed', to: 'shipped' } },
          onEnterState: {
            shipped: [
              // Cash on delivery: shipping settles the payment of the same order.
              async ({ tx, record }) => {
                await tx.fire('orderPayments', record.id, 'settle', {
                  actor: { id: 'system' },
                });
                ran.push('settled');
              },
              () => void ran.push('second'),
            ],
          },
          onEnter: {
            shipped: [
              defineEffect({
                name: 'orders.track',
                run: () => void ran.push('effect:shipped'),
              }),
            ],
          },
        },
      ),
    );
    const order = store.insertRecord('orders', {
      status: 'packed',
      paymentStatus: 'unpaid',
      lifecycleVersion: 0,
    });

    const fired = await runtime.fire('orders', order.id, 'ship', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual(['settled', 'second', 'effect:shipped']);
    expect(fired.effectRuns.map((run) => run.effect)).toEqual(['orders.track']);
    expect(store.record('orders', order.id)).toMatchObject({
      status: 'shipped',
      paymentStatus: 'paid',
      lifecycleVersion: 2,
    });
  });

  it('still stops when a lifecycle call it made moved the record on further down', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'open' | 'closed' }>({
        name: 'child',
        initial: 'open',
        states: ['open', { name: 'closed', final: true }],
        transitions: { close: { from: 'open', to: 'closed' } },
        onEnterState: {
          // The child closes its parent as soon as it exists.
          open: async ({ tx, record }) => {
            await tx.fire('parent', String(record.parentId), 'onward', {
              actor: { id: 'system' },
            });
          },
        },
      }),
    );
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: State }>({
        name: 'parent',
        initial: 'a',
        states: ['a', 'b', { name: 'c', final: true }],
        transitions: {
          start: { from: 'a', to: 'b' },
          onward: { from: 'b', to: 'c' },
        },
        onEnterState: {
          b: [
            async ({ tx, record }) => {
              await tx.create(
                'child',
                { parentId: String(record.id) },
                { actor: { id: 'system' } },
              );
            },
            () => void ran.push('second'),
          ],
        },
        onEnter: {
          b: [defineEffect({ name: 'enter.b', run: () => void ran.push('b') })],
        },
      }),
    );
    const { record } = await runtime.create(
      'parent',
      {},
      { actor: { id: 'person' } },
    );

    const fired = await runtime.fire('parent', record.id, 'start', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual([]);
    expect(fired.record).toMatchObject({ status: 'c' });
    expect(fired.effectRuns).toEqual([]);
  });

  it('still stops when the hook fires its record onward through the handle rather than tx', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const ran: string[] = [];
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: State }>({
        name: 'work',
        initial: 'a',
        states: ['a', 'b', { name: 'c', final: true }],
        transitions: {
          start: {
            from: 'a',
            to: 'b',
            onTransition: async ({ record, transactionHandle }) => {
              await runtime.fire('work', record.id, 'onward', {
                actor: { id: 'system' },
                transaction: transactionHandle,
              });
            },
          },
          onward: { from: 'b', to: 'c' },
        },
        onEnterState: { b: () => void ran.push('enter:b') },
        onEnter: {
          b: [defineEffect({ name: 'enter.b', run: () => void ran.push('b') })],
        },
      }),
    );
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );

    const fired = await runtime.fire('work', record.id, 'start', {
      actor: { id: 'person' },
    });

    expect(ran).toEqual([]);
    expect(fired.record).toMatchObject({ status: 'c' });
  });
});
