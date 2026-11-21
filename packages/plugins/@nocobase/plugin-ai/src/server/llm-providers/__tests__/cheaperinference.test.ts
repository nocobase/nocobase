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

import { CheaperInferenceProvider, cheaperinferenceProviderOptions, isTextModel } from '../cheaperinference';

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('CheaperInferenceProvider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    serverRequestMock.mockReset();
  });

  it('uses the Cheaper Inference OpenAI-compatible API base URL', () => {
    const provider = new CheaperInferenceProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    expect(provider.baseURL).toBe('https://api.cheaperinference.com/v1');
  });

  it('uses the Cheaper Inference brand name in provider selectors', () => {
    expect(cheaperinferenceProviderOptions.title).toBe('Cheaper Inference');
  });

  it('creates a chat model with the Cheaper Inference base URL', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.cheaperinference.com';
    const provider = new CheaperInferenceProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'gpt-5.4-mini' },
    });

    expect(provider.chatModel.clientConfig).toMatchObject({
      baseURL: 'https://api.cheaperinference.com/v1',
    });
    expect(provider.chatModel.clientConfig.defaultHeaders).toBeUndefined();
  });

  it('recognizes text models', () => {
    expect(isTextModel({ id: 'gpt-5.4-mini', type: 'text' })).toBe(true);
    expect(isTextModel({ id: 'image-model', type: 'image' })).toBe(false);
    expect(isTextModel({ id: 'video-model', type: 'video' })).toBe(false);
    expect(isTextModel({ id: 'legacy-model' })).toBe(true);
  });

  it('loads the account model catalog and keeps only text models', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.cheaperinference.com';
    serverRequestMock.mockResolvedValue({
      data: {
        data: [
          { id: 'gpt-5.4-mini', type: 'text' },
          { id: 'image-model', type: 'image' },
          { id: 'video-model', type: 'video' },
          { id: 'legacy-model' },
        ],
      },
    });
    const provider = new CheaperInferenceProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    await expect(provider.listModels()).resolves.toEqual({
      models: [{ id: 'gpt-5.4-mini' }, { id: 'legacy-model' }],
    });
    expect(serverRequestMock).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.cheaperinference.com/v1/models',
      headers: {
        Authorization: 'Bearer test-key',
      },
    });
  });

  it('requires an API key before loading models', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.cheaperinference.com';
    const provider = new CheaperInferenceProvider({
      app: createApp(),
    });

    await expect(provider.listModels()).resolves.toEqual({
      code: 400,
      errMsg: 'API Key required',
    });
    expect(serverRequestMock).not.toHaveBeenCalled();
  });
});
