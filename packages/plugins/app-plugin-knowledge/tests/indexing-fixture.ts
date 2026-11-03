import { randomUUID } from 'node:crypto';
import {
  createAuthorization,
  ResourceItems,
} from '@nocobase/authorization/core';
import { createJobExecutorService, type ScheduleJob } from '@nocobase/jobs';
import { vi, expect } from 'vitest';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import { createKnowledgeIndexingRegistry } from '../server/indexing/registry.js';
import { createKnowledgeIndexing } from '../server/indexing/runtime.js';
import type {
  KnowledgeEmbeddingProvider,
  KnowledgeIndexingExtension,
} from '../server/indexing/types.js';
import {
  sourcesRepo,
  workRepo,
  settingsRepo,
} from '../server/indexing/store.js';
import { revisionOf } from '../server/indexing/vector.js';
import { ADMIN, createKnowledgeHarness } from './harness.js';

export async function indexingFixture(
  options: {
    attempts?: number;
    extension?: KnowledgeIndexingExtension;
    concurrency?: number;
    embed?: KnowledgeEmbeddingProvider['embed'];
    dropWake?: boolean;
  } = {},
) {
  const h = await createKnowledgeHarness();
  h.levels.set('admin', ADMIN);
  const space = { scope: 'project', scopeId: 'p1' } as const;
  h.projects.set('p1', { id: 'p1', name: 'Visible', leadUserId: 'admin' });
  const authorization = createAuthorization({
    plugins: [
      {
        id: 'fixture',
        grants: {
          resolve: async () => [],
          resolveAll: async () => [],
          unrestricted: async () => true,
        },
      },
    ],
  });
  const items = new ResourceItems();
  items.add({
    id: 'kb.indexing',
    actions: [{ name: 'read' }, { name: 'configure' }, { name: 'rebuild' }],
  });
  authorization.resourceTypes.add({ type: 'settings', items });
  const context = authorization.for({
    principal: { type: 'user', id: 'admin' },
    subjects: [],
  });
  const embed = vi.fn<KnowledgeEmbeddingProvider['embed']>(
    options.embed ??
      (async ({ values, signal }) => {
        signal.throwIfAborted();
        return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
      }),
  );
  const model: KnowledgeEmbeddingProvider = {
    catalog: async () => [],
    identity: async () => ({ hash: 'fixture-v1', dimensions: 3 }),
    embed,
  };
  const service = createJobExecutorService(
    {
      default: 'local',
      local: {
        adapter: 'memory',
        attempts: options.attempts ?? 1,
        concurrency: options.concurrency ?? 1,
      },
    },
    { appName: 'kb-fixture', storagePath: h.storage },
  );
  const executor = service.getJobExecutor('@nocobase/app-plugin-knowledge');
  const schedule = service.getScheduleExecutor(
    '@nocobase/app-plugin-knowledge',
  );
  const jobRegistration = vi.spyOn(executor, 'registerJob');
  const jobSetup = vi.spyOn(executor, 'setup');
  const scheduleSetup = vi.spyOn(schedule, 'setup');
  const rules = new Map<string, ScheduleJob>();
  const addRule = schedule.addJob.bind(schedule);
  vi.spyOn(schedule, 'addJob').mockImplementation(async (job, registerOnly) => {
    rules.set(job.name, job);
    return addRule(job, registerOnly);
  });
  if (options.dropWake)
    vi.spyOn(h.knowledge.events, 'on').mockImplementation(() => () => {});
  let clock = Date.now();
  const registry = createKnowledgeIndexingRegistry();
  registry.register(options.extension ?? sqliteVecIndexingExtension);
  const errors: string[] = [];
  const runtime = createKnowledgeIndexing({
    database: h.database,
    knowledge: h.knowledge,
    registry,
    indexing: {
      local: {
        name: 'Local',
        type: options.extension?.type ?? 'sqlite-vec',
        file: 'vectors.sqlite',
      },
    },
    embedding: () => model,
    jobs: () => ({ executor, schedule }),
    newId: randomUUID,
    now: () => new Date(clock),
    storagePath: h.storage,
    onError: (reason) => {
      errors.push(reason);
    },
  });
  const register = vi.spyOn(h.knowledge, 'registerIndexer');
  await runtime.start();
  return {
    h,
    jobRegistration,
    jobSetup,
    scheduleSetup,
    indexer: register.mock.calls[0]![0],
    space,
    context,
    runtime,
    service,
    executor,
    schedule,
    rules,
    async cleanup() {
      const rule = rules.get('knowledge.indexing.cleanup');
      if (!rule) throw new Error('Missing cleanup rule.');
      await rule.execute({
        jobId: randomUUID(),
        scheduledAt: new Date(),
        runAt: new Date(),
        signal: new AbortController().signal,
      });
    },
    model,
    embed,
    errors,
    advance(ms: number) {
      clock += ms;
    },
    async tick() {
      const rule = rules.get('knowledge.indexing.reconcile');
      if (!rule) throw new Error('Missing reconcile rule.');
      await rule.execute({
        jobId: randomUUID(),
        scheduledAt: new Date(),
        runAt: new Date(),
        signal: new AbortController().signal,
      });
    },
    async create(content = 'Source text.') {
      return h.knowledge.docs.create(h.user('admin'), {
        ...space,
        title: 'Source',
        content,
      });
    },
    async enable() {
      return runtime.service.save(context, {
        requestId: randomUUID(),
        expectedRevision: '0',
        config: {
          version: 1,
          key: 'local',
          options: { embedding: { modelService: 'fixture', model: 'embed' } },
        },
        acknowledgeFullRebuild: true,
      });
    },
    async settled(docId: string) {
      await expect
        .poll(async () => {
          const source = await sourcesRepo(h.database.connection()).findOne({
            filter: { docId },
          });
          const settings = await settingsRepo(h.database.connection()).findOne({
            filter: { id: 'global' },
          });
          const work = await workRepo(h.database.connection()).findMany({
            filter: { docId },
          });
          const ids = [
            settings?.activeGenerationId,
            settings?.buildingGenerationId,
          ].filter(Boolean);
          const currentWork = work.filter((item) =>
            ids.includes(item.generationId),
          );
          return Boolean(
            source &&
            ids.length > 0 &&
            currentWork.length === ids.length &&
            currentWork.every(
              (item) =>
                item.state === 'done' &&
                revisionOf(item.appliedRevision) ===
                  revisionOf(source.revision),
            ),
          );
        })
        .toBe(true);
    },
    async close() {
      await runtime.close();
      await service.shutdown();
      await h.close();
    },
  };
}
export type IndexingFixture = Awaited<ReturnType<typeof indexingFixture>>;
