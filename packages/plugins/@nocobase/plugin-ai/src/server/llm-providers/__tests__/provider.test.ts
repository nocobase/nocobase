/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, afterEach } from 'vitest';
import type { Application } from '@nocobase/server';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { EmbeddingProvider, LLMProvider } from '../provider';

class TestLLMProvider extends LLMProvider {
  get baseURL(): string {
    return 'https://api.example.com/v1';
  }

  createModel() {
    return {};
  }

  getResolvedURL() {
    return this.getResolvedBaseURL();
  }

  buildURL(pathname: string) {
    return this.buildRequestURL(pathname);
  }
}

class TestEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return 'https://api.example.com/v1';
  }

  createEmbedding(): EmbeddingsInterface {
    return {} as EmbeddingsInterface;
  }

  getResolvedURL() {
    return this.baseURL;
  }
}

function createApp(renderedValue?: Record<string, unknown>): Application {
  return {
    environment: {
      renderJsonTemplate: () => renderedValue ?? {},
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('LLM provider baseURL guard', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
  });

  it('normalizes rendered baseURL and preserves nested paths when building request URLs', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestLLMProvider({
      app: createApp({ baseURL: 'https://api.example.com/v1/' }),
    });

    expect(provider.serviceOptions.baseURL).toBe('https://api.example.com/v1');
    expect(provider.buildURL('models')).toBe('https://api.example.com/v1/models');
  });

  it('validates provider default baseURL against the global whitelist', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestLLMProvider({
      app: createApp(),
    });

    expect(provider.getResolvedURL()).toBe('https://api.example.com/v1');
  });

  it('rejects rendered baseURL values blocked by the global whitelist', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    expect(
      () =>
        new TestLLMProvider({
          app: createApp({ baseURL: 'http://169.254.169.254/latest/meta-data/' }),
        }),
    ).toThrow(/blocked/i);
  });

  it('applies the same normalization to embedding providers', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestEmbeddingProvider({
      app: createApp({ baseURL: 'https://api.example.com/v1/' }),
      modelOptions: { model: 'text-embedding-3-small' },
    });

    expect(provider.getResolvedURL()).toBe('https://api.example.com/v1');
  });
});
