import { WEB_SEARCH_RETRIEVAL_INSTRUCTIONS } from '../server/online/search/prompts.js';
import { createModelGateway } from '../server/online/gateway.js';
import { createHarness, type Harness } from './harness.js';
import {
  createServer,
  type IncomingHttpHeaders,
  type ServerResponse,
} from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MODEL_USER_AGENT } from '../server/online/providers.js';

interface Candidate {
  readonly provider: 'anthropic' | 'google';
  readonly model: string;
  readonly origin: string;
  readonly path: string;
}
const candidates: readonly Candidate[] = [
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    origin: 'https://api.anthropic.com',
    path: '/v1/messages',
  },
  {
    provider: 'google',
    model: 'gemini-2.5-flash',
    origin: 'https://generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-2.5-flash:generateContent',
  },
  {
    provider: 'google',
    model: 'gemini-3.1-flash-lite-preview',
    origin: 'https://generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-3.1-flash-lite-preview:generateContent',
  },
  {
    provider: 'anthropic',
    model: 'future-anthropic-chat-model',
    origin: 'https://api.anthropic.com',
    path: '/v1/messages',
  },
];

/** Real locked SDKs; synthetic provider responses and keys, with all outbound calls confined to loopback. */
describe.each(candidates)('$provider native search SDK gate', (candidate) => {
  const realFetch = globalThis.fetch;
  let requests: {
    method: string;
    path: string;
    headers: IncomingHttpHeaders;
    body: unknown;
  }[];
  let answer: (response: ServerResponse) => void;
  let close: () => Promise<void>;
  let harness: Harness | undefined;
  function responseBody({
    executed = true,
    sources = true,
    url = 'https://example.com/evidence',
  } = {}): unknown {
    if (candidate.provider === 'anthropic')
      return {
        id: 'msg_search',
        type: 'message',
        role: 'assistant',
        model: candidate.model,
        system: [{ type: 'text', text: WEB_SEARCH_RETRIEVAL_INSTRUCTIONS }],
        content: [
          ...(executed
            ? [
                {
                  type: 'server_tool_use',
                  id: 'srv_search',
                  name: 'web_search',
                  input: { query: 'NocoBase' },
                },
                {
                  type: 'web_search_tool_result',
                  tool_use_id: 'srv_search',
                  content: sources
                    ? [
                        {
                          type: 'web_search_result',
                          title: 'Evidence',
                          url,
                          encrypted_content: 'private-opaque-content',
                          page_age: null,
                        },
                      ]
                    : [],
                },
              ]
            : []),
          { type: 'text', text: 'Safe finding', citations: [] },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 20, output_tokens: 10 },
      };
    return {
      candidates: [
        {
          index: 0,
          finishReason: 'STOP',
          content: { role: 'model', parts: [{ text: 'Safe finding' }] },
          groundingMetadata: {
            webSearchQueries: executed ? ['NocoBase'] : [],
            groundingChunks: sources
              ? [{ web: { uri: url, title: 'Evidence' } }]
              : [],
          },
        },
      ],
      usageMetadata: {
        promptTokenCount: 20,
        candidatesTokenCount: 10,
        totalTokenCount: 30,
      },
    };
  }
  async function setup(): Promise<Harness> {
    harness = await createHarness();
    await harness.services.models.services.create({
      title: 'Search',
      provider: candidate.provider,
      apiKey: 'offline-provider-key',
      models: [{ value: candidate.model }],
    });
    return harness;
  }
  async function search(
    h: Harness,
    signal: AbortSignal = new AbortController().signal,
  ) {
    const result = await createModelGateway(h.services.models.services).search({
      model: { modelService: 'search', model: candidate.model },
      queries: ['NocoBase'],
      sessionId: 'provider-fixture',
      signal,
      source: 'agents.webSearch',
    });
    return result.results[0];
  }
  beforeEach(async () => {
    requests = [];
    answer = (response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(responseBody()));
    };
    const server = createServer((request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk) => {
        body += chunk;
      });
      request.on('end', () => {
        const parsed: unknown = JSON.parse(body);
        requests.push({
          method: request.method ?? '',
          path: request.url ?? '',
          headers: request.headers,
          body: parsed,
        });
        answer(response);
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Expected loopback HTTP fixture');
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
        if (url.origin !== candidate.origin)
          throw new Error('Unexpected outbound provider request');
        return realFetch(`${origin}${url.pathname}`, init);
      },
    );
  });
  afterEach(async () => {
    await harness?.close();
    harness = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await close();
  });

  it('sends the exact model, native tool and explicit reasoning-off settings with safe evidence', async () => {
    expect(await search(await setup())).toEqual({
      query: 'NocoBase',
      status: 'success',
      findings: 'Safe finding',
      sources: [{ title: 'Evidence', url: 'https://example.com/evidence' }],
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: 'POST', path: candidate.path });
    expect(requests[0]?.headers['user-agent']).toContain(MODEL_USER_AGENT);
    expect(requests[0]?.headers['x-opencode-session']).toBeUndefined();
    if (candidate.provider === 'anthropic')
      expect(requests[0]?.body).toMatchObject({
        model: candidate.model,
        thinking: { type: 'disabled' },
        tools: [
          { type: 'web_search_20250305', name: 'web_search', max_uses: 1 },
        ],
        tool_choice: {
          type: 'tool',
          name: 'web_search',
          disable_parallel_tool_use: true,
        },
        messages: [
          { role: 'user', content: [{ type: 'text', text: 'NocoBase' }] },
        ],
      });
    else
      expect(requests[0]?.body).toMatchObject({
        systemInstruction: {
          parts: [{ text: WEB_SEARCH_RETRIEVAL_INSTRUCTIONS }],
        },
        tools: [{ googleSearch: {} }],
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0, includeThoughts: false },
        },
        contents: [{ role: 'user', parts: [{ text: 'NocoBase' }] }],
      });
    expect(JSON.stringify(requests[0]?.body)).not.toContain('attachments');
  });
  it.each([
    { executed: false, sources: true },
    { executed: true, sources: false },
    { executed: true, sources: true, url: 'javascript:alert(1)' },
    { executed: true, sources: true, url: 'https://user:secret@example.com' },
  ])(
    'requires executed native search and safe sources: %j',
    async (options) => {
      answer = (response) => {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(responseBody(options)));
      };
      expect(await search(await setup())).toEqual({
        query: 'NocoBase',
        status: 'failed',
        reason: 'noEvidence',
      });
      expect(requests).toHaveLength(1);
    },
  );
  it('cancels before dispatch without any provider request', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Cancelled before search'));
    await expect(search(await setup(), controller.signal)).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });
  it('sanitizes upstream authentication failures and never retries', async () => {
    answer = (response) => {
      response.writeHead(401, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          type: 'error',
          error: {
            type: 'authentication_error',
            message: 'Private upstream details',
          },
        }),
      );
    };
    await expect(search(await setup())).rejects.toMatchObject({
      code: 'auth',
      message: 'Web search model configuration or credentials are unavailable.',
    });
    expect(requests).toHaveLength(1);
  });
  it.each([400, 500])(
    'maps incompatible model/options and service failure %s to safe evidence without retrying',
    async (status) => {
      answer = (response) => {
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({ error: { message: 'Private upstream details' } }),
        );
      };
      expect(await search(await setup())).toEqual({
        query: 'NocoBase',
        status: 'failed',
        reason: 'unavailable',
      });
      expect(requests).toHaveLength(1);
    },
  );
  it('cancels active HTTP and settles without retries', async () => {
    let closed = false;
    answer = (response) => {
      response.on('close', () => {
        closed = true;
      });
    };
    const controller = new AbortController();
    const pending = search(await setup(), controller.signal);
    // Keep a failed HTTP wait from leaving an unhandled rejection or a live search.
    void pending.catch(() => {});
    try {
      await vi.waitFor(() => expect(requests).toHaveLength(1), {
        timeout: 10_000,
      });
      controller.abort(new Error('Stop hosted search'));
      await expect(pending).rejects.toThrow('Stop hosted search');
      await vi.waitFor(() => expect(closed).toBe(true), { timeout: 10_000 });
      expect(requests).toHaveLength(1);
    } finally {
      controller.abort();
      await Promise.allSettled([pending]);
    }
  });
});
