import { expect, vi } from 'vitest';
import {
  configurationGroup,
  createRepositoryLifecycleStore,
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  StoredLifecycleParameters,
  SYSTEM_ACTOR,
  parameterIdentity,
  type LifecycleRecord,
  type ParameterGroup,
} from '@nocobase/lifecycle';
import { PARAMETER_COLLECTIONS } from '../server/configuration/store.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../server/scope.js';
import { test } from './fixtures.js';
import type { DatabaseManager } from '@nocobase/db';

interface Types {
  record: LifecycleRecord;
  state: 'draft' | 'waiting' | 'done';
  parameters: { left: number; right: number };
}
const group: ParameterGroup = {
  key: 'pair',
  title: 'Pair',
  schemaVersion: 1,
  fields: Object.fromEntries(
    ['left', 'right'].map((field) => [
      field,
      {
        type: 'number' as const,
        title: field,
        parse(value: unknown) {
          if (typeof value !== 'number') throw new Error('Expected number.');
          return value;
        },
      },
    ]),
  ),
  validate(values) {
    if (Number(values.right) !== Number(values.left) * 2)
      throw new Error('Pair must stay consistent.');
  },
};
async function setup(
  database: DatabaseManager,
  options: {
    fail?: boolean;
    draft?: boolean;
    onCreate?: (
      record: LifecycleRecord,
      handle: unknown,
      values: object,
    ) => Promise<void>;
    effect?: (values: object) => void;
  } = {},
) {
  await database.builder().createCollection('snapshotWork', (table) => {
    table.bigInt('id').primary().autoIncrement().notNull();
    table.string('status').notNull();
    table.datetimeTz('statusChangedAt').notNull();
    table.integer('lifecycleVersion').notNull();
    table.string('definition').notNull();
    table.string('title').notNull();
  });
  const store = createRepositoryLifecycleStore(database, {
    collections: LIFECYCLE_EXAMPLE_COLLECTIONS,
  });
  const parameters = new StoredLifecycleParameters(
    store,
    PARAMETER_COLLECTIONS,
  );
  const definition = defineLifecycle<Types>({
    name: 'snapshotWork',
    key: 'snapshotWork',
    version: 1,
    collection: 'snapshotWork',
    definitionField: 'definition',
    initial: options.draft ? 'draft' : 'waiting',
    states: [
      ...(options.draft ? ['draft' as const] : []),
      'waiting',
      { name: 'done', final: true },
    ],
    parameters: { left: 1, right: 2 },
    parameterConfiguration: {
      groups: [group],
    },
    onEnterState: {
      ...(options.draft
        ? {
            draft: [
              async ({
                record,
                tx,
                parameters: values,
              }: {
                record: LifecycleRecord;
                tx: { handle: unknown };
                parameters: object;
              }) => options.onCreate?.(record, tx.handle, values),
            ],
          }
        : {}),
      waiting: [
        () => {
          if (options.fail) throw new Error('state entry failure');
        },
      ],
    },
    onEnter: options.effect
      ? {
          waiting: [
            defineEffect<Types>({
              name: 'inspectSnapshot',
              retry: { attempts: 2 },
              run: ({ parameters: values }) => {
                options.effect!(values);
                return {};
              },
              onSuccess: 'finish',
            }),
          ],
        }
      : {},
    transitions: {
      finish: { from: 'waiting', to: 'done' },
      ...(options.draft
        ? {
            submit: { from: 'draft' as const, to: 'waiting' as const },
            withdraw: { from: 'waiting' as const, to: 'draft' as const },
          }
        : {}),
    },
  });
  const runtime = () => {
    const instance = new LifecycleRuntime({
      store,
      creationRequestsCollection: 'lifecycleExampleCreationRequests',
      dispatcher: { dispatch: async () => {} },
    });
    instance.register(definition, {
      parameterConfiguration: { store: parameters, scope: () => 'tenant' },
    });
    return instance;
  };
  const save = (left: number, expectedRevision: number) =>
    parameters.save({
      scope: 'tenant',
      group: configurationGroup('snapshotWork', [group]),
      values: { left, right: left * 2 },
      expectedRevision,
      requestId: `save-${expectedRevision}`,
      actorId: 'admin',
      at: new Date().toISOString(),
    });
  return { store, parameters, runtime, save };
}

test('concurrent creation retries commit one identity and snapshot; other actors remain isolated', async ({
  database,
}) => {
  const { runtime, parameters, save } = await setup(database);
  const first = runtime();
  const second = runtime();
  const result = await Promise.all([
    first.create(
      'snapshotWork',
      { title: 'one' },
      { actor: SYSTEM_ACTOR, requestId: 'same' },
    ),
    second.create(
      'snapshotWork',
      { title: 'one' },
      { actor: SYSTEM_ACTOR, requestId: 'same' },
    ),
  ]);
  expect(result[0].record.id).toBe(result[1].record.id);
  expect(await database.repository('snapshotWork').count()).toBe(1);
  await save(10, 0);
  expect(
    (
      await second.create(
        'snapshotWork',
        { title: 'one' },
        { actor: SYSTEM_ACTOR, requestId: 'same' },
      )
    ).replayed,
  ).toBe(true);
  expect(
    await parameters.snapshot(
      'tenant',
      'snapshotWork',
      String(result[0].record.id),
    ),
  ).toMatchObject({ revision: 0, values: { left: 1, right: 2 } });
  const other = await second.create(
    'snapshotWork',
    { title: 'one' },
    { actor: { id: 'someone-else' }, requestId: 'same' },
  );
  expect(other.record.id).not.toBe(result[0].record.id);
});

test('configuration save racing creation captures a complete old or new revision', async ({
  database,
}) => {
  const { runtime, parameters, save } = await setup(database);
  const instance = runtime();
  const [created] = await Promise.all([
    instance.create('snapshotWork', { title: 'race' }, { actor: SYSTEM_ACTOR }),
    save(10, 0),
  ]);
  const snapshot = (await parameters.snapshot(
    'tenant',
    'snapshotWork',
    String(created.record.id),
  ))!;
  expect([
    [1, 2],
    [10, 20],
  ]).toContainEqual([snapshot.values.left, snapshot.values.right]);
  expect(snapshot.revision).toBe(snapshot.values.left === 1 ? 0 : 1);
});

test('failed creation rolls back the request, record, snapshot, log and queued facts', async ({
  database,
}) => {
  const options = { fail: true };
  const { runtime, parameters } = await setup(database, options);
  const instance = runtime();
  await expect(
    instance.create(
      'snapshotWork',
      { title: 'retry' },
      { actor: SYSTEM_ACTOR, requestId: 'same' },
    ),
  ).rejects.toThrow('state entry failure');
  for (const collection of [
    'snapshotWork',
    'lifecycleExampleCreationRequests',
    'lifecycleExampleParameterSnapshots',
    'lifecycleExampleTransitions',
    'lifecycleExampleParameterUsages',
  ])
    expect(await database.repository(collection).count()).toBe(0);
  options.fail = false;
  const created = await instance.create(
    'snapshotWork',
    { title: 'retry' },
    { actor: SYSTEM_ACTOR, requestId: 'same' },
  );
  expect(
    await parameters.snapshot(
      'tenant',
      'snapshotWork',
      String(created.record.id),
    ),
  ).toMatchObject({ values: { left: 1, right: 2 } });
});

test('queued effects survive configuration edits and a new runtime, and retries keep the original values', async ({
  database,
}) => {
  let first = true;
  const effect = vi.fn((values: object) => {
    expect(values).toEqual({ left: 1, right: 2 });
    if (first) {
      first = false;
      throw new Error('retry');
    }
  });
  const { runtime, save } = await setup(database, { effect });
  const created = await runtime().create(
    'snapshotWork',
    { title: 'async' },
    { actor: SYSTEM_ACTOR },
  );
  await save(10, 0);
  const restarted = runtime();
  await restarted.runEffect(created.effectRuns[0].id);
  await restarted.runEffect(created.effectRuns[0].id);
  expect(effect).toHaveBeenCalledTimes(2);
  expect(
    (await restarted.view('snapshotWork', created.record.id, SYSTEM_ACTOR))
      .state,
  ).toBe('done');
});

test('edited drafts retain their creation snapshot across failed and successful submission', async ({
  database,
}) => {
  const options = { draft: true, fail: true };
  const { runtime, parameters, save } = await setup(database, options);
  const instance = runtime();
  const created = await instance.create(
    'snapshotWork',
    { title: 'draft' },
    { actor: SYSTEM_ACTOR },
  );
  const recordId = String(created.record.id);
  const before = await parameters.snapshot('tenant', 'snapshotWork', recordId);
  expect(before).toMatchObject({ revision: 0, values: { left: 1, right: 2 } });
  expect(
    await database.repository('lifecycleExampleCreationRequests').count(),
  ).toBe(0);
  await database.repository('snapshotWork').updateMany({
    filter: { id: Number(recordId) },
    values: { title: 'edited', lifecycleVersion: 7 },
  });
  await save(10, 0);
  expect(
    (await instance.view('snapshotWork', recordId, SYSTEM_ACTOR))
      .parameterValues,
  ).toEqual({ left: 1, right: 2 });
  await expect(
    instance.fire('snapshotWork', recordId, 'submit', { actor: SYSTEM_ACTOR }),
  ).rejects.toThrow('state entry failure');
  expect(await parameters.snapshot('tenant', 'snapshotWork', recordId)).toEqual(
    before,
  );
  await save(20, 1);
  options.fail = false;
  await instance.fire('snapshotWork', recordId, 'submit', {
    actor: SYSTEM_ACTOR,
  });
  expect(await parameters.snapshot('tenant', 'snapshotWork', recordId)).toEqual(
    before,
  );
});

test('lost submit logs and a missing snapshot never turn a withdrawn instance into a fresh draft', async ({
  database,
}) => {
  const { runtime, parameters } = await setup(database, { draft: true });
  const instance = runtime();
  const created = await instance.create(
    'snapshotWork',
    { title: 'history' },
    { actor: SYSTEM_ACTOR },
  );
  const recordId = String(created.record.id);
  await instance.fire('snapshotWork', recordId, 'submit', {
    actor: SYSTEM_ACTOR,
  });
  await instance.fire('snapshotWork', recordId, 'withdraw', {
    actor: SYSTEM_ACTOR,
  });
  for (const transition of ['submit', 'withdraw'])
    await database.repository('lifecycleExampleTransitions').deleteMany({
      filter: { lifecycle: 'snapshotWork', recordId, transition },
    });
  await database.repository('lifecycleExampleParameterSnapshots').deleteMany({
    filter: { id: parameterIdentity('tenant', 'snapshotWork', recordId) },
  });
  expect(
    (
      await database
        .repository('lifecycleExampleTransitions')
        .findMany({ filter: { lifecycle: 'snapshotWork', recordId } })
    ).map((entry) => entry.transition),
  ).toEqual(['$create']);
  const read = vi.spyOn(parameters, 'readConfiguration');
  await expect(
    instance.view('snapshotWork', recordId, SYSTEM_ACTOR),
  ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
  await expect(
    instance.fire('snapshotWork', recordId, 'submit', { actor: SYSTEM_ACTOR }),
  ).rejects.toMatchObject({ code: 'PARAMETER_SNAPSHOT_MISSING' });
  expect(read).not.toHaveBeenCalled();
});

test('creation hooks and their nested transitions share one resolution after the snapshot is persisted', async ({
  database,
}) => {
  const { runtime: factory, parameters } = await setup(database, {
    draft: true,
    onCreate: async (record, handle, values) => {
      expect(
        await parameters.snapshot(
          'tenant',
          'snapshotWork',
          String(record.id),
          handle,
        ),
      ).toMatchObject({ values });
      expect(
        await instance.resolveParameters('snapshotWork', {
          record,
          transactionHandle: handle,
          purpose: 'action',
        }),
      ).toEqual(values);
      await instance.fire('snapshotWork', record.id, 'submit', {
        actor: SYSTEM_ACTOR,
        transaction: handle,
      });
    },
  });
  const instance = factory();
  const read = vi.spyOn(parameters, 'readConfiguration');
  const created = await instance.create(
    'snapshotWork',
    { title: 'Nested creation' },
    { actor: SYSTEM_ACTOR },
  );
  expect(read).toHaveBeenCalledTimes(1);
  expect(created.record.status).toBe('waiting');
  expect(
    await parameters.snapshot(
      'tenant',
      'snapshotWork',
      String(created.record.id),
    ),
  ).toMatchObject({ values: { left: 1, right: 2 } });
});

test('existing drafts run from valid creation snapshots when the current persisted configuration is corrupt', async ({
  database,
}) => {
  const { runtime, parameters, save } = await setup(database, { draft: true });
  const instance = runtime();
  const created = await instance.create(
    'snapshotWork',
    { title: 'Historical policy' },
    { actor: SYSTEM_ACTOR },
  );
  const snapshot = await parameters.snapshot(
    'tenant',
    'snapshotWork',
    String(created.record.id),
  );
  await save(10, 0);
  await database.repository('lifecycleExampleParameterVersions').updateMany({
    filter: { id: parameterIdentity('tenant', 'snapshotWork', 1) },
    values: {
      payload: {
        scope: 'tenant',
        group: 'snapshotWork',
        revision: 1,
        schemaVersion: 1,
        values: { left: 'invalid', right: 20 },
        actorId: 'admin',
        at: new Date().toISOString(),
      },
    },
  });
  await expect(
    instance.resolveParameters('snapshotWork', {
      record: null,
      purpose: 'preview',
      transactionHandle: undefined,
    }),
  ).rejects.toThrow();
  expect(
    (await instance.view('snapshotWork', created.record.id, SYSTEM_ACTOR))
      .parameterValues,
  ).toEqual({ left: 1, right: 2 });
  await instance.fire('snapshotWork', created.record.id, 'submit', {
    actor: SYSTEM_ACTOR,
  });
  await instance.withParameterExecution(
    'snapshotWork',
    created.record.id,
    async (values) => {
      expect(values).toEqual({ left: 1, right: 2 });
    },
  );
  expect(
    await parameters.snapshot(
      'tenant',
      'snapshotWork',
      String(created.record.id),
    ),
  ).toEqual(snapshot);
  await expect(
    instance.create(
      'snapshotWork',
      { title: 'New policy' },
      { actor: SYSTEM_ACTOR },
    ),
  ).rejects.toThrow();
  expect(await database.repository('snapshotWork').count()).toBe(1);
});
