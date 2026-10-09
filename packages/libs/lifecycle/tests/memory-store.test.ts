// What a rolled-back transaction may take with it on the memory store:
// its own writes, and nothing written outside it meanwhile.
import { describe, expect, it } from 'vitest';

import {
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleRecord,
  type LifecycleStore,
  type NewEffectRun,
} from '../src/index.js';

const queued: NewEffectRun = {
  transitionId: 't1',
  lifecycle: 'orders',
  recordId: '1',
  effect: 'orders.pay',
  status: 'queued',
  attempts: 0,
  maxAttempts: 3,
  result: null,
  error: null,
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
  claimedAt: null,
  runAfter: null,
  stayBound: true,
};

/** A promise and the function that settles it. */
function gate(): { promise: Promise<void>; open(): void } {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

describe('memory store transactions', () => {
  it('keeps a claim made outside a transaction that then rolls back', async () => {
    const store = new MemoryLifecycleStore();
    const run = await store.createEffectRun(queued);
    const started = gate();
    const claimed = gate();
    const failing = store.transaction(async (tx) => {
      await tx.createRecord('orders', { status: 'waiting' });
      started.open();
      await claimed.promise;
      throw new Error('The transaction fails after the claim.');
    });
    // A worker claims the run while the transaction is still open.
    await started.promise;
    expect(
      await store.updateEffectRun(
        run.id,
        { status: 'queued', attempts: 0 },
        {
          status: 'running',
          attempts: 1,
          claimedAt: '2026-10-01T09:00:01.000Z',
        },
      ),
    ).toBe(true);
    claimed.open();
    await expect(failing).rejects.toThrow('fails after the claim');

    expect(await store.findEffectRun(run.id)).toMatchObject({
      status: 'running',
      attempts: 1,
    });
  });

  it('undoes every write of its own, newest first', async () => {
    const store = new MemoryLifecycleStore();
    const record = store.insertRecord('orders', { status: 'waiting' });
    const run = await store.createEffectRun(queued);
    let createdId: string | number | undefined;
    await expect(
      store.transaction(async (tx) => {
        await tx.updateRecordIf(
          'orders',
          record.id,
          {
            stateField: 'status',
            state: 'waiting',
            versionField: 'lifecycleVersion',
            version: null,
          },
          { status: 'approved', lifecycleVersion: 1 },
        );
        await tx.updateRecordIf(
          'orders',
          record.id,
          {
            stateField: 'status',
            state: 'approved',
            versionField: 'lifecycleVersion',
            version: 1,
          },
          { status: 'paid', lifecycleVersion: 2 },
        );
        await tx.appendTransition({
          lifecycle: 'orders',
          recordId: String(record.id),
          transition: 'approve',
          from: 'waiting',
          to: 'approved',
          actorId: 'a',
          input: {},
          at: '2026-10-01T09:00:00.000Z',
          version: 1,
          requestId: null,
        });
        await tx.createEffectRun(queued);
        await tx.updateEffectRun(
          run.id,
          { status: 'queued' },
          { status: 'cancelled' },
        );
        createdId = (await tx.createRecord('orders', { status: 'waiting' })).id;
        throw new Error('Refused.');
      }),
    ).rejects.toThrow('Refused.');

    expect(store.record('orders', record.id)).toEqual(record);
    expect(await store.listTransitions('orders', String(record.id))).toEqual(
      [],
    );
    expect(await store.listEffectRuns({})).toEqual([run]);
    expect(store.record('orders', createdId!)).toBeUndefined();
  });

  it('puts back runs a rolled-back prune deleted', async () => {
    const store = new MemoryLifecycleStore();
    const run = await store.createEffectRun({ ...queued, status: 'succeeded' });
    await expect(
      store.transaction(async (tx) => {
        expect(
          await tx.deleteEffectRuns({
            statuses: ['succeeded'],
            updatedBefore: '2026-10-02T00:00:00.000Z',
          }),
        ).toBe(1);
        throw new Error('Refused.');
      }),
    ).rejects.toThrow('Refused.');
    expect(await store.findEffectRun(run.id)).toEqual(run);
  });

  it('keeps everything when the work succeeds', async () => {
    const store = new MemoryLifecycleStore();
    const created = await store.transaction((tx) =>
      tx.createRecord('orders', { status: 'waiting' }),
    );
    expect(store.record('orders', created.id)).toEqual(created);
  });

  it('nests a transaction within a running one, as a savepoint', async () => {
    const store = new MemoryLifecycleStore();
    const committed: string[] = [];
    await store.transaction(async (outer) => {
      await outer.createRecord('orders', { id: 'kept', status: 'waiting' });
      outer.afterCommit(() => void committed.push('outer'));
      await expect(
        store.transaction(
          async (inner) => {
            await inner.createRecord('orders', {
              id: 'undone',
              status: 'waiting',
            });
            inner.afterCommit(() => void committed.push('refused'));
            throw new Error('Refused.');
          },
          { within: outer.transactionHandle },
        ),
      ).rejects.toThrow('Refused.');
      await store.transaction(
        async (inner) => {
          await inner.createRecord('orders', {
            id: 'nested',
            status: 'waiting',
          });
          inner.afterCommit(() => void committed.push('nested'));
        },
        { within: outer.transactionHandle },
      );
      // Nothing runs before the outermost transaction commits.
      expect(committed).toEqual([]);
    });
    expect(committed).toEqual(['outer', 'nested']);
    expect(store.record('orders', 'kept')).toBeDefined();
    expect(store.record('orders', 'nested')).toBeDefined();
    expect(store.record('orders', 'undone')).toBeUndefined();
  });

  it('undoes a nested transaction that succeeded when the outer one fails', async () => {
    const store = new MemoryLifecycleStore();
    const committed: string[] = [];
    await expect(
      store.transaction(async (outer) => {
        await store.transaction(
          async (inner) => {
            await inner.createRecord('orders', {
              id: 'nested',
              status: 'waiting',
            });
            inner.afterCommit(() => void committed.push('nested'));
          },
          { within: outer.transactionHandle },
        );
        throw new Error('The outer transaction fails.');
      }),
    ).rejects.toThrow('outer transaction fails');
    expect(store.record('orders', 'nested')).toBeUndefined();
    expect(committed).toEqual([]);
  });

  it('runs commit callbacks once the next transaction may start', async () => {
    const store = new MemoryLifecycleStore();
    let inside: unknown;
    await store.transaction((tx) => {
      tx.afterCommit(async () => {
        // A callback that opens a transaction of its own does not wait forever.
        inside = await store.transaction((next) =>
          next.createRecord('orders', { status: 'waiting' }),
        );
      });
      return Promise.resolve();
    });
    expect(inside).toMatchObject({ status: 'waiting' });
  });

  it('refuses afterCommit outside a transaction, and a handle that is not its own', async () => {
    const store = new MemoryLifecycleStore();
    expect(store.transactionHandle).toBeUndefined();
    expect(() => store.afterCommit(() => undefined)).toThrow(
      /inside a transaction/,
    );
    const other = new MemoryLifecycleStore();
    await other.transaction(async (tx) => {
      await expect(
        store.transaction(() => Promise.resolve(), {
          within: tx.transactionHandle,
        }),
      ).rejects.toThrow(/one of its own running transactions/);
    });
  });

  it('puts back only the fields it wrote, keeping an edit made meanwhile', async () => {
    interface Mail extends LifecycleRecord {
      readonly status: 'open' | 'sent';
      readonly title: string;
    }
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const writing = gate();
    const edited = gate();
    runtime.register(
      defineLifecycle<{ record: Mail; state: Mail['status'] }>({
        name: 'mails',
        initial: 'open',
        states: ['open', { name: 'sent', final: true }],
        transitions: {
          send: {
            from: 'open',
            to: 'sent',
            // The record is already written when this runs.
            onTransition: async () => {
              writing.open();
              await edited.promise;
              throw new Error('The mail server refused it.');
            },
          },
        },
      }),
    );
    const { id } = store.insertRecord('mails', {
      status: 'open',
      title: 'a',
      statusChangedAt: '2026-10-01T09:00:00.000Z',
      lifecycleVersion: 0,
    });
    const sending = runtime.fire('mails', id, 'send', { actor: { id: 'lin' } });
    await writing.promise;
    expect(store.record('mails', id)).toMatchObject({
      status: 'sent',
      lifecycleVersion: 1,
    });
    // An edit form saves another field while the transition is undecided.
    store.patchRecord('mails', id, { title: 'b' });
    edited.open();
    await expect(sending).rejects.toThrow('refused it');

    expect(store.record('mails', id)).toMatchObject({
      status: 'open',
      lifecycleVersion: 0,
      title: 'b',
      statusChangedAt: '2026-10-01T09:00:00.000Z',
    });
    expect(await store.listTransitions('mails', String(id))).toEqual([]);
  });

  it('keeps a field an outside write changed too, and drops a row it inserted', async () => {
    const store = new MemoryLifecycleStore();
    const record = store.insertRecord('orders', {
      status: 'waiting',
      note: 'none',
    });
    const started = gate();
    const edited = gate();
    let insertedId: string | number | undefined;
    const failing = store.transaction(async (tx) => {
      await tx.updateRecordIf(
        'orders',
        record.id,
        {
          stateField: 'status',
          state: 'waiting',
          versionField: 'lifecycleVersion',
          version: null,
        },
        { status: 'approved', note: 'approved', lifecycleVersion: 1 },
      );
      // A row of its own, written twice: rolling back removes it.
      const inserted = await tx.createRecord('orders', { status: 'waiting' });
      insertedId = inserted.id;
      await tx.updateRecordIf(
        'orders',
        inserted.id,
        {
          stateField: 'status',
          state: 'waiting',
          versionField: 'lifecycleVersion',
          version: null,
        },
        { status: 'approved', lifecycleVersion: 1 },
      );
      started.open();
      await edited.promise;
      throw new Error('Refused.');
    });
    await started.promise;
    store.patchRecord('orders', record.id, { note: 'edited' });
    edited.open();
    await expect(failing).rejects.toThrow('Refused.');

    expect(store.record('orders', record.id)).toEqual({
      id: record.id,
      status: 'waiting',
      note: 'edited',
    });
    expect(store.record('orders', insertedId!)).toBeUndefined();
  });

  it('refuses a transaction handle once its transaction has committed or rolled back', async () => {
    const store = new MemoryLifecycleStore();
    let committed: LifecycleStore | undefined;
    await store.transaction((tx) => {
      committed = tx;
      return Promise.resolve();
    });
    let rolledBack: LifecycleStore | undefined;
    await expect(
      store.transaction((tx) => {
        rolledBack = tx;
        return Promise.reject(new Error('Refused.'));
      }),
    ).rejects.toThrow('Refused.');

    for (const ended of [committed!, rolledBack!]) {
      await expect(
        store.transaction(() => Promise.resolve(), {
          within: ended.transactionHandle,
        }),
      ).rejects.toThrow(/Transaction query already complete/);
      expect(() => ended.afterCommit(() => undefined)).toThrow(
        /Transaction query already complete/,
      );
      await expect(
        ended.createRecord('orders', { status: 'waiting' }),
      ).rejects.toThrow(/Transaction query already complete/);
      await expect(ended.findRecord('orders', 1)).rejects.toThrow(
        /Transaction query already complete/,
      );
    }
    expect(await store.listEffectRuns({})).toEqual([]);
  });

  it('refuses a nested transaction once it has ended, and afterCommit from a commit callback', async () => {
    const store = new MemoryLifecycleStore();
    let nested: LifecycleStore | undefined;
    const late: unknown[] = [];
    await store.transaction(async (outer) => {
      await store.transaction(
        (inner) => {
          nested = inner;
          return Promise.resolve();
        },
        { within: outer.transactionHandle },
      );
      await expect(
        nested!.createRecord('orders', { status: 'waiting' }),
      ).rejects.toThrow(/already complete/);
      outer.afterCommit(() => {
        try {
          outer.afterCommit(() => undefined);
        } catch (error) {
          late.push(error);
        }
      });
    });
    expect(late).toEqual([
      expect.objectContaining({
        message: expect.stringMatching(/already complete/) as unknown,
      }),
    ]);
  });

  it('refuses a lifecycle call joining a transaction that has ended', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    runtime.register(
      defineLifecycle({
        name: 'orders',
        initial: 'waiting',
        states: ['waiting', { name: 'approved', final: true }],
        transitions: { approve: { from: 'waiting', to: 'approved' } },
      }),
    );
    const completed: string[] = [];
    runtime.on('completed', {}, (event) => {
      completed.push(event.transition);
    });
    const { id } = store.insertRecord('orders', {
      status: 'waiting',
      statusChangedAt: '2026-10-01T09:00:00.000Z',
      lifecycleVersion: 0,
    });
    let ended: unknown;
    await store.transaction((tx) => {
      ended = tx.transactionHandle;
      return Promise.resolve();
    });
    await expect(
      runtime.fire('orders', id, 'approve', {
        actor: { id: 'lin' },
        transaction: ended,
      }),
    ).rejects.toThrow(/already complete/);
    expect(store.record('orders', id)).toMatchObject({ status: 'waiting' });
    expect(completed).toEqual([]);
  });
});
