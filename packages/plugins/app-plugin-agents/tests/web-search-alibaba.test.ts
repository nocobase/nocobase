import { fixtureModel } from './helpers/native-files.js';
import {
  WEB_SEARCH_RETRIEVAL_INSTRUCTIONS,
  WEB_SEARCH_TOOL_DESCRIPTION,
} from '../server/online/search/prompts.js';
import { Authorization } from '@nocobase/authorization/core';
import { generateText, simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import {
  createServer,
  type IncomingHttpHeaders,
  type ServerResponse,
} from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as providers from '../server/online/providers.js';
import { createModelGateway } from '../server/online/gateway.js';
import {
  publicSearchResult,
  searchItem,
  unverifiedSearchItem,
} from '../shared/web-search-results.js';
import { WEB_SEARCH_LIMITS } from '../shared/web-search.js';
import { createHarness, type Harness } from './harness.js';

/** Real Alibaba SDK and application gateway; every model request is confined to loopback. */
describe('Alibaba search without source evidence', () => {
  const realFetch = globalThis.fetch;
  let harness: Harness;
  let requestOrigins: string[];
  let requests: { path: string; headers: IncomingHttpHeaders; body: unknown }[];
  let answer: (response: ServerResponse) => void;
  let close: () => Promise<void>;
  const responseBody = (
    text: string = 'Provider answer without verifiable search evidence.',
  ) => ({
    id: 'offline-alibaba',
    model: 'qwen-plus',
    created: 1,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
    private_metadata: 'private-provider-payload',
  });
  beforeEach(async () => {
    requests = [];
    requestOrigins = [];
    answer = (response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(responseBody()));
    };
    const server = createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString());
      requests.push({
        path: request.url ?? '',
        headers: request.headers,
        body,
      });
      answer(response);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Expected loopback fixture.');
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
          ![
            'https://dashscope.aliyuncs.com',
            'https://dashscope-intl.aliyuncs.com',
          ].includes(url.origin)
        )
          throw new Error('Unexpected outbound provider request.');
        requestOrigins.push(url.origin);
        return realFetch(`${origin}${url.pathname}`, init);
      },
    );
    harness = await createHarness();
    await harness.services.models.services.create({
      title: 'Alibaba search',
      provider: 'alibaba',
      apiKey: 'offline-alibaba-key',
      models: [{ value: 'qwen-plus' }],
    });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await harness?.close();
    vi.unstubAllGlobals();
    await close();
  });
  const selectedModel = { modelService: 'alibaba-search', model: 'qwen-plus' };
  const search = (
    queries: string[] = ['Current facts'],
    signal: AbortSignal = new AbortController().signal,
  ) =>
    createModelGateway(harness.services.models.services).search({
      model: selectedModel,
      queries,
      signal,
      sessionId: 'alibaba-session',
      source: 'agents.webSearch',
    });

  it('enables search only on the isolated child and returns a source-free unverified answer', async () => {
    const result = await search();
    expect(result.results).toEqual([
      {
        query: 'Current facts',
        status: 'unverified',
        findings: 'Provider answer without verifiable search evidence.',
        sources: [],
      },
    ]);
    expect(publicSearchResult(result)).toEqual(result);
    expect(requests).toHaveLength(1);
    expect(requestOrigins).toEqual(['https://dashscope.aliyuncs.com']);
    expect(requests[0]?.path).toBe('/compatible-mode/v1/chat/completions');
    expect(requests[0]?.headers.authorization).toBe(
      'Bearer offline-alibaba-key',
    );
    expect(requests[0]?.headers['user-agent']).toContain(
      providers.MODEL_USER_AGENT,
    );
    expect(requests[0]?.headers['x-opencode-session']).toBeUndefined();
    expect(requests[0]?.body).toMatchObject({
      model: 'qwen-plus',
      enable_search: true,
      search_options: { forced_search: true },
      enable_thinking: false,
      preserve_thinking: false,
      messages: [
        {
          role: 'system',
          content: WEB_SEARCH_RETRIEVAL_INSTRUCTIONS,
        },
        { role: 'user', content: [{ type: 'text', text: 'Current facts' }] },
      ],
    });
    expect(requests[0]?.body).not.toHaveProperty('tools');
    expect(JSON.stringify(result)).not.toMatch(
      /offline-alibaba-key|private-provider-payload|private_metadata/,
    );
    await generateText({
      model: providers.languageModel(
        { provider: 'alibaba', baseUrl: null, apiKey: 'ordinary-key' },
        'qwen-plus',
      ),
      prompt: 'Ordinary chat',
      maxRetries: 0,
    });
    expect(requests[1]?.body).not.toHaveProperty('enable_search');
    expect(requests[1]?.body).not.toHaveProperty('search_options');
    expect(requestOrigins[1]).toBe('https://dashscope.aliyuncs.com');
    expect(requests[1]?.headers.authorization).toBe('Bearer ordinary-key');
  });

  it.each(['qwen3.7-flash', 'future-qwen-chat'])(
    'forces search for configured model %s without switching model or protocol',
    async (model) => {
      await harness.services.models.services.update('alibaba-search', {
        models: [{ value: model }],
      });
      const result = await createModelGateway(
        harness.services.models.services,
      ).search({
        model: { ...selectedModel, model },
        queries: ['Current facts'],
        signal: new AbortController().signal,
        source: 'agents.webSearch',
      });
      expect(result.results[0]?.status).toBe('unverified');
      expect(requests).toHaveLength(1);
      expect(requests[0]?.body).toMatchObject({
        model,
        enable_search: true,
        search_options: { forced_search: true },
      });
      expect(requests[0]?.path).toBe('/compatible-mode/v1/chat/completions');
    },
  );

  it('preserves an explicitly configured Singapore endpoint without regional fallback', async () => {
    await harness.services.models.services.update('alibaba-search', {
      baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
    expect((await search()).results[0]?.status).toBe('unverified');
    expect(requestOrigins).toEqual(['https://dashscope-intl.aliyuncs.com']);
    expect(requests[0]?.headers.authorization).toBe(
      'Bearer offline-alibaba-key',
    );
  });

  it('does not treat an empty answer as a usable unverified result', async () => {
    answer = (response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(responseBody('  ')));
    };
    expect((await search()).results).toEqual([
      { query: 'Current facts', status: 'failed', reason: 'noEvidence' },
    ]);
  });

  it.each([400, 500])(
    'fails safely on HTTP %s without retry or fallback',
    async (status) => {
      answer = (response) => {
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            error: {
              message: 'Private upstream details',
              type: 'invalid_request_error',
              code: 'invalid_parameter',
            },
          }),
        );
      };
      expect((await search()).results).toEqual([
        { query: 'Current facts', status: 'failed', reason: 'unavailable' },
      ]);
      expect(requests).toHaveLength(1);
    },
  );

  it('halts queued queries on authentication failure and hides provider details', async () => {
    answer = (response) => {
      response.writeHead(401, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          error: {
            message: 'Private upstream details',
            type: 'authentication_error',
            code: 'invalid_api_key',
          },
        }),
      );
    };
    await expect(search(['One', 'Two', 'Three', 'Four'])).rejects.toMatchObject(
      {
        code: 'auth',
        message:
          'Web search model configuration or credentials are unavailable.',
      },
    );
    expect(requests.length).toBeLessThanOrEqual(WEB_SEARCH_LIMITS.concurrency);
    expect(requests.length).toBeGreaterThan(0);
  });

  it('cancels active HTTP searches and prevents queued requests', async () => {
    let closed = 0;
    answer = (response) => {
      response.on('close', () => closed++);
    };
    const controller = new AbortController();
    const pending = search(['One', 'Two', 'Three', 'Four'], controller.signal);
    const failure = pending.then(
      () => null,
      (error: unknown) => error,
    );
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    controller.abort(new Error('Stopped by user'));
    expect(await failure).toBeInstanceOf(Error);
    await vi.waitFor(() => expect(closed).toBe(2));
    expect(requests).toHaveLength(2);
  });

  it('cancels before dispatch without invoking the provider', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      search(['Current facts'], controller.signal),
    ).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });

  it('round-trips unverified results through the Native model and canonical history without claiming evidence', async () => {
    const authorization = new Authorization({ plugins: [] }).for({
      principal: { type: 'user', id: 'alice' },
    });
    const actor = { user: { id: 'alice' }, authorization, credentials: {} };
    let step = 0;
    const usage = {
      inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    };
    const main = new MockLanguageModelV4({
      doStream: async ({ prompt, tools }) => {
        if (step++ === 0) {
          expect(
            tools?.find((tool) => tool.name === 'webSearch'),
          ).toMatchObject({
            description: WEB_SEARCH_TOOL_DESCRIPTION,
          });
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: 'tool-call',
                  toolCallId: 'alibaba-search-call',
                  toolName: 'webSearch',
                  input: '{"queries":["Current facts"]}',
                },
                {
                  type: 'finish',
                  usage,
                  finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
                },
              ],
            }),
          };
        }
        expect(prompt).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              role: 'tool',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'tool-result',
                  output: {
                    type: 'text',
                    value: expect.stringContaining('"status":"unverified"'),
                  },
                }),
              ]),
            }),
          ]),
        );
        expect(JSON.stringify(prompt)).toContain(
          'Provider answer without verifiable search evidence.',
        );
        expect(JSON.stringify(prompt)).toContain(
          'unverified results do not establish search execution',
        );
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 'reply' },
              {
                type: 'text-delta',
                id: 'reply',
                delta:
                  'The provider answered, but search could not be verified.',
              },
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
    const online = harness.services.onlineAgent;
    const agent = await online.realtime(actor, {
      webSearch: true,
      selectedModel,
    });
    await agent.send([{ role: 'user', content: 'Find current facts.' }]);
    const stream = await agent.receive();
    if (stream) {
      const reader = stream.getReader();
      while (!(await reader.read()).done) {
        /* Drain the public Native stream. */
      }
    }
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
    const history = await agent.history();
    expect(JSON.stringify(history)).toContain('"status":"unverified"');
    expect(JSON.stringify(history)).not.toMatch(
      /offline-alibaba-key|private-provider-payload/,
    );
    const restored = await online.realtime(actor, {
      sessionId: agent.sessionId,
    });
    expect(JSON.stringify(await restored.history())).toContain(
      '"status":"unverified"',
    );
    expect(requests).toHaveLength(1);
    expect(step).toBe(2);
  });
});

it('keeps source-free text distinct from verified success and bounds the public projection', () => {
  expect(searchItem('q', 'Answer', [], true)).toEqual({
    query: 'q',
    status: 'failed',
    reason: 'noEvidence',
  });
  const result = publicSearchResult({
    results: [
      {
        query: 'q',
        status: 'unverified',
        findings: '😀'.repeat(7000),
        sources: [],
        private: 'secret',
      },
    ],
  });
  const item = result.results[0];
  expect(item?.status).toBe('unverified');
  expect(item?.status === 'unverified' && [...item.findings].length).toBe(
    WEB_SEARCH_LIMITS.findingsCharacters,
  );
  expect(JSON.stringify(result)).not.toContain('secret');
  expect(publicSearchResult(result)).toEqual(result);
  expect(unverifiedSearchItem('q', ' ')).toEqual({
    query: 'q',
    status: 'failed',
    reason: 'noEvidence',
  });
  expect(() =>
    publicSearchResult({
      results: [
        {
          query: 'q',
          status: 'unverified',
          findings: 'Answer',
          sources: [{ title: 'Invented', url: 'https://example.com' }],
        },
      ],
    }),
  ).toThrow();
});
