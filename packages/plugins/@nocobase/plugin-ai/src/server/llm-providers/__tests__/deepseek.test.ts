/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { convertMessagesToResponsesInput } from '@langchain/openai';
import type { Model } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import type OpenAI from 'openai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AIMessageInput } from '../../types';
import { patchRequestMessagesReasoning } from '../common/reasoning';
import { AIManager } from '../../manager/ai-manager';
import {
  adaptDeepSeekResponsesStream,
  DEEPSEEK_MODEL_CAPABILITIES,
  DeepSeekProvider,
  deepseekProviderOptions,
  extractDeepSeekReasoningText,
  getDeepSeekReasoningRequestParams,
  normalizeDeepSeekChatRequest,
  normalizeDeepSeekResponsesRequest,
  resolveDeepSeekReasoningConfig,
} from '../deepseek';
import { deepSeekThinkingModeFixture } from './fixtures/deepseek-thinking-mode.fixture';

function createApp(renderedValue?: Record<string, unknown>): Application {
  return {
    environment: {
      renderJsonTemplate: () => renderedValue ?? {},
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

afterEach(() => {
  process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
});

describe('DeepSeek protocol contract', () => {
  it('freezes the official model protocol and web-search capability matrix', () => {
    expect(DEEPSEEK_MODEL_CAPABILITIES['deepseek-v4-flash'].protocol).toBe('responses');
    expect(DEEPSEEK_MODEL_CAPABILITIES['deepseek-v4-flash'].supportsWebSearch).toBe(true);
    expect(DEEPSEEK_MODEL_CAPABILITIES['deepseek-v4-pro'].protocol).toBe('responses');
    expect(DEEPSEEK_MODEL_CAPABILITIES['deepseek-v4-pro'].supportsWebSearch).toBe(true);
    expect(DEEPSEEK_MODEL_CAPABILITIES['deepseek-chat'].protocol).toBe('chat-completions');
    expect(deepseekProviderOptions.webSearchModels).toEqual(deepSeekThinkingModeFixture.responsesModels);
  });

  it.each([
    ['deepseek-v4-flash', 'default', {}],
    ['deepseek-v4-flash', 'off', deepSeekThinkingModeFixture.responsesThinkingDisabled],
    ['deepseek-v4-flash', 'minimal', { reasoning: { effort: 'low' } }],
    ['deepseek-v4-flash', 'low', { reasoning: { effort: 'low' } }],
    ['deepseek-v4-flash', 'medium', { reasoning: { effort: 'high' } }],
    ['deepseek-v4-flash', 'high', deepSeekThinkingModeFixture.responsesThinkingEnabled],
    ['deepseek-v4-flash', 'xhigh', { reasoning: { effort: 'high' } }],
    ['deepseek-v4-pro', 'default', {}],
    ['deepseek-v4-pro', 'off', deepSeekThinkingModeFixture.responsesThinkingDisabled],
    ['deepseek-v4-pro', 'minimal', { reasoning: { effort: 'low' } }],
    ['deepseek-v4-pro', 'low', { reasoning: { effort: 'low' } }],
    ['deepseek-v4-pro', 'medium', deepSeekThinkingModeFixture.responsesThinkingEnabled],
    ['deepseek-v4-pro', 'high', deepSeekThinkingModeFixture.responsesThinkingEnabled],
    ['deepseek-v4-pro', 'xhigh', { reasoning: { effort: 'high' } }],
  ] as const)('maps %s reasoning mode %s to the official wire format', (model, mode, expected) => {
    const config = resolveDeepSeekReasoningConfig(model, { mode });
    expect(getDeepSeekReasoningRequestParams(config)).toEqual(expected);
  });

  it('does not inject DeepSeek-only fields into custom compatible models', () => {
    const config = resolveDeepSeekReasoningConfig('private-deepseek-compatible', { mode: 'high' });
    expect(config.recognizedModel).toBe(false);
    expect(getDeepSeekReasoningRequestParams(config)).toEqual({});
  });

  it('rejects unsupported reasoning switches for fixed-mode legacy models', () => {
    expect(() => resolveDeepSeekReasoningConfig('deepseek-reasoner', { mode: 'off' })).toThrow(
      /does not support disabling reasoning/,
    );
    expect(() => resolveDeepSeekReasoningConfig('deepseek-chat', { mode: 'low' })).toThrow(
      /does not support reasoning/,
    );
  });

  it('normalizes the final Chat Completions request body for legacy models', () => {
    const request = {
      model: 'deepseek-reasoner',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.2,
      top_p: 0.8,
      presence_penalty: 1,
      frequency_penalty: 1,
      logprobs: true,
    } as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & Record<string, unknown>;

    normalizeDeepSeekChatRequest(request, resolveDeepSeekReasoningConfig('deepseek-reasoner', { mode: 'high' }));

    expect(request).toMatchObject({
      model: 'deepseek-reasoner',
      logprobs: true,
    });
    for (const field of deepSeekThinkingModeFixture.unsupportedThinkingFields) {
      expect(request[field]).toBeUndefined();
    }
  });

  it('normalizes the final Responses request body and restores plaintext reasoning input', () => {
    const request = {
      model: 'deepseek-v4-flash',
      input: [
        {
          type: 'reasoning',
          id: 'rs_1',
          summary: [{ type: 'summary_text', text: 'continue this reasoning' }],
        },
      ],
      temperature: 0.2,
      top_p: 0.8,
      stream: false,
    } as unknown as OpenAI.Responses.ResponseCreateParamsNonStreaming & Record<string, unknown>;

    normalizeDeepSeekResponsesRequest(
      request,
      resolveDeepSeekReasoningConfig('deepseek-v4-flash', { mode: 'minimal' }),
    );

    expect(request.reasoning).toEqual({ effort: 'low' });
    expect(request.temperature).toBeUndefined();
    expect(request.top_p).toBeUndefined();
    expect(request.input[0]).toMatchObject({
      type: 'reasoning',
      id: 'rs_1',
      summary: [],
      content: [{ type: 'reasoning_text', text: 'continue this reasoning' }],
    });
  });
});

describe('DeepSeek final client routing', () => {
  it('sends V4 Pro through Responses with the DeepSeek web_search tool', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: {
        model: 'deepseek-v4-pro',
        builtIn: { webSearch: true },
        _reasoning: { mode: 'high' },
      },
    });
    const create = vi.fn(async (request: unknown) => ({ request }));
    const responses = (
      provider.chatModel as unknown as {
        responses: {
          client: unknown;
          completionWithRetry: (request: OpenAI.Responses.ResponseCreateParamsNonStreaming) => Promise<unknown>;
        };
      }
    ).responses;
    responses.client = { responses: { create } };

    await responses.completionWithRetry({
      model: 'deepseek-v4-pro',
      input: 'hello',
      tools: provider.resolveTools([]) as OpenAI.Responses.Tool[],
      stream: false,
    });

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({
      reasoning: { effort: 'high' },
      tools: [{ type: 'web_search' }],
    });
  });

  it('sends V4 Flash through Responses with the DeepSeek web_search tool', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: {
        model: 'deepseek-v4-flash',
        builtIn: { webSearch: true },
        _reasoning: { mode: 'off' },
      },
    });
    const create = vi.fn(async (request: unknown) => ({ request }));
    const responses = (
      provider.chatModel as unknown as {
        responses: {
          client: unknown;
          completionWithRetry: (request: OpenAI.Responses.ResponseCreateParamsNonStreaming) => Promise<unknown>;
        };
      }
    ).responses;
    responses.client = { responses: { create } };

    await responses.completionWithRetry({
      model: 'deepseek-v4-flash',
      input: 'hello',
      tools: provider.resolveTools([]) as OpenAI.Responses.Tool[],
      stream: false,
    });

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({
      reasoning: { effort: 'none' },
      tools: [{ type: 'web_search' }],
    });
  });

  it('converts native DeepSeek Responses reasoning and web-search stream events through LangChain', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'deepseek-v4-flash', builtIn: { webSearch: true } },
    });
    async function* responseEvents(): AsyncGenerator<OpenAI.Responses.ResponseStreamEvent> {
      yield {
        type: 'response.output_item.added',
        item: { type: 'reasoning', id: 'rs_1', summary: [], status: 'in_progress' },
        output_index: 0,
        sequence_number: 1,
      } as OpenAI.Responses.ResponseStreamEvent;
      yield {
        type: 'response.reasoning_text.delta',
        content_index: 0,
        delta: 'reasoning delta',
        item_id: 'rs_1',
        output_index: 0,
        sequence_number: 2,
      };
      yield {
        type: 'response.output_item.added',
        item: {
          type: 'web_search_call',
          id: 'ws_1',
          status: 'in_progress',
          action: { type: 'search', query: 'DeepSeek V4' },
        },
        output_index: 1,
        sequence_number: 3,
      } as OpenAI.Responses.ResponseStreamEvent;
      yield {
        type: 'response.output_text.delta',
        content_index: 0,
        delta: 'answer',
        item_id: 'msg_1',
        logprobs: [],
        output_index: 2,
        sequence_number: 4,
      };
    }
    const create = vi.fn(async () => responseEvents());
    const responses = (
      provider.chatModel as unknown as {
        responses: {
          client: unknown;
          _streamResponseChunks: (
            messages: HumanMessage[],
            options: Record<string, unknown>,
          ) => AsyncGenerator<{ message: AIMessageChunk }>;
        };
      }
    ).responses;
    responses.client = { responses: { create } };

    const chunks: AIMessageChunk[] = [];
    for await (const chunk of responses._streamResponseChunks([new HumanMessage('hello')], {})) {
      chunks.push(chunk.message);
    }

    expect(chunks.map((chunk) => provider.parseReasoningContent(chunk)).filter(Boolean)).toEqual([
      { status: 'streaming', content: 'reasoning delta' },
    ]);
    expect(chunks.flatMap((chunk) => provider.parseWebSearchAction(chunk))).toEqual([
      { type: 'search', query: 'DeepSeek V4' },
    ]);
    expect(chunks.map((chunk) => provider.parseResponseChunk(chunk.content)).filter(Boolean)).toEqual(['answer']);
  });

  it('rejects web search for legacy DeepSeek models before provider invocation', async () => {
    const manager = new AIManager({
      app: createApp({ apiKey: 'test-key' }),
      db: {
        getRepository: () => ({
          findOne: vi.fn().mockResolvedValue({ provider: 'deepseek', options: { apiKey: 'test-key' } }),
        }),
      },
    } as never);
    manager.registerLLMProvider('deepseek', deepseekProviderOptions);

    await expect(
      manager.getLLMService({
        llmService: 'deepseek-service',
        model: 'deepseek-chat',
        webSearch: true,
      }),
    ).rejects.toThrow(/Web search is not supported/);
  });
});

describe('DeepSeek tool-loop reasoning continuity', () => {
  it('only restores non-empty reasoning for assistant tool calls in the active user turn', () => {
    const request = {
      messages: [
        { role: 'user', content: 'old question' },
        { role: 'assistant', content: '', tool_calls: [{ id: 'old_call' }] },
        { role: 'tool', content: 'old result', tool_call_id: 'old_call' },
        { role: 'assistant', content: 'old answer' },
        { role: 'user', content: 'new question' },
        { role: 'assistant', content: '', tool_calls: [{ id: 'call_1' }, { id: 'call_2' }] },
        { role: 'tool', content: 'result 1', tool_call_id: 'call_1' },
        { role: 'tool', content: 'result 2', tool_call_id: 'call_2' },
        { role: 'assistant', content: '', tool_calls: [{ id: 'call_3' }] },
        { role: 'tool', content: 'result 3', tool_call_id: 'call_3' },
      ],
    };
    patchRequestMessagesReasoning(
      request,
      new Map([
        ['1', 'old reasoning'],
        ['5', 'parallel reasoning'],
        ['8', 'second reasoning'],
      ]),
    );

    expect(request.messages[1].reasoning_content).toBeUndefined();
    expect(request.messages[5].reasoning_content).toBe('parallel reasoning');
    expect(request.messages[8].reasoning_content).toBe('second reasoning');
  });

  it('does not write undefined when an active tool call has no stored reasoning', () => {
    const request = {
      messages: [
        { role: 'user', content: 'question' },
        { role: 'assistant', content: '', tool_calls: [{ id: 'call_1' }] },
        { role: 'tool', content: 'result', tool_call_id: 'call_1' },
      ],
    };
    patchRequestMessagesReasoning(request, new Map([['0', 'unrelated']]));
    expect('reasoning_content' in request.messages[1]).toBe(false);
  });

  it('preserves Responses reasoning, function call, and output ordering for checkpoint continuation', () => {
    const reasoningItem = {
      type: 'reasoning',
      id: 'rs_1',
      summary: [],
      content: [{ type: 'reasoning_text', text: 'call the weather tool' }],
    };
    const functionCall = {
      type: 'function_call',
      id: 'fc_1',
      call_id: 'call_1',
      name: 'get_weather',
      arguments: '{"city":"Hangzhou"}',
    };
    const input = convertMessagesToResponsesInput({
      model: 'deepseek-v4-flash',
      zdrEnabled: false,
      messages: [
        new HumanMessage('weather'),
        new AIMessage({
          content: '',
          response_metadata: {
            model_provider: 'openai',
            output: [reasoningItem, functionCall],
          },
        }),
        new ToolMessage({ content: 'sunny', tool_call_id: 'call_1' }),
      ],
    });

    expect(input.slice(1)).toEqual([
      reasoningItem,
      functionCall,
      expect.objectContaining({ type: 'function_call_output', call_id: 'call_1', output: 'sunny' }),
    ]);
  });
});

describe('DeepSeek Responses parsing and persistence', () => {
  it('adapts DeepSeek reasoning text events and surfaces web-search actions once', async () => {
    async function* events(): AsyncGenerator<OpenAI.Responses.ResponseStreamEvent> {
      yield {
        type: 'response.reasoning_text.delta',
        content_index: 0,
        delta: 'reasoning delta',
        item_id: 'rs_1',
        output_index: 0,
        sequence_number: 1,
      };
      yield {
        type: 'response.output_item.added',
        item: {
          type: 'web_search_call',
          id: 'ws_1',
          status: 'in_progress',
          action: { type: 'search', query: 'DeepSeek V4' },
        },
        output_index: 1,
        sequence_number: 2,
      } as OpenAI.Responses.ResponseStreamEvent;
      yield {
        type: 'response.output_item.done',
        item: {
          type: 'web_search_call',
          id: 'ws_1',
          status: 'completed',
          action: { type: 'search', query: 'DeepSeek V4' },
        },
        output_index: 1,
        sequence_number: 3,
      } as OpenAI.Responses.ResponseStreamEvent;
    }

    const adapted: OpenAI.Responses.ResponseStreamEvent[] = [];
    for await (const event of adaptDeepSeekResponsesStream(events())) {
      adapted.push(event);
    }

    expect(adapted.map((event) => event.type)).toEqual([
      'response.reasoning_summary_text.delta',
      'response.output_item.done',
    ]);
  });

  it('extracts each reasoning chunk once and excludes reasoning blocks from answer text', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'deepseek-v4-flash' },
    });
    const chunk = new AIMessageChunk({
      content: [
        { type: 'reasoning', reasoning: 'step one' },
        { type: 'text', text: 'final answer' },
        { type: 'non_standard', value: { type: 'web_search_call' } },
      ],
      additional_kwargs: {
        reasoning: {
          type: 'reasoning',
          id: 'rs_1',
          summary: [{ type: 'summary_text', text: 'step one' }],
        },
      },
    });

    expect(provider.parseReasoningContent(chunk)).toEqual({ status: 'streaming', content: 'step one' });
    expect(provider.parseResponseChunk(chunk.content)).toBe('final answer');
  });

  it('stores raw Responses reasoning and normalized display text without flattening the AI message', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'deepseek-v4-flash' },
    });
    const reasoningItem = {
      type: 'reasoning',
      id: 'rs_1',
      summary: [],
      content: [{ type: 'reasoning_text', text: 'saved reasoning' }],
    };
    const aiMessage = new AIMessage({
      content: [
        { type: 'reasoning', reasoning: 'saved reasoning' },
        { type: 'text', text: 'answer' },
      ],
      response_metadata: {
        output: [reasoningItem],
      },
    });
    const values: AIMessageInput = {
      role: 'assistant',
      content: { type: 'text', content: 'answer' },
      metadata: { model: 'deepseek-v4-flash', provider: 'deepseek', usage_metadata: {} },
      toolCalls: null,
    };

    provider.reshapeAIMessage({ aiMessage, values });

    expect(values.metadata.additional_kwargs).toMatchObject({
      reasoning: reasoningItem,
      reasoning_content: 'saved reasoning',
    });
    expect(Array.isArray(aiMessage.content)).toBe(true);
    expect(provider.prepareStoredAssistantAdditionalKwargs(values.metadata.additional_kwargs)).toBeUndefined();
  });

  it('restores persisted reasoning and citations from Responses metadata', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.deepseek.com';
    const provider = new DeepSeekProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'deepseek-v4-flash' },
    });
    const row = {
      content: { type: 'text', content: 'answer' },
      messageId: 'message_1',
      role: 'assistant',
      toolCalls: null,
      attachments: null,
      workContext: null,
      createdAt: new Date(),
      toJSON: () => ({
        metadata: {
          additional_kwargs: {
            reasoning: {
              type: 'reasoning',
              id: 'rs_1',
              summary: [],
              content: [{ type: 'reasoning_text', text: 'persisted reasoning' }],
            },
          },
          response_metadata: {
            output: [
              {
                type: 'message',
                content: [
                  {
                    type: 'output_text',
                    text: 'answer',
                    annotations: [{ type: 'url_citation', title: 'DeepSeek docs', url: 'https://example.com' }],
                  },
                ],
              },
            ],
          },
        },
      }),
    } as unknown as Model;

    const parsed = provider.parseResponseMessage(row);
    expect(parsed.content.reasoning).toEqual({ status: 'stop', content: 'persisted reasoning' });
    expect(parsed.content.reference).toEqual([{ title: 'DeepSeek docs', url: 'https://example.com' }]);
  });

  it('prefers visible chunk reasoning over duplicate metadata representations', () => {
    expect(
      extractDeepSeekReasoningText({
        content: [{ type: 'reasoning', reasoning: 'one copy' }],
        additional_kwargs: {
          reasoning: { summary: [{ type: 'summary_text', text: 'duplicate' }] },
        },
      }),
    ).toBe('one copy');
  });
});
