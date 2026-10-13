import { describe, expect, it, vi } from 'vitest';
import { createLifecycleTestKit } from '../src/testing.js';
import {
  defineLifecycle,
  defineEffect,
  LifecycleRuntime,
  LifecycleError,
  MemoryLifecycleStore,
  StoredLifecycleParameters,
  ParameterConfigurationError,
  SYSTEM_ACTOR,
  normalizeReviewerSelections,
  resolveReviewerSelections,
  type ParameterGroup,
  type LifecycleRecord,
  type ParameterConfigurationDefinition,
} from '../src/index.js';

interface Types {
  record: LifecycleRecord;
  state: 'draft' | 'review';
  parameters: { limit: number; live: number };
}
const positive = (value: unknown): number => {
  if (typeof value !== 'number' || value < 0 || !Number.isFinite(value))
    throw new Error('Expected a non-negative number.');
  return value;
};
const group: ParameterGroup = {
  key: 'thresholds',
  title: 'Thresholds',
  schemaVersion: 1,
  fields: {
    limit: { type: 'number', title: 'Limit', parse: positive },
    live: { type: 'number', title: 'Live', readMode: 'live', parse: positive },
  },
};
const configuration: ParameterConfigurationDefinition = {
  readMode: 'snapshot',
  snapshotTransition: 'submit',
  groups: [group],
};
function setup() {
  const store = new MemoryLifecycleStore();
  const parameters = new StoredLifecycleParameters(store);
  const runtime = new LifecycleRuntime({ store });
  const seen: number[][] = [];
  let fail = false;
  const lifecycle = defineLifecycle<Types>({
    name: 'orders',
    initial: 'draft',
    states: ['draft', 'review'],
    parameters: { limit: 10, live: 1 },
    parameterConfiguration: configuration,
    transitions: {
      submit: {
        from: 'draft',
        to: 'review',
        set: ({ parameters }) => {
          seen.push([parameters.limit, parameters.live]);
          return {};
        },
        onTransition: async ({ record, tx, parameters }) => {
          seen.push([parameters.limit, parameters.live]);
          const nested = await runtime.resolveParameters('orders', {
            record,
            transactionHandle: tx.handle,
            purpose: 'action',
          });
          expect(nested).toEqual(parameters);
          if (fail) throw new Error('hook failure');
        },
      },
      withdraw: { from: 'review', to: 'draft' },
    },
  });
  runtime.register(lifecycle, {
    parameterConfiguration: { store: parameters, scope: () => 'demo' },
  });
  const save = (
    limit: number,
    live: number,
    expectedRevision: number,
    requestId: string = `r${expectedRevision}`,
  ) =>
    parameters.save({
      scope: 'demo',
      group,
      values: { limit, live },
      expectedRevision,
      requestId,
      actorId: 'admin',
      at: '2026-10-13T00:00:00Z',
    });
  return {
    store,
    parameters,
    runtime,
    seen,
    lifecycle,
    save,
    fail: () => {
      fail = true;
    },
  };
}
describe('configured lifecycle parameters', () => {
  it('previews current values, binds only first successful submission, and mixes later live values', async () => {
    const { store, parameters, runtime, save, seen } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await save(20, 2, 0);
    expect(
      await runtime.resolveParameters('orders', {
        record,
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ).toEqual({ limit: 20, live: 2 });
    expect(
      await parameters.snapshot('demo', 'orders', String(record.id)),
    ).toBeUndefined();
    const first = await runtime.fire('orders', record.id, 'submit', {
      actor: SYSTEM_ACTOR,
      requestId: 'first',
    });
    await save(30, 3, 1);
    const submitted = first.record;
    expect(
      await runtime.resolveParameters('orders', {
        record: submitted,
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ).toEqual({ limit: 20, live: 3 });
    await runtime.fire('orders', record.id, 'withdraw', {
      actor: SYSTEM_ACTOR,
    });
    await runtime.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
    expect(seen).toEqual([
      [20, 2],
      [20, 2],
      [20, 3],
      [20, 3],
    ]);
    const newRecord = await store.createRecord('orders', { status: 'draft' });
    await runtime.fire('orders', newRecord.id, 'submit', {
      actor: SYSTEM_ACTOR,
    });
    expect(seen.at(-1)).toEqual([30, 3]);
    const usage = await parameters.usage(
      'orders',
      'transition',
      first.entry.id,
    );
    expect(usage).toMatchObject({
      values: { limit: 20, live: 2 },
      sources: {
        limit: { origin: 'configuration', revision: 1, readMode: 'snapshot' },
      },
    });
  });
  it('rolls back snapshots and usage together with hooks and nested savepoints', async () => {
    const { store, runtime, parameters, fail } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    fail();
    await expect(
      runtime.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR }),
    ).rejects.toThrow('hook failure');
    expect(
      await parameters.snapshot('demo', 'orders', String(record.id)),
    ).toBeUndefined();
    expect(await store.listTransitions('orders', String(record.id))).toEqual(
      [],
    );
    await runtime.transaction(async (tx) => {
      await expect(
        tx.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR }),
      ).rejects.toThrow('hook failure');
      expect(
        await parameters.snapshot(
          'demo',
          'orders',
          String(record.id),
          tx.handle,
        ),
      ).toBeUndefined();
    });
  });
  it('does not reread or replace facts on idempotent replay', async () => {
    const { store, runtime, parameters, save } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    const first = await runtime.fire('orders', record.id, 'submit', {
      actor: SYSTEM_ACTOR,
      requestId: 'first',
    });
    await save(40, 4, 0);
    const read = vi.spyOn(parameters, 'read');
    expect(
      (
        await runtime.fire('orders', record.id, 'submit', {
          actor: SYSTEM_ACTOR,
          requestId: 'first',
        })
      ).replayed,
    ).toBe(true);
    expect(read).not.toHaveBeenCalled();
    expect(
      await parameters.usage('orders', 'transition', first.entry.id),
    ).toMatchObject({
      values: { limit: 10, live: 1 },
      sources: { limit: { origin: 'default', revision: 0 } },
    });
  });
  it('saves one version for duplicate requests, refuses CAS conflicts and preserves immutable old versions', async () => {
    const { parameters, save } = setup();
    const first = await save(20, 2, 0, 'same');
    expect(await save(20, 2, 0, 'same')).toEqual(first);
    await expect(save(21, 2, 0, 'same')).rejects.toMatchObject({
      code: 'CONFIGURATION_REQUEST_REUSED',
    });
    const results = await Promise.allSettled([
      save(30, 3, 1, 'left'),
      save(40, 4, 1, 'right'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(await save(20, 2, 0, 'same')).toEqual(first);
    expect((await parameters.read('demo', group.key))?.revision).toBe(2);
  });
  it('refuses illegal fields and linked-mode definitions', async () => {
    const { parameters, lifecycle } = setup();
    await expect(
      parameters.save({
        scope: 'demo',
        group,
        values: { limit: -1, live: 2 },
        expectedRevision: 0,
        requestId: 'bad',
        actorId: 'admin',
        at: 'now',
      }),
    ).rejects.toBeInstanceOf(ParameterConfigurationError);
    await expect(
      parameters.save({
        scope: 'demo',
        group,
        values: { limit: 1, live: 2, waitMinutes: 3 },
        expectedRevision: 0,
        requestId: 'bad',
        actorId: 'admin',
        at: 'now',
      }),
    ).rejects.toMatchObject({ code: 'CONFIGURATION_INVALID' });
    expect(() =>
      defineLifecycle<Types>({
        name: 'bad',
        initial: 'draft',
        states: ['draft', 'review'],
        parameters: { limit: 10, live: 1 },
        parameterConfiguration: {
          ...configuration,
          groups: [{ ...group, sameReadMode: [['limit', 'live']] }],
        },
        transitions: {
          submit: { from: 'draft', to: 'review' },
          withdraw: { from: 'review', to: 'draft' },
        },
      }),
    ).toThrow('same read mode');
    expect(() =>
      new LifecycleRuntime({ store: new MemoryLifecycleStore() }).register(
        lifecycle,
      ),
    ).toThrow('storage adapter');
  });
  it('records standalone action facts and shares values with its transitions', async () => {
    const { store, runtime, parameters, save } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await runtime.withParameterExecution('orders', record.id, async () => {}, {
      actionId: 'comment-1',
    });
    expect(
      await parameters.usage('orders', 'action', 'comment-1'),
    ).toMatchObject({ values: { limit: 10, live: 1 } });
    await save(20, 2, 0);
    await runtime.withParameterExecution(
      'orders',
      record.id,
      async (values, tx) => {
        expect(values).toEqual({ limit: 20, live: 2 });
        await tx.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
      },
      { actionId: 'submit-action' },
    );
    expect(
      await parameters.usage('orders', 'action', 'submit-action'),
    ).toMatchObject({ values: { limit: 20, live: 2 } });
  });
  it('refuses missing historical snapshot values and explicitly supports legacy routing', async () => {
    const { store, parameters, lifecycle } = setup();
    const runtime = new LifecycleRuntime({ store });
    runtime.register(lifecycle, {
      parameterConfiguration: {
        store: parameters,
        scope: () => 'demo',
        snapshotRequired: (record) => record.status === 'review',
        legacyRecord: (record) => record.legacy === true,
      },
    });
    const record = await store.createRecord('orders', { status: 'review' });
    await expect(
      runtime.available('orders', record.id, SYSTEM_ACTOR),
    ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_REQUIRED' });
    const old = await store.createRecord('orders', {
      status: 'review',
      legacy: true,
    });
    expect(
      await runtime.resolveParameters('orders', {
        record: old,
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ).toEqual({ limit: 10, live: 1 });
    await store.transaction(async (tx) =>
      parameters.saveSnapshot(
        {
          scope: 'demo',
          lifecycle: 'orders',
          recordId: String(record.id),
          values: {},
          sources: {},
          at: 'now',
        },
        tx.transactionHandle,
      ),
    );
    await expect(
      runtime.available('orders', record.id, SYSTEM_ACTOR),
    ).rejects.toMatchObject({ code: 'CONFIGURATION_INCOMPATIBLE' });
  });
});

describe('reviewer selection rules', () => {
  it('intersects within groups, unions across groups, deduplicates and filters every branch', async () => {
    const selections = normalizeReviewerSelections(
      [
        { group: 1, type: 'department', referenceId: 'finance' },
        { group: 1, type: 'role', referenceId: 'reviewer' },
        { group: 2, type: 'user', referenceId: 'carol' },
        { group: 3, type: 'user', referenceId: 'disabled' },
      ],
      ['department', 'role', 'user'],
    );
    const people = await resolveReviewerSelections(
      selections as unknown as import('../src/index.js').ReviewerSelection[],
      { scope: 'demo', applicantId: 'alice' },
      {
        selectors: {
          department: async () => ['bob', 'disabled', 'alice'],
          role: async () => ['bob', 'disabled'],
          user: async (id) => [id],
        },
        eligible: async (id, context) =>
          id !== 'disabled' && id !== context.applicantId,
      },
    );
    expect(people).toEqual(['bob', 'carol']);
    expect(() =>
      normalizeReviewerSelections(
        [{ group: 1, type: 'script', referenceId: 'evil' }],
        ['user'],
      ),
    ).toThrow();
  });
});

describe('configured effect attempts', () => {
  it('persists separately fenced values before each attempt and keeps retry reads live', async () => {
    const store = new MemoryLifecycleStore();
    const parameters = new StoredLifecycleParameters(store);
    const runtime = new LifecycleRuntime({
      store,
      dispatcher: { dispatch: async () => {} },
    });
    const seen: number[] = [];
    runtime.register(
      defineLifecycle<Types>({
        name: 'orders',
        initial: 'draft',
        states: ['draft', 'review'],
        parameters: { limit: 10, live: 1 },
        parameterConfiguration: configuration,
        transitions: {
          submit: {
            from: 'draft',
            to: 'review',
            effects: [
              defineEffect<Types>({
                name: 'notify',
                retry: { attempts: 2 },
                run: async ({
                  parameters: values,
                  attempt,
                  idempotencyKey,
                }) => {
                  const runId = idempotencyKey.split(':').at(-1)!;
                  expect(
                    await parameters.usage('orders', 'effect', runId, attempt),
                  ).toMatchObject({ values: { limit: 10, live: attempt } });
                  seen.push(values.live);
                  if (attempt === 1) throw new Error('retry');
                },
              }),
            ],
          },
          withdraw: { from: 'review', to: 'draft' },
        },
      }),
      { parameterConfiguration: { store: parameters, scope: () => 'demo' } },
    );
    const record = await store.createRecord('orders', { status: 'draft' });
    const result = await runtime.fire('orders', record.id, 'submit', {
      actor: SYSTEM_ACTOR,
    });
    const runId = result.effectRuns[0]!.id;
    await runtime.runEffect(runId);
    await parameters.save({
      scope: 'demo',
      group,
      values: { limit: 99, live: 2 },
      expectedRevision: 0,
      requestId: 'new',
      actorId: 'admin',
      at: 'now',
    });
    await runtime.runEffect(runId);
    expect(seen).toEqual([1, 2]);
    await expect(
      parameters.saveUsage({
        scope: 'demo',
        lifecycle: 'orders',
        recordId: String(record.id),
        values: {},
        sources: {},
        kind: 'effect',
        associationId: runId,
        attempt: 1,
        at: 'now',
      }),
    ).rejects.toMatchObject({ code: 'PARAMETER_ATTEMPT_STALE' });
  });
});

describe('configured action and continuation boundaries', () => {
  it('rolls back a successful nested submission when its outer action fails', async () => {
    const { store, runtime, parameters } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    await expect(
      runtime.withParameterExecution(
        'orders',
        record.id,
        async (_values, tx, resolution) => {
          expect(resolution?.sources.limit).toMatchObject({
            origin: 'default',
            readMode: 'snapshot',
          });
          await tx.fire('orders', record.id, 'submit', { actor: SYSTEM_ACTOR });
          expect(
            await parameters.snapshot(
              'demo',
              'orders',
              String(record.id),
              tx.handle,
            ),
          ).toBeDefined();
          throw new Error('outer action failure');
        },
        { actionId: 'rolled-back' },
      ),
    ).rejects.toThrow('outer action failure');
    expect(
      await parameters.snapshot('demo', 'orders', String(record.id)),
    ).toBeUndefined();
    expect(
      await parameters.listUsage('demo', 'orders', String(record.id)),
    ).toEqual([]);
    expect((await store.findRecord('orders', record.id))?.status).toBe('draft');
  });
  it('allows a replay-aware action owner to avoid reading or writing parameter facts twice', async () => {
    const { store, runtime, parameters, save } = setup();
    const record = await store.createRecord('orders', { status: 'draft' });
    const execute = async (): Promise<unknown> =>
      store.transaction(async (transaction) => {
        const receipt = await transaction.findRecord(
          'businessActionReceipts',
          'comment',
        );
        if (receipt) return receipt.result;
        return runtime.withParameterExecution(
          'orders',
          record.id,
          async (values, tx) => {
            await store.transaction(
              async (joined) => {
                await joined.createRecord('businessActionReceipts', {
                  id: 'comment',
                  result: values,
                });
              },
              { within: tx.handle },
            );
            return values;
          },
          { actionId: 'comment', transaction: transaction.transactionHandle },
        );
      });
    expect(await execute()).toEqual({ limit: 10, live: 1 });
    await save(20, 2, 0);
    const read = vi.spyOn(parameters, 'read');
    expect(await execute()).toEqual({ limit: 10, live: 1 });
    expect(read).not.toHaveBeenCalled();
    expect(
      await parameters.listUsage('demo', 'orders', String(record.id)),
    ).toHaveLength(1);
  });
  it('reads new live values on continuation retry without rerunning the external effect', async () => {
    const store = new MemoryLifecycleStore();
    const parameters = new StoredLifecycleParameters(store);
    const runtime = new LifecycleRuntime({ store });
    const external = vi.fn(() => ({ ok: true }));
    const liveGroup: ParameterGroup = {
      key: 'copy',
      title: 'Copy',
      schemaVersion: 1,
      fields: { live: { type: 'number', title: 'Live', parse: positive } },
    };
    let blocked = true;
    const seen: number[] = [];
    runtime.register(
      defineLifecycle<Types>({
        name: 'tasks',
        initial: 'draft',
        states: ['draft', { name: 'review', final: true }],
        parameters: { limit: 10, live: 1 },
        parameterConfiguration: { readMode: 'live', groups: [liveGroup] },
        transitions: {
          start: {
            from: 'draft',
            to: 'draft',
            effects: [
              defineEffect<Types>({
                name: 'tasks.external',
                run: external,
                onSuccess: 'finish',
              }),
            ],
          },
          finish: {
            from: 'draft',
            to: 'review',
            set: ({ parameters }) => {
              seen.push(parameters.live);
              if (blocked)
                throw new LifecycleError('INVALID_SET', 'continuation blocked');
              return {};
            },
          },
        },
      }),
      { parameterConfiguration: { store: parameters, scope: () => 'demo' } },
    );
    const record = await store.createRecord('tasks', { status: 'draft' });
    const result = await runtime.fire('tasks', record.id, 'start', {
      actor: SYSTEM_ACTOR,
    });
    const runId = result.effectRuns[0]!.id;
    await runtime.runEffect(runId);
    expect(seen).toEqual([1]);
    await parameters.save({
      scope: 'demo',
      group: liveGroup,
      values: { live: 2 },
      expectedRevision: 0,
      requestId: 'new-copy',
      actorId: 'admin',
      at: new Date().toISOString(),
    });
    blocked = false;
    await runtime.continueRun(runId);
    expect(seen).toEqual([1, 2]);
    expect(external).toHaveBeenCalledTimes(1);
    const facts = await parameters.listUsage(
      'demo',
      'tasks',
      String(record.id),
    );
    expect(
      facts
        .filter((fact) => fact.kind === 'effect')
        .map((fact) => fact.values.live),
    ).toEqual([1]);
    expect(
      facts
        .filter((fact) => fact.kind === 'transition')
        .map((fact) => fact.values.live),
    ).toEqual([1, 2]);
  });
});

describe('configured lifecycle test kit', () => {
  it('retains parameter fixture overrides when configuration is enabled', async () => {
    const lifecycle = defineLifecycle<Types>({
      name: 'kitOrders',
      initial: 'draft',
      states: ['draft', { name: 'review', final: true }],
      parameters: { limit: 10, live: 1 },
      parameterConfiguration: configuration,
      transitions: {
        submit: {
          from: 'draft',
          to: 'review',
          set: ({ parameters }) => ({ observed: parameters.limit }),
        },
      },
    });
    const kit = createLifecycleTestKit(lifecycle, {
      parameters: { limit: 99 },
    });
    const record = await kit.store.createRecord('kitOrders', {
      status: 'draft',
    });
    await kit.fire(record.id, 'submit');
    expect((await kit.store.findRecord('kitOrders', record.id))?.observed).toBe(
      99,
    );
  });
});
