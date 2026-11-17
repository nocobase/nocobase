/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serverRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/utils')>();
  return {
    ...original,
    serverRequest: serverRequestMock,
  };
});

import {
  AIMLAPI_ATTRIBUTION_HEADERS,
  AimlapiEmbeddingProvider,
  AimlapiProvider,
  aimlapiProviderOptions,
  supportsChatCompletions,
  supportsEmbeddings,
} from '../aimlapi';
import { SupportedModel } from '../../manager/ai-manager';

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('AimlapiProvider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    serverRequestMock.mockReset();
  });

  it('uses the AI/ML API OpenAI-compatible API base URL', () => {
    const provider = new AimlapiProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    expect(provider.baseURL).toBe('https://api.aimlapi.com/v1');
  });

  it('uses the aimlapi.com brand name in provider selectors', () => {
    expect(aimlapiProviderOptions.title).toBe('aimlapi.com');
  });

  // A partner id that does not match the gateway's pattern is dropped silently: the request still succeeds, it is
  // simply never attributed. A typo would therefore be invisible at runtime, hence this assertion.
  it('ships a partner id in the format the gateway accepts', () => {
    expect(AIMLAPI_ATTRIBUTION_HEADERS['X-AIMLAPI-Partner-ID']).toMatch(/^part_[A-Za-z0-9]{1,64}$/);
  });

  it('ships a source in the <channel>/<client> format the gateway accepts', () => {
    expect(AIMLAPI_ATTRIBUTION_HEADERS['X-AIMLAPI-Source']).toMatch(/^(web|agent|mcp)\/[a-z0-9-]{1,32}$/);
  });

  it('identifies NocoBase, not AI/ML API, as the calling application', () => {
    expect(AIMLAPI_ATTRIBUTION_HEADERS['HTTP-Referer']).toBe('https://github.com/nocobase/nocobase');
    expect(AIMLAPI_ATTRIBUTION_HEADERS['X-Title']).toBe('NocoBase');
  });

  it('adds the attribution headers to chat requests', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com';
    const provider = new AimlapiProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'openai/gpt-4o-mini' },
    });

    expect(provider.chatModel.clientConfig).toMatchObject({
      baseURL: 'https://api.aimlapi.com/v1',
      defaultHeaders: { ...AIMLAPI_ATTRIBUTION_HEADERS },
    });
  });

  it('lets a configured referer and title win over the defaults without dropping the AI/ML API headers', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com';
    const provider = new AimlapiProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', httpReferer: 'https://example.test', xTitle: 'Test App' },
      modelOptions: { model: 'openai/gpt-4o-mini' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toEqual({
      'HTTP-Referer': 'https://example.test',
      'X-Title': 'Test App',
      'X-AIMLAPI-Partner-ID': AIMLAPI_ATTRIBUTION_HEADERS['X-AIMLAPI-Partner-ID'],
      'X-AIMLAPI-Source': AIMLAPI_ATTRIBUTION_HEADERS['X-AIMLAPI-Source'],
    });
    expect(AIMLAPI_ATTRIBUTION_HEADERS['X-Title']).toBe('NocoBase');
  });

  // baseURL is user-configurable. Attribution that rode along to another vendor, or to a proxy fronting AI/ML API,
  // would tag traffic that is not ours.
  it('does not send attribution to a base URL outside the AI/ML API origin', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com,proxy.example.test';
    const provider = new AimlapiProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', baseURL: 'https://proxy.example.test/v1' },
      modelOptions: { model: 'openai/gpt-4o-mini' },
    });

    expect(provider.chatModel.clientConfig.defaultHeaders).toBeUndefined();
  });

  it('recognizes Chat Completions-compatible models', () => {
    expect(supportsChatCompletions({ id: 'openai/gpt-4o', type: 'openai/chat-completions' })).toBe(true);
    expect(supportsChatCompletions({ id: 'openai/o3-deep-research', type: 'openai/responses/submit' })).toBe(false);
    expect(supportsChatCompletions({ id: 'flux/dev', type: 'openai/image-generations' })).toBe(false);
    expect(supportsChatCompletions({ id: 'legacy-model' })).toBe(true);
  });

  it('loads and filters the model catalog with the attribution headers attached', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com';
    serverRequestMock.mockResolvedValue({
      data: {
        object: 'list',
        data: [
          { id: 'openai/gpt-4o', type: 'openai/chat-completions' },
          { id: 'flux/dev', type: 'openai/image-generations' },
          { id: 'legacy-model' },
        ],
      },
    });
    const provider = new AimlapiProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
    });

    await expect(provider.listModels()).resolves.toEqual({
      models: [{ id: 'openai/gpt-4o' }, { id: 'legacy-model' }],
    });
    expect(serverRequestMock).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.aimlapi.com/v1/models',
      headers: {
        Authorization: 'Bearer test-key',
        ...AIMLAPI_ATTRIBUTION_HEADERS,
      },
    });
  });

  it('requires an API key before loading models', async () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com';
    const provider = new AimlapiProvider({
      app: createApp(),
    });

    await expect(provider.listModels()).resolves.toEqual({
      code: 400,
      errMsg: 'API Key required',
    });
    expect(serverRequestMock).not.toHaveBeenCalled();
  });
});

describe('AimlapiEmbeddingProvider', () => {
  // The base class refuses a base URL that is not whitelisted, so it has to be set before construction.
  beforeEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.aimlapi.com,example.invalid';
  });

  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
  });

  const build = (serviceOptions: Record<string, unknown> = {}) =>
    new AimlapiEmbeddingProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key', ...serviceOptions },
      modelOptions: { model: 'openai/text-embedding-3-small' },
    });

  it('defaults to the AI/ML API embeddings surface', () => {
    expect(build().createEmbedding()).toMatchObject({
      model: 'openai/text-embedding-3-small',
    });
  });

  it('attributes embedding traffic, not only chat', () => {
    const embeddings = build().createEmbedding() as unknown as {
      clientConfig: { baseURL: string; defaultHeaders?: Record<string, string> };
    };

    expect(embeddings.clientConfig).toMatchObject({
      baseURL: 'https://api.aimlapi.com/v1',
      defaultHeaders: { ...AIMLAPI_ATTRIBUTION_HEADERS },
    });
  });

  // Same rule the chat provider follows: baseURL is user-configurable, so it may point at another vendor or at a
  // proxy fronting this API, and neither should receive our partner id.
  it('withholds attribution when the base URL is not AI/ML API', () => {
    const embeddings = build({ baseURL: 'https://example.invalid/v1' }).createEmbedding() as unknown as {
      clientConfig: { defaultHeaders?: Record<string, string> };
    };

    expect(embeddings.clientConfig.defaultHeaders).toBeUndefined();
  });
});

describe('embedding model discovery', () => {
  // The chat predicate keeps untyped entries, because a foreign OpenAI-compatible catalog may carry no type at all.
  // The embedding predicate must not: an untyped entry is a chat model, and offering it here 404s at the first index.
  it('accepts only entries the catalog marks as embeddings', () => {
    expect(supportsEmbeddings({ id: 'openai/text-embedding-3-small', type: 'openai/embeddings' })).toBe(true);
    expect(supportsEmbeddings({ id: 'openai/gpt-4o-mini', type: 'openai/chat-completions' })).toBe(false);
    expect(supportsEmbeddings({ id: 'some/model' })).toBe(false);
    expect(supportsChatCompletions({ id: 'some/model' })).toBe(true);
  });

  it('offers embeddings as a selectable model kind', () => {
    expect(aimlapiProviderOptions.supportedModel).toContain(SupportedModel.EMBEDDING);
    expect(aimlapiProviderOptions.embedding).toBe(AimlapiEmbeddingProvider);
  });

  // The picker reads a static list per model kind rather than calling the provider, so an empty list here would make
  // the provider selectable and then offer nothing to select.
  it('enumerates embedding models for the picker', () => {
    const models = aimlapiProviderOptions.models?.[SupportedModel.EMBEDDING] ?? [];

    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain('openai/text-embedding-3-small');
    expect(models.every((id) => typeof id === 'string' && id.includes('/'))).toBe(true);
  });
});
