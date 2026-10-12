/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OpenAICompletionsProvider } from '../openai/completions';
import { OpenAIResponsesProvider } from '../openai/responses';

const SESSION_ID = '7e70126d-ea78-4ce3-8a47-f3e02b20391a';
const OTHER_SESSION_ID = 'd7d47246-2923-4a2c-b7d1-df58d613832e';
const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
    getVersion: () => '2.2.23',
  } as unknown as Application;
}

type CapturedRequest = {
  path: string;
  body: {
    model: string;
    prompt_cache_key?: string;
    stream?: boolean;
    store?: boolean;
  };
};

const requests: CapturedRequest[] = [];
let baseURL: string;

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const body = JSON.parse(Buffer.concat(chunks).toString()) as CapturedRequest['body'];
  requests.push({ path: request.url ?? '/', body });

  const isResponses = request.url === '/v1/responses';
  const result = isResponses
    ? {
        id: 'resp_test',
        object: 'response',
        created_at: 0,
        model: body.model,
        status: 'completed',
        output: [
          {
            type: 'message',
            id: 'msg_test',
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text: 'hello', annotations: [] }],
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      }
    : {
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 0,
        model: body.model,
        choices: [{ index: 0, message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };

  if (!body.stream) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(result));
    return;
  }

  response.writeHead(200, { 'Content-Type': 'text/event-stream' });
  if (isResponses) {
    const events = [
      { type: 'response.created', response: { ...result, status: 'in_progress' } },
      { type: 'response.output_text.delta', delta: 'hello', content_index: 0, output_index: 0, item_id: 'msg_test' },
      { type: 'response.completed', response: result },
    ];
    for (const event of events) {
      response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    }
  } else {
    response.write(
      `data: ${JSON.stringify({
        id: 'chatcmpl-test',
        object: 'chat.completion.chunk',
        created: 0,
        model: body.model,
        choices: [{ index: 0, delta: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }],
      })}\n\n`,
    );
    response.write('data: [DONE]\n\n');
  }
  response.end();
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error: Error) => response.destroy(error));
});

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP address for the mock gateway');
  }
  baseURL = `http://127.0.0.1:${address.port}/v1`;
});

beforeEach(() => {
  requests.length = 0;
  process.env.SERVER_REQUEST_WHITELIST = '127.0.0.1,api.openai.com,opencode.ai';
});

afterEach(() => {
  if (originalWhitelist === undefined) {
    delete process.env.SERVER_REQUEST_WHITELIST;
  } else {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
  }
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe.each([
  ['Chat Completions', OpenAICompletionsProvider, '/v1/chat/completions'],
  ['Responses', OpenAIResponsesProvider, '/v1/responses'],
] as const)('%s prompt cache key', (_protocol, Provider, endpoint) => {
  it('uses the conversation primary key, including when the agent recreates the model', () => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'gpt-4o-mini' },
      requestContext: { sessionId: SESSION_ID },
    });

    expect(provider.chatModel.promptCacheKey).toBe(SESSION_ID);
    expect(provider.createModel().invocationParams({}).prompt_cache_key).toBe(SESSION_ID);
  });

  it('uses the same identity for the OpenCode session header and prompt cache key', () => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: 'https://opencode.ai/zen/go/v1' },
      modelOptions: { model: 'gpt-4o-mini' },
      requestContext: { sessionId: SESSION_ID },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({
      'User-Agent': 'NocoBase/2.2.23',
      'x-opencode-session': SESSION_ID,
    });
    expect(provider.chatModel.invocationParams({}).prompt_cache_key).toBe(SESSION_ID);
  });

  it('prefers the conversation key over a fixed model option', () => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'gpt-4o-mini', promptCacheKey: 'fixed-key' },
      requestContext: { sessionId: SESSION_ID },
    });

    expect(provider.chatModel.invocationParams({}).prompt_cache_key).toBe(SESSION_ID);
  });

  it.each([undefined, ''])('preserves a configured key without a session (%s)', (sessionId) => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'gpt-4o-mini', promptCacheKey: 'fixed-key' },
      requestContext: { sessionId },
    });

    expect(provider.chatModel.invocationParams({}).prompt_cache_key).toBe('fixed-key');
  });

  it.each([false, true])('sends the key in the final HTTP body (stream=%s)', async (streaming) => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL },
      modelOptions: { model: 'gpt-4o-mini', maxRetries: 0 },
      requestContext: { sessionId: SESSION_ID },
    });
    const context = { messages: [{ role: 'user' as const, content: 'hello' }] };

    if (streaming) {
      const events = await provider.stream(context, { version: 'v2' });
      let eventCount = 0;
      for await (const _event of events) {
        eventCount++;
      }
      expect(eventCount).toBeGreaterThan(0);
    } else {
      const message = await provider.invoke(context);
      expect(message.text).toBe('hello');
    }

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      path: endpoint,
      body: { prompt_cache_key: SESSION_ID, stream: streaming },
    });
    expect(requests[0].body).not.toHaveProperty('promptCacheKey');
    expect(requests[0].body).not.toHaveProperty('store');
  });

  it('keeps the wire key stable across rounds and isolates another conversation', async () => {
    for (const sessionId of [SESSION_ID, SESSION_ID, OTHER_SESSION_ID]) {
      const provider = new Provider({
        app: createApp(),
        serviceOptions: { apiKey: 'test-key', baseURL },
        modelOptions: { model: 'gpt-4o-mini', maxRetries: 0 },
        requestContext: { sessionId },
      });
      const model = provider
        .createModel()
        .bindTools([
          { type: 'function', function: { name: 'lookup', parameters: { type: 'object', properties: {} } } },
        ]);
      await model.invoke('hello');
    }

    expect(requests.map(({ body }) => body.prompt_cache_key)).toEqual([SESSION_ID, SESSION_ID, OTHER_SESSION_ID]);
    expect(requests.every(({ path }) => path === endpoint)).toBe(true);
  });

  it('omits the wire key when there is no session or configured key', async () => {
    const provider = new Provider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL },
      modelOptions: { model: 'gpt-4o-mini', maxRetries: 0 },
    });

    await provider.createModel().invoke('hello');

    expect(requests).toHaveLength(1);
    expect(requests[0].body).not.toHaveProperty('prompt_cache_key');
  });
});
