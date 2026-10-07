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
    await h.services.online.services.create({
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

  it('keeps each model of a kind its provider serves, and lists the catalog by kind', async () => {
    const harness = await create();
    const services = harness.services.online.services;
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
    const gateway = harness.services.online.gateway;
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
    const gateway = harness.services.online.gateway;
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
    const services = harness.services.online.services;
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
