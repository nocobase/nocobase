import { expect, it } from 'vitest';
import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type LifecycleRecord,
  type TransitionListOptions,
} from '../src/index.js';

type Types = {
  record: LifecycleRecord;
  state: 'idle' | 'busy' | 'review' | 'done';
};
const delivery = defineEffect<Types>({
  name: 'delivery',
  onSuccess: 'complete',
  run: () => ({ reference: 'old-payment' }),
});

it.each([false, true])(
  'does not apply an old outcome when another transition commits during the stay check; pending=%s',
  async (pending) => {
    let inject: (() => Promise<void>) | undefined;
    class InterleavedStore extends MemoryLifecycleStore {
      override async listTransitions(
        lifecycle: string,
        recordId: string,
        options?: TransitionListOptions,
      ) {
        const snapshot = await super.listTransitions(
          lifecycle,
          recordId,
          options,
        );
        if (options?.after && inject) {
          const commit = inject;
          inject = undefined;
          await commit();
        }
        return snapshot;
      }
    }
    const store = new InterleavedStore();
    const runtime = new LifecycleRuntime({
      store,
      dispatcher: { dispatch: async () => {} },
    });
    let broken = pending;
    runtime.register(
      defineLifecycle<Types>({
        name: 'jobs',
        initial: 'idle',
        states: ['idle', 'busy', 'review', { name: 'done', final: true }],
        transitions: {
          begin: { from: 'idle', to: 'busy' },
          review: { from: 'busy', to: 'review' },
          resume: { from: 'review', to: 'busy' },
          touch: { from: 'busy', to: 'busy' },
          complete: {
            from: 'busy',
            to: 'done',
            set: ({ input }) =>
              broken ? { status: 'done' } : { reference: input.reference },
          },
        },
        onEnter: { busy: [delivery] },
      }),
    );
    const row = store.insertRecord('jobs', {
      status: 'idle',
      lifecycleVersion: 0,
    });
    const fired = await runtime.fire('jobs', row.id, 'begin', {
      actor: SYSTEM_ACTOR,
    });
    const runId = fired.effectRuns[0].id;
    if (pending) {
      await runtime.runEffect(runId);
      expect((await store.findEffectRun(runId))?.continuation).toBeTruthy();
      broken = false;
    }
    // Model a separate transaction committing after the history SELECT's snapshot
    // under READ COMMITTED. The conditional write must still use the record
    // version read before this snapshot, rather than reading the newer version.
    inject = async () => {
      store.patchRecord('jobs', row.id, {
        status: 'busy',
        lifecycleVersion: 2,
      });
      await store.appendTransition({
        lifecycle: 'jobs',
        recordId: String(row.id),
        transition: 'touch',
        from: 'busy',
        to: 'busy',
        actorId: 'other',
        input: {},
        at: new Date().toISOString(),
        version: 2,
        requestId: null,
      });
    };
    if (pending)
      await expect(runtime.continueRun(runId)).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    else await runtime.runEffect(runId);
    expect(store.record('jobs', row.id)?.status).toBe('busy');
  },
);
it('retains a transition effect continuation when the same effect is also declared onEnter', async () => {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({
    store,
    dispatcher: { dispatch: async () => {} },
  });
  runtime.register(
    defineLifecycle<Types>({
      name: 'jobs',
      initial: 'idle',
      states: ['idle', 'busy', 'review', { name: 'done', final: true }],
      transitions: {
        begin: {
          from: 'idle',
          to: 'busy',
          effects: [delivery],
          onTransition: async ({ tx, record }) => {
            await tx.fire('jobs', record.id, 'review', { actor: SYSTEM_ACTOR });
          },
        },
        review: { from: 'busy', to: 'review' },
        complete: { from: 'review', to: 'done' },
      },
      onEnter: { busy: [delivery] },
    }),
  );
  const row = store.insertRecord('jobs', {
    status: 'idle',
    lifecycleVersion: 0,
  });
  const fired = await runtime.fire('jobs', row.id, 'begin', {
    actor: SYSTEM_ACTOR,
  });
  expect(fired.effectRuns).toHaveLength(1);
  await runtime.runEffect(fired.effectRuns[0].id);
  expect(store.record('jobs', row.id)?.status).toBe('done');
});

it.each([false, true])(
  'keeps the queued stay binding after a definition change (stayBound: %s)',
  async (stayBound) => {
    const store = new MemoryLifecycleStore();
    const definition = (bind: boolean) =>
      defineLifecycle<Types>({
        name: 'jobs',
        initial: 'idle',
        states: ['idle', 'busy', { name: 'done', final: true }],
        transitions: {
          begin: { from: 'idle', to: 'busy', effects: bind ? [] : [delivery] },
          touch: { from: 'busy', to: 'busy' },
          complete: { from: 'busy', to: 'done' },
        },
        onEnter: { busy: bind ? [delivery] : [] },
      });
    const dispatcher = { dispatch: () => Promise.resolve() };
    const before = new LifecycleRuntime({ store, dispatcher });
    before.register(definition(stayBound));
    const row = store.insertRecord('jobs', {
      status: 'idle',
      lifecycleVersion: 0,
    });
    const begun = await before.fire('jobs', row.id, 'begin', {
      actor: SYSTEM_ACTOR,
    });
    expect(begun.effectRuns[0].stayBound).toBe(stayBound);
    await before.fire('jobs', row.id, 'touch', { actor: SYSTEM_ACTOR });
    // A new process moves the same effect to the other place in its definition.
    const after = new LifecycleRuntime({ store, dispatcher });
    after.register(definition(!stayBound));
    await after.runEffect(begun.effectRuns[0].id);
    expect(store.record('jobs', row.id)?.status).toBe(
      stayBound ? 'busy' : 'done',
    );
  },
);
