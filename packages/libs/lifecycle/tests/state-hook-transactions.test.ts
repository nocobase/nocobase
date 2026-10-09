import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type LifecycleLogger,
  type LifecycleRecord,
  type MemoryRows,
  type StateHookContext,
  type TransitionHookContext,
} from '../src/index.js';

describe('state hooks on savepoints and continuations', () => {
  it('rolls back a refused continuation and its state hooks while retaining the effect outcome', async () => {
    const store = new MemoryLifecycleStore();
    const told: string[] = [];
    const runtime = new LifecycleRuntime({ store });
    const effect = defineEffect({
      name: 'complete',
      onSuccess: 'finish',
      run: () => ({ ok: true }),
    });
    runtime.register(
      defineLifecycle<{
        record: LifecycleRecord;
        state: 'draft' | 'waiting' | 'done';
      }>({
        name: 'work',
        initial: 'draft',
        states: ['draft', 'waiting', { name: 'done', final: true }],
        transitions: {
          start: { from: 'draft', to: 'waiting', effects: [effect] },
          finish: { from: 'waiting', to: 'done' },
        },
        onEnterState: {
          done: ({ tx }) => {
            (tx.handle as MemoryRows).insertRecord('tasks', {
              id: 'rolled-back',
            });
            tx.afterCommit(() => void told.push('hook'));
            throw new LifecycleError(
              'INVALID_STATE',
              'The parent is not ready.',
            );
          },
        },
      }),
    );
    runtime.on('completed', {}, (e) => void told.push(e.transition));
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );
    await runtime.fire('work', record.id, 'start', { actor: { id: 'person' } });
    expect(store.record('work', record.id)?.status).toBe('waiting');
    expect(store.records('tasks')).toEqual([]);
    const history = await runtime.history('work', record.id);
    expect(history.transitions.map((e) => e.transition)).toEqual([
      '$create',
      'start',
    ]);
    expect(history.effectRuns).toMatchObject([
      { status: 'succeeded', attempts: 1 },
    ]);
    expect(told).toEqual(['$create', 'start']);
  });

  it('does not run hooks again on replay or on a rejected human action', async () => {
    const store = new MemoryLifecycleStore();
    let entered = 0;
    const runtime = new LifecycleRuntime({ store });
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'open' | 'done' }>({
        name: 'work',
        initial: 'open',
        states: ['open', { name: 'done', final: true }],
        transitions: {
          again: { from: 'open', to: 'open' },
          finish: { from: 'open', to: 'done', manual: false },
        },
        onEnterState: {
          open: () => void entered++,
          done: () => void entered++,
        },
      }),
    );
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );
    await runtime.fire('work', record.id, 'again', {
      actor: { id: 'person' },
      requestId: 'click',
    });
    await runtime.fire('work', record.id, 'again', {
      actor: { id: 'person' },
      requestId: 'click',
    });
    await expect(
      runtime.fire('work', record.id, 'finish', {
        actor: { id: 'person' },
        manual: true,
      }),
    ).rejects.toMatchObject({ code: 'NOT_MANUAL' });
    expect(entered).toBe(2);
  });
});

it.each([false, true])(
  'defers transactional entry work until local/global hooks finish (initial: %s)',
  async (initial) => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const seen: string[] = [];
    runtime.register(
      defineLifecycle<{
        record: LifecycleRecord;
        state: 'draft' | 'review' | 'done';
      }>({
        name: 'queuedEntry',
        initial: initial ? ['review', 'draft'] : 'draft',
        states: [
          'draft',
          {
            name: 'review',
            onEnterState: ({ afterEntry, tx, record }) => {
              seen.push('local');
              afterEntry(async () => {
                seen.push('deferred');
                await tx.fire('queuedEntry', record.id, 'finish', {
                  actor: { id: 'system', system: true },
                });
              });
            },
          },
          { name: 'done', final: true },
        ],
        transitions: {
          submit: { from: 'draft', to: 'review' },
          finish: { from: 'review', to: 'done', manual: false },
        },
        onEnterState: {
          review: async ({ tx, record }) => {
            seen.push(
              String((await tx.read('queuedEntry', record.id))?.status),
            );
          },
        },
      }),
    );
    const created = await runtime.create(
      'queuedEntry',
      {},
      { actor: { id: 'person' } },
    );
    if (!initial)
      await runtime.fire('queuedEntry', created.record.id, 'submit', {
        actor: { id: 'person' },
      });
    expect(seen).toEqual(['local', 'review', 'deferred']);
    expect(store.record('queuedEntry', created.record.id)?.status).toBe('done');
  },
);

it('rolls back creation and deferred entry writes if queued work fails', async () => {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  let notified = false;
  runtime.register(
    defineLifecycle<{ record: LifecycleRecord; state: 'open' }>({
      name: 'failedEntry',
      initial: 'open',
      states: ['open'],
      transitions: { again: { from: 'open', to: 'open' } },
      onEnterState: {
        open: ({ afterEntry, tx }) => {
          afterEntry(() => {
            (tx.handle as MemoryRows).insertRecord('tasks', {
              id: 'discarded',
            });
            tx.afterCommit(() => {
              notified = true;
            });
            throw new Error('Entry refused');
          });
        },
      },
    }),
  );
  await expect(
    runtime.create('failedEntry', {}, { actor: { id: 'person' } }),
  ).rejects.toThrow('Entry refused');
  expect(store.records('failedEntry')).toEqual([]);
  expect(store.records('tasks')).toEqual([]);
  expect(notified).toBe(false);
});

it('offers afterEntry to entry hooks only', async () => {
  expectTypeOf<
    StateHookContext<{ record: LifecycleRecord; state: 'open' }>
  >().not.toHaveProperty('afterEntry');
  expectTypeOf<
    TransitionHookContext<{ record: LifecycleRecord; state: 'open' }>
  >().not.toHaveProperty('afterEntry');
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const offered: Record<string, boolean> = {};
  runtime.register(
    defineLifecycle<{ record: LifecycleRecord; state: 'draft' | 'review' }>({
      name: 'entryOnly',
      initial: 'draft',
      states: ['draft', { name: 'review', final: true }],
      transitions: {
        submit: {
          from: 'draft',
          to: 'review',
          onTransition: (context) => {
            offered.transition = 'afterEntry' in context;
          },
        },
      },
      onLeaveState: {
        draft: (context) => {
          offered.leave = 'afterEntry' in context;
        },
      },
      onEnterState: {
        review: (context) => {
          offered.enter = 'afterEntry' in context;
        },
      },
    }),
  );
  const created = await runtime.create(
    'entryOnly',
    {},
    { actor: { id: 'person' } },
  );
  await runtime.fire('entryOnly', created.record.id, 'submit', {
    actor: { id: 'person' },
  });
  expect(offered).toEqual({ leave: false, transition: false, enter: true });
});

it('refuses entry work queued once the entry hooks have finished', async () => {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  let kept: ((callback: () => void) => void) | undefined;
  let fromCallback = true;
  runtime.register(
    defineLifecycle<{ record: LifecycleRecord; state: 'open' }>({
      name: 'closedEntry',
      initial: 'open',
      states: ['open'],
      transitions: { again: { from: 'open', to: 'open' } },
      onEnterState: {
        open: ({ afterEntry }) => {
          kept = afterEntry;
          if (fromCallback) afterEntry(() => afterEntry(() => {}));
        },
      },
    }),
  );
  await expect(
    runtime.create('closedEntry', {}, { actor: { id: 'person' } }),
  ).rejects.toThrow('afterEntry() queues work only while');
  expect(store.records('closedEntry')).toEqual([]);

  fromCallback = false;
  const created = await runtime.create(
    'closedEntry',
    {},
    { actor: { id: 'person' } },
  );
  expect(created.record.status).toBe('open');
  expect(() => kept?.(() => {})).toThrow('afterEntry() queues work only while');
});

it.each(['hook', 'afterEntry'] as const)(
  'moving the record on from %s decides whether the entered stay began',
  async (from) => {
    const store = new MemoryLifecycleStore();
    const warn = vi.fn<LifecycleLogger['warn']>();
    const runtime = new LifecycleRuntime({
      store,
      // Holds every run, so the test runs it once the entry has committed.
      dispatcher: { dispatch: () => Promise.resolve() },
      logger: { warn, error: () => {} },
    });
    let checked = false;
    const check = defineEffect({
      name: 'check',
      onSuccess: 'pass',
      run: () => {
        checked = true;
        return {};
      },
    });
    runtime.register(
      defineLifecycle<{
        record: LifecycleRecord;
        state: 'draft' | 'review' | 'passed' | 'closed';
      }>({
        name: 'movedEntry',
        initial: 'draft',
        states: [
          'draft',
          'review',
          { name: 'passed', final: true },
          { name: 'closed', final: true },
        ],
        transitions: {
          submit: { from: 'draft', to: 'review' },
          pass: { from: 'review', to: 'passed', manual: false },
          conclude: { from: 'review', to: 'closed', manual: false },
        },
        onEnter: { review: [check] },
        onEnterState: {
          review: ({ afterEntry, tx, lifecycle, record }) => {
            const conclude = async (): Promise<void> => {
              await tx.fire(lifecycle, record.id, 'conclude', {
                actor: SYSTEM_ACTOR,
              });
            };
            if (from === 'hook') return conclude();
            afterEntry(conclude);
          },
        },
      }),
    );
    const { record } = await runtime.create(
      'movedEntry',
      {},
      { actor: { id: 'person' } },
    );
    const submitted = await runtime.fire('movedEntry', record.id, 'submit', {
      actor: { id: 'person' },
    });
    expect(submitted.record.status).toBe('closed');

    if (from === 'hook') {
      // A hook ends the stay before it began: the state owes nothing.
      expect(submitted.effectRuns).toEqual([]);
      expect(await store.listEffectRuns({})).toEqual([]);
      return;
    }
    // afterEntry ends a stay that began: its onEnter effect still runs, but
    // the stay it served is over, so its continuation is dropped.
    expect(submitted.effectRuns).toEqual([
      expect.objectContaining({ effect: 'check', stayBound: true }),
    ]);
    await runtime.runEffect(submitted.effectRuns[0]!.id);
    expect(checked).toBe(true);
    expect(store.record('movedEntry', record.id)?.status).toBe('closed');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('could not continue with "pass"'),
      expect.objectContaining({ code: 'INVALID_STATE' }),
    );
  },
);
