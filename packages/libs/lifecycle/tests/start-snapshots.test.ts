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
        ...(creation ? {} : { startTransition: 'submit' }),
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
    ).toEqual({ wait: 500, second: 1000 });
    expect(read).not.toHaveBeenCalled();
    expect(
      await parameters.snapshot('tenant', 'work', String(a.record.id)),
    ).toMatchObject({
      revision: 1,
      at: '2026-11-13T00:00:00.000Z',
      values: { wait: 500, second: 1000 },
    });
  });
  it('starts a draft with current values and retains them after withdrawal and resubmission', async () => {
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
    ).toEqual({ wait: 300, second: 600 });
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
    ).rejects.toMatchObject({ code: 'PARAMETER_START_UNKNOWN' });
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
