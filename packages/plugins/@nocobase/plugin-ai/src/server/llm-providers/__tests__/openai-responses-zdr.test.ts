/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import type { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import type { ChatOpenAI } from '@langchain/openai';
import type { Application } from '@nocobase/server';
import { createAgent, tool } from 'langchain';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AIManager } from '../../manager/ai-manager';
import type PluginAIServer from '../../plugin';
import { openaiResponsesProviderOptions } from '../openai';
import { OpenAIResponsesProvider } from '../openai/responses';

const SESSION_ID = 'zdr-test-session';
const CALL_ID = 'call_lookup';
const ITEM_IDS = ['rs_resource_a', 'msg_resource_a', 'fc_resource_a'];
const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

type InputItem = {
  type: string;
  id?: string;
  role?: string;
  content?: unknown;
  name?: string;
  arguments?: string;
  call_id?: string;
  output?: string;
};

type RequestBody = {
  model: string;
  input: InputItem[];
  stream: boolean;
  store?: boolean;
  prompt_cache_key?: string;
};

const requests: RequestBody[] = [];
let baseURL: string;

function createProvider(zdrEnabled?: boolean) {
  const app: unknown = {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
    getVersion: () => '2.2.23',
  };
  return new OpenAIResponsesProvider({
    app: app as Application,
    serviceOptions: { apiKey: 'test-key', baseURL, ...(zdrEnabled === undefined ? {} : { zdrEnabled }) },
    modelOptions: {
      model: 'gpt-4.1',
      maxRetries: 0,
    },
    requestContext: { sessionId: SESSION_ID },
  });
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const body = JSON.parse(Buffer.concat(chunks).toString()) as RequestBody;
  requests.push(body);
  const hasToolResult = body.input.some((item) => item.type === 'function_call_output');
  const result = {
    id: hasToolResult ? `resp_final_${requests.length}` : 'resp_resource_a',
    object: 'response',
    created_at: 0,
    model: body.model,
    status: 'completed',
    output: hasToolResult
      ? [
          {
            type: 'message',
            id: 'msg_final',
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text: 'Sunny', annotations: [] }],
          },
        ]
      : [
          { type: 'reasoning', id: ITEM_IDS[0], summary: [{ type: 'summary_text', text: 'Check the weather' }] },
          {
            type: 'message',
            id: ITEM_IDS[1],
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text: 'Looking up the weather', annotations: [] }],
          },
          {
            type: 'function_call',
            id: ITEM_IDS[2],
            call_id: CALL_ID,
            name: 'lookup',
            arguments: '{"city":"Shanghai"}',
            status: 'completed',
          },
        ],
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  };
  if (!body.stream) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(result));
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const events: Record<string, unknown>[] = [
    { type: 'response.created', response: { ...result, status: 'in_progress' } },
  ];
  for (const [outputIndex, item] of result.output.entries()) {
    events.push({ type: 'response.output_item.added', output_index: outputIndex, item });
    if ('content' in item && item.content) {
      events.push({
        type: 'response.output_text.delta',
        delta: item.content[0].text,
        content_index: 0,
        output_index: outputIndex,
        item_id: item.id,
      });
    }
    events.push({ type: 'response.output_item.done', output_index: outputIndex, item });
  }
  events.push({ type: 'response.completed', response: result });
  for (const event of events) {
    response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
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
  process.env.SERVER_REQUEST_WHITELIST = '127.0.0.1';
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

async function invokeStream(model: ChatOpenAI, messages: BaseMessage[]): Promise<AIMessageChunk> {
  let result: AIMessageChunk | undefined;
  for await (const chunk of await model.stream(messages)) {
    result = result ? result.concat(chunk) : chunk;
  }
  if (!result) {
    throw new Error('Expected a streamed response');
  }
  return result;
}

function expectStatelessRequest(body: RequestBody) {
  expect(body.store).toBe(false);
  expect(body.prompt_cache_key).toBe(SESSION_ID);
  expect(body).not.toHaveProperty('zdrEnabled');
  expect(body).not.toHaveProperty('previous_response_id');
  expect(body.input.every((item) => !item.id)).toBe(true);
  expect(body.input.some((item) => item.type === 'reasoning')).toBe(false);
  expect(body.input).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'function_call',
        name: 'lookup',
        arguments: '{"city":"Shanghai"}',
        call_id: CALL_ID,
      }),
      expect.objectContaining({ type: 'function_call_output', call_id: CALL_ID, output: 'Sunny' }),
    ]),
  );
}

describe('OpenAI Responses stateless requests', () => {
  it('uses the saved service setting through the AI employee provider resolver', async () => {
    const configuredProvider = createProvider(true);
    const plugin: unknown = {
      app: configuredProvider.app,
      db: {
        getRepository: () => ({
          findOne: async () => ({ provider: 'openai', options: configuredProvider.serviceOptions }),
        }),
      },
    };
    const manager = new AIManager(plugin as PluginAIServer);
    manager.registerLLMProvider('openai', openaiResponsesProviderOptions);

    const { provider } = await manager.getLLMService(
      { llmService: 'gateway', model: 'gpt-4.1' },
      { sessionId: SESSION_ID },
    );
    await provider.createModel().invoke('Hello');

    expect(requests).toHaveLength(1);
    expect(requests[0].store).toBe(false);
    expect(requests[0].prompt_cache_key).toBe(SESSION_ID);
  });
  it.each([undefined, false])('preserves the existing request behavior when zdrEnabled=%s', async (enabled) => {
    const provider = createProvider(enabled);
    const model = provider.createModel();
    const userMessage = new HumanMessage('Weather in Shanghai?');
    const reply = await model.invoke([userMessage]);

    await model.invoke([userMessage, reply, new ToolMessage({ content: 'Sunny', tool_call_id: CALL_ID })]);

    expect(requests).toHaveLength(2);
    expect(requests[1]).not.toHaveProperty('store');
    expect(requests[1].input.map((item) => item.id).filter(Boolean)).toEqual(ITEM_IDS);
    expect(provider.createModel().zdrEnabled).toBe(false);
  });

  it.each([false, true])(
    'filters same-turn tool-loop messages in the final HTTP body (stream=%s)',
    async (streaming) => {
      const provider = createProvider(true);
      const model = provider.createModel();
      const userMessage = new HumanMessage('Weather in Shanghai?');
      const reply = streaming ? await invokeStream(model, [userMessage]) : await model.invoke([userMessage]);
      expect(reply.additional_kwargs).toMatchObject({
        reasoning: { id: ITEM_IDS[0] },
        __openai_function_call_ids__: { [CALL_ID]: ITEM_IDS[2] },
      });
      expect(reply.response_metadata.output).toHaveLength(3);
      const originalMessage = JSON.stringify(reply);
      const messages = [userMessage, reply, new ToolMessage({ content: 'Sunny', tool_call_id: CALL_ID })];

      if (streaming) {
        expect((await invokeStream(model, messages)).text).toBe('Sunny');
      } else {
        expect((await model.invoke(messages)).text).toBe('Sunny');
      }

      expect(requests).toHaveLength(2);
      expect(requests.every((body) => body.store === false)).toBe(true);
      expectStatelessRequest(requests[1]);
      expect(JSON.stringify(reply)).toBe(originalMessage);
    },
  );

  it('filters old messages restored from a LangGraph checkpoint without modifying the saved state', async () => {
    const checkpointer = new MemorySaver();
    const lookup = tool(({ city }) => (city === 'Shanghai' ? 'Sunny' : 'Unknown'), {
      name: 'lookup',
      description: 'Look up the weather',
      schema: z.object({ city: z.string() }),
    });
    const config = { configurable: { thread_id: SESSION_ID } };
    const firstAgent = createAgent({ model: createProvider(false).createModel(), tools: [lookup], checkpointer });
    await firstAgent.invoke({ messages: [new HumanMessage('Weather in Shanghai?')] }, config);
    const checkpoint = await checkpointer.getTuple(config);
    expect(checkpoint).toBeDefined();
    if (!checkpoint) {
      throw new Error('Expected a saved checkpoint');
    }
    const savedState = JSON.stringify(checkpoint);
    expect(savedState).toContain(ITEM_IDS[0]);
    expect(savedState).toContain(ITEM_IDS[2]);
    requests.length = 0;

    const resumedAgent = createAgent({ model: createProvider(true).createModel(), tools: [lookup], checkpointer });
    const result = await resumedAgent.invoke({ messages: [new HumanMessage('Repeat the result')] }, config);

    expect(result.messages.at(-1)?.text).toBe('Sunny');
    expect(requests).toHaveLength(1);
    expectStatelessRequest(requests[0]);
    expect(await checkpointer.getTuple(checkpoint.config)).toEqual(checkpoint);
  });

  it.each([false, true])('filters aiMessages-style history on resend (stream=%s)', async (streaming) => {
    const initialProvider = createProvider(false);
    const reply = await initialProvider.createModel().invoke('Weather in Shanghai?');
    const metadata: Pick<AIMessage, 'additional_kwargs' | 'response_metadata'> = JSON.parse(
      JSON.stringify({
        additional_kwargs: reply.additional_kwargs,
        response_metadata: reply.response_metadata,
      }),
    );
    const originalMetadata = JSON.stringify(metadata);
    const provider = createProvider(true);
    // Match formatMessages(): assistant content/tool_calls/additional_kwargs, without response_metadata.
    const messages = [
      { role: 'user' as const, content: 'Weather in Shanghai?' },
      {
        role: 'assistant' as const,
        content: reply.content,
        tool_calls: reply.tool_calls,
        additional_kwargs: provider.prepareStoredAssistantAdditionalKwargs(metadata.additional_kwargs),
      },
      { role: 'tool' as const, content: 'Sunny', tool_call_id: CALL_ID },
      { role: 'user' as const, content: 'Repeat the result' },
    ];
    requests.length = 0;

    if (streaming) {
      const events = await provider.stream({ messages }, { version: 'v2' });
      for await (const _event of events) {
        // Consume the actual SDK stream to complete the request.
      }
    } else {
      expect((await provider.invoke({ messages })).text).toBe('Sunny');
    }

    expect(requests).toHaveLength(1);
    expectStatelessRequest(requests[0]);
    expect(JSON.stringify(metadata)).toBe(originalMetadata);
  });

  it('omits an assistant message item ID even without response_metadata.output', async () => {
    const provider = createProvider(true);
    await provider
      .createModel()
      .invoke([
        new HumanMessage('Hello'),
        new AIMessage({ id: ITEM_IDS[1], content: 'Hello back' }),
        new HumanMessage('Continue'),
      ]);

    expect(requests).toHaveLength(1);
    expect(requests[0].store).toBe(false);
    expect(requests[0].input).toContainEqual({ type: 'message', role: 'assistant', content: 'Hello back' });
  });
});
