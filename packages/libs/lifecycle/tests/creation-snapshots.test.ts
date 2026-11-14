import { describe, expect, it, vi } from 'vitest';
import {
  configurationGroup,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  StoredLifecycleParameters,
  SYSTEM_ACTOR,
  type LifecycleRecord,
  type ParameterGroup,
} from '../src/index.js';

const group: ParameterGroup = {
  key: 'timing',
  title: 'Timing',
  schemaVersion: 1,
  fields: {
    wait: {
      type: 'number',
      title: 'Wait (ms)',
      parse(value) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 1)
          throw new Error('Invalid wait.');
        return value;
      },
    },
    second: {
      type: 'number',
      title: 'Second',
      parse(value) {
        if (typeof value !== 'number') throw new Error('Invalid second.');
        return value;
      },
    },
  },
};
interface Types {
  record: LifecycleRecord;
  state: 'draft' | 'waiting' | 'done';
  parameters: { wait: number; second: number };
}
function setup(creation = false) {
  const store = new MemoryLifecycleStore();
  const parameters = new StoredLifecycleParameters(store);
  let now = Date.parse('2026-11-13T00:00:00Z');
  const runtime = new LifecycleRuntime({ store, clock: () => new Date(now) });
  runtime.register(
    defineLifecycle<Types>({
      name: 'work',
      key: 'work',
      version: 1,
      definitionField: 'definition',
      dueAtField: 'dueAt',
      initial: creation ? 'waiting' : 'draft',
      states: ['draft', 'waiting', { name: 'done', final: true }],
      parameters: { wait: 100, second: 200 },
      parameterConfiguration: {
        groups: [group],
      },
      transitions: {
        submit: { from: 'draft', to: 'waiting' },
        withdraw: { from: 'waiting', to: 'draft' },
        finish: {
          from: 'waiting',
          to: 'done',
          guard: ({ record }) => !record.blocked,
        },
      },
      triggers: {
        finish: {
          transition: 'finish',
          when: 'waiting',
          after: (values) => values.wait,
          batchSize: 10,
        },
      },
    }),
    { parameterConfiguration: { store: parameters, scope: () => 'tenant' } },
  );
  const save = (wait: number, second: number, revision: number) =>
    parameters.save({
      scope: 'tenant',
      group: configurationGroup('work', [group]),
      values: { wait, second },
      expectedRevision: revision,
      requestId: `config-${revision}`,
      actorId: 'admin',
      at: new Date(now).toISOString(),
    });
  return {
    store,
    parameters,
    runtime,
    save,
    advance: (ms: number) => {
      now += ms;
    },
  };
}
describe('complete startup snapshots', () => {
  it('ignores invalid current configuration after start and preserves defaults and provenance', async () => {
    const { runtime, parameters, save } = setup();
    const a = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    await save(500, 1000, 0);
    await runtime.fire('work', a.record.id, 'submit', { actor: SYSTEM_ACTOR });
    const read = vi
      .spyOn(parameters, 'readConfiguration')
      .mockRejectedValue(new Error('broken configuration'));
    expect(
      (await runtime.view('work', a.record.id, SYSTEM_ACTOR)).parameterValues,
    ).toEqual({ wait: 100, second: 200 });
    expect(read).not.toHaveBeenCalled();
    expect(
      await parameters.snapshot('tenant', 'work', String(a.record.id)),
    ).toMatchObject({
      revision: 0,
      at: '2026-11-13T00:00:00.000Z',
      values: { wait: 100, second: 200 },
    });
  });
  it('starts independently with same-name fields having different types, defaults and validation', async () => {
    const store = new MemoryLifecycleStore();
    const parameters = new StoredLifecycleParameters(store);
    const runtime = new LifecycleRuntime({ store });
    const contracts: ParameterGroup[] = [
      {
        key: 'rules',
        title: 'Rules',
        schemaVersion: 1,
        fields: {
          limit: {
            type: 'number',
            title: 'Limit',
            parse(value) {
              if (typeof value !== 'number' || value < 1)
                throw new Error('Positive number required.');
              return value;
            },
          },
        },
      },
      {
        key: 'rules',
        title: 'Rules',
        schemaVersion: 2,
        fields: {
          limit: {
            type: 'string',
            title: 'Limit',
            parse(value) {
              if (typeof value !== 'string' || !value.startsWith('tier-'))
                throw new Error('Tier required.');
              return value;
            },
          },
        },
      },
    ];
    for (const [index, contract] of contracts.entries()) {
      runtime.register(
        defineLifecycle<{
          record: LifecycleRecord;
          state: 'active';
          parameters: { limit: number | string };
        }>({
          name: `contract-v${index + 1}`,
          key: 'contract',
          version: index + 1,
          collection: 'contracts',
          definitionField: 'definition',
          initial: 'active',
          states: [{ name: 'active', final: true }],
          parameters: { limit: index === 0 ? 5 : 'tier-default' },
          parameterConfiguration: { groups: [contract] },
          transitions: {},
        }),
        {
          parameterConfiguration: { store: parameters, scope: () => 'tenant' },
        },
      );
    }
    const first = await runtime.create(
      'contract-v1',
      {},
      { actor: SYSTEM_ACTOR },
    );
    const second = await runtime.create(
      'contract-v2',
      {},
      { actor: SYSTEM_ACTOR },
    );
    for (const [index, contract] of contracts.entries()) {
      await parameters.save({
        scope: 'tenant',
        group: configurationGroup(`contract-v${index + 1}`, [contract]),
        values: { limit: index === 0 ? 20 : 'tier-premium' },
        expectedRevision: 0,
        requestId: `contract-config-${index}`,
        actorId: 'admin',
        at: new Date().toISOString(),
      });
    }
    const third = await runtime.create(
      'contract-v1',
      {},
      { actor: SYSTEM_ACTOR },
    );
    const fourth = await runtime.create(
      'contract-v2',
      {},
      { actor: SYSTEM_ACTOR },
    );
    const values = await Promise.all(
      [first, second, third, fourth].map(
        async (result) =>
          (
            await runtime.view(
              String(result.record.definition),
              result.record.id,
              SYSTEM_ACTOR,
            )
          ).parameterValues,
      ),
    );
    expect(values).toEqual([
      { limit: 5 },
      { limit: 'tier-default' },
      { limit: 20 },
      { limit: 'tier-premium' },
    ]);
    await expect(
      parameters.save({
        scope: 'tenant',
        group: configurationGroup('contract-v2', [contracts[1]!]),
        values: { limit: 20 },
        expectedRevision: 1,
        requestId: 'invalid-v2',
        actorId: 'admin',
        at: new Date().toISOString(),
      }),
    ).rejects.toThrow('Tier required.');
  });
  it('freezes a draft at creation and retains its values after withdrawal and resubmission', async () => {
    const { runtime, save } = setup();
    const a = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    await save(300, 600, 0);
    await runtime.fire('work', a.record.id, 'submit', {
      actor: SYSTEM_ACTOR,
      requestId: 'submit',
    });
    await save(400, 800, 1);
    await runtime.fire('work', a.record.id, 'withdraw', {
      actor: SYSTEM_ACTOR,
    });
    await runtime.fire('work', a.record.id, 'submit', { actor: SYSTEM_ACTOR });
    expect(
      (await runtime.view('work', a.record.id, SYSTEM_ACTOR)).parameterValues,
    ).toEqual({ wait: 100, second: 200 });
    const b = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    await runtime.fire('work', b.record.id, 'submit', { actor: SYSTEM_ACTOR });
    expect(
      (await runtime.view('work', b.record.id, SYSTEM_ACTOR)).parameterValues,
    ).toEqual({ wait: 400, second: 800 });
  });
  it('fires different instances at their own deadlines with one snapshot batch per page', async () => {
    const { runtime, parameters, save, advance } = setup(true);
    const a = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    await save(1000, 2000, 0);
    const b = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    const batch = vi.spyOn(parameters, 'snapshots');
    advance(100);
    expect(await runtime.runTriggers()).toBe(1);
    expect(batch).toHaveBeenCalledTimes(1);
    expect((await runtime.view('work', a.record.id, SYSTEM_ACTOR)).state).toBe(
      'done',
    );
    expect((await runtime.view('work', b.record.id, SYSTEM_ACTOR)).state).toBe(
      'waiting',
    );
    advance(900);
    expect(await runtime.runTriggers()).toBe(1);
  });
  it('replays creation under its original snapshot and refuses reuse with different input', async () => {
    const { runtime, save, parameters } = setup(true);
    const first = await runtime.create(
      'work',
      { title: 'one' },
      { actor: SYSTEM_ACTOR, requestId: 'same' },
    );
    await save(1000, 2000, 0);
    const second = await runtime.create(
      'work',
      { title: 'one' },
      { actor: SYSTEM_ACTOR, requestId: 'same' },
    );
    expect(second.replayed).toBe(true);
    expect(second.record.id).toBe(first.record.id);
    expect(
      await parameters.snapshot('tenant', 'work', String(second.record.id)),
    ).toMatchObject({ values: { wait: 100, second: 200 }, revision: 0 });
    await expect(
      runtime.create(
        'work',
        { title: 'two' },
        { actor: SYSTEM_ACTOR, requestId: 'same' },
      ),
    ).rejects.toMatchObject({ code: 'REQUEST_REUSED' });
  });
  it('rejects missing snapshots even for records returned to the initial state and unknown startup history', async () => {
    const { runtime, store } = setup();
    const legacy = await store.createRecord('work', {
      definition: 'work',
      status: 'draft',
    });
    await expect(
      runtime.view('work', legacy.id, SYSTEM_ACTOR),
    ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
    await store.appendTransition({
      lifecycle: 'work',
      recordId: String(legacy.id),
      transition: 'submit',
      from: 'draft',
      to: 'waiting',
      actorId: 'system',
      input: {},
      version: 1,
      requestId: null,
      at: new Date().toISOString(),
    });
    await expect(
      runtime.view('work', legacy.id, SYSTEM_ACTOR),
    ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
  });
  it('does not infer an unstarted draft from a surviving creation log', async () => {
    const { runtime, store, parameters } = setup();
    const record = await store.createRecord('work', {
      definition: 'work',
      status: 'draft',
      lifecycleVersion: 9,
    });
    await store.appendTransition({
      lifecycle: 'work',
      recordId: String(record.id),
      transition: '$create',
      from: null,
      to: 'draft',
      actorId: 'system',
      input: {},
      version: 1,
      requestId: null,
      at: new Date().toISOString(),
    });
    const read = vi.spyOn(parameters, 'readConfiguration');
    await expect(
      runtime.view('work', record.id, SYSTEM_ACTOR),
    ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
    await expect(
      runtime.fire('work', record.id, 'submit', { actor: SYSTEM_ACTOR }),
    ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
    expect(read).not.toHaveBeenCalled();
  });

  it('never rewrites a draft snapshot during editing or submission and bases a delayed deadline on state entry', async () => {
    const { runtime, store, parameters, save, advance } = setup();
    const created = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
    const before = await parameters.snapshot(
      'tenant',
      'work',
      String(created.record.id),
    );
    expect(before).toMatchObject({
      values: { wait: 100, second: 200 },
      revision: 0,
    });
    expect(store.records('lifecycleCreationRequests')).toHaveLength(0);
    store.patchRecord('work', created.record.id, {
      lifecycleVersion: 8,
      title: 'Edited draft',
    });
    await save(300, 600, 0);
    advance(5000);
    const writes = vi.spyOn(parameters, 'saveSnapshot');
    await runtime.fire('work', created.record.id, 'submit', {
      actor: SYSTEM_ACTOR,
    });
    expect(writes).not.toHaveBeenCalled();
    expect(
      await parameters.snapshot('tenant', 'work', String(created.record.id)),
    ).toEqual(before);
    expect((await store.findRecord('work', created.record.id))?.dueAt).toBe(
      '2026-11-13T00:00:05.100Z',
    );
    advance(99);
    expect(await runtime.runTriggers()).toBe(0);
    advance(1);
    expect(await runtime.runTriggers()).toBe(1);
  });

  it.each([
    'values',
    'scope',
    'revision',
    'at',
    'sources',
    'schemaVersion',
    'group',
    'origin',
    'sourceRevision',
    'nonIsoTime',
    'recovery',
  ])(
    'rejects a draft with invalid snapshot %s without consulting configuration',
    async (field) => {
      const { runtime, store, parameters } = setup();
      const created = await runtime.create('work', {}, { actor: SYSTEM_ACTOR });
      const row = store.records('lifecycleParameterSnapshots')[0]!;
      const payload = structuredClone(row.payload) as Record<string, unknown>;
      const sources = payload.sources as Record<
        string,
        Record<string, unknown>
      >;
      if (field === 'nonIsoTime') payload.at = 'January 1, 2026';
      else if (field === 'recovery')
        payload.recoveredFrom = { transitionId: 12 };
      else if (field === 'values')
        payload.values = { wait: 'wrong', second: 200 };
      else if (field === 'sources') payload.sources = {};
      else if (field === 'schemaVersion') sources.wait.schemaVersion = 2;
      else if (field === 'group') sources.wait.group = 'other';
      else if (field === 'origin') sources.wait.origin = 'unknown';
      else if (field === 'sourceRevision') sources.wait.revision = -1;
      else payload[field] = field === 'revision' ? -1 : 'invalid';
      store.patchRecord('lifecycleParameterSnapshots', row.id, { payload });
      const read = vi.spyOn(parameters, 'readConfiguration');
      await expect(
        runtime.view('work', created.record.id, SYSTEM_ACTOR),
      ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_INVALID' });
      expect(read).not.toHaveBeenCalled();
    },
  );

  it('bounds overdue refusal scans and resumes beyond the refused backlog on the next sweep', async () => {
    const { runtime, store, advance } = setup(true);
    for (let index = 0; index < 101; index++)
      await runtime.create('work', { blocked: true }, { actor: SYSTEM_ACTOR });
    const ready = await runtime.create(
      'work',
      { blocked: false },
      { actor: SYSTEM_ACTOR },
    );
    advance(100);
    const scans = vi.spyOn(store, 'findIdleRecords');
    expect(await runtime.runTriggers()).toBe(0);
    expect(scans).toHaveBeenCalledTimes(10);
    scans.mockClear();
    expect(await runtime.runTriggers()).toBe(1);
    expect(scans).toHaveBeenCalledTimes(1);
    expect(
      (await runtime.view('work', ready.record.id, SYSTEM_ACTOR)).state,
    ).toBe('done');
  });
});
