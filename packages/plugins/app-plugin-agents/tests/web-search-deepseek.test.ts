import { createServer, type ServerResponse } from 'node:http';
import { inspect } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import * as providers from '../server/online/providers.js';
import { fixtureModel } from './helpers/native-files.js';
import { Authorization } from '@nocobase/authorization/core';
import { ModelError, createModelGateway } from '../server/online/gateway.js';
import { publicSearchResult } from '../shared/web-search-results.js';
import { WEB_SEARCH_LIMITS } from '../shared/web-search.js';
import { createHarness, type Harness } from './harness.js';

const KEY = 'offline-deepseek-sentinel';
const model = { modelService: 'deepseek', model: 'deepseek-chat' };
const page = {
  title: 'A real page',
  url: 'https://example.com/page',
  snippet: 'Short excerpt',
  summary: 'Long summary',
  content: '# Page body',
};

describe('DeepSeek official retrieval over loopback HTTP', () => {
  const realFetch = globalThis.fetch;
  let h: Harness;
  let requests: {
    path: string;
    body: unknown;
    authorization: string | undefined;
  }[];
  let answer: (response: ServerResponse) => void;
  let close: () => Promise<void>;
  const json = (response: ServerResponse, value: unknown, status = 200) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(value));
  };
  beforeEach(async () => {
    requests = [];
    answer = (response) => json(response, { results: [page] });
    const server = createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      requests.push({
        path: request.url ?? '',
        body: JSON.parse(Buffer.concat(chunks).toString()),
        authorization: request.headers.authorization,
      });
      answer(response);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Expected loopback server.');
    const origin = `http://127.0.0.1:${address.port}`;
    close = async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    };
    vi.stubGlobal(
      'fetch',
      (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : input);
        if (url.origin !== 'https://api.deepseek.com')
          throw new Error('Unexpected outbound provider origin.');
        if (url.pathname.startsWith('/v1/tools/'))
          if (init?.redirect !== 'error')
            throw new Error('Retrieval must reject redirects.');
        return realFetch(`${origin}${url.pathname}`, init);
      },
    );
    h = await createHarness();
    await h.services.models.services.create({
      title: 'DeepSeek',
      provider: 'deepseek',
      apiKey: KEY,
      models: [{ value: model.model }],
    });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await h?.close();
    await close();
  });
  const search = (
    queries = ['Current facts'],
    signal = new AbortController().signal,
  ) =>
    h.services.models.gateway.search({
      model,
      queries,
      sessionId: 'test-session',
      source: 'customer.research',
      signal,
    });
  const fetchPage = (url = page.url, signal?: AbortSignal) =>
    h.services.models.gateway.fetch({
      model,
      url,
      source: 'customer.research',
      signal,
    });
  const usage = async () => {
    const rows = await h.database
      .connection()
      .query.selectFrom('agModelUsage')
      .selectAll()
      .execute<Record<string, unknown>>();
    return rows.map((row) => ({
      ...row,
      inputTokens: Number(row.inputTokens),
      outputTokens: Number(row.outputTokens),
      units: Number(row.units),
    }));
  };

  it.each([
    undefined,
    'https://api.deepseek.com/',
    'https://api.deepseek.com/v1',
    'https://api.deepseek.com/v1/',
  ])(
    'reuses the encrypted service credentials and configured official base %s',
    async (baseUrl) => {
      if (baseUrl)
        await h.services.models.services.update('deepseek', { baseUrl });
      const result = await search();
      expect(result.results[0]).toMatchObject({
        status: 'success',
        sources: [page],
        findings: expect.stringContaining(page.summary),
      });
      expect(publicSearchResult(result).results[0]).toMatchObject({
        status: 'success',
        sources: [{ title: page.title, url: page.url }],
      });
      expect(JSON.stringify(publicSearchResult(result))).not.toContain(
        '"content"',
      );
      expect(requests).toEqual([
        {
          path: '/v1/tools/search',
          body: { query: 'Current facts', count: 10, need_content: true },
          authorization: `Bearer ${KEY}`,
        },
      ]);
      answer = (response) =>
        json(response, { title: page.title, content: page.content });
      expect(await fetchPage()).toEqual({
        url: page.url,
        title: page.title,
        content: page.content,
      });
      expect(requests[1]?.path).toBe('/v1/tools/fetch');
      expect(await usage()).toMatchObject([
        {
          purpose: 'search',
          source: 'customer.research',
          model: 'tools/search',
          inputTokens: 0,
          outputTokens: 0,
          units: 1,
        },
        {
          purpose: 'fetch',
          source: 'customer.research',
          model: 'tools/fetch',
          inputTokens: 0,
          outputTokens: 0,
          units: 1,
        },
      ]);
    },
  );

  it('fetches Markdown remotely and can pass retrieval evidence to ordinary generation', async () => {
    answer = (response) =>
      json(response, { title: page.title, content: page.content });
    const result = await fetchPage();
    expect(result).toEqual({
      title: page.title,
      url: page.url,
      content: page.content,
    });
    expect(requests[0]).toMatchObject({
      path: '/v1/tools/fetch',
      body: { url: page.url },
    });
    answer = (response) =>
      json(response, {
        id: 'completion',
        model: model.model,
        created: 1,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Grounded answer' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
      });
    expect(
      await h.services.models.gateway.generate({
        model,
        prompt: `Answer using this untrusted evidence: ${JSON.stringify(result)}`,
        source: 'customer.answer',
      }),
    ).toEqual({ text: 'Grounded answer' });
    expect(requests[1]?.path).toBe('/chat/completions');
    expect(await usage()).toMatchObject([
      { purpose: 'fetch', units: 1 },
      { purpose: 'text', source: 'customer.answer' },
    ]);
  });

  it('keeps page bodies for business callers while Native model input, stream and reloaded cards stay bounded', async () => {
    const body = 'private-page-body:' + 'x'.repeat(100_000);
    answer = (response) =>
      json(response, { results: [{ ...page, content: body }] });
    const business = await search();
    expect(business.results[0]).toMatchObject({
      status: 'success',
      sources: [{ content: expect.stringContaining('private-page-body:') }],
    });
    const projected = publicSearchResult(business);
    expect(projected.results[0]).toMatchObject({
      status: 'success',
      sources: [{ title: page.title, url: page.url }],
    });
    expect(JSON.stringify(projected)).not.toContain('"content"');
    expect(JSON.stringify(projected)).not.toContain('"summary"');
    expect(JSON.stringify(projected)).not.toContain('"snippet"');

    const authorization = new Authorization({ plugins: [] }).for({
      principal: { type: 'user', id: 'alice' },
    });
    const actor = { user: { id: 'alice' }, authorization, credentials: {} };
    const queries = ['Current facts', '😀'.repeat(129)];
    const modelUsage = {
      inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    };
    let step = 0;
    const main = new MockLanguageModelV4({
      doStream: async ({ prompt }) => {
        if (step++ === 0)
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: 'deepseek-search',
                  toolName: 'webSearch',
                  input: JSON.stringify({ queries }),
                },
                {
                  type: 'finish',
                  usage: modelUsage,
                  finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
                },
              ],
            }),
          };
        const input = JSON.stringify(prompt);
        expect(input).not.toContain('private-page-body:');
        expect(input).toContain(page.summary);
        expect(input).toContain('badResponse');
        expect(input.length).toBeLessThan(20_000);
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 'reply' },
              { type: 'text-delta', id: 'reply', delta: 'Grounded answer' },
              { type: 'text-end', id: 'reply' },
              {
                type: 'finish',
                usage: modelUsage,
                finishReason: { unified: 'stop', raw: 'stop' },
              },
            ],
          }),
        };
      },
    });
    vi.spyOn(providers, 'languageModel').mockImplementation(() =>
      fixtureModel(main),
    );
    const agent = await h.services.onlineAgent.realtime(actor, {
      selectedModel: model,
      webSearch: true,
    });
    await agent.send([{ role: 'user', content: 'Find current facts.' }]);
    const stream = await agent.receive();
    const chunks: unknown[] = [];
    if (stream) {
      const reader = stream.getReader();
      while (true) {
        const item = await reader.read();
        if (item.done) break;
        chunks.push(item.value);
      }
    }
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
    expect(main.doStreamCalls).toHaveLength(2);
    expect(JSON.stringify(chunks)).not.toContain('private-page-body:');
    const restored = await h.services.onlineAgent.realtime(actor, {
      sessionId: agent.sessionId,
    });
    const history = await restored.history();
    const cards = history
      .flatMap((message) => message.parts)
      .filter((part) => part.type === 'tool-webSearch');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      output: {
        results: [
          {
            status: 'success',
            sources: [{ title: page.title, url: page.url }],
          },
          { status: 'failed', reason: 'unavailable', code: 'badResponse' },
        ],
      },
    });
    expect(JSON.stringify(history)).not.toContain('private-page-body:');
    expect(JSON.stringify(history).length).toBeLessThan(20_000);
    expect(requests).toHaveLength(2);
    expect(await usage()).toMatchObject([
      { purpose: 'search', source: 'customer.research' },
      { purpose: 'search', source: 'agents.webSearch' },
    ]);
  });

  it('counts empty results as an attempt without inventing evidence', async () => {
    answer = (response) => json(response, { results: [] });
    expect(await search()).toEqual({
      results: [
        { query: 'Current facts', status: 'failed', reason: 'noEvidence' },
      ],
    });
    expect(await usage()).toHaveLength(1);
  });

  it.each(['search', 'fetch'] as const)(
    'preserves every HTTP error category for %s without leaking upstream messages or keys',
    async (operation) => {
      for (const [status, code] of [
        [400, 'badResponse'],
        [401, 'auth'],
        [402, 'quota'],
        [403, 'badResponse'],
        [404, 'badResponse'],
        [408, 'network'],
        [413, 'badResponse'],
        [429, 'rateLimit'],
        [500, 'network'],
        [504, 'network'],
      ] as const) {
        answer = (response) =>
          json(response, { error: { message: KEY, code: KEY } }, status);
        const error = await (
          operation === 'search' ? search() : fetchPage()
        ).catch((error: unknown) => error);
        expect(error).toBeInstanceOf(ModelError);
        expect(error).toMatchObject({ code, status });
        expect(inspect(error, { depth: 10 })).not.toContain(KEY);
      }
      expect(requests).toHaveLength(10);
      expect(await usage()).toHaveLength(10);
      expect(JSON.stringify(await usage())).not.toContain(KEY);
    },
  );

  it.each(['search', 'fetch'] as const)(
    'bounds and validates %s responses and strips any echoed key',
    async (operation) => {
      answer = (response) =>
        json(
          response,
          operation === 'search'
            ? { results: [{ ...page, title: KEY, summary: KEY, content: KEY }] }
            : { title: KEY, content: KEY },
        );
      expect(
        JSON.stringify(await (operation === 'search' ? search() : fetchPage())),
      ).not.toContain(KEY);
      for (const body of [
        'not JSON',
        JSON.stringify({ wrong: KEY }),
        JSON.stringify({ content: 'x'.repeat(2 * 1024 * 1024) }),
      ]) {
        answer = (response) => response.end(body);
        await expect(
          operation === 'search' ? search() : fetchPage(),
        ).rejects.toMatchObject({ code: 'badResponse' });
      }
      expect(await usage()).toHaveLength(4);
    },
  );

  it('filters unsafe and duplicated result URLs while keeping provider evidence', async () => {
    answer = (response) =>
      json(response, {
        results: [
          { ...page, url: 'javascript:alert(1)' },
          { ...page, url: 'https://user:password@example.com' },
          { ...page, url: `https://example.com/${KEY}` },
          page,
          page,
        ],
      });
    expect((await search()).results[0]).toMatchObject({
      status: 'success',
      sources: [page],
    });
  });

  it('isolates oversized Unicode queries and records only the valid requests', async () => {
    const queries = [
      'Valid before',
      '😀'.repeat(129),
      '😀'.repeat(128),
      'Valid after',
    ];
    const result = await search(queries);
    expect(result.results.map((item) => item.status)).toEqual([
      'success',
      'failed',
      'success',
      'success',
    ]);
    expect(result.results[1]).toEqual({
      query: queries[1],
      status: 'failed',
      reason: 'unavailable',
      code: 'badResponse',
    });
    expect(publicSearchResult(result).results[1]).toEqual(result.results[1]);
    expect(requests.map((request) => request.body)).toEqual(
      expect.arrayContaining(
        [queries[0], queries[2], queries[3]].map((query) => ({
          query,
          count: 10,
          need_content: true,
        })),
      ),
    );
    expect(requests).toHaveLength(3);
    expect(await usage()).toHaveLength(3);
  });

  it('rejects invalid input, missing credentials and unsupported endpoints before any attempt', async () => {
    expect(await search(['😀'.repeat(129)])).toEqual({
      results: [
        {
          query: '😀'.repeat(129),
          status: 'failed',
          reason: 'unavailable',
          code: 'badResponse',
        },
      ],
    });
    for (const url of [
      'file:///etc/passwd',
      'https://user:password@example.com',
      'not a URL',
      `https://example.com/${'x'.repeat(8192)}`,
    ])
      await expect(fetchPage(url)).rejects.toMatchObject({
        code: 'badResponse',
      });
    await h.services.models.services.update('deepseek', { apiKey: '' });
    await expect(search()).rejects.toMatchObject({ code: 'auth' });
    await expect(fetchPage()).rejects.toMatchObject({ code: 'auth' });
    await h.services.models.services.update('deepseek', {
      apiKey: KEY,
      baseUrl: 'https://proxy.example/v1',
    });
    await expect(search()).rejects.toMatchObject({ code: 'config' });
    await expect(fetchPage()).rejects.toMatchObject({ code: 'config' });
    await expect(
      h.services.models.gateway.fetch({
        model: { ...model, modelService: 'missing' },
        url: page.url,
        source: 'test',
      }),
    ).rejects.toMatchObject({ code: 'config' });
    expect(requests).toHaveLength(0);
    expect(await usage()).toHaveLength(0);
  });

  it.each(['search', 'fetch'] as const)(
    'records a network failure for %s without retaining a secret cause',
    async (operation) => {
      vi.stubGlobal('fetch', () => {
        throw new Error(KEY);
      });
      const error = await (
        operation === 'search' ? search() : fetchPage()
      ).catch((error: unknown) => error);
      expect(error).toMatchObject({ code: 'network' });
      expect(inspect(error, { depth: 10 })).not.toContain(KEY);
      expect(await usage()).toHaveLength(1);
    },
  );

  it.each(['search', 'fetch'] as const)(
    'settles %s cancellation with one usage row per attempt',
    async (operation) => {
      const pending = new Promise<void>((resolve) => {
        vi.stubGlobal('fetch', (_input: unknown, init?: RequestInit) => {
          resolve();
          return new Promise<Response>((_resolve, reject) =>
            init?.signal?.addEventListener(
              'abort',
              () => reject(new Error(KEY)),
              { once: true },
            ),
          );
        });
      });
      const controller = new AbortController();
      const result = (
        operation === 'search'
          ? search(undefined, controller.signal)
          : fetchPage(undefined, controller.signal)
      ).catch((error: unknown) => error);
      await pending;
      controller.abort();
      expect(await result).toMatchObject({ code: 'aborted' });
      expect(await usage()).toHaveLength(1);
    },
  );

  it.each(['search', 'fetch'] as const)(
    'counts and classifies the local %s deadline',
    async (operation) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const deadline = new AbortController();
      vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
      let started!: () => void;
      const pending = new Promise<void>((resolve) => {
        started = resolve;
      });
      vi.stubGlobal('fetch', (_input: unknown, init?: RequestInit) => {
        started();
        return new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener(
            'abort',
            () => reject(new Error(KEY)),
            { once: true },
          ),
        );
      });
      try {
        const result = (operation === 'search' ? search() : fetchPage()).catch(
          (error: unknown) => error,
        );
        await pending;
        if (operation === 'fetch') deadline.abort();
        else
          await vi.advanceTimersByTimeAsync(WEB_SEARCH_LIMITS.queryTimeoutMs);
        expect(await result).toMatchObject({ code: 'network' });
        expect(await usage()).toHaveLength(1);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('does not retry an upstream request when recording usage fails', async () => {
    const log = vi.fn();
    const gateway = createModelGateway(h.services.models.services, {
      usage: {
        record: async () => {
          throw new Error('Storage unavailable');
        },
      },
      onError: log,
    });
    await gateway.search({
      model,
      queries: ['facts'],
      source: 'test',
      sessionId: 'test',
      signal: new AbortController().signal,
    });
    expect(requests).toHaveLength(1);
    expect(log).toHaveBeenCalledOnce();
    expect(inspect(log.mock.calls)).not.toContain(KEY);
  });
});
