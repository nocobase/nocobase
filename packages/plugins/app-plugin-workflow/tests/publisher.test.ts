import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/db-testing';
import {
  buildWorkflowArtifact,
  type WorkflowDistArtifact,
} from '../build/artifact-builder.js';
import { LocalWorkflowArtifactStore } from '../server/loader/artifact-store.js';
import { WorkflowPublisher } from '../server/loader/synchronizer.js';
import { asIdFilter } from '../server/engine/utils.js';
import {
  createWorkflowTestDatabase,
  insertTestRun,
  testStore,
} from './helpers.js';
const roots: string[] = [];
async function artifact(
  root: string,
  key: string,
  title: string,
): Promise<WorkflowDistArtifact> {
  const definition = {
    title,
    inputSchema: { type: 'object' as const },
    nodes: [],
  };
  const built = buildWorkflowArtifact({
    key,
    flatIr: { ...definition, start: null, nodes: [] },
  });
  const directory = path.join(root, key, built.digest);
  for (const [file, content] of built.files) {
    const target = path.join(directory, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  return { key, digest: built.digest, directory, workflow: built.workflow };
}
describe('workflow publisher', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let storage: string;
  let store: LocalWorkflowArtifactStore;
  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    storage = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-publish-'));
    roots.push(storage);
    store = new LocalWorkflowArtifactStore({
      storeRoot: path.join(storage, 'private'),
    });
  });
  afterEach(async () => {
    await testDatabase.destroy();
    await Promise.all(
      roots
        .splice(0)
        .map((root) => fs.rm(root, { recursive: true, force: true })),
    );
  });
  it('is idempotent, keeps revisions immutable, and preserves historical hashes', async () => {
    const publisher = new WorkflowPublisher({ database, artifactStore: store });
    const v1 = await artifact(storage, 'x', 'v1');
    await store.commit(v1.key, v1.digest, v1.directory);
    const first = await publisher.registerArtifact(v1);
    expect(first.action).toBe('created');
    expect((await publisher.registerArtifact(v1)).action).toBe('unchanged');
    const v2 = await artifact(storage, 'x', 'v2');
    await store.commit(v2.key, v2.digest, v2.directory);
    const second = await publisher.registerArtifact(v2);
    expect(second.action).toBe('created');
    expect(second.workflowId).not.toBe(first.workflowId);
    const oldRunId = await insertTestRun(database, {
      workflowId: second.workflowId,
      workflowKey: 'x',
      eventKey: 'pinned',
      hash: v2.digest,
    });
    const v3 = await artifact(storage, 'x', 'v3');
    await store.commit(v3.key, v3.digest, v3.directory);
    const third = await publisher.registerArtifact(v3);
    expect(third.action).toBe('created');
    expect(third.workflowId).not.toBe(second.workflowId);
    await publisher.activate(third.workflowId);
    await expect(
      testStore(database).runs.findOne({
        filter: { id: asIdFilter(oldRunId) },
        select: (select) => select.fields('workflowId', 'hash'),
      }),
    ).resolves.toEqual({ workflowId: second.workflowId, hash: v2.digest });
  });
  it('rolls back DB registration after a consistency failure while leaving the imported orphan safe', async () => {
    const value = await artifact(storage, 'bad', 'bad');
    await store.commit(value.key, value.digest, value.directory);
    const publisher = new WorkflowPublisher({
      database,
      artifactStore: store,
      afterMaterialize: async (workflowId, store) => {
        await store.nodes.createOne({
          values: {
            workflowId: asIdFilter(workflowId),
            key: 'rogue',
            type: 'rogue',
            config: '{}',
          },
        });
      },
    });
    await expect(publisher.registerArtifact(value)).rejects.toThrow(
      /node count mismatch/,
    );
    await expect(
      testStore(database).workflows.exists({ filter: { key: 'bad' } }),
    ).resolves.toBe(false);
    await expect(store.has('bad', value.digest)).resolves.toBe(true);
  });
});
