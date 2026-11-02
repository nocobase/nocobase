// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { randomUUID } from 'node:crypto';
import { createJobExecutorService } from '@nocobase/jobs';
import { createKnowledgeIndexing } from '../server/indexing/runtime.js';
import { createKnowledgeIndexingRegistry } from '../server/indexing/registry.js';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import { workRepo } from '../server/indexing/store.js';
describe('host-owned Knowledge job attempts', () => {
  let f: IndexingFixture;
  afterEach(async () => {
    await f?.close();
    vi.restoreAllMocks();
  });
  it('uses host attempts for a documented transient failure', async () => {
    let calls = 0;
    f = await indexingFixture({
      attempts: 2,
      embed: async ({ values }) => {
        if (++calls === 1)
          throw Object.assign(new Error('Private provider details.'), {
            code: 'network',
          });
        return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
      },
    });
    const doc = await f.create();
    await f.enable();
    await f.settled(doc.id);
    expect(calls).toBe(2);
    expect((await f.runtime.service.status(f.context)).availability).toBe(
      'ready',
    );
  });
  it('records permanent failure without consuming more host attempts or sweeping it forever', async () => {
    f = await indexingFixture({
      attempts: 4,
      embed: async () => {
        throw new Error('Private provider key.');
      },
    });
    const doc = await f.create();
    await f.enable();
    await expect
      .poll(
        async () =>
          (await f.runtime.service.status(f.context)).target?.documents.failed,
      )
      .toBe(1);
    f.advance(600001);
    await f.tick();
    await f.tick();
    expect(f.embed).toHaveBeenCalledTimes(1);
    const status = await f.runtime.service.status(f.context);
    expect(status.serving).toBeNull();
    expect(JSON.stringify(status)).not.toContain('Private provider key');
    expect(
      (await f.h.knowledge.indexing.doc(f.h.user('admin'), doc.id)).state,
    ).toBe('failed');
  });
  it('acknowledges duplicate delivery of an already applied revision without embedding it again', async () => {
    f = await indexingFixture();
    const sent = vi.spyOn(f.executor, 'addJob');
    const doc = await f.create();
    await f.enable();
    await f.settled(doc.id);
    const job = sent.mock.calls.find(
      ([value]) => value.constructor.name === 'DocumentJob',
    )?.[0];
    expect(job).toBeDefined();
    let ended = 0;
    const unsubscribe = f.executor.subscribe((event) => {
      if (
        event.name === 'JobEnd' &&
        event.jobName === 'knowledge.indexing.document'
      )
        ended++;
    });
    f.embed.mockClear();
    await f.executor.addJob(job!);
    await f.executor.addJob(job!);
    await expect.poll(() => ended).toBe(2);
    expect(f.embed).not.toHaveBeenCalled();
    expect(
      (await f.h.knowledge.indexing.doc(f.h.user('admin'), doc.id)).state,
    ).toBe('done');
    unsubscribe();
  });
  it('restores an interrupted Memory attempt without turning it into an ordinary failure', async () => {
    const started = Promise.withResolvers<void>();
    let calls = 0;
    f = await indexingFixture({
      attempts: 1,
      embed: async ({ values }) => {
        if (++calls === 1) {
          started.resolve();
          await new Promise<void>(() => {});
        }
        return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
      },
    });
    const doc = await f.create();
    await f.enable();
    await started.promise;
    await f.runtime.close();
    expect(
      (
        await workRepo(f.h.database.connection()).findOne({
          filter: { docId: doc.id },
        })
      )?.state,
    ).toBe('pending');
    const service = createJobExecutorService(
      {
        default: 'local',
        local: { adapter: 'memory', attempts: 1, concurrency: 1 },
      },
      { appName: 'kb-fixture', storagePath: f.h.storage },
    );
    const executor = service.getJobExecutor('@nocobase/app-plugin-knowledge');
    const schedule = service.getScheduleExecutor(
      '@nocobase/app-plugin-knowledge',
    );
    const attempts: number[] = [];
    executor.subscribe((event) => {
      if (
        event.name === 'JobStart' &&
        event.jobName === 'knowledge.indexing.document'
      )
        attempts.push(event.attempt);
    });
    const registry = createKnowledgeIndexingRegistry();
    registry.register(sqliteVecIndexingExtension);
    const runtime = createKnowledgeIndexing({
      database: f.h.database,
      knowledge: f.h.knowledge,
      registry,
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
      embedding: () => f.model,
      jobs: () => ({ executor, schedule }),
      newId: randomUUID,
      storagePath: f.h.storage,
      onError: () => {},
    });
    try {
      await runtime.start();
      await f.settled(doc.id);
      expect(calls).toBe(2);
      expect(attempts).toEqual([2]);
    } finally {
      await runtime.close();
      await service.shutdown();
    }
  });
});
