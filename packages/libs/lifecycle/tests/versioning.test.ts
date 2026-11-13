// Several versions of one process on one collection: each record stays
// with the definition that created it, whatever a page or a sweep asks.
import { describe, expect, it, vi } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  lifecycleErrorFields,
  MemoryLifecycleStore,
  StoredLifecycleParameters,
  SYSTEM_ACTOR,
  type LifecycleDefinition,
  type LifecycleLogger,
  type LifecycleRecord,
  type ParameterGroup,
} from '../src/index.js';

interface Types {
  record: LifecycleRecord;
  state: string;
  parameters: { limit: number; extra: number };
  services: { readonly sent: string[] };
}

const actor = { id: 'u1' };
const positive = (value: unknown): number => {
  if (typeof value !== 'number' || value < 0)
    throw new Error('Expected a non-negative number.');
  return value;
};
const limits: ParameterGroup = {
  key: 'limits',
  title: 'Limits',
  schemaVersion: 1,
  fields: { limit: { type: 'number', title: 'Limit', parse: positive } },
};
const extras: ParameterGroup = {
  key: 'extras',
  title: 'Extras',
  schemaVersion: 1,
  fields: { extra: { type: 'number', title: 'Extra', parse: positive } },
};

const notify = defineEffect<Types>({
  name: 'notify',
  onSuccess: 'finish',
  run: ({ services, record }) => {
    services.sent.push(String(record.definition));
  },
});

function v1(
  overrides: Partial<LifecycleDefinition<Types>> = {},
): LifecycleDefinition<Types> {
  return {
    name: 'requests',
    key: 'requests',
    version: 1,
    collection: 'requests',
    definitionField: 'definition',
    initial: 'draft',
    states: ['draft', 'sent', { name: 'done', final: true }],
    parameters: { limit: 10, extra: 0 },
    transitions: {
      send: { from: 'draft', to: 'sent', effects: [notify] },
      finish: { from: 'sent', to: 'done', manual: false },
    },
    triggers: {
      expire: { transition: 'send', when: 'draft', after: () => -1 },
    },
    ...overrides,
  };
}

/** v2 adds a review step before the request is sent. */
function v2(
  overrides: Partial<LifecycleDefinition<Types>> = {},
): LifecycleDefinition<Types> {
  return {
    ...v1(),
    name: 'requests-v2',
    version: 2,
    states: ['draft', 'review', 'sent', { name: 'done', final: true }],
    transitions: {
      submit: { from: 'draft', to: 'review' },
      send: { from: 'review', to: 'sent', effects: [notify] },
      finish: { from: 'sent', to: 'done', manual: false },
    },
    triggers: {
      expire: { transition: 'submit', when: 'draft', after: () => -1 },
    },
    ...overrides,
  };
}

function setup() {
  const store = new MemoryLifecycleStore();
  const logger = {
    warn: vi.fn<LifecycleLogger['warn']>(),
    error: vi.fn<LifecycleLogger['error']>(),
  };
  const services = { sent: [] as string[] };
  const runtime = new LifecycleRuntime({
    store,
    logger,
    clock: () => new Date('2026-11-11T00:00:00Z'),
  });
  // Registered newest first: the order says nothing about which is latest.
  runtime.register(defineLifecycle(v2()), { services });
  runtime.register(defineLifecycle(v1()), { services });
  return { store, logger, runtime, services };
}

async function refusal(work: Promise<unknown>): Promise<LifecycleError> {
  const error = await work.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(LifecycleError);
  return error as LifecycleError;
}

describe('a definition with a key and a version', () => {
  it('describes both, and defaults them to its name and 1', () => {
    const declared = defineLifecycle(v2());
    expect(declared).toMatchObject({
      key: 'requests',
      version: 2,
      definitionField: 'definition',
      defaulted: [],
    });
    const legacy = defineLifecycle(
      v1({ key: undefined, version: undefined, definitionField: undefined }),
    );
    expect(legacy).toMatchObject({
      key: 'requests',
      version: 1,
      defaulted: ['key', 'version'],
    });
    const { runtime } = setup();
    expect(runtime.describe('requests-v2')).toMatchObject({
      name: 'requests-v2',
      key: 'requests',
      version: 2,
      definitionField: 'definition',
    });
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'refuses version %s',
    (version) => {
      expect(() => defineLifecycle(v1({ version }))).toThrow(
        /version is not a positive integer/,
      );
    },
  );

  it('refuses a key that is not an identifier, and a definition field the lifecycle already owns', () => {
    expect(() => defineLifecycle(v1({ key: 'two words' }))).toThrow(
      /key is not an identifier/,
    );
    expect(() =>
      defineLifecycle(v1({ definitionField: 'lifecycleVersion' })),
    ).toThrow(/already owns/);
  });

  it('lets no transition accept the definition field', () => {
    expect(() =>
      defineLifecycle(
        v1({
          transitions: {
            send: {
              from: 'draft',
              to: 'sent',
              accept: ['definition'],
              effects: [notify],
            },
            finish: { from: 'sent', to: 'done', manual: false },
          },
        }),
      ),
    ).toThrow(/may not accept "definition"/);
  });
});

describe('registering versions', () => {
  it('warns about a definition that leaves key, version or definition field out', () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const runtime = new LifecycleRuntime({
      store: new MemoryLifecycleStore(),
      logger,
    });
    runtime.register(
      defineLifecycle(
        v1({
          key: undefined,
          version: undefined,
          definitionField: undefined,
        }),
      ),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('declares no key or version'),
      { lifecycle: 'requests', defaulted: ['key', 'version'] },
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('declares no definitionField'),
      { lifecycle: 'requests' },
    );
    expect(runtime.group('requests')).toEqual({
      key: 'requests',
      versions: [{ name: 'requests', version: 1 }],
      latest: 'requests',
    });
  });

  it('says nothing about a definition that declares all three', () => {
    const { logger } = setup();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('takes the largest version as the latest, whatever the order', () => {
    const { runtime } = setup();
    expect(runtime.groups()).toEqual([
      {
        key: 'requests',
        versions: [
          { name: 'requests', version: 1 },
          { name: 'requests-v2', version: 2 },
        ],
        latest: 'requests-v2',
        definitionField: 'definition',
      },
    ]);
    expect(runtime.group('requests-v2').key).toBe('requests');
    expect(() => runtime.group('missing')).toThrow(/No lifecycle "missing"/);
  });

  it('lists every state of every version once, titled by the latest', () => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(defineLifecycle(v1()));
    runtime.register(
      defineLifecycle(
        v2({
          states: [
            { name: 'draft', title: 'Draft (v2)' },
            'review',
            'sent',
            { name: 'done', final: true },
          ],
        }),
      ),
    );
    expect(
      runtime.groupStates('requests').map(({ name, title }) => [name, title]),
    ).toEqual([
      ['draft', 'Draft (v2)'],
      ['review', 'review'],
      ['sent', 'sent'],
      ['done', 'done'],
    ]);
  });

  it.each<[string, Partial<LifecycleDefinition<Types>>, RegExp]>([
    ['a version taken', { version: 1 }, /version 1 of "requests" is already/],
    [
      'another collection',
      { collection: 'requests2' },
      /collection "requests2" differs/,
    ],
    ['another state field', { stateField: 'phase' }, /stateField "phase"/],
    [
      'another definition field',
      { definitionField: 'flow' },
      /definitionField "flow"/,
    ],
    [
      'no definition field',
      { definitionField: undefined },
      /definitionField "undefined" differs/,
    ],
  ])('refuses a second version with %s', (_, overrides, message) => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(defineLifecycle(v1()));
    expect(() => runtime.register(defineLifecycle(v2(overrides)))).toThrow(
      message,
    );
  });

  it('refuses a key that is the name of a definition of another key', () => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(defineLifecycle(v1({ key: 'other' })));
    expect(() => runtime.register(defineLifecycle(v2()))).toThrow(
      /its key "requests" is the name of a definition of "other"/,
    );
  });

  it('refuses two versions that both lack a definition field', () => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(defineLifecycle(v1({ definitionField: undefined })));
    expect(() =>
      runtime.register(defineLifecycle(v2({ definitionField: undefined }))),
    ).toThrow(/need a definitionField/);
  });

  it('refuses a name that is the key of other definitions', () => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(defineLifecycle(v2()));
    expect(() =>
      runtime.register(
        defineLifecycle(v1({ name: 'requests', key: 'other', version: 1 })),
      ),
    ).toThrow(/its name is the key of "requests-v2"/);
  });
});

describe('records of several versions', () => {
  it('binds a created record to its definition in the same write, and refuses a caller that sets the binding', async () => {
    const { runtime, store } = setup();
    const { record } = await runtime.create('requests', {}, { actor });
    expect(store.record('requests', String(record.id))).toMatchObject({
      definition: 'requests',
      status: 'draft',
    });
    const forged = await refusal(
      runtime.create('requests', { definition: 'requests-v2' }, { actor }),
    );
    expect(forged.code).toBe('INVALID_SET');
  });

  it('refuses a transition whose set would rebind the record', async () => {
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(
      defineLifecycle(
        v1({
          transitions: {
            send: {
              from: 'draft',
              to: 'sent',
              set: () => ({ definition: 'requests-v2' }),
            },
            finish: { from: 'sent', to: 'done', manual: false },
          },
        }),
      ),
      { services: { sent: [] } },
    );
    const { record } = await runtime.create('requests', {}, { actor });
    const error = await refusal(
      runtime.fire('requests', record.id, 'send', { actor }),
    );
    expect(error.code).toBe('INVALID_SET');
  });

  it("refuses every operation that names another version than the record's", async () => {
    const { runtime } = setup();
    const { record } = await runtime.create('requests', {}, { actor });
    const id = record.id;
    for (const work of [
      runtime.view('requests-v2', id, actor),
      runtime.available('requests-v2', id, actor),
      runtime.can('requests-v2', id, 'submit', actor),
      runtime.fire('requests-v2', id, 'submit', { actor }),
      runtime.withParameterExecution('requests-v2', id, () =>
        Promise.resolve(),
      ),
      runtime.transaction((tx) => tx.read('requests-v2', id)),
    ]) {
      const error = await refusal(work);
      expect(error.code).toBe('DEFINITION_MISMATCH');
      expect(error.bound).toBe('requests');
    }
    await expect(runtime.view('requests', id, actor)).resolves.toMatchObject({
      lifecycle: 'requests',
      definitionVersion: 1,
      state: 'draft',
    });
  });

  it('refuses a record no definition started, rather than pick the latest', async () => {
    const { runtime, store } = setup();
    const record = store.insertRecord('requests', {
      status: 'draft',
      lifecycleVersion: 1,
    });
    const error = await refusal(runtime.view('requests', record.id, actor));
    expect(error).toMatchObject({ code: 'DEFINITION_MISMATCH', bound: null });
    expect(lifecycleErrorFields(error)).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'DEFINITION_MISMATCH',
      metadata: { bound: null },
    });
    const unbound = await refusal(
      runtime.boundLifecycle('requests', record.id),
    );
    expect(unbound.code).toBe('DEFINITION_MISMATCH');
  });

  it('finds the definition of a record by its key or by any version name', async () => {
    const { runtime } = setup();
    const old = await runtime.create('requests', {}, { actor });
    const current = await runtime.create('requests-v2', {}, { actor });
    for (const asked of ['requests', 'requests-v2']) {
      await expect(runtime.boundLifecycle(asked, old.record.id)).resolves.toBe(
        'requests',
      );
      await expect(
        runtime.boundLifecycle(asked, current.record.id),
      ).resolves.toBe('requests-v2');
    }
    expect(runtime.recordLifecycle('requests', current.record)).toBe(
      'requests-v2',
    );
    const missing = await refusal(runtime.boundLifecycle('requests', 'nope'));
    expect(missing.code).toBe('RECORD_NOT_FOUND');
    const unknown = await refusal(runtime.boundLifecycle('nothing', 1));
    expect(unknown.code).toBe('UNKNOWN_LIFECYCLE');
  });

  it("refuses a record bound to a definition that is not one of the key's versions", async () => {
    const { runtime, store } = setup();
    const record = store.insertRecord('requests', {
      status: 'draft',
      lifecycleVersion: 1,
      definition: 'retired',
    });
    const error = await refusal(runtime.boundLifecycle('requests', record.id));
    expect(error).toMatchObject({
      code: 'DEFINITION_MISMATCH',
      bound: 'retired',
    });
  });

  it('warns about a legacy definition without a definition field and runs it as before', async () => {
    const store = new MemoryLifecycleStore();
    const logger = { warn: vi.fn(), error: vi.fn() };
    const runtime = new LifecycleRuntime({ store, logger });
    runtime.register(defineLifecycle(v1({ definitionField: undefined })), {
      services: { sent: [] },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('declares no definitionField'),
      { lifecycle: 'requests' },
    );
    // A record written before any binding existed is still its own.
    const record = store.insertRecord('requests', {
      status: 'draft',
      lifecycleVersion: 1,
    });
    const findRecord = vi.spyOn(store, 'findRecord');
    await expect(runtime.boundLifecycle('requests', record.id)).resolves.toBe(
      'requests',
    );
    expect(findRecord).not.toHaveBeenCalled();
    await expect(
      runtime.view('requests', record.id, actor),
    ).resolves.toMatchObject({ lifecycle: 'requests', state: 'draft' });
    const created = await runtime.create('requests', {}, { actor });
    expect(
      store.record('requests', String(created.record.id)),
    ).not.toHaveProperty('definition');
  });

  it('refuses an unbound record of a single version that declares a definition field', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    runtime.register(defineLifecycle(v1()), { services: { sent: [] } });
    const record = store.insertRecord('requests', {
      status: 'draft',
      lifecycleVersion: 1,
    });
    for (const work of [
      runtime.boundLifecycle('requests', record.id),
      runtime.view('requests', record.id, actor),
      runtime.fire('requests', record.id, 'send', { actor }),
    ]) {
      const error = await refusal(work);
      expect(error).toMatchObject({ code: 'DEFINITION_MISMATCH', bound: null });
    }
    expect(() => runtime.recordLifecycle('requests', record)).toThrow(
      /has not been started/,
    );
    // Nor does a sweep pick it up.
    await expect(runtime.runTriggers()).resolves.toBe(0);
    expect(store.record('requests', String(record.id))?.status).toBe('draft');
  });

  it('runs each version as it is defined, its effect and continuation included', async () => {
    const { runtime, services, store } = setup();
    const old = await runtime.create('requests', {}, { actor });
    const current = await runtime.create('requests-v2', {}, { actor });
    await runtime.fire('requests', old.record.id, 'send', { actor });
    const refused = await refusal(
      runtime.fire('requests-v2', current.record.id, 'send', { actor }),
    );
    expect(refused.code).toBe('INVALID_STATE');
    await runtime.fire('requests-v2', current.record.id, 'submit', { actor });
    await runtime.fire('requests-v2', current.record.id, 'send', { actor });
    expect(services.sent).toEqual(['requests', 'requests-v2']);
    expect(store.record('requests', String(old.record.id))).toMatchObject({
      status: 'done',
      definition: 'requests',
    });
    expect(store.record('requests', String(current.record.id))).toMatchObject({
      status: 'done',
      definition: 'requests-v2',
    });
    const runs = await runtime.listEffectRuns({
      recordId: String(old.record.id),
    });
    expect(runs.map((run) => run.lifecycle)).toEqual(['requests']);
  });

  it('sweeps each version over its own records only', async () => {
    const { runtime, store, logger } = setup();
    const old = await runtime.create('requests', {}, { actor });
    const current = await runtime.create('requests-v2', {}, { actor });
    // Both wait in draft; v1 sends from there, v2 submits for review.
    await expect(runtime.runTriggers()).resolves.toBe(2);
    expect(store.record('requests', String(old.record.id))).toMatchObject({
      definition: 'requests',
    });
    expect(store.record('requests', String(old.record.id))?.status).not.toBe(
      'draft',
    );
    expect(store.record('requests', String(current.record.id))).toMatchObject({
      status: 'review',
      definition: 'requests-v2',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('skips a record of another version even when the store ignores the match', async () => {
    const { runtime, store, logger } = setup();
    await runtime.create('requests-v2', {}, { actor });
    const findIdleRecords = store.findIdleRecords.bind(store);
    vi.spyOn(store, 'findIdleRecords').mockImplementation(
      (collection, { match: _match, ...query }) =>
        findIdleRecords(collection, query),
    );
    await expect(runtime.runTriggers()).resolves.toBe(1);
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('parameters isolated by definition version', () => {
  function versions() {
    const store = new MemoryLifecycleStore();
    const parameters = new StoredLifecycleParameters(store);
    const runtime = new LifecycleRuntime({ store });
    const scopes: [string, string][] = [];
    const registration = {
      store: parameters,
      scope: ({ lifecycle, key }: { lifecycle: string; key: string }) => {
        scopes.push([lifecycle, key]);
        return 'demo';
      },
    };
    runtime.register(
      defineLifecycle(
        v1({
          dueAtField: 'dueAt', parameterConfiguration: { groups: [limits] },
        }),
      ),
      { parameterConfiguration: registration, services: { sent: [] } },
    );
    return { store, parameters, runtime, registration, scopes };
  }

  it('reads independent configuration for every version', async () => {
    const { parameters, runtime, registration, scopes } = versions();
    runtime.register(
      defineLifecycle(
        v2({
          dueAtField: 'dueAt', parameterConfiguration: {
            groups: [limits, extras],
          },
        }),
      ),
      { parameterConfiguration: registration, services: { sent: [] } },
    );
    await parameters.save({
      scope: 'demo',
      group: { ...limits, key: 'requests' },
      values: { limit: 25 },
      expectedRevision: 0,
      requestId: 'r1',
      actorId: 'admin',
      at: '2026-11-11T00:00:00Z',
    });
    const old = await runtime.create('requests', {}, { actor });
    const current = await runtime.create('requests-v2', {}, { actor });
    await expect(
      runtime.resolveParameters('requests', {
        record: old.record,
        transactionHandle: undefined,
        purpose: 'preview',
      }),
    ).resolves.toEqual({ limit: 25, extra: 0 });
    await expect(
      runtime.resolveParameters('requests-v2', {
        record: current.record,
        transactionHandle: undefined,
        purpose: 'preview',
      }),
    ).resolves.toEqual({ limit: 10, extra: 0 });
    expect(scopes).toContainEqual(['requests-v2', 'requests']);
    expect(scopes).toContainEqual(['requests', 'requests']);
  });

  it.each<[string, ParameterGroup]>([
    [
      'a field added',
      { ...limits, fields: { ...limits.fields, ...extras.fields } },
    ],
    ['a schema version raised', { ...limits, schemaVersion: 2 }],
    [
      'a field retyped',
      {
        ...limits,
        fields: {
          limit: {
            type: 'string',
            title: 'Limit',
            parse: (value) => String(value),
          },
        },
      },
    ],
  ])('accepts a version whose independent contract has %s', (_, changed) => {
    const { runtime, registration } = versions();
    expect(() =>
      runtime.register(
        defineLifecycle(
          v2({
            parameters: {
              limit: changed.schemaVersion === 2 ? 10 : 10,
              extra: 0,
            },
            dueAtField: 'dueAt', parameterConfiguration: { groups: [changed] },
          }),
        ),
        { parameterConfiguration: registration, services: { sent: [] } },
      ),
    ).not.toThrow();
  });

  it('still reads the shared group for a record of the first version', async () => {
    const { runtime, store } = versions();
    const { record } = await runtime.create('requests', {}, { actor });
    await runtime.fire('requests', record.id, 'send', { actor: SYSTEM_ACTOR });
    expect(store.record('requests', String(record.id))).toMatchObject({
      definition: 'requests',
    });
  });
});
