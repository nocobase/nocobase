/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const serverRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/utils')>();
  return {
    ...original,
    serverRequest: serverRequestMock,
  };
});

import { ShengSuanYunProvider, shengsuanyunProviderOptions, supportsChatCompletions } from '../shengsuanyun';

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('ShengSuanYunProvider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    serverRequestMock.mockReset();
  });

  it('uses the ShengSuanYun OpenAI-compatible API base URL', () => {
    const provider = new ShengSuanYunProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    expect(provider.baseURL).toBe('https://router.shengsuanyun.com/api/v1');
  });

  it('uses the SSYCloud brand name in provider selectors', () => {
    expect(shengsuanyunProviderOptions.title).toBe('SSYCloud');
  });

  it('adds the configured X-Title header to chat requests', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'router.shengsuanyun.com';
    const provider = new ShengSuanYunProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', xTitle: 'Test App' },
      modelOptions: { model: 'deepseek/deepseek-v4-flash' },
    });

    expect(provider.chatModel.clientConfig).toMatchObject({
      baseURL: 'https://router.shengsuanyun.com/api/v1',
      defaultHeaders: {
        'X-Title': 'Test App',
      },
    });
  });

  it('does not hardcode the X-Title header', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'router.shengsuanyun.com';
    const provider = new ShengSuanYunProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'deepseek/deepseek-v4-flash' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toBeUndefined();
  });

  it('recognizes Chat Completions-compatible models', () => {
    expect(
      supportsChatCompletions({
        id: 'deepseek/deepseek-v4-flash',
        support_apis: ['/v1/chat/completions', '/v1/messages'],
      }),
    ).toBe(true);
    expect(
      supportsChatCompletions({
        id: 'openai/o3-deep-research',
        support_apis: ['/v1/responses'],
      }),
    ).toBe(false);
    expect(supportsChatCompletions({ id: 'legacy-model' })).toBe(true);
  });

  it('loads and filters the account model catalog with the configured X-Title header', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'router.shengsuanyun.com';
    serverRequestMock.mockResolvedValue({
      data: {
        data: [
          {
            id: 'deepseek/deepseek-v4-flash',
            support_apis: ['/v1/chat/completions', '/v1/messages'],
          },
          {
            id: 'openai/o3-deep-research',
            support_apis: ['/v1/responses'],
          },
          {
            id: 'legacy-model',
          },
        ],
      },
    });
    const provider = new ShengSuanYunProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', xTitle: 'Test App' },
    });

    await expect(provider.listModels()).resolves.toEqual({
      models: [{ id: 'deepseek/deepseek-v4-flash' }, { id: 'legacy-model' }],
    });
    expect(serverRequestMock).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://router.shengsuanyun.com/api/v1/models',
      headers: {
        Authorization: 'Bearer test-key',
        'X-Title': 'Test App',
      },
    });
  });

  it('requires an API key before loading models', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'router.shengsuanyun.com';
    const provider = new ShengSuanYunProvider({
      app: createApp(),
    });

    await expect(provider.listModels()).resolves.toEqual({
      code: 400,
      errMsg: 'API Key required',
    });
    expect(serverRequestMock).not.toHaveBeenCalled();
  });
});
