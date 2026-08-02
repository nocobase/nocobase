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
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { EmbeddingProvider, LLMProvider } from '../provider';
import { injectMistralReasoningEffort, MistralProvider } from '../mistral';
import type { AIMessageInput } from '../../types';
import { Readable } from 'node:stream';
import type { Context } from '@nocobase/actions';
import type { AttachmentModel } from '@nocobase/plugin-file-manager';

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

  it('treats blank rendered baseURL as unset for LLM providers', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestLLMProvider({
      app: createApp({ baseURL: '  ' }),
    });

    expect(provider.serviceOptions.baseURL).toBeUndefined();
    expect(provider.getResolvedURL()).toBe('https://api.example.com/v1');
    expect(provider.buildURL('models')).toBe('https://api.example.com/v1/models');
  });

  it('validates provider default baseURL against the global whitelist', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestLLMProvider({
      app: createApp(),
    });

    expect(provider.getResolvedURL()).toBe('https://api.example.com/v1');
  });

  it('trims rendered baseURL before validation', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestLLMProvider({
      app: createApp({ baseURL: ' https://api.example.com/v1/ ' }),
    });

    expect(provider.serviceOptions.baseURL).toBe('https://api.example.com/v1');
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

  it('treats blank rendered baseURL as unset for embedding providers', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.example.com';

    const provider = new TestEmbeddingProvider({
      app: createApp({ baseURL: '' }),
      modelOptions: { model: 'text-embedding-3-small' },
    });

    expect(provider.getResolvedURL()).toBe('https://api.example.com/v1');
  });

  it('normalizes Mistral SDK serverURL to the API root', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.mistral.ai';

    const provider = new MistralProvider({
      app: createApp({ apiKey: 'test-key', baseURL: 'https://api.mistral.ai/v1/' }),
      modelOptions: { model: 'mistral-small-latest' },
    });

    expect(provider.chatModel.serverURL).toBe('https://api.mistral.ai');
  });

  it('injects high reasoning effort into Mistral chat requests', async () => {
    const request = new Request('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    const nextRequest = await injectMistralReasoningEffort(request);
    const body = await (nextRequest as Request).json();

    expect(body).toMatchObject({
      reasoning_effort: 'high',
      model: 'mistral-small-latest',
    });
  });

  it('skips reasoning effort for Mistral models without reasoning support', async () => {
    const request = new Request('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    const nextRequest = await injectMistralReasoningEffort(request);

    expect(nextRequest).toBeUndefined();
  });

  it('parses Mistral thinking chunks as reasoning and keeps text chunks as content', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.mistral.ai';

    const provider = new MistralProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'mistral-small-latest' },
    });
    const content = [
      {
        type: 'thinking',
        thinking: [{ type: 'text', text: 'reasoning step' }],
      },
      {
        type: 'text',
        text: 'final answer',
      },
    ];

    expect(provider.parseResponseChunk(content)).toBe('final answer');
    expect(provider.parseReasoningContent(new AIMessageChunk({ content }))).toEqual({
      status: 'streaming',
      content: 'reasoning step',
    });
  });

  it('reshapes Mistral thinking blocks into saved reasoning metadata', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.mistral.ai';

    const provider = new MistralProvider({
      app: createApp({ apiKey: 'test-key' }),
      modelOptions: { model: 'mistral-small-latest' },
    });
    const content = [
      {
        type: 'thinking',
        thinking: [{ type: 'text', text: 'saved reasoning' }],
      },
      {
        type: 'text',
        text: 'final answer',
      },
    ];
    const values: AIMessageInput = {
      role: 'assistant',
      content: {
        type: 'text',
        content: 'final answer',
      },
      metadata: {
        model: 'mistral-small-latest',
        provider: 'mistral',
        usage_metadata: {},
      },
      toolCalls: null,
    };

    const aiMessage = new AIMessage({ content: content as unknown as AIMessage['content'] });

    provider.reshapeAIMessage({ aiMessage, values });

    expect(values.metadata.additional_kwargs).toMatchObject({
      reasoning_content: 'saved reasoning',
    });
    expect(aiMessage.content).toBe('final answer');
  });

  it('returns a system prompt for attachments that were not loaded from storage records', async () => {
    const provider = new TestLLMProvider({
      app: createApp(),
    });

    const parsed = await provider.parseAttachment(
      {} as Context,
      {
        filename: 'secret.png',
        mimetype: 'image/png',
        path: '',
        url: '.env',
        storageId: null,
      } as unknown as AttachmentModel,
    );

    expect(parsed).toMatchObject({
      placement: 'system',
      content: expect.stringContaining('cannot be parsed'),
    });
  });

  it('encodes attachment models through file manager streams', async () => {
    const app = {
      ...createApp(),
      pm: {
        get: () => ({
          getFileStream: async () => ({
            stream: Readable.from([Buffer.from('hello')]),
          }),
        }),
      },
    } as unknown as Application;
    const provider = new TestLLMProvider({ app });

    const parsed = await provider.parseAttachment(
      {
        get: () => '',
      } as unknown as Context,
      {
        id: 1,
        title: 'image',
        filename: 'image.png',
        mimetype: 'image/png',
        path: '',
        storageId: 1,
      } as unknown as AttachmentModel,
    );

    expect(parsed).toMatchObject({
      placement: 'contentBlocks',
      content: {
        image_url: {
          url: 'data:image/png;base64,aGVsbG8=',
        },
      },
    });
  });

  it('accepts external attachments without a local storage id', async () => {
    const app = {
      ...createApp(),
      pm: {
        get: () => ({
          getFileStream: async () => ({
            stream: Readable.from([Buffer.from('remote')]),
          }),
        }),
      },
    } as unknown as Application;
    const provider = new TestLLMProvider({ app });

    const parsed = await provider.parseAttachment(
      {
        get: () => '',
      } as unknown as Context,
      {
        id: 10,
        title: 'remote image',
        filename: 'remote.png',
        mimetype: 'image/png',
        path: '',
        storageId: null,
        source: {
          dataSourceKey: 'external',
          collectionName: 'attachments',
        },
      } as unknown as AttachmentModel,
    );

    expect(parsed).toMatchObject({
      placement: 'contentBlocks',
      content: {
        image_url: {
          url: 'data:image/png;base64,cmVtb3Rl',
        },
      },
    });
  });
});
