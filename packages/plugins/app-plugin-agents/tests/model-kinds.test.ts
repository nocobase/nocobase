/**
 * Embedding, rerank and utility text models of the model services: kinds a provider serves, the catalog by kind, the
 * gateway's `embed`, `rerank` and `generate` against a local OpenAI-compatible server, their use recorded apart from
 * runs (`agModelUsage`) and its report, and the system prompt marked for caching.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createModelGateway, toPrompt } from '../server/online/gateway.js';
import { compatibleReranking } from '../server/online/providers.js';
import { createHarness, type Harness } from './harness.js';
import { startMockOpenAI, type MockOpenAI } from './mock-openai.js';

describe('model kinds', () => {
  let h: Harness | undefined;
  let mock: MockOpenAI;

  beforeEach(async () => {
    mock = await startMockOpenAI();
  });
  afterEach(async () => {
    await h?.close();
    h = undefined;
    await mock.close();
  });

  const create = async () => {
    h = await createHarness();
    await h.services.models.services.create({
      title: 'Local',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      apiKey: 'test-key',
      models: [
        { value: 'mock-model' },
        { value: 'mock-embed', kind: 'embedding', dimensions: 6 },
        { value: 'mock-rerank', kind: 'rerank' },
      ],
    });
    return h;
  };

  it('uses one Alibaba service for unchanged chat and compatible embedding batches', async () => {
    h = await createHarness();
    const saved = await h.services.models.services.create({
      title: 'Alibaba shared service',
      provider: 'alibaba',
      baseUrl: mock.url,
      apiKey: 'fixture-key',
      models: [
        { value: 'mock-chat', kind: 'chat' },
        { value: 'mock-embed', kind: 'embedding', dimensions: 6 },
      ],
    });
    const gateway = h.services.models.gateway;
    mock.answer({ text: ['Chat unchanged.'] });
    expect(
      await gateway.generate({
        model: { modelService: saved.name, model: 'mock-chat' },
        prompt: 'Hello.',
        source: 'knowledge',
      }),
    ).toEqual({ text: 'Chat unchanged.' });
    const values = Array.from({ length: 13 }, (_, i) => 'x'.repeat(i + 1));
    const result = await gateway.embed({
      model: { modelService: saved.name, model: 'mock-embed' },
      values,
      source: 'knowledge',
    });
    expect(result.dimension).toBe(6);
    expect(result.embeddings).toHaveLength(13);
    expect(mock.embeddings).toEqual([
      expect.objectContaining({
        model: 'mock-embed',
        input: values.slice(0, 10),
        dimensions: 6,
      }),
      expect.objectContaining({
        model: 'mock-embed',
        input: values.slice(10),
        dimensions: 6,
      }),
    ]);
    expect(
      mock.seen
        .filter((request) => request.method === 'POST')
        .map((request) => request.path),
    ).toEqual(['/v1/chat/completions', '/v1/embeddings', '/v1/embeddings']);
    expect(
      mock.seen.every(
        (request) => request.headers.authorization === 'Bearer fixture-key',
      ),
    ).toBe(true);
  });

  it('keeps each model of a kind its provider serves, and lists the catalog by kind', async () => {
    const harness = await create();
    const services = harness.services.models.services;
    await expect(
      services.create({
        title: 'Claude',
        provider: 'anthropic',
        apiKey: 'k',
        models: [{ value: 'voyage', kind: 'embedding' }],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      services.update('local', {
        models: [{ value: 'mock-model', dimensions: 8 }],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const gateway = harness.services.models.gateway;
    const names = async (kind?: 'chat' | 'embedding' | 'rerank') =>
      (await gateway.catalog(kind)).services.flatMap((service) =>
        service.models.map((model) => model.value),
      );
    expect(await names()).toEqual(['mock-model']);
    expect(await names('embedding')).toEqual(['mock-embed']);
    expect(await names('rerank')).toEqual(['mock-rerank']);
    expect(
      (
        await harness.request('GET', '/agents/models?kind=embedding', {
          user: 'eve',
        })
      ).body.data[0].models,
    ).toEqual([
      {
        value: 'mock-embed',
        label: 'mock-embed',
        kind: 'embedding',
        capabilities: { webSearch: false },
        dimensions: 6,
      },
    ]);
    expect(
      (
        await harness.request('GET', '/agents/models?kind=nope', {
          user: 'eve',
        })
      ).status,
    ).toBe(400);
  });

  it('embeds, reranks and writes short texts, recording each use apart from runs', async () => {
    const harness = await create();
    expect(harness.services).not.toHaveProperty('vectors');
    const gateway = harness.services.models.gateway;
    const embedded = await gateway.embed({
      model: { modelService: 'local', model: 'mock-embed' },
      values: ['a', 'bbb'],
      source: 'knowledge',
    });
    expect(embedded).toMatchObject({ dimension: 6, tokens: 6 });
    expect(embedded.embeddings).toHaveLength(2);
    expect(mock.embeddings.at(-1)).toMatchObject({
      model: 'mock-embed',
      dimensions: 6,
    });
    // A chat model is not an embedding model.
    await expect(
      gateway.embed({
        model: { modelService: 'local', model: 'mock-model' },
        values: ['a'],
        source: 'knowledge',
      }),
    ).rejects.toMatchObject({ code: 'config' });

    expect(
      await gateway.rerank({
        model: { modelService: 'local', model: 'mock-rerank' },
        query: 'cat',
        documents: ['dog', 'a cat', 'cart'],
        topN: 2,
        source: 'knowledge',
      }),
    ).toEqual({
      ranking: [
        { index: 1, score: 1 },
        { index: 2, score: 1 },
      ],
    });
    expect(mock.reranks.at(-1)).toMatchObject({ top_n: 2, query: 'cat' });

    mock.answer({
      text: ['A sentence.'],
      usage: { prompt: 20, completion: 4 },
    });
    expect(
      await gateway.generate({
        model: { modelService: 'local', model: 'mock-model' },
        system: 'Be brief.',
        prompt: 'Situate this.',
        source: 'knowledge',
      }),
    ).toEqual({ text: 'A sentence.' });

    await harness.services.prices.replace({
      prices: [
        {
          tool: 'online',
          modelService: 'local',
          model: 'mock-embed',
          inputPerM: 1_000_000,
          outputPerM: 0,
        },
      ],
      subscriptions: [],
    });
    const report = await harness.services.reporting.modelUsage(
      { userId: 'admin', allRuns: true },
      {},
    );
    expect(report.rows).toEqual([
      expect.objectContaining({
        purpose: 'embedding',
        source: 'knowledge',
        model: 'mock-embed',
        calls: 1,
        units: 2,
        inputTokens: 6,
        cost: { USD: 6 },
      }),
      expect.objectContaining({
        purpose: 'rerank',
        model: 'mock-rerank',
        units: 3,
        inputTokens: 7,
        cost: null,
      }),
      expect.objectContaining({
        purpose: 'text',
        model: 'mock-model',
        inputTokens: 20,
        outputTokens: 4,
      }),
    ]);
    expect(
      (
        await harness.services.reporting.modelUsage(
          { userId: 'bob', allRuns: false },
          {},
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await harness.request('GET', '/agents/usage/models', {
          user: 'eve',
        })
      ).status,
    ).toBe(403);
  });

  it('checks a model as its kind says', async () => {
    const harness = await create();
    const services = harness.services.models.services;
    expect(
      await services.check({
        service: 'local',
        model: 'mock-embed',
        kind: 'embedding',
        dimensions: 6,
      }),
    ).toEqual({ ok: true, message: null });
    expect(
      await services.check({
        service: 'local',
        model: 'mock-rerank',
        kind: 'rerank',
      }),
    ).toEqual({ ok: true, message: null });
    expect(
      await services.check({
        provider: 'anthropic',
        apiKey: 'k',
        model: 'x',
        kind: 'rerank',
      }),
    ).toMatchObject({ ok: false });
  });
});

describe('the compatible rerank model', () => {
  it('posts the Cohere shape and reads results and tokens', async () => {
    const mock = await startMockOpenAI();
    try {
      const model = compatibleReranking(mock.url, 'k', 'mock-rerank');
      const result = await model.doRerank({
        documents: { type: 'text', values: ['x', 'ab'] },
        query: 'ab',
        topN: 1,
      });
      expect(result.ranking).toEqual([{ index: 1, relevanceScore: 1 }]);
      expect(result.providerMetadata).toEqual({
        openaiCompatible: { totalTokens: 7 },
      });
    } finally {
      await mock.close();
    }
  });

  it('fails with the status of a refused request', async () => {
    const gateway = createModelGateway(
      {
        catalog: () => Promise.resolve({ services: [] }),
        connectionFor: () =>
          Promise.resolve({
            provider: 'openai-compatible',
            baseUrl: 'http://127.0.0.1:9',
            apiKey: null,
          }),
        endpointFor: () =>
          Promise.resolve({
            connection: {
              provider: 'openai-compatible',
              baseUrl: 'http://127.0.0.1:9',
              apiKey: null,
            },
            dimensions: null,
          }),
      },
      { maxRetries: 0 },
    );
    await expect(
      gateway.rerank({
        model: { modelService: 'x', model: 'y' },
        query: 'q',
        documents: ['a'],
        source: 'test',
      }),
    ).rejects.toMatchObject({ code: 'network' });
  });
});

describe('the system prompt', () => {
  it('asks Anthropic to cache a system message marked so', () => {
    expect(
      toPrompt([
        { role: 'system', content: 'Rules.', cache: true },
        { role: 'system', content: 'More.' },
      ]).instructions,
    ).toEqual([
      {
        role: 'system',
        content: 'Rules.',
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      },
      { role: 'system', content: 'More.' },
    ]);
  });
});

describe('fixed embedding model names', () => {
  let h: Harness | undefined;
  let mock: MockOpenAI;
  beforeEach(async () => {
    mock = await startMockOpenAI();
    h = await createHarness();
  });
  afterEach(async () => {
    await h?.close();
    await mock.close();
  });
  it('requires explicit opt-in, preserves typed model ID, learns dimensions and records use without modifying the catalog', async () => {
    const services = h!.services.models.services;
    const saved = await services.create({
      title: 'Fixed embedding',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      models: [],
    });
    const gateway = h!.services.models.gateway;
    const request = {
      model: { modelService: saved.name, model: 'custom-embedding-v1' },
      values: ['fixture text'],
      source: 'knowledge',
    };
    await expect(gateway.embed(request)).rejects.toMatchObject({
      code: 'config',
    });
    expect(mock.embeddings).toHaveLength(0);
    const result = await gateway.embed({
      ...request,
      allowUnlistedModel: true,
    });
    expect(result.embeddings).toHaveLength(1);
    expect(result.dimension).toBeGreaterThan(0);
    expect(mock.embeddings).toEqual([
      expect.objectContaining({
        model: 'custom-embedding-v1',
        input: ['fixture text'],
      }),
    ]);
    expect(mock.embeddings[0]).not.toHaveProperty('dimensions');
    expect(
      (await services.list()).find((s) => s.name === saved.name)?.models,
    ).toEqual([]);
    await services.update(saved.name, { enabled: false });
    await expect(
      gateway.embed({ ...request, allowUnlistedModel: true }),
    ).rejects.toMatchObject({ code: 'config' });
    expect(mock.embeddings).toHaveLength(1);
  });
  it('rejects a known wrong-kind model, incompatible provider and invalid model IDs even with opt-in', async () => {
    const services = h!.services.models.services;
    const saved = await services.create({
      title: 'Chat only',
      provider: 'openai-compatible',
      baseUrl: mock.url,
      models: [{ value: 'chat', kind: 'chat' }],
    });
    const gateway = h!.services.models.gateway;
    for (const model of ['chat', '', 'x'.repeat(201)]) {
      await expect(
        gateway.embed({
          model: { modelService: saved.name, model },
          values: ['text'],
          source: 'knowledge',
          allowUnlistedModel: true,
        }),
      ).rejects.toMatchObject({ code: 'config' });
    }
    const incompatible = await services.create({
      title: 'No embedding',
      provider: 'anthropic',
      apiKey: 'fixture-key',
      models: [],
    });
    await expect(
      gateway.embed({
        model: { modelService: incompatible.name, model: 'custom' },
        values: ['text'],
        source: 'knowledge',
        allowUnlistedModel: true,
      }),
    ).rejects.toMatchObject({ code: 'config' });
    await expect(
      services.endpointFor(
        { modelService: saved.name, model: 'unlisted-chat' },
        'chat',
        { allowUnlistedModel: true },
      ),
    ).rejects.toMatchObject({ code: 'config' });
    expect(mock.embeddings).toHaveLength(0);
  });
});
