// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  createAuthorization,
  ResourceItems,
} from '@nocobase/authorization/core';
import { createJobExecutorService } from '@nocobase/jobs';
import { afterEach, describe, expect, it } from 'vitest';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import { createKnowledgeIndexingRegistry } from '../server/indexing/registry.js';
import { createKnowledgeIndexing } from '../server/indexing/runtime.js';
import type {
  KnowledgeEmbeddingProvider,
  KnowledgeIndexingRuntime,
} from '../server/indexing/types.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const auth = () => {
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
  return authorization.for({
    principal: { type: 'user', id: 'admin' },
    subjects: [],
  });
};
const model: KnowledgeEmbeddingProvider = {
  catalog: async () => [
    {
      name: 'fixture',
      title: 'Fixture',
      provider: 'deterministic',
      models: [{ value: 'embed', label: 'Embed', dimensions: 3 }],
    },
  ],
  identity: async () => ({ hash: 'deterministic-v1', dimensions: 3 }),
  embed: async ({ values, signal }) => {
    signal.throwIfAborted();
    return { dimension: 3, embeddings: values.map(() => [1, 0, 0]) };
  },
};
describe('Knowledge indexing with the real jobs executor and sqlite-vec', () => {
  let harness: KnowledgeHarness | undefined;
  let runtime: KnowledgeIndexingRuntime | undefined;
  let service: ReturnType<typeof createJobExecutorService> | undefined;
  afterEach(async () => {
    await runtime?.close();
    await service?.shutdown();
    await harness?.close();
    runtime = undefined;
    service = undefined;
    harness = undefined;
  });
  it('durably accepts one shared generation and retrieves only authorized chunks across two spaces', async () => {
    const h = (harness = await createKnowledgeHarness());
    h.levels.set('admin', ADMIN);
    const project = { scope: 'project', scopeId: 'p1' } as const;
    const other = { scope: 'project', scopeId: 'p2' } as const;
    h.projects.set('p1', {
      id: 'p1',
      name: 'Visible',
      leadUserId: 'admin',
      seenBy: ['admin', 'lead'],
    });
    h.projects.set('p2', {
      id: 'p2',
      name: 'Private',
      leadUserId: 'admin',
      seenBy: ['admin'],
    });
    const a = await h.knowledge.docs.create(h.user('admin'), {
      ...project,
      title: 'One',
      content: 'First source.',
    });
    const b = await h.knowledge.docs.create(h.user('admin'), {
      ...other,
      title: 'Two',
      content: 'Second source.',
    });
    service = createJobExecutorService(undefined, {
      appName: 'kb-test',
      storagePath: h.storage,
    });
    const registry = createKnowledgeIndexingRegistry();
    registry.register(sqliteVecIndexingExtension);
    const errors: string[] = [];
    runtime = createKnowledgeIndexing({
      database: h.database,
      knowledge: h.knowledge,
      registry,
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
      embedding: async () => model,
      jobs: () => ({
        executor: service!.getJobExecutor('@nocobase/app-plugin-knowledge'),
        schedule: service!.getScheduleExecutor(
          '@nocobase/app-plugin-knowledge',
        ),
      }),
      newId: randomUUID,
      storagePath: h.storage,
      onError: (reason) => errors.push(reason),
    });
    await runtime.start();
    const context = auth();
    const request = {
      requestId: randomUUID(),
      expectedRevision: '0',
      config: {
        version: 1,
        key: 'local',
        options: { embedding: { modelService: 'fixture', model: 'embed' } },
      },
      acknowledgeFullRebuild: true,
    } as const;
    const receipt = await runtime.service.save(context, request);
    expect(receipt).toMatchObject({
      changed: true,
      enabled: true,
      revision: '1',
    });
    expect(
      await h.database
        .connection()
        .repository('kbIndexRequests')
        .findOne({ filter: { requestId: request.requestId } }),
    ).not.toBeNull();
    await expect
      .poll(async () => (await runtime!.service.status(context)).availability)
      .toBe('ready');
    expect(errors).toEqual([]);
    expect((await runtime.service.status(context)).serving?.id).toBe(
      receipt.generationId,
    );
    expect(await runtime.service.save(context, request)).toEqual(receipt);
    const all = await h.knowledge.docs.searchMany(
      h.user('admin'),
      [project, other],
      'semantic-only',
    );
    expect(new Set(all.map((hit) => hit.docId))).toEqual(new Set([a.id, b.id]));
    const visible = await h.knowledge.docs.searchMany(
      h.user('lead'),
      [project, other],
      'semantic-only',
    );
    expect(new Set(visible.map((hit) => hit.docId))).toEqual(new Set([a.id]));
  });
  it('rejects enabling without host jobs but preserves contains and closing', async () => {
    const h = (harness = await createKnowledgeHarness());
    h.levels.set('admin', ADMIN);
    const project = { scope: 'project', scopeId: 'p1' } as const;
    h.projects.set('p1', { id: 'p1', name: 'Visible', leadUserId: 'admin' });
    await h.knowledge.docs.create(h.user('admin'), {
      ...project,
      title: 'Source',
      content: 'contains survives',
    });
    const registry = createKnowledgeIndexingRegistry();
    registry.register(sqliteVecIndexingExtension);
    runtime = createKnowledgeIndexing({
      database: h.database,
      knowledge: h.knowledge,
      registry,
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
      embedding: async () => model,
      jobs: () => null,
      newId: randomUUID,
      storagePath: h.storage,
      onError: () => {},
    });
    await runtime.start();
    await expect(
      runtime.service.save(auth(), {
        requestId: randomUUID(),
        expectedRevision: '0',
        config: {
          version: 1,
          key: 'local',
          options: { embedding: { modelService: 'fixture', model: 'embed' } },
        },
        acknowledgeFullRebuild: true,
      }),
    ).rejects.toMatchObject({ code: 'INDEXING_JOBS_UNAVAILABLE' });
    expect(
      await h.knowledge.docs.searchMany(h.user('admin'), [project], 'survives'),
    ).toHaveLength(1);
    expect(
      await runtime.service.save(auth(), {
        requestId: randomUUID(),
        expectedRevision: '0',
        config: null,
        acknowledgeFullRebuild: false,
      }),
    ).toMatchObject({ enabled: false, changed: false });
  });
  it('keeps contains when indexing is unconfigured or Agents is absent', async () => {
    const h = (harness = await createKnowledgeHarness());
    h.levels.set('admin', ADMIN);
    const project = { scope: 'project', scopeId: 'p1' } as const;
    h.projects.set('p1', { id: 'p1', name: 'Visible', leadUserId: 'admin' });
    await h.knowledge.docs.create(h.user('admin'), {
      ...project,
      title: 'Source',
      content: 'contains survives',
    });
    service = createJobExecutorService(undefined, {
      appName: 'kb-test',
      storagePath: h.storage,
    });
    const registry = createKnowledgeIndexingRegistry();
    registry.register(sqliteVecIndexingExtension);
    runtime = createKnowledgeIndexing({
      database: h.database,
      knowledge: h.knowledge,
      registry,
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
      embedding: () => null,
      jobs: () => ({
        executor: service!.getJobExecutor('@nocobase/app-plugin-knowledge'),
        schedule: service!.getScheduleExecutor(
          '@nocobase/app-plugin-knowledge',
        ),
      }),
      newId: randomUUID,
      storagePath: h.storage,
      onError: () => {},
    });
    await runtime.start();
    expect((await runtime.service.status(auth())).availability).toBe(
      'disabled',
    );
    expect(
      await h.knowledge.docs.searchMany(h.user('admin'), [project], 'survives'),
    ).toHaveLength(1);
    await expect(
      runtime.service.save(auth(), {
        requestId: randomUUID(),
        expectedRevision: '0',
        config: {
          version: 1,
          key: 'local',
          options: { embedding: { modelService: 'fixture', model: 'embed' } },
        },
        acknowledgeFullRebuild: true,
      }),
    ).rejects.toMatchObject({ code: 'INDEXING_MODEL_UNKNOWN' });
    expect(
      await h.knowledge.docs.searchMany(h.user('admin'), [project], 'survives'),
    ).toHaveLength(1);
  });
});
