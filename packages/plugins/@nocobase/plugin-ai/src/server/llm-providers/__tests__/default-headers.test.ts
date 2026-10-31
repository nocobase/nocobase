/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { AIMessageChunk } from '@langchain/core/messages';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serverRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/utils')>();
  return {
    ...original,
    serverRequest: serverRequestMock,
  };
});

import { OpenAICompletionsProvider } from '../openai/completions';
import { OpenAIResponsesProvider } from '../openai/responses';
import { AnthropicProvider } from '../anthropic';
import { XAIProvider } from '../xai';
import { createMistralHeadersHook } from '../mistral';

const OPENCODE_BASE_URL = 'https://opencode.ai/zen/go/v1';

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
    getVersion: () => '2.2.18',
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('LLM provider default headers', () => {
  beforeEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = 'opencode.ai,api.openai.com,api.anthropic.com,api.x.ai';
  });

  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    serverRequestMock.mockReset();
  });

  it('injects OpenCode headers into OpenAI chat completions models', () => {
    const provider = new OpenAICompletionsProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
      modelOptions: { model: 'glm-5' },
      requestContext: { sessionId: 'session-1' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({
      'User-Agent': 'NocoBase/2.2.18',
      'x-opencode-session': 'session-1',
    });
  });

  it('keeps the same session header when the model is recreated for the agent', () => {
    const provider = new OpenAIResponsesProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
      modelOptions: { model: 'grok-4' },
      requestContext: { sessionId: 'session-1' },
    });

    const model = provider.createModel();

    expect(model.clientConfig.defaultHeaders).toMatchObject({ 'x-opencode-session': 'session-1' });
  });

  it('omits the session header when no session is available', () => {
    const provider = new OpenAICompletionsProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
      modelOptions: { model: 'glm-5' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({ 'User-Agent': 'NocoBase/2.2.18' });
  });

  it('returns empty headers for non-OpenCode services', () => {
    const provider = new OpenAICompletionsProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'gpt-5' },
      requestContext: { sessionId: 'session-1' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({});
  });

  it('injects OpenCode headers into Anthropic models', () => {
    const provider = new AnthropicProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: 'https://opencode.ai/zen/go' },
      modelOptions: { model: 'minimax-m2.7' },
      requestContext: { sessionId: 'session-1' },
    });

    expect(provider.chatModel.clientOptions.defaultHeaders).toEqual({
      'User-Agent': 'NocoBase/2.2.18',
      'x-opencode-session': 'session-1',
    });
  });

  it('injects OpenCode headers into xAI models despite ChatXAI overriding configuration', () => {
    const provider = new XAIProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
      modelOptions: { model: 'grok-4' },
      requestContext: { sessionId: 'session-1' },
    });

    expect(provider.chatModel.clientConfig).toMatchObject({
      baseURL: OPENCODE_BASE_URL,
      defaultHeaders: { 'x-opencode-session': 'session-1' },
    });
  });

  it('injects headers into Mistral requests through a before-request hook', async () => {
    const hook = createMistralHeadersHook({ 'x-opencode-session': 'session-1' });
    const request = new Request('https://opencode.ai/zen/go/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'test' }),
    });

    const result = (await hook(request)) as Request;

    expect(result.headers.get('x-opencode-session')).toBe('session-1');
    expect(result.headers.get('content-type')).toBe('application/json');
    await expect(result.json()).resolves.toEqual({ model: 'test' });
    expect(createMistralHeadersHook({})(request)).toBeUndefined();
  });

  it('runs test flight through the model carrying default headers', async () => {
    const provider = new OpenAICompletionsProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
      modelOptions: { model: 'glm-5', responseFormat: 'text' },
      requestContext: { sessionId: 'test-flight-1' },
    });
    const invoke = vi.spyOn(provider.chatModel, 'invoke').mockResolvedValue(new AIMessageChunk('hi'));

    await expect(provider.testFlight()).resolves.toMatchObject({ status: 'success' });

    expect(invoke).toHaveBeenCalledWith('hello');
    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({
      'User-Agent': 'NocoBase/2.2.18',
      'x-opencode-session': 'test-flight-1',
    });
  });

  it('sends default headers when listing models', async () => {
    serverRequestMock.mockResolvedValue({ data: { data: [{ id: 'glm-5' }] } });
    const provider = new OpenAICompletionsProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: OPENCODE_BASE_URL },
    });

    await provider.listModels();

    expect(serverRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'User-Agent': 'NocoBase/2.2.18',
          Authorization: 'Bearer test-key',
        },
      }),
    );
  });
});
