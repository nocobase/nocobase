// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createJobExecutorService, type ScheduleJob } from '@nocobase/jobs';
import { createKnowledgeIndexingRegistry } from '../server/indexing/registry.js';
import { createKnowledgeIndexing } from '../server/indexing/runtime.js';
import path from 'node:path';
import Sqlite from 'better-sqlite3';
import { afterEach, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import {
  configOf,
  generationsRepo,
  settingsRepo,
  workRepo,
  requestsRepo,
  sourcesRepo,
} from '../server/indexing/store.js';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import type { IndexingTarget } from '../server/indexing/types.js';
let fixture: IndexingFixture | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});
const day = 86400000;
async function retired() {
  const f = (fixture = await indexingFixture());
  const doc = await f.create();
  const receipt = await f.enable();
  await f.settled(doc.id);
  await expect
    .poll(
      async () =>
        (
          await settingsRepo(f.h.database.connection()).findOne({
            filter: { id: 'global' },
          })
        )?.activeGenerationId,
    )
    .toBe(receipt.generationId);
  await f.runtime.service.save(f.context, {
    requestId: randomUUID(),
    expectedRevision: receipt.revision,
    config: null,
    acknowledgeFullRebuild: false,
  });
  return { f, doc, id: receipt.generationId! };
}
it('keeps the 24-hour grace, drops without calling a removed model, then expires only dropped metadata and receipts after seven days', async () => {
  const { f, doc, id } = await retired();
  const conn = f.h.database.connection();
  const before = await generationsRepo(conn).findOne({ filter: { id } });
  const calls = f.embed.mock.calls.length;
  const identity = vi
    .spyOn(f.model, 'identity')
    .mockRejectedValue(new Error('private removed model'));
  await f.cleanup();
  expect((await generationsRepo(conn).findOne({ filter: { id } }))?.state).toBe(
    'retired',
  );
  f.advance(day + 1);
  await f.cleanup();
  await expect
    .poll(
      async () =>
        (await generationsRepo(conn).findOne({ filter: { id } }))?.state,
    )
    .toBe('dropped');
  expect(identity).not.toHaveBeenCalled();
  expect(f.embed).toHaveBeenCalledTimes(calls);
  expect(
    await workRepo(conn).findMany({ filter: { generationId: id } }),
  ).not.toHaveLength(0);
  const db = new Sqlite(path.join(f.h.storage, 'vectors.sqlite'));
  try {
    expect(
      db
        .prepare('SELECT state FROM __kb_index_targets WHERE generationId=?')
        .get(id),
    ).toEqual({ state: 'closed' });
    f.advance(7 * day + 1);
    await f.cleanup();
    expect(
      await generationsRepo(conn).findOne({ filter: { id } }),
    ).toBeUndefined();
    expect(
      await workRepo(conn).findMany({ filter: { generationId: id } }),
    ).toEqual([]);
    expect(await requestsRepo(conn).findMany()).toEqual([]);
    expect(
      await sourcesRepo(conn).findOne({ filter: { docId: doc.id } }),
    ).not.toBeNull();
    expect(
      await f.h.knowledge.docs.get(f.h.user('admin'), doc.id),
    ).toMatchObject({ id: doc.id });
    expect(
      db
        .prepare('SELECT state FROM __kb_index_targets WHERE generationId=?')
        .get(id),
    ).toEqual({ state: 'closed' });
    expect(before?.cleanupAfter).not.toBeNull();
  } finally {
    db.close();
  }
});
it('protects current active and failed building pointers even when their cleanup timestamps are forced into the past', async () => {
  const f = (fixture = await indexingFixture());
  const doc = await f.create();
  const enabled = await f.enable();
  await f.settled(doc.id);
  const rebuilt = await f.runtime.service.rebuild(f.context, {
    requestId: randomUUID(),
    expectedRevision: enabled.revision,
    acknowledgeFullRebuild: true,
  });
  const conn = f.h.database.connection();
  await f.executor.shutdown();
  await generationsRepo(conn).updateMany({
    filter: { id: rebuilt.generationId! },
    values: { state: 'failed', cleanupAfter: '2000-01-01T00:00:00.000Z' },
  });
  await settingsRepo(conn).updateMany({
    filter: { id: 'global' },
    values: {
      activeGenerationId: enabled.generationId,
      buildingGenerationId: rebuilt.generationId,
    },
  });
  await generationsRepo(conn).updateMany({
    filter: { id: enabled.generationId! },
    values: { cleanupAfter: '2000-01-01T00:00:00.000Z' },
  });
  const add = vi.spyOn(f.executor, 'addJob');
  f.advance(20 * day);
  await f.cleanup();
  expect(add).not.toHaveBeenCalled();
  expect(
    (
      await generationsRepo(conn).findOne({
        filter: { id: rebuilt.generationId! },
      })
    )?.state,
  ).toBe('failed');
  expect(
    await generationsRepo(conn).findOne({
      filter: { id: enabled.generationId! },
    }),
  ).not.toBeNull();
});
it('limits each sweep to ten targets and rotates enqueue failures without forgetting any external intent', async () => {
  const { f, id } = await retired();
  const conn = f.h.database.connection();
  const row = (await generationsRepo(conn).findOne({ filter: { id } }))!;
  for (let i = 0; i < 11; i++)
    await generationsRepo(conn).createOne({
      values: { ...row, id: randomUUID() },
    });
  f.advance(day + 1);
  const add = vi
    .spyOn(f.executor, 'addJob')
    .mockRejectedValue(new Error('private queue connection'));
  await f.cleanup();
  expect(add).toHaveBeenCalledTimes(10);
  const first = new Set(
    add.mock.calls.map(
      ([job]) => (job.payload as { generationId: string }).generationId,
    ),
  );
  f.advance(3600000);
  add.mockClear();
  await f.cleanup();
  expect(add).toHaveBeenCalledTimes(10);
  const second = add.mock.calls.map(
    ([job]) => (job.payload as { generationId: string }).generationId,
  );
  expect(second.filter((key) => !first.has(key))).toHaveLength(2);
  expect(await generationsRepo(conn).findMany()).toHaveLength(12);
  expect(f.errors).toContain('INDEXING_CLEANUP_DISPATCH_FAILED');
});
it('writes a closed marker even for an uninitialized superseded generation and refuses a late ensure', async () => {
  const f = (fixture = await indexingFixture());
  const add = vi
    .spyOn(f.executor, 'addJob')
    .mockResolvedValue({ jobId: 'lost-enqueue' });
  const receipt = await f.enable();
  await f.runtime.service.save(f.context, {
    requestId: randomUUID(),
    expectedRevision: receipt.revision,
    config: null,
    acknowledgeFullRebuild: false,
  });
  const conn = f.h.database.connection();
  const generation = (await generationsRepo(conn).findOne({
    filter: { id: receipt.generationId! },
  }))!;
  expect(generation.dimension).toBe(3);
  expect(generation.target).toMatchObject({ resource: null });
  add.mockRestore();
  f.advance(day + 1);
  await f.cleanup();
  await expect
    .poll(
      async () =>
        (await generationsRepo(conn).findOne({ filter: { id: generation.id } }))
          ?.state,
    )
    .toBe('dropped');
  const settings = (await settingsRepo(conn).findOne({
    filter: { id: 'global' },
  }))!;
  const target: IndexingTarget = {
    namespace: settings.namespace,
    generationId: generation.id,
    type: generation.type,
    contractVersion: generation.contractVersion,
    options: configOf(generation)!.options,
    dimension: generation.dimension,
    identityHash: generation.configHash,
  };
  const late = sqliteVecIndexingExtension.create({
    key: 'local',
    config: { file: 'vectors.sqlite' },
    storagePath: f.h.storage,
    onError: vi.fn(),
  });
  try {
    await expect(
      late.ensureTarget(target, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT' });
  } finally {
    await late.close();
  }
});

it('refuses cleanup after a deployment key is relocated and succeeds only when its original resource is restored', async () => {
  const { f, id } = await retired();
  await f.runtime.close();
  const clock = new Date(Date.now() + 2 * day);
  async function boot(file: string) {
    const host = createJobExecutorService(
      { default: 'local', local: { adapter: 'memory' } },
      { appName: 'cleanup-' + randomUUID(), storagePath: f.h.storage },
    );
    const executor = host.getJobExecutor('@nocobase/app-plugin-knowledge');
    const schedule = host.getScheduleExecutor('@nocobase/app-plugin-knowledge');
    let cleanup: ScheduleJob | undefined;
    const original = schedule.addJob.bind(schedule);
    vi.spyOn(schedule, 'addJob').mockImplementation(
      async (rule, registerOnly) => {
        if (rule.name === 'knowledge.indexing.cleanup') cleanup = rule;
        return original(rule, registerOnly);
      },
    );
    const registry = createKnowledgeIndexingRegistry();
    registry.register(sqliteVecIndexingExtension);
    const runtime = createKnowledgeIndexing({
      database: f.h.database,
      knowledge: f.h.knowledge,
      registry,
      indexing: { local: { name: 'Local', type: 'sqlite-vec', file } },
      embedding: () => null,
      jobs: () => ({ executor, schedule }),
      newId: randomUUID,
      now: () => clock,
      storagePath: f.h.storage,
      onError: vi.fn(),
    });
    await runtime.start();
    return {
      runtime,
      host,
      async sweep() {
        await cleanup!.execute({
          jobId: randomUUID(),
          scheduledAt: clock,
          runAt: clock,
          signal: new AbortController().signal,
        });
      },
    };
  }
  const relocated = await boot('moved.sqlite');
  try {
    await relocated.sweep();
    await expect
      .poll(
        async () =>
          (
            await generationsRepo(f.h.database.connection()).findOne({
              filter: { id },
            })
          )?.errorReason,
      )
      .toBe('INDEXING_TARGET_OWNERSHIP_CONFLICT');
    expect(existsSync(path.join(f.h.storage, 'moved.sqlite'))).toBe(false);
  } finally {
    await relocated.runtime.close();
    await relocated.host.shutdown();
  }
  clock.setTime(clock.getTime() + 3600000);
  const restored = await boot('vectors.sqlite');
  try {
    await restored.sweep();
    await expect
      .poll(
        async () =>
          (
            await generationsRepo(f.h.database.connection()).findOne({
              filter: { id },
            })
          )?.state,
      )
      .toBe('dropped');
  } finally {
    await restored.runtime.close();
    await restored.host.shutdown();
  }
});

it('retains ownership failures for later repair instead of claiming that another owner’s target was reclaimed', async () => {
  const { f, id } = await retired();
  const conn = f.h.database.connection();
  const generation = (await generationsRepo(conn).findOne({ filter: { id } }))!;
  const db = new Sqlite(path.join(f.h.storage, 'vectors.sqlite'));
  try {
    db.prepare(
      'UPDATE __kb_index_targets SET identityHash=? WHERE generationId=?',
    ).run('different-owner', id);
    f.advance(day + 1);
    await f.cleanup();
    await expect
      .poll(
        async () =>
          (await generationsRepo(conn).findOne({ filter: { id } }))
            ?.errorReason,
      )
      .toBe('INDEXING_TARGET_OWNERSHIP_CONFLICT');
    expect(
      (await generationsRepo(conn).findOne({ filter: { id } }))?.state,
    ).toBe('dropping');
    expect(
      db
        .prepare('SELECT state FROM __kb_index_targets WHERE generationId=?')
        .get(id),
    ).toEqual({ state: 'open' });
    f.advance(8 * day);
    await f.cleanup();
    expect(
      await generationsRepo(conn).findOne({ filter: { id } }),
    ).toBeDefined();
    db.prepare(
      'UPDATE __kb_index_targets SET identityHash=? WHERE generationId=?',
    ).run(generation.configHash, id);
    f.advance(3600000);
    await f.cleanup();
    await expect
      .poll(
        async () =>
          (await generationsRepo(conn).findOne({ filter: { id } }))?.state,
      )
      .toBe('dropped');
    expect(
      (await generationsRepo(conn).findOne({ filter: { id } }))?.errorReason,
    ).toBeNull();
  } finally {
    db.close();
  }
});
