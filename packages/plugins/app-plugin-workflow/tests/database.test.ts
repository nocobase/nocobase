import type { Knex } from 'knex';
import { fileURLToPath } from 'node:url';

import { validateMigrations, validateSeeds } from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import { workflowStore } from '../server/collections/store.js';
import { legacyTimestamp } from './integration/helpers.js';

const migrationsDirectory = fileURLToPath(
  new URL('../database/migrations', import.meta.url),
);
const seedsDirectory = fileURLToPath(
  new URL('../database/seeds', import.meta.url),
);
const createMigrationName = '202608200001_create_workflow_collections';
const sourceMigrationName = '202609090001_add_workflow_run_source';
const instantMigrationName = '202609110001_workflow_instant_columns';
const clientMigrationName = '202609130001_add_workflow_client';
const waitMigrationName = '202609300001_workflow_resume_requests';
const idMigrationName = '202610010001_workflow_application_ids';
const migrationNames = [
  createMigrationName,
  sourceMigrationName,
  instantMigrationName,
  clientMigrationName,
  waitMigrationName,
  idMigrationName,
];
/** Columns that hold an instant and therefore must resolve as `datetimeTz`. */
const instantFields = {
  workflowRuns: ['startedAt', 'finishedAt', 'expiresAt', 'createdAt'],
  workflowNodeRuns: ['startedAt', 'finishedAt', 'expiresAt'],
} as const;
const collectionNames = [
  'workflows',
  'workflowNodes',
  'workflowRuns',
  'workflowNodeRuns',
  'workflowStats',
  'workflowVersionStats',
  'workflowResumeRequests',
] as const;

const test = createDatabaseTest();

describe('@nocobase/app-plugin-workflow database', () => {
  it('provides the workflow collections migration and no seeds', async () => {
    const migrations = await validateMigrations(migrationsDirectory);
    expect(migrations.map((migration) => migration.name)).toEqual(
      migrationNames,
    );
    await expect(validateSeeds(seedsDirectory)).resolves.toEqual([]);
  });

  test('creates and drops the fixed workflow schema', async ({
    database,
    expectCollection,
  }) => {
    const migrator = database.createMigrator({
      directory: migrationsDirectory,
      packageName: '@nocobase/app-plugin-workflow',
    });

    // Applied in separate batches so each reversible migration can be
    // verified independently below.
    await expect(migrator.upTo(createMigrationName)).resolves.toMatchObject({
      executed: [createMigrationName],
      skipped: [],
    });
    // A row written the way the engine used to write one: the UTC wall
    // clock, with nothing recording that it is UTC. Converting the column
    // has to read it back as the same instant, whatever time zone the
    // database server happens to be configured with.
    const legacy = '2026-08-24T01:18:19.007Z';
    // Bound as raw SQL on purpose. These bytes were written by an older build,
    // through a query builder that passed strings to the driver untouched, so
    // they must not go through the temporal encoder of the build under test —
    // it would resolve the offset against the host and store a wall clock,
    // which is a different row from the one the migration has to convert.
    // MySQL rejects the `T` and `Z` of that string, so there it is the
    // zone-free form that build stored instead.
    const legacyBinding = (await database.connection().client<Knex>()).raw(
      '?',
      [legacyTimestamp(legacy)],
    );
    await database
      .query()
      .insertInto('workflowRuns')
      .values({
        workflowId: 1,
        workflowKey: 'legacy',
        eventKey: 'legacy',
        input: JSON.stringify({}),
        parameters: JSON.stringify({}),
        stack: JSON.stringify([]),
        output: JSON.stringify(null),
        dispatched: false,
        manually: false,
        createdAt: legacyBinding,
      })
      .execute();

    await expect(migrator.upTo(sourceMigrationName)).resolves.toMatchObject({
      executed: [sourceMigrationName],
      skipped: [createMigrationName],
    });
    await expect(migrator.upTo(instantMigrationName)).resolves.toMatchObject({
      executed: [instantMigrationName],
      skipped: [createMigrationName, sourceMigrationName],
    });
    const workflows = database.repository('workflows');
    await workflows.createOne({ values: { key: 'existing-workflow' } });
    await expect(migrator.upTo(waitMigrationName)).resolves.toMatchObject({
      executed: [clientMigrationName, waitMigrationName],
      skipped: [createMigrationName, sourceMigrationName, instantMigrationName],
    });
    const connection = database.connection();
    const migrated = await workflowStore(database).runs.findOne({
      filter: { eventKey: 'legacy' },
      select: (select) => select.fields('createdAt'),
    });
    expect(migrated?.createdAt).toBe(legacy);
    await expect(
      Promise.all(
        collectionNames.map((name) => connection.builder.hasCollection(name)),
      ),
    ).resolves.toEqual(collectionNames.map(() => true));
    const collections = await Promise.all(
      collectionNames.map((name) => connection.collections.get(name)),
    );
    expect(collections.map((collection) => collection?.name)).toEqual(
      collectionNames,
    );
    expect(collections[0]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', autoIncrement: true }),
        expect.objectContaining({
          name: 'nodes',
          type: 'hasMany',
          target: 'workflowNodes',
        }),
      ]),
    );
    expect(collections[3]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'workflowRunId',
          nullable: false,
        }),
        expect.objectContaining({
          name: 'workflowRun',
          type: 'belongsTo',
          target: 'workflowRuns',
        }),
      ]),
    );

    expect(collections[6]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'nodeRunId', nullable: false }),
        expect.objectContaining({ name: 'idempotencyKey', nullable: false }),
        expect.objectContaining({ name: 'slot' }),
      ]),
    );
    expect(
      (await connection.collections.getPhysical('workflowResumeRequests'))
        ?.columns,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columnName: 'node_run_id',
          nullable: false,
        }),
        expect.objectContaining({
          columnName: 'idempotency_key',
          nullable: false,
        }),
        expect.objectContaining({ columnName: 'slot' }),
      ]),
    );

    // Every run timestamp is an instant. Declared zone-free, PostgreSQL
    // stored it without its offset and its driver rebuilt it in the host's
    // zone, which is what made a finished node look eight hours long.
    for (const [name, fields] of Object.entries(instantFields)) {
      const collection = await connection.collections.get(name);
      expect(
        fields.map(
          (field) =>
            collection?.fields?.find((one) => one.name === field)?.type,
        ),
      ).toEqual(fields.map(() => 'datetimeTz'));
    }

    expect(
      (await connection.collections.get('workflows'))?.fields?.find(
        (field) => field.name === 'client',
      ),
    ).toMatchObject({ type: 'json', nullable: false, defaultValue: {} });
    await expectCollection('workflows').toHaveField('client', {
      nullable: false,
    });
    expect(
      await workflows.findOne({ filter: { key: 'existing-workflow' } }),
    ).toMatchObject({ client: {} });
    await expect(migrator.upTo(waitMigrationName)).resolves.toMatchObject({
      executed: [],
    });
    await workflows.createOne({ values: { key: 'default-client' } });
    expect(
      await workflows.findOne({ filter: { key: 'default-client' } }),
    ).toMatchObject({ client: {} });

    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [waitMigrationName, clientMigrationName],
    });
    await expectCollection('workflows').not.toHaveField('client');
    expect(
      (await connection.collections.get('workflows'))?.fields?.find(
        (field) => field.name === 'client',
      ),
    ).toBeUndefined();
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [instantMigrationName],
    });
    for (const [name, fields] of Object.entries(instantFields)) {
      const rolledBack = await connection.collections.get(name);
      expect(
        fields.map(
          (field) =>
            rolledBack?.fields?.find((one) => one.name === field)?.type,
        ),
      ).toEqual(fields.map(() => 'datetime'));
    }
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [sourceMigrationName],
    });
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [createMigrationName],
    });
    await expect(
      Promise.all(
        collectionNames.map((name) => connection.builder.hasCollection(name)),
      ),
    ).resolves.toEqual(collectionNames.map(() => false));
  });
  test('rebuilds the run tables empty with application-allocated ids, and back', async ({
    database,
  }) => {
    const migrator = database.createMigrator({
      directory: migrationsDirectory,
      packageName: '@nocobase/app-plugin-workflow',
    });
    await migrator.upTo(waitMigrationName);
    const workflow = await database
      .repository('workflows')
      .createOne({ values: { key: 'legacy' } });
    const workflowId = Number(workflow.record.id);
    await database.repository('workflowRuns').createOne({
      values: {
        workflowId,
        workflowKey: 'legacy',
        eventKey: 'legacy-run',
        createdAt: '2026-08-24T01:18:19.007Z',
      },
    });
    await database.repository('workflowNodeRuns').createOne({
      values: {
        workflowRunId: 1,
        nodeId: 1,
        nodeKey: 'legacy-node',
        status: 0,
        startedAt: '2026-08-24T01:18:19.007Z',
      },
    });
    await database.repository('workflowResumeRequests').createOne({
      values: {
        id: 1,
        workflowRunId: 1,
        nodeRunId: 1,
        nodeKey: 'legacy-node',
        instructionType: 'wait',
        idempotencyKey: 'event',
        payloadHash: 'hash',
        state: 'queued',
        slot: 'active',
        createdAt: '2026-08-24T01:18:19.007Z',
      },
    });

    await expect(migrator.latest()).resolves.toMatchObject({
      executed: [idMigrationName],
    });
    const connection = database.connection();
    for (const name of ['workflowRuns', 'workflowNodeRuns']) {
      expect(
        (await connection.collections.get(name))?.fields?.find(
          (field) => field.name === 'id',
        ),
      ).toMatchObject({ type: 'bigInt', autoIncrement: false });
    }
    // The previous rows are not carried over, and neither are the requests
    // that pointed at them.
    for (const name of [
      'workflowRuns',
      'workflowNodeRuns',
      'workflowResumeRequests',
    ]) {
      await expect(database.repository(name).count()).resolves.toBe(0);
    }
    expect(
      (await connection.collections.get('workflowResumeRequests'))?.fields,
    ).toContainEqual(
      expect.objectContaining({
        name: 'attempts',
        type: 'integer',
        nullable: false,
      }),
    );

    // Both tables take the ids they are given, in the range a snowflake
    // service produces, and the relations between them are back.
    await database.repository('workflowRuns').createOne({
      values: {
        id: 389_661_797_122_049,
        workflowId,
        workflowKey: 'legacy',
        eventKey: 'application-run',
        createdAt: '2026-08-24T01:18:19.007Z',
      },
    });
    await database.repository('workflowNodeRuns').createOne({
      values: {
        id: 389_661_797_122_050,
        workflowRunId: 389_661_797_122_049,
        nodeId: 1,
        nodeKey: 'application-node',
        status: 1,
        startedAt: '2026-08-24T01:18:19.007Z',
      },
    });
    expect(
      await database
        .repository('workflowNodeRuns')
        .findOne({ filter: { id: 389_661_797_122_050 } }),
    ).toMatchObject({ workflowRunId: '389661797122049' });
    for (const [name, relation] of [
      ['workflows', 'runs'],
      ['workflowRuns', 'nodeRuns'],
      ['workflowNodeRuns', 'workflowRun'],
    ] as const) {
      expect(
        (await connection.collections.get(name))?.fields?.find(
          (field) => field.name === relation,
        ),
      ).toBeDefined();
    }

    // Going back rebuilds them with generated ids, empty as well.
    await expect(migrator.rollback()).resolves.toMatchObject({
      rolledBack: [idMigrationName],
    });
    for (const name of ['workflowRuns', 'workflowNodeRuns']) {
      expect(
        (await connection.collections.get(name))?.fields?.find(
          (field) => field.name === 'id',
        ),
      ).toMatchObject({ autoIncrement: true });
      await expect(database.repository(name).count()).resolves.toBe(0);
    }
    const generated = await database.repository('workflowRuns').createOne({
      values: {
        workflowId,
        workflowKey: 'legacy',
        eventKey: 'generated-run',
        createdAt: '2026-08-24T01:18:19.007Z',
      },
      select: (select) => select.fields('id'),
    });
    expect(generated.record.id).toBe('1');
  });
});
