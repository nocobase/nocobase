// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { createAppTest } from '@nocobase/app-testing/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { expect, vi } from 'vitest';
import { agentsEmbedding } from '../server/indexing/embedding.js';
import { canonicalJson, sha256 } from '../server/indexing/vector.js';
import {
  knowledgeIndexingToken,
  knowledgeIndexingExtensionsToken,
  knowledgeToken,
  knowledgeAccessToken,
} from '../server/tokens.js';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    knowledge: {
      indexing: {
        local: { name: 'Local', type: 'sqlite-vec', file: 'vectors.sqlite' },
      },
    },
  },
});
test('starts indexing through application Providers and the original host jobs token', async ({
  app,
}) => {
  expect(app.container.has(jobExecutorServiceToken)).toBe(true);
  const registry = app.container.resolve(knowledgeIndexingExtensionsToken);
  expect(registry.list().map((item) => item.type)).toContain('sqlite-vec');
  expect(() => registry.register(registry.get('sqlite-vec')!)).toThrow();
  const service = app.container.resolve(knowledgeIndexingToken);
  const authorization = app.container.resolve(authorizationToken);
  const models = app.container.resolve(agentsToken).models;
  const saved = await models.services.create({
    title: 'Deterministic',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:1/v1',
    apiKey: 'fixture-not-a-real-key',
    models: [
      { value: 'embed', label: 'Embed', kind: 'embedding', dimensions: 3 },
    ],
  });
  const privateEndpoint = vi.spyOn(models.services, 'endpointFor');
  const privateConnection = vi.spyOn(models.services, 'connectionFor');
  const embed = vi
    .spyOn(models.gateway, 'embed')
    .mockImplementation(async ({ values }) => ({
      embeddings: values.map(() => [1, 0, 0]),
      dimension: 3,
      model: 'embed',
      tokens: 0,
    }));
  // Catalog/model resolution uses the real Agents service; no paid model call is made.
  const subject = { type: 'user', id: 'fixture-admin' };
  await authorization.permissionSets.assign({ subject, permissionSet: 'root' });
  const context = authorization.for({ principal: subject, subjects: [] });
  app.container.singleton(knowledgeAccessToken, () => ({
    space: (space) => (space.scope === 'project' ? space : null),
    inherits: () => [],
    forReader: (reader) => ({
      access: async (space) => {
        const read =
          reader.userId === 'fixture-admin' || space.scopeId === 'p1';
        return {
          read,
          propose: read,
          edit: reader.userId === 'fixture-admin',
          manage: reader.userId === 'fixture-admin',
        };
      },
    }),
    title: async () => null,
    names: async () => new Map(),
  }));
  const knowledge = app.container.resolve(knowledgeToken);
  const admin = { kind: 'user', userId: 'fixture-admin' } as const;
  const reader = { kind: 'user', userId: 'reader' } as const;
  const first = { scope: 'project', scopeId: 'p1' } as const;
  const second = { scope: 'project', scopeId: 'p2' } as const;
  const a = await knowledge.docs.create(admin, {
    ...first,
    title: 'One',
    content: 'First source.',
  });
  const b = await knowledge.docs.create(admin, {
    ...second,
    title: 'Two',
    content: 'Second source.',
  });
  const receipt = await service.save(context, {
    requestId: randomUUID(),
    expectedRevision: '0',
    config: {
      version: 1,
      key: 'local',
      options: { embedding: { modelService: saved.name, model: 'embed' } },
    },
    acknowledgeFullRebuild: true,
  });
  expect(receipt.enabled).toBe(true);
  await expect
    .poll(async () => (await service.status(context)).availability)
    .toBe('ready');
  expect(embed).toHaveBeenCalled();
  const hits = await knowledge.docs.searchMany(
    admin,
    [first, second],
    'semantic-query',
  );
  expect(new Set(hits.map((hit) => hit.docId))).toEqual(new Set([a.id, b.id]));
  const visible = await knowledge.docs.searchMany(
    reader,
    [first, second],
    'semantic-query',
  );
  expect(new Set(visible.map((hit) => hit.docId))).toEqual(new Set([a.id]));
  expect(privateEndpoint).not.toHaveBeenCalled();
  expect(privateConnection).not.toHaveBeenCalled();
  privateEndpoint.mockRestore();
  privateConnection.mockRestore();
  embed.mockRestore();
});

for (const provider of ['alibaba', 'openai-compatible'] as const) {
  test(`resolves ${provider} transport identity from public metadata without embedding or reading secrets`, async ({
    app,
  }) => {
    const models = app.container.resolve(agentsToken).models;
    const saved = await models.services.create({
      title: `Identity ${provider}`,
      provider,
      baseUrl: 'https://embedding.invalid/compatible-mode/v1',
      apiKey: 'fixture-not-a-real-key',
      models: [{ value: 'embed', kind: 'embedding', dimensions: 3 }],
    });
    const privateEndpoint = vi.spyOn(models.services, 'endpointFor');
    const privateConnection = vi.spyOn(models.services, 'connectionFor');
    const embed = vi.spyOn(models.gateway, 'embed');
    try {
      const embedding = await agentsEmbedding(app.container);
      const legacyIdentity = {
        provider,
        baseUrl: saved.baseUrl,
        modelService: saved.name,
        model: 'embed',
        encoding: 'kb-chunk-text-v1',
        dimensions: 3,
      };
      const identity = await embedding!.identity({
        modelService: saved.name,
        model: 'embed',
      });
      expect(identity).toEqual({
        hash: sha256(
          canonicalJson({
            ...legacyIdentity,
            ...(provider === 'alibaba'
              ? { embeddingTransport: 'openai-compatible-v1' }
              : {}),
          }),
        ),
        dimensions: 3,
      });
      if (provider === 'alibaba') {
        expect(identity.hash).not.toBe(sha256(canonicalJson(legacyIdentity)));
      } else {
        expect(identity.hash).toBe(sha256(canonicalJson(legacyIdentity)));
      }
      expect(privateEndpoint).not.toHaveBeenCalled();
      expect(privateConnection).not.toHaveBeenCalled();
      expect(embed).not.toHaveBeenCalled();
    } finally {
      privateEndpoint.mockRestore();
      privateConnection.mockRestore();
      embed.mockRestore();
    }
  });
}

test('catalogs embedding-capable empty services and resolves fixed model identity without a model call', async ({
  app,
}) => {
  const models = app.container.resolve(agentsToken).models;
  const saved = await models.services.create({
    title: 'Fixed model service',
    provider: 'openai-compatible',
    baseUrl: 'https://embedding.invalid/v1',
    models: [],
  });
  const disabled = await models.services.create({
    title: 'Disabled fixed service',
    provider: 'openai-compatible',
    baseUrl: 'https://embedding.invalid/v1',
    models: [],
    enabled: false,
  });
  const chat = await models.services.create({
    title: 'Chat only fixed',
    provider: 'anthropic',
    models: [],
  });
  const gateway = vi.spyOn(models.gateway, 'embed').mockResolvedValue({
    embeddings: [[1, 0, 0]],
    dimension: 3,
    model: 'fixed-id',
    tokens: 0,
  });
  const endpoint = vi.spyOn(models.services, 'endpointFor');
  const embedding = (await agentsEmbedding(app.container))!;
  const ref = { modelService: saved.name, model: 'fixed-id' };
  try {
    const catalog = await embedding.catalog();
    expect(catalog).toContainEqual({
      name: saved.name,
      title: saved.title,
      provider: saved.provider,
      models: [],
    });
    expect(
      catalog.some((s) => s.name === disabled.name || s.name === chat.name),
    ).toBe(false);
    const identity = await embedding.identity(ref);
    expect(identity.dimensions).toBeNull();
    expect(
      (await embedding.identity({ ...ref, model: 'another-id' })).hash,
    ).not.toBe(identity.hash);
    expect(gateway).not.toHaveBeenCalled();
    expect(endpoint).not.toHaveBeenCalled();
    await expect(
      embedding.identity({ modelService: disabled.name, model: 'fixed' }),
    ).rejects.toMatchObject({ code: 'INDEXING_MODEL_UNKNOWN' });
    await embedding.embed({
      model: ref,
      values: ['fixture'],
      source: 'knowledge',
      signal: new AbortController().signal,
    });
    expect(gateway).toHaveBeenCalledWith(
      expect.objectContaining({ model: ref, allowUnlistedModel: true }),
    );
  } finally {
    gateway.mockRestore();
    endpoint.mockRestore();
  }
});
