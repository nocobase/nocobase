import type { CollectionDefinition, RepositoryRecord } from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/db-testing/vitest';
import { describe, expect } from 'vitest';

import {
  WORKFLOW_COLLECTIONS,
  workflowCollectionSchemas,
} from '../server/collections/index.js';
import { asId, asIdFilter } from '../server/engine/utils.js';
import { createWorkflowCollections } from './helpers.js';

const test = createDatabaseTest();

describe('workflow collections', () => {
  test('creates the six workflow tables with NocoBase 3 naming', async ({
    database,
    expectCollection,
  }) => {
    await createWorkflowCollections(database.builder());

    for (const name of Object.values(WORKFLOW_COLLECTIONS)) {
      await expectCollection(name).toExist();
    }

    for (const [collection, field] of [
      [WORKFLOW_COLLECTIONS.nodes, 'workflowId'],
      [WORKFLOW_COLLECTIONS.runs, 'eventKey'],
      [WORKFLOW_COLLECTIONS.runs, 'input'],
      [WORKFLOW_COLLECTIONS.runs, 'parameters'],
      [WORKFLOW_COLLECTIONS.runs, 'parentRunId'],
      [WORKFLOW_COLLECTIONS.runs, 'hash'],
      [WORKFLOW_COLLECTIONS.runs, 'finishedAt'],
      [WORKFLOW_COLLECTIONS.workflows, 'parametersSchema'],
      [WORKFLOW_COLLECTIONS.workflows, 'parameterValues'],
      [WORKFLOW_COLLECTIONS.nodes, 'description'],
      [WORKFLOW_COLLECTIONS.nodeRuns, 'error'],
      [WORKFLOW_COLLECTIONS.nodeRuns, 'nodeId'],
      [WORKFLOW_COLLECTIONS.nodeRuns, 'finishedAt'],
    ] as const) {
      await expectCollection(collection).toHaveField(field);
    }
  });

  test('preserves workflow indexes and relation metadata without physical foreign keys', async ({
    database,
    connection,
    expectCollection,
  }) => {
    await createWorkflowCollections(database.builder());

    const workflowSchema = await expectCollection(
      WORKFLOW_COLLECTIONS.workflows,
    ).toExist();
    expect(workflowSchema.indexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ unique: true })]),
    );

    const runs = await expectCollection(WORKFLOW_COLLECTIONS.runs).toExist();
    expect(runs.indexes).toHaveLength(6);

    for (const name of [
      WORKFLOW_COLLECTIONS.nodeRuns,
      WORKFLOW_COLLECTIONS.nodes,
      WORKFLOW_COLLECTIONS.runs,
    ]) {
      expect((await expectCollection(name).toExist()).foreignKeys).toEqual([]);
    }

    const created = async (
      collection: string,
      values: RepositoryRecord,
    ): Promise<number> =>
      asIdFilter(
        asId(
          (
            await connection.repository(collection).createOne({
              values,
              select: (select) => select.fields('id'),
            })
          ).record.id,
        ),
      );
    const workflowId = await created(WORKFLOW_COLLECTIONS.workflows, {
      key: 'order-created',
    });
    const nodeId = await created(WORKFLOW_COLLECTIONS.nodes, {
      key: 'start',
      workflowId,
      type: 'start',
    });
    const runId = await created(WORKFLOW_COLLECTIONS.runs, {
      workflowId,
      workflowKey: 'order-created',
      eventKey: 'event-1',
      createdAt: new Date().toISOString(),
    });
    await created(WORKFLOW_COLLECTIONS.nodeRuns, {
      workflowRunId: runId,
      nodeId,
      nodeKey: 'start',
      status: 1,
      startedAt: new Date().toISOString(),
    });
    // Relations are logical, so deleting a run leaves its node runs untouched at the
    // database level; cascading is the application layer's responsibility. The
    // delete goes through the query builder, which knows nothing of relations.
    await connection.query
      .deleteFrom(WORKFLOW_COLLECTIONS.runs)
      .where('id', '=', runId)
      .execute();
    await expect(
      connection.query
        .selectFrom(WORKFLOW_COLLECTIONS.nodeRuns)
        .selectAll()
        .where('workflowRunId', '=', runId)
        .execute(),
    ).resolves.toHaveLength(1);

    await expect(
      Promise.all(
        workflowCollectionSchemas.map(async ({ name }) =>
          connection.collections.get(name),
        ),
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.workflows }),
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.nodes }),
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.runs }),
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.nodeRuns }),
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.stats }),
        expect.objectContaining({ name: WORKFLOW_COLLECTIONS.versionStats }),
      ]),
    );
    await expect(
      connection.collectionMetadata.get(WORKFLOW_COLLECTIONS.workflows),
    ).resolves.toMatchObject({
      document: {
        relations: {
          nodes: { target: WORKFLOW_COLLECTIONS.nodes },
          runs: { target: WORKFLOW_COLLECTIONS.runs },
        },
      },
    });

    const dryRun = await createWorkflowCollections(database.builder(), {
      dryRun: true,
    });
    const workflows = dryRun.operations[0] as {
      definition: CollectionDefinition;
    };
    expect(workflows.definition.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'nodes',
          type: 'hasMany',
          target: WORKFLOW_COLLECTIONS.nodes,
        }),
        expect.objectContaining({ name: 'revisions', constraints: false }),
        expect.objectContaining({
          name: 'versionStats',
          target: WORKFLOW_COLLECTIONS.versionStats,
        }),
      ]),
    );
  });
});
