import path from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  SubmissionController,
  deriveSubmissionKey,
} from '@nocobase/app-client';
import { createFixture } from './helpers.js';
import { atomicRepository, atomicUpdate } from '../client/atomic.js';
import {
  prepareRelationLab,
  executeRelationLab,
} from '../client/relation-lab.js';

let fixture: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  fixture = await createFixture(true);
  await fixture.database
    .createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-repository-example',
    })
    .run();
});
afterEach(async () => {
  await fixture.destroy();
});

it('strict atomic entry retries a committed increment with one operation key and permits a new increment', async () => {
  const repo = atomicRepository(fixture.api);
  const input = atomicUpdate('demo-visits', { increment: 1 });
  await expect(repo.updateOne(input)).rejects.toMatchObject({
    reason: 'OPERATION_KEY_REQUIRED',
  });
  const controller = new SubmissionController();
  await expect(
    controller.run(input, async (key) => {
      await repo.updateOne({ ...input, idempotencyKey: key });
      throw new TypeError('Committed response lost');
    }),
  ).rejects.toThrow('Committed response lost');
  await controller.run(input, (key) =>
    repo.updateOne({ ...input, idempotencyKey: key }),
  );
  expect((await repo.findOne({ filter: { id: 'demo-visits' } }))?.value).toBe(
    1,
  );
  await controller.run(input, (key) =>
    repo.updateOne({ ...input, idempotencyKey: key }),
  );
  expect((await repo.findOne({ filter: { id: 'demo-visits' } }))?.value).toBe(
    2,
  );
});

it('retains each of ten intentional sub-operations when the group response is lost', async () => {
  const repo = atomicRepository(fixture.api);
  const controller = new SubmissionController();
  const input = atomicUpdate('demo-visits', { increment: 1 });
  const execute = (key: string) =>
    Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repo.updateOne({
          ...input,
          idempotencyKey: deriveSubmissionKey(key, String(index)),
        }),
      ),
    );
  await expect(
    controller.run(input, async (key) => {
      await execute(key);
      throw new TypeError('Group response lost');
    }),
  ).rejects.toThrow('Group response lost');
  await controller.run(input, execute);
  expect((await repo.findOne({ filter: { id: 'demo-visits' } }))?.value).toBe(
    10,
  );
});

it('strict relation preparation and nested create keep their derived identities across retry', async () => {
  const preparation = new SubmissionController();
  await expect(
    preparation.run({ operation: 'create', relation: 'tasks' }, async (key) => {
      await prepareRelationLab(fixture.api, 'create', 'tasks', key);
      throw new TypeError('Preparation response lost');
    }),
  ).rejects.toThrow('Preparation response lost');
  const lab = await preparation.run(
    { operation: 'create', relation: 'tasks' },
    (key) => prepareRelationLab(fixture.api, 'create', 'tasks', key),
  );
  expect(lab).toBeDefined();
  const input = {
    targetId: '',
    selectedIds: [],
    content: 'Synthetic nested task',
    points: 1,
    status: 'draft',
    role: 'primary',
  };
  const controller = new SubmissionController();
  await expect(
    controller.run(input, async (key) => {
      await executeRelationLab(fixture.api, lab!, input, key);
      throw new TypeError('Mutation response lost');
    }),
  ).rejects.toThrow('Mutation response lost');
  await controller.run(input, (key) =>
    executeRelationLab(fixture.api, lab!, input, key),
  );
  const rows = await fixture.api
    .repository('repositoryExampleRelationTasks')
    .findMany({ filter: { id: lab!.nextId } });
  expect(rows).toHaveLength(1);
});
