import { describe, expect, it, vi } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type LifecycleRecord,
  type ParameterReadContext,
} from '../src/index.js';

interface Types {
  record: LifecycleRecord;
  state: 'draft' | 'review' | 'done';
  parameters: { limit: number; nested: { message: string } };
}

const defaults = { limit: 10, nested: { message: 'default' } };

function setup() {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const seen: number[] = [];
  const provider = vi.fn(async (_context: ParameterReadContext<Types>) => ({
    limit: provider.mock.calls.length,
  }));
  const lifecycle = defineLifecycle<Types>({
    name: 'orders',
    initial: 'draft',
    states: ['draft', 'review', { name: 'done', final: true }],
    parameters: defaults,
    transitions: {
      submit: {
        from: 'draft',
        to: 'review',
        guard: ({ parameters }) => {
          seen.push(parameters.limit);
          return true;
        },
        set: ({ parameters }) => {
          seen.push(parameters.limit);
          return {};
        },
        onTransition: async ({ parameters, tx, record }) => {
          seen.push(parameters.limit);
          await tx.fire('orders', record.id, 'finish', { actor: SYSTEM_ACTOR });
        },
      },
      finish: {
        from: 'review',
        to: 'done',
        set: ({ parameters }) => {
          seen.push(parameters.limit);
          return {};
        },
      },
    },
  });
  runtime.register(lifecycle, { parameterProvider: provider });
  return { runtime, store, seen, provider, lifecycle };
}

describe('asynchronous lifecycle parameters', () => {
  it('reads once for callbacks and same-record nested transitions, after replay checks', async () => {
    const { runtime, store, provider, seen } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await runtime.fire('orders', record.id, 'submit', {
      actor: SYSTEM_ACTOR,
      requestId: 'submit-1',
    });
    expect(seen).toEqual([1, 1, 1, 1]);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider.mock.calls[0]?.[0]).toMatchObject({
      purpose: 'transition',
      transition: 'submit',
      record,
    });
    expect(provider.mock.calls[0]?.[0].transactionHandle).toBeDefined();
    expect(
      (
        await runtime.fire('orders', record.id, 'submit', {
          actor: SYSTEM_ACTOR,
          requestId: 'submit-1',
        })
      ).replayed,
    ).toBe(true);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('rejects ambiguous registration and retains synchronous overrides', async () => {
    const { lifecycle } = setup();
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    expect(() =>
      runtime.register(lifecycle, {
        parameters: () => ({ limit: 20 }),
        parameterProvider: async () => ({ limit: 30 }),
      }),
    ).toThrow('Register either');
    runtime.register(lifecycle, { parameters: () => ({ limit: 20 }) });
    expect(runtime.parameters('orders')).toEqual({ ...defaults, limit: 20 });
    expect(
      await runtime.resolveParameters('orders', {
        record: null,
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ).toEqual({ ...defaults, limit: 20 });
  });

  it('preserves non-data parameters in the legacy synchronous contract', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const callback = (): number => 42;
    runtime.register(
      defineLifecycle<{
        record: LifecycleRecord;
        state: 'draft' | 'done';
        parameters: { callback: () => number };
      }>({
        name: 'legacy',
        initial: 'draft',
        states: ['draft', { name: 'done', final: true }],
        parameters: { callback },
        transitions: {
          finish: {
            from: 'draft',
            to: 'done',
            set: ({ parameters }) => ({ value: parameters.callback() }),
          },
        },
      }),
    );
    const record = await store.createRecord('legacy', { status: 'draft' });
    expect(
      (
        await runtime.fire('legacy', record.id, 'finish', {
          actor: SYSTEM_ACTOR,
        })
      ).record,
    ).toMatchObject({ value: 42 });
  });

  it('uses asynchronous values for preview and detaches immutable parameter objects', async () => {
    const { runtime, store, provider } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await runtime.available('orders', record.id, SYSTEM_ACTOR);
    expect(provider.mock.calls[0]?.[0].purpose).toBe('preview');
    const parameters = await runtime.resolveParameters('orders', {
      record,
      purpose: 'preview',
      transactionHandle: undefined,
    });
    expect(Object.isFrozen(parameters)).toBe(true);
    expect(Object.isFrozen((parameters as Types['parameters']).nested)).toBe(
      true,
    );
    expect(Object.isFrozen(defaults.nested)).toBe(false);
    expect(runtime.parameters('orders')).toEqual(defaults);
  });

  it('shares action values with tx.fire and starts a fresh execution for the next action', async () => {
    const { runtime, store, provider, seen } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await runtime.withParameterExecution(
      'orders',
      record.id,
      async (parameters, tx) => {
        expect(parameters).toMatchObject({ limit: 1 });
        await tx.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
      },
    );
    expect(provider).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([1, 1, 1, 1]);
    await runtime.withParameterExecution(
      'orders',
      record.id,
      async (parameters) => {
        expect(parameters).toMatchObject({ limit: 2 });
      },
    );
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it('does not share composed values with another record in the same transaction', async () => {
    const { runtime, store, provider, seen } = setup();
    const first = await store.createRecord('orders', { status: 'draft' });
    const second = await store.createRecord('orders', { status: 'draft' });
    await runtime.withParameterExecution(
      'orders',
      first.id,
      async (_parameters, tx) => {
        await tx.fire('orders', second.id, 'submit', { actor: SYSTEM_ACTOR });
        await tx.fire('orders', first.id, 'submit', { actor: SYSTEM_ACTOR });
      },
    );
    expect(provider).toHaveBeenCalledTimes(2);
    expect(seen).toEqual([2, 2, 2, 2, 1, 1, 1, 1]);
  });

  it('rolls back failed execution and rereads on retry', async () => {
    const { runtime, store, provider } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await expect(
      runtime.withParameterExecution(
        'orders',
        record.id,
        async (_parameters, tx) => {
          await tx.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
          throw new Error('rollback');
        },
      ),
    ).rejects.toThrow('rollback');
    expect(await store.findRecord('orders', record.id)).toMatchObject({
      status: 'draft',
    });
    expect(await store.listTransitions('orders', String(record.id))).toEqual(
      [],
    );
    await runtime.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it('discards failed savepoint values and retains successful child reads', async () => {
    const { runtime, store, provider } = setup();
    const first = await store.createRecord('orders', { status: 'draft' });
    const second = await store.createRecord('orders', { status: 'draft' });
    let refuse = true;
    runtime.addGuard<Types>(
      'orders',
      'submit',
      ({ record }) => record.id !== second.id || !refuse,
    );
    await runtime.withParameterExecution(
      'orders',
      first.id,
      async (_parameters, tx) => {
        await expect(
          tx.fire('orders', second.id, 'submit', { actor: SYSTEM_ACTOR }),
        ).rejects.toThrow();
        refuse = false;
        await tx.fire('orders', second.id, 'submit', { actor: SYSTEM_ACTOR });
        expect(
          await runtime.resolveParameters('orders', {
            record: second,
            transactionHandle: tx.handle,
            purpose: 'action',
          }),
        ).toMatchObject({ limit: 3 });
      },
    );
    expect(provider).toHaveBeenCalledTimes(3);
  });

  it('isolates overlapping action scopes and coalesces simultaneous same-record reads', async () => {
    const { runtime, store, provider } = setup();
    const first = await store.createRecord('orders', { status: 'draft' });
    const second = await store.createRecord('orders', { status: 'draft' });
    await runtime.transaction(async (outer) => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const pending = runtime.withParameterExecution(
        'orders',
        first.id,
        async (parameters, tx) => {
          await gate;
          const resolved = await runtime.resolveParameters('orders', {
            record: first,
            transactionHandle: tx.handle,
            purpose: 'action',
          });
          expect(resolved).toBe(parameters);
        },
        { transaction: outer.handle },
      );
      await runtime.withParameterExecution(
        'orders',
        second.id,
        async (_parameters, tx) => {
          const context = {
            record: first,
            transactionHandle: tx.handle,
            purpose: 'action' as const,
          };
          const [left, right] = await Promise.all([
            runtime.resolveParameters('orders', context),
            runtime.resolveParameters('orders', context),
          ]);
          expect(left).toBe(right);
          release();
        },
        { transaction: outer.handle },
      );
      await pending;
    });
    expect(provider).toHaveBeenCalledTimes(3);
  });

  it('propagates provider failures without writing a transition', async () => {
    const { store, lifecycle } = setup();
    const runtime = new LifecycleRuntime({ store });
    runtime.register(lifecycle, {
      parameterProvider: async () => {
        throw new Error('configuration unavailable');
      },
    });
    const record = await store.createRecord('orders', { status: 'draft' });
    await expect(
      runtime.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR }),
    ).rejects.toThrow('configuration unavailable');
    expect(await store.listTransitions('orders', String(record.id))).toEqual(
      [],
    );
    expect(await store.findRecord('orders', record.id)).toMatchObject({
      status: 'draft',
    });
  });

  it('shares creation values with entry hooks and their same-record transition', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const seen: number[] = [];
    const provider = vi.fn(async () => ({ limit: 42 }));
    runtime.register(
      defineLifecycle<Types>({
        name: 'orders',
        initial: 'draft',
        parameters: defaults,
        states: [
          {
            name: 'draft',
            onEnterState: async ({ parameters, record, tx }) => {
              seen.push(parameters.limit);
              await tx.fire('orders', record.id, 'submit', {
                actor: SYSTEM_ACTOR,
              });
            },
          },
          { name: 'done', final: true },
        ],
        create: {
          guard: ({ parameters }) => {
            seen.push(parameters.limit);
            return true;
          },
        },
        transitions: {
          submit: {
            from: 'draft',
            to: 'done',
            set: ({ parameters }) => {
              seen.push(parameters.limit);
              return {};
            },
          },
        },
      }),
      { parameterProvider: provider },
    );
    await runtime.create('orders', {}, { actor: SYSTEM_ACTOR });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([42, 42, 42]);
  });

  it('reads new values for each effect attempt while keeping its business idempotency key', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({
      store,
      dispatcher: { dispatch: async () => {} },
    });
    let message = 'A';
    const seen: string[] = [];
    const keys: string[] = [];
    const effect = defineEffect<Types>({
      name: 'notify',
      retry: { attempts: 2 },
      run: ({ parameters, attempt, idempotencyKey }) => {
        seen.push(parameters.nested.message);
        keys.push(idempotencyKey);
        if (attempt === 1) throw new Error('retry');
      },
    });
    runtime.register(
      defineLifecycle<Types>({
        name: 'orders',
        initial: 'draft',
        states: ['draft', { name: 'done', final: true }],
        parameters: defaults,
        transitions: {
          submit: { from: 'draft', to: 'done', effects: [effect] },
        },
      }),
      { parameterProvider: async () => ({ nested: { message } }) },
    );
    const record = await store.createRecord('orders', { status: 'draft' });
    const result = await runtime.fire('orders', record.id, 'submit', {
      actor: SYSTEM_ACTOR,
    });
    const runId = result.effectRuns[0]!.id;
    await runtime.runEffect(runId);
    message = 'B';
    await runtime.runEffect(runId);
    expect(seen).toEqual(['A', 'B']);
    expect(keys[0]).toBe(keys[1]);
  });
});

describe('asynchronous parameter data safety', () => {
  it.each([new Date(), new Map([['value', 1]]), new Set([1])])(
    'rejects mutable built-in values that Object.freeze cannot make immutable',
    async (mutable) => {
      const store = new MemoryLifecycleStore();
      const runtime = new LifecycleRuntime({ store });
      runtime.register(
        defineLifecycle<{
          record: LifecycleRecord;
          state: 'draft';
          parameters: { value: unknown };
        }>({
          name: 'data',
          initial: 'draft',
          states: [{ name: 'draft', final: true }],
          parameters: { value: null },
          transitions: {},
        }),
        { parameterProvider: async () => ({ value: mutable }) },
      );
      await expect(
        runtime.resolveParameters('data', {
          record: null,
          purpose: 'preview',
          transactionHandle: undefined,
        }),
      ).rejects.toThrow('plain objects and arrays');
    },
  );
});
