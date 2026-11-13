import { createServer, type ServerResponse } from 'node:http';
import { inspect } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { Authorization } from '@nocobase/authorization/core';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import * as providers from '../server/online/providers.js';
import { classify, ModelError } from '../server/online/gateway.js';
import { deepseekSearch } from '../server/online/search/deepseek.js';
import { publicSearchResult } from '../shared/web-search-results.js';
import { WEB_SEARCH_LIMITS } from '../shared/web-search.js';
import { fixtureModel } from './helpers/native-files.js';
import { createHarness, type Harness } from './harness.js';

const KEY = 'offline-deepseek-sentinel';
const model = { modelService: 'deepseek', model: 'deepseek-chat' };
const page = {
  title: 'A real page',
  url: 'https://example.com/page',
  snippet: 'Short excerpt',
  summary: 'Long summary',
  content: '',
};
const source = { title: page.title, url: page.url };

describe('DeepSeek Search in the existing Native retrieval contract', () => {
  const realFetch = globalThis.fetch;
  let h: Harness;
  let requests: {
    path: string;
    body: unknown;
    authorization: string | undefined;
  }[];
  let answer: (response: ServerResponse, query: string) => void;
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
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        query: string;
      };
      requests.push({
        path: request.url ?? '',
        body,
        authorization: request.headers.authorization,
      });
      answer(response, body.query);
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
        if (
          url.origin !== 'https://api.deepseek.com' ||
          init?.redirect !== 'error'
        )
          throw new Error('Unexpected outbound provider request.');
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
    vi.useRealTimers();
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
      sessionId: 'native-search',
      source: 'agents.webSearch',
      signal,
    });
  const adapter = async () =>
    deepseekSearch(
      await h.services.models.services.connectionFor(model),
      'Current facts',
      new AbortController().signal,
    );

  it.each([
    undefined,
    'https://api.deepseek.com/',
    'https://api.deepseek.com/v1',
    'https://api.deepseek.com/v1/',
  ])(
    'reuses the existing encrypted service connection at %s',
    async (baseUrl) => {
      if (baseUrl)
        await h.services.models.services.update('deepseek', { baseUrl });
      const result = await search();
      expect(result.results[0]).toEqual({
        query: 'Current facts',
        status: 'success',
        sources: [source],
        findings: `[1] ${page.title}\n${page.summary}`,
      });
      expect(publicSearchResult(result)).toEqual(result);
      expect(requests).toEqual([
        {
          path: '/v1/tools/search',
          body: { query: 'Current facts', count: 10, need_content: false },
          authorization: `Bearer ${KEY}`,
        },
      ]);
    },
  );

  it('composes search with the Native answer loop using the original model, stream and history contract', async () => {
    const body = 'unrequested-page-body:' + 'x'.repeat(100_000);
    answer = (response) =>
      json(response, { results: [{ ...page, content: body }] });
    const authorization = new Authorization({ plugins: [] }).for({
      principal: { type: 'user', id: 'alice' },
    });
    const actor = { user: { id: 'alice' }, authorization, credentials: {} };
    const queries = ['Current facts', '😀'.repeat(129)];
    const usage = {
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
                  usage,
                  finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
                },
              ],
            }),
          };
        expect(JSON.stringify(prompt)).toContain(page.summary);
        expect(JSON.stringify(prompt)).toContain('unavailable');
        expect(JSON.stringify(prompt)).not.toContain('unrequested-page-body:');
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 'reply' },
              { type: 'text-delta', id: 'reply', delta: 'Grounded answer' },
              { type: 'text-end', id: 'reply' },
              {
                type: 'finish',
                usage,
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
    const chunks: unknown[] = [];
    const stream = await agent.receive();
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
            query: queries[0],
            status: 'success',
            findings: `[1] ${page.title}\n${page.summary}`,
            sources: [source],
          },
          { query: queries[1], status: 'failed', reason: 'unavailable' },
        ],
      },
    });
    expect(JSON.stringify(chunks)).not.toContain('unrequested-page-body:');
    expect(JSON.stringify(history)).not.toContain('unrequested-page-body:');
    expect(requests).toHaveLength(1);
  });

  it('returns noEvidence for empty results and uses snippets when summaries are empty', async () => {
    answer = (response) => json(response, { results: [] });
    expect(await search()).toEqual({
      results: [
        { query: 'Current facts', status: 'failed', reason: 'noEvidence' },
      ],
    });
    answer = (response) =>
      json(response, { results: [{ ...page, summary: '' }] });
    expect((await search()).results[0]).toMatchObject({
      findings: `[1] ${page.title}\n${page.snippet}`,
    });
  });

  it('preserves adapter error categories in the common classifier and applies common gateway failure semantics', async () => {
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
      const error = await adapter().catch((error: unknown) => error);
      expect(error).toBeInstanceOf(ModelError);
      expect(classify(error)).toMatchObject({ code, status });
      expect(inspect(error, { depth: 10 })).not.toContain(KEY);
      if (code === 'auth')
        await expect(search()).rejects.toMatchObject({ code });
      else
        expect(await search()).toEqual({
          results: [
            { query: 'Current facts', status: 'failed', reason: 'unavailable' },
          ],
        });
    }
    expect(requests).toHaveLength(20);
  });

  it('preserves successful siblings when one query is rate-limited', async () => {
    answer = (response, query) =>
      query === 'limited'
        ? json(response, { error: { message: KEY } }, 429)
        : json(response, { results: [page] });
    const result = await search(['valid', 'limited', 'later']);
    expect(result.results.map((item) => item.status)).toEqual([
      'success',
      'failed',
      'success',
    ]);
    expect(result.results[1]).toEqual({
      query: 'limited',
      status: 'failed',
      reason: 'unavailable',
    });
  });

  it('returns a single timeout while retaining other successful queries', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const transport = vi.fn((_input: unknown, init?: RequestInit) => {
      const { query } = JSON.parse(String(init?.body)) as { query: string };
      if (query !== 'hang')
        return Promise.resolve(Response.json({ results: [page] }));
      return new Promise<Response>((_resolve, reject) =>
        init?.signal?.addEventListener(
          'abort',
          () => reject(init.signal?.reason),
          { once: true },
        ),
      );
    });
    vi.stubGlobal('fetch', transport);
    const pending = search(['hang', 'success', 'later']);
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(3));
    await vi.advanceTimersByTimeAsync(WEB_SEARCH_LIMITS.queryTimeoutMs);
    const result = await pending;
    expect(result.results.map((item) => item.status)).toEqual([
      'failed',
      'success',
      'success',
    ]);
    expect(result.results[0]).toEqual({
      query: 'hang',
      status: 'failed',
      reason: 'timeout',
    });
  });

  it('cancels active HTTP requests with the caller reason and leaves queued queries unstarted', async () => {
    let closed = 0;
    answer = (response) => {
      response.on('close', () => {
        closed++;
      });
    };
    const controller = new AbortController();
    const reason = new Error('Stop DeepSeek searches');
    const pending = search(
      ['first', 'second', 'third', 'fourth'],
      controller.signal,
    );
    void pending.catch(() => {});
    try {
      await vi.waitFor(() => expect(requests).toHaveLength(2));
      controller.abort(reason);
      await expect(pending).rejects.toBe(reason);
      await vi.waitFor(() => expect(closed).toBe(2));
      expect(requests).toHaveLength(2);
    } finally {
      controller.abort();
      await Promise.allSettled([pending]);
    }
  });

  it('propagates an authentication failure through group cancellation without relabeling it as a timeout', async () => {
    const responses = new Map<string, ServerResponse>();
    let closed = false;
    answer = (response, query) => {
      responses.set(query, response);
      if (query === 'hold')
        response.on('close', () => {
          closed = true;
        });
      if (responses.has('denied') && responses.has('hold'))
        json(responses.get('denied')!, { error: { message: KEY } }, 401);
    };
    const reasons: unknown[] = [];
    const transport = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      (input: string | URL | Request, init?: RequestInit) => {
        init?.signal?.addEventListener(
          'abort',
          () => reasons.push(init.signal?.reason),
          { once: true },
        );
        return transport(input, init);
      },
    );
    await expect(
      search(['denied', 'hold', 'later', 'last']),
    ).rejects.toMatchObject({ code: 'auth' });
    await vi.waitFor(() => expect(closed).toBe(true));
    expect(requests).toHaveLength(2);
    expect(reasons.length).toBeGreaterThan(0);
    for (const reason of reasons)
      expect(reason).toMatchObject({ code: 'auth' });
  });

  it('bounds and validates responses without retaining unsafe text or echoed keys', async () => {
    answer = (response) =>
      json(response, { results: [{ ...page, title: KEY, summary: KEY }] });
    expect(JSON.stringify(await search())).not.toContain(KEY);
    for (const body of [
      'not JSON',
      JSON.stringify({ wrong: KEY }),
      JSON.stringify({ oversized: 'x'.repeat(2 * 1024 * 1024) }),
    ]) {
      answer = (response) => response.end(body);
      const error = await adapter().catch((error: unknown) => error);
      expect(classify(error).code).toBe('badResponse');
      expect(inspect(error, { depth: 10 })).not.toContain(KEY);
      expect(await search()).toEqual({
        results: [
          { query: 'Current facts', status: 'failed', reason: 'unavailable' },
        ],
      });
    }
  });

  it('filters unsafe and duplicated sources and bounds findings', async () => {
    answer = (response) =>
      json(response, {
        results: [
          { ...page, url: 'javascript:alert(1)' },
          { ...page, url: 'https://user:password@example.com' },
          { ...page, url: `https://example.com/${KEY}` },
          { ...page, summary: '😀'.repeat(7000) },
          page,
        ],
      });
    const result = await search();
    expect(result.results[0]).toMatchObject({
      status: 'success',
      sources: [source],
    });
    if (result.results[0]?.status !== 'success')
      throw new Error('Expected evidence.');
    expect([...result.results[0].findings]).toHaveLength(
      WEB_SEARCH_LIMITS.findingsCharacters,
    );
  });

  it('isolates the 128-code-point query limit without expanding result fields', async () => {
    const queries = ['valid', '😀'.repeat(129), '😀'.repeat(128), 'later'];
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
    });
    expect(requests).toHaveLength(3);
  });

  it('uses the original preflight exceptions for cancellation, invalid input and missing configuration', async () => {
    const reason = new Error('Already stopped');
    await expect(search(undefined, AbortSignal.abort(reason))).rejects.toBe(
      reason,
    );
    await expect(search([])).rejects.toBeInstanceOf(ZodError);
    await h.services.models.services.update('deepseek', { apiKey: '' });
    await expect(search()).rejects.toMatchObject({ code: 'auth' });
    await h.services.models.services.update('deepseek', {
      apiKey: KEY,
      baseUrl: 'https://proxy.example/v1',
    });
    await expect(search()).rejects.toMatchObject({ code: 'config' });
    expect(requests).toHaveLength(0);
  });

  it('classifies transport failures without retaining a secret cause', async () => {
    vi.stubGlobal('fetch', () => {
      throw new Error(KEY);
    });
    const error = await adapter().catch((error: unknown) => error);
    expect(classify(error).code).toBe('network');
    expect(inspect(error, { depth: 10 })).not.toContain(KEY);
    expect(await search()).toEqual({
      results: [
        { query: 'Current facts', status: 'failed', reason: 'unavailable' },
      ],
    });
  });
});
