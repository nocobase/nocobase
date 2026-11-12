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
import { afterEach, describe, expect, it, vi } from 'vitest';

const serverRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/utils')>();
  return {
    ...original,
    serverRequest: serverRequestMock,
  };
});

import { OpperProvider, opperProviderOptions } from '../opper';

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('OpperProvider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    serverRequestMock.mockReset();
  });

  it('uses the Opper OpenAI-compatible API base URL', () => {
    const provider = new OpperProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    expect(provider.baseURL).toBe('https://api.opper.ai/v3/compat');
  });

  it('uses the Opper brand name in provider selectors', () => {
    expect(opperProviderOptions.title).toBe('Opper');
  });

  it('points chat requests at the Opper base URL without extra headers', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.opper.ai';
    const provider = new OpperProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'claude-sonnet-4-6' },
    });

    expect(provider.chatModel.clientConfig).toMatchObject({
      apiKey: 'test-key',
      baseURL: 'https://api.opper.ai/v3/compat',
    });
    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({});
  });

  it('surfaces streamed reasoning_content as reasoning', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.opper.ai';
    const provider = new OpperProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'deepseek-v4-pro' },
    });

    const chunk = provider.chatModel._convertCompletionsDeltaToBaseMessageChunk(
      { role: 'assistant', content: '', reasoning_content: 'step one' },
      { id: 'chatcmpl-1' },
      'assistant',
    ) as AIMessageChunk;

    expect(provider.parseReasoningContent(chunk)).toEqual({ status: 'streaming', content: 'step one' });
    expect(provider.parseReasoningContent(new AIMessageChunk({ content: 'final answer' }))).toBeNull();
  });

  it('loads the model catalog from the Opper models endpoint', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.opper.ai';
    serverRequestMock.mockResolvedValue({
      data: {
        object: 'list',
        data: [{ id: 'claude-sonnet-4-6' }, { id: 'gpt-5.4-mini' }],
      },
    });
    const provider = new OpperProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    await expect(provider.listModels()).resolves.toEqual({
      models: [{ id: 'claude-sonnet-4-6' }, { id: 'gpt-5.4-mini' }],
    });
    expect(serverRequestMock).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.opper.ai/v3/compat/models',
      headers: {
        Authorization: 'Bearer test-key',
      },
    });
  });

  it('requires an API key before loading models', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.opper.ai';
    const provider = new OpperProvider({
      app: createApp(),
    });

    await expect(provider.listModels()).resolves.toEqual({
      code: 400,
      errMsg: 'API Key required',
    });
    expect(serverRequestMock).not.toHaveBeenCalled();
  });
});
