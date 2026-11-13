import { expect, vi } from 'vitest';
import {
  configurationGroup,
  createRepositoryLifecycleStore,
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  StoredLifecycleParameters,
  SYSTEM_ACTOR,
  type LifecycleRecord,
  type ParameterGroup,
} from '@nocobase/lifecycle';
import { PARAMETER_COLLECTIONS } from '../server/configuration/store.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../server/scope.js';
import { test } from './fixtures.js';
import type { DatabaseManager } from '@nocobase/db';

interface Types {
  record: LifecycleRecord;
  state: 'waiting' | 'done';
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
  options: { fail?: boolean; effect?: (values: object) => void } = {},
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
    initial: 'waiting',
    states: ['waiting', { name: 'done', final: true }],
    parameters: { left: 1, right: 2 },
    parameterConfiguration: { groups: [group] },
    onEnterState: {
      waiting: [
        () => {
          if (options.fail) throw new Error('start failure');
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
    transitions: { finish: { from: 'waiting', to: 'done' } },
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

test('configuration save racing startup captures a complete old or new revision', async ({
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

test('failed startup rolls back the request, record, snapshot, log and queued facts', async ({
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
  ).rejects.toThrow('start failure');
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
