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
import { AIMessageChunk, HumanMessage } from '@langchain/core/messages';
import { convertMessagesToCompletionsMessageParams } from '@langchain/openai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeFile } from '../../utils';
import type { ReasoningChatOpenAI } from '../common/reasoning';
import { MiniMaxProvider, minimaxProviderOptions } from '../minimax';
import type { ParsedAttachmentResult } from '../provider';
import { SupportedModel } from '../../manager/ai-manager';

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

describe('MiniMax provider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
    vi.clearAllMocks();
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

  it('exposes the target models in priority order', () => {
    expect(minimaxProviderOptions.title).toBe('MiniMax');
    expect(minimaxProviderOptions.models?.[SupportedModel.LLM]).toEqual(['MiniMax-M3', 'MiniMax-M2.7']);
  });
});
