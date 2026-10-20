/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { AttachmentModel } from '@nocobase/plugin-file-manager';
import type { Application } from '@nocobase/server';
import { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { convertMessagesToCompletionsMessageParams } from '@langchain/openai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeFile } from '../../utils';
import { AnthropicProvider } from '../anthropic';
import type { ReasoningChatOpenAI } from '../common/reasoning';
import { MiniMaxProvider, minimaxProviderOptions } from '../minimax';
import type { ParsedAttachmentResult } from '../provider';
import { AIManager, SupportedModel } from '../../manager/ai-manager';
import type PluginAIServer from '../../plugin';
import { getRecommendedModels } from '../../../common/recommended-models';

vi.mock('../../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils')>();
  return {
    ...actual,
    encodeFile: vi.fn().mockResolvedValue('encoded-video'),
  };
});

function createApp(
  renderedValue?: Record<string, unknown>,
  fileURL = 'https://files.example.com/sample.mp4',
): Application {
  return {
    environment: {
      renderJsonTemplate: () => renderedValue ?? {},
    },
    pm: {
      get: () => ({
        getFileURL: async () => fileURL,
      }),
    },
  } as unknown as Application;
}

class TestMiniMaxProvider extends MiniMaxProvider {
  resolvedBaseURL() {
    return this.getResolvedBaseURL();
  }

  supportsAttachment(mimetype: string) {
    return this.isApiSupportedAttachment({ mimetype } as AttachmentModel);
  }

  convertAttachment(ctx: Context, attachment: AttachmentModel): Promise<ParsedAttachmentResult> {
    return this.convertToContent(ctx, attachment);
  }

  requestModelKwargs() {
    return (this.chatModel as ReasoningChatOpenAI & { modelKwargs?: Record<string, unknown> }).modelKwargs;
  }
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

function requestURL(input: string | URL | Request): string {
  if (typeof input === 'string') {
    return input;
  }
  return input instanceof URL ? input.toString() : input.url;
}

async function requestJSON(input: string | URL | Request, init?: RequestInit): Promise<Record<string, unknown>> {
  const body = input instanceof Request ? await input.clone().text() : String(init?.body ?? '{}');
  return JSON.parse(body);
}

function openAIResponse(model: string) {
  return new Response(
    JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 0,
      model,
      choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function anthropicResponse(model: string) {
  return new Response(
    JSON.stringify({
      id: 'msg-test',
      type: 'message',
      role: 'assistant',
      model,
      content: [{ type: 'text', text: 'ok' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('MiniMax provider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each(
    ['https://api.minimax.io/v1', 'https://api.minimaxi.com/v1', 'https://custom.example.com/v1'].flatMap((baseURL) =>
      ['MiniMax-M3.1-Flash', 'MiniMax-M3', 'MiniMax-M2.7', 'saved-custom-model'].map((model) => [baseURL, model]),
    ),
  )('sends %s OpenAI-compatible requests for %s', async (baseURL, model) => {
    const expectedURL = `${baseURL}/chat/completions`;
    process.env.SERVER_REQUEST_WHITELIST = new URL(baseURL).hostname;
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => openAIResponse(model));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new TestMiniMaxProvider({
      app: createApp({ apiKey: 'test-key', baseURL }),
      serviceOptions: { apiKey: 'test-key', baseURL },
      modelOptions: { model, thinking: 'adaptive', serviceTier: 'priority', reasoningEffort: 'high' },
    });

    await provider.chatModel.invoke('hello');

    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    expect(requestURL(input)).toBe(expectedURL);
    const body = await requestJSON(input, init);
    expect(body.model).toBe(model);
    expect(body.reasoning_split).toBe(true);
    expect(body.reasoning_effort).toBe(model === 'MiniMax-M3.1-Flash' ? 'high' : undefined);
    if (model === 'MiniMax-M3') {
      expect(body.thinking).toEqual({ type: 'adaptive' });
      expect(body.service_tier).toBe('priority');
    } else {
      if (model === 'MiniMax-M3.1-Flash') {
        expect(body.thinking).toEqual({ type: 'adaptive' });
      } else {
        expect(body).not.toHaveProperty('thinking');
      }
      expect(body).not.toHaveProperty('service_tier');
    }
  });

  it.each(
    ['https://api.minimax.io/anthropic', 'https://api.minimaxi.com/anthropic'].flatMap((baseURL) =>
      ['MiniMax-M3.1-Flash', 'MiniMax-M3', 'MiniMax-M2.7', 'saved-custom-model'].map((model) => [baseURL, model]),
    ),
  )('sends %s Anthropic-compatible requests for %s', async (baseURL, model) => {
    const expectedURL = `${baseURL}/v1/messages`;
    process.env.SERVER_REQUEST_WHITELIST = new URL(baseURL).hostname;
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => anthropicResponse(model));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new AnthropicProvider({
      app: createApp({ apiKey: 'test-key', baseURL }),
      serviceOptions: { apiKey: 'test-key', baseURL },
      modelOptions: { model },
    });

    await provider.chatModel.invoke('hello');

    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    expect(requestURL(input)).toBe(expectedURL);
    expect(await requestJSON(input, init)).toMatchObject({ model });
  });

  it('creates a chat model using the default MiniMax baseURL', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.chatModel).toBeDefined();
    expect(provider.resolvedBaseURL()).toBe('https://api.minimax.io/v1');
  });

  it('normalizes a regional baseURL override', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimaxi.com';

    const provider = new TestMiniMaxProvider({
      app: createApp({ apiKey: 'test-key', baseURL: 'https://api.minimaxi.com/v1/' }),
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.serviceOptions.baseURL).toBe('https://api.minimaxi.com/v1');
    expect(provider.resolvedBaseURL()).toBe('https://api.minimaxi.com/v1');
  });

  it('maps MiniMax-M3 request options to supported API fields', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: {
        model: 'MiniMax-M3',
        thinking: 'disabled',
        serviceTier: 'priority',
        maxCompletionTokens: -1,
      },
    });

    expect(provider.requestModelKwargs()).toEqual({
      reasoning_split: true,
      thinking: { type: 'disabled' },
      service_tier: 'priority',
    });
  });

  it('keeps MiniMax-M2.7 thinking enabled and omits M3-only options', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: {
        model: 'MiniMax-M2.7',
        thinking: 'disabled',
        serviceTier: 'priority',
      },
    });

    expect(provider.requestModelKwargs()).toEqual({ reasoning_split: true });
  });

  it('accepts multimodal attachments only for MiniMax-M3', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const m3Provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });
    const m27Provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M2.7' },
    });

    expect(m3Provider.supportsAttachment('image/png')).toBe(true);
    expect(m3Provider.supportsAttachment('video/mp4')).toBe(true);
    expect(m3Provider.supportsAttachment('audio/mpeg')).toBe(false);
    expect(m27Provider.supportsAttachment('image/png')).toBe(false);
    expect(m27Provider.supportsAttachment('video/mp4')).toBe(false);
  });

  it('converts video attachments to compatible content blocks', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });
    const ctx = {} as Context;
    const attachment = { mimetype: 'video/mp4' } as AttachmentModel;

    await expect(provider.convertAttachment(ctx, attachment)).resolves.toEqual({
      placement: 'contentBlocks',
      content: {
        type: 'video_url',
        video_url: {
          url: 'data:video/mp4;base64,encoded-video',
        },
      },
    });
    expect(encodeFile).toHaveBeenCalledWith(ctx, 'https://files.example.com/sample.mp4');
  });

  it('preserves video content blocks when building completion messages', () => {
    const [message] = convertMessagesToCompletionsMessageParams({
      model: 'MiniMax-M3',
      messages: [
        new HumanMessage({
          content: [
            {
              type: 'video_url',
              video_url: {
                url: 'data:video/mp4;base64,encoded-video',
              },
            },
          ],
        }),
      ],
    });

    expect(message).toEqual({
      role: 'user',
      content: [
        {
          type: 'video_url',
          video_url: {
            url: 'data:video/mp4;base64,encoded-video',
          },
        },
      ],
    });
  });

  it('parses reasoning content from streamed chunks', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });
    const chunk = new AIMessageChunk({
      content: 'final answer',
      additional_kwargs: { reasoning_content: 'reasoning step' },
    });

    expect(provider.parseReasoningContent(chunk)).toEqual({
      status: 'streaming',
      content: 'reasoning step',
    });
  });

  it('returns null reasoning content when the chunk carries none', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new TestMiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.parseReasoningContent(new AIMessageChunk({ content: 'answer' }))).toBeNull();
  });

  it('exposes only the current models in priority order in both pickers', async () => {
    const models = ['MiniMax-M3.1-Flash', 'MiniMax-M3'];
    expect(minimaxProviderOptions.title).toBe('MiniMax');
    expect(minimaxProviderOptions.models?.[SupportedModel.LLM]).toEqual(models);
    expect(getRecommendedModels('minimax').map(({ value }) => value)).toEqual(models);
    const provider = new MiniMaxProvider({ app: createApp() });
    expect(await provider.listModels()).toEqual({ models: models.map((id) => ({ id })) });
  });

  it.each([
    { mode: 'recommended', models: [] },
    { mode: 'custom', models: [{ label: 'Saved', value: 'MiniMax-M2.7' }] },
    { mode: 'provider', models: [{ label: 'Custom', value: 'saved-custom-model' }] },
    ['MiniMax-M2.7'],
  ])('preserves configured models through default resolution and HTTP: %j', async (enabledModels) => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';
    const expectedModel = Array.isArray(enabledModels)
      ? enabledModels[0]
      : enabledModels.mode === 'recommended'
        ? 'MiniMax-M3.1-Flash'
        : enabledModels.models[0].value;
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      openAIResponse(expectedModel),
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = { name: 'minimax', title: 'MiniMax', provider: 'minimax', enabledModels, options: {} };
    const app = createApp({ apiKey: 'test-key' });
    const manager = new AIManager({
      app,
      db: { getRepository: () => ({ find: async () => [service], findOne: async () => service }) },
    } as unknown as PluginAIServer);
    manager.registerLLMProvider('minimax', minimaxProviderOptions);

    const resolved = await manager.resolveModel();
    expect(resolved.model).toBe(expectedModel);
    const { provider } = await manager.getLLMService(resolved);
    await provider.invoke({ messages: [{ role: 'user', content: 'hello' }] });
    const [input, init] = fetchMock.mock.calls[0];
    expect(requestURL(input)).toBe('https://api.minimax.io/v1/chat/completions');
    expect(await requestJSON(input, init)).toMatchObject({ model: expectedModel });
    const saved = { llmService: 'minimax', model: 'explicit-saved-model' };
    expect(await manager.resolveModel(saved)).toBe(saved);
  });

  it.each(['low', 'medium', 'high', 'xhigh', 'max', 'none', undefined])(
    'serializes Flash effort %s without disabled thinking or service tier',
    async (reasoningEffort) => {
      process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';
      const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
        openAIResponse('MiniMax-M3.1-Flash'),
      );
      vi.stubGlobal('fetch', fetchMock);
      const modelOptions = { thinking: 'disabled', serviceTier: 'priority', reasoningEffort };
      const provider = new MiniMaxProvider({
        app: createApp({ apiKey: 'test-key' }),
        modelOptions,
      });
      await provider.invoke({ messages: [{ role: 'user', content: 'hello' }] });
      const [input, init] = fetchMock.mock.calls[0];
      const body = await requestJSON(input, init);
      expect(body).toMatchObject({
        model: 'MiniMax-M3.1-Flash',
        thinking: { type: 'adaptive' },
        reasoning_split: true,
      });
      expect(body).not.toHaveProperty('service_tier');
      expect(body).not.toHaveProperty('reasoningEffort');
      if (reasoningEffort && reasoningEffort !== 'none') {
        expect(body.reasoning_effort).toBe(reasoningEffort);
      } else {
        expect(body).not.toHaveProperty('reasoning_effort');
      }
      expect(modelOptions.thinking).toBe('disabled');
    },
  );

  it('streams Flash requests and preserves returned reasoning', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      const chunk = {
        id: 'chatcmpl-stream-test',
        object: 'chat.completion.chunk',
        created: 0,
        model: 'MiniMax-M3.1-Flash',
        choices: [
          { index: 0, delta: { role: 'assistant', content: 'ok', reasoning_content: 'Think' }, finish_reason: null },
        ],
      };
      return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
        headers: { 'content-type': 'text/event-stream' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const provider = new MiniMaxProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'MiniMax-M3.1-Flash', thinking: 'disabled', serviceTier: 'priority' },
    });
    const chunks: AIMessageChunk[] = [];
    const messages = [
      new HumanMessage('hello'),
      new AIMessage({
        content: '',
        additional_kwargs: { reasoning_content: 'Previous reasoning' },
        tool_calls: [{ name: 'lookup', args: {}, id: 'call-stream', type: 'tool_call' as const }],
      }),
      new ToolMessage({ content: 'Tool result', tool_call_id: 'call-stream' }),
    ];
    for await (const chunk of await provider.chatModel.stream(messages)) {
      chunks.push(chunk);
    }
    expect(chunks.some((chunk) => chunk.additional_kwargs.reasoning_content === 'Think')).toBe(true);
    const [input, init] = fetchMock.mock.calls[0];
    const body = await requestJSON(input, init);
    expect(body).toMatchObject({
      model: 'MiniMax-M3.1-Flash',
      stream: true,
      thinking: { type: 'adaptive' },
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', reasoning_content: 'Previous reasoning', tool_calls: [{ id: 'call-stream' }] },
        { role: 'tool', content: 'Tool result', tool_call_id: 'call-stream' },
      ],
    });
    expect(body).not.toHaveProperty('service_tier');
  });

  it('preserves M3 disabled thinking and ignores Flash effort on the wire', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      openAIResponse('MiniMax-M3'),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = new MiniMaxProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'MiniMax-M3', thinking: 'disabled', serviceTier: 'priority', reasoningEffort: 'max' },
    });
    await provider.invoke({ messages: [{ role: 'user', content: 'hello' }] });
    const [input, init] = fetchMock.mock.calls[0];
    const body = await requestJSON(input, init);
    expect(body).toMatchObject({ model: 'MiniMax-M3', thinking: { type: 'disabled' }, service_tier: 'priority' });
    expect(body).not.toHaveProperty('reasoning_effort');
  });

  it('preserves tool reasoning and multimodal content in the serialized request', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      openAIResponse('MiniMax-M3'),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = new MiniMaxProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'MiniMax-M3' },
    });
    const content = [
      { type: 'text', text: 'Describe the clip' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,aW1hZ2U=' } },
      { type: 'video_url', video_url: { url: 'data:video/mp4;base64,dmlkZW8=' } },
    ];
    await provider.chatModel.invoke([
      new HumanMessage({ content }),
      new AIMessage({
        content: '',
        additional_kwargs: { reasoning_content: 'Saved reasoning' },
        tool_calls: [{ name: 'lookup', args: { query: 'clip' }, id: 'call-1', type: 'tool_call' }],
      }),
      new ToolMessage({ content: 'Saved tool result', tool_call_id: 'call-1' }),
    ]);
    const [input, init] = fetchMock.mock.calls[0];
    expect(await requestJSON(input, init)).toMatchObject({
      model: 'MiniMax-M3',
      messages: [
        { role: 'user', content },
        { role: 'assistant', reasoning_content: 'Saved reasoning', tool_calls: [{ id: 'call-1' }] },
        { role: 'tool', tool_call_id: 'call-1', content: 'Saved tool result' },
      ],
    });
  });
});
