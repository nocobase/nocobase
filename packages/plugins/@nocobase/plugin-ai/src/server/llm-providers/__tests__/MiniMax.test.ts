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
import { AIMessageChunk } from '@langchain/core/messages';
import { MiniMaxProvider, minimaxProviderOptions } from '../MiniMax';
import { SupportedModel } from '../../manager/ai-manager';

function createApp(renderedValue?: Record<string, unknown>): Application {
  return {
    environment: {
      renderJsonTemplate: () => renderedValue ?? {},
    },
  } as unknown as Application;
}

const originalWhitelist = process.env.SERVER_REQUEST_WHITELIST;

describe('MiniMax provider', () => {
  afterEach(() => {
    process.env.SERVER_REQUEST_WHITELIST = originalWhitelist;
  });

  it('creates a chat model using the default MiniMax baseURL', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new MiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.chatModel).toBeDefined();
  });

  it('normalizes a rendered baseURL override', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new MiniMaxProvider({
      app: createApp({ apiKey: 'test-key', baseURL: 'https://api.minimax.io/v1/' }),
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.serviceOptions.baseURL).toBe('https://api.minimax.io/v1');
  });

  it('parses reasoning content from streamed chunks', () => {
    process.env.SERVER_REQUEST_WHITELIST = 'api.minimax.io';

    const provider = new MiniMaxProvider({
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

    const provider = new MiniMaxProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'test-key' },
      modelOptions: { model: 'MiniMax-M3' },
    });

    expect(provider.parseReasoningContent(new AIMessageChunk({ content: 'answer' }))).toBeNull();
  });

  it('exposes MiniMax-M3 as a selectable model', () => {
    expect(minimaxProviderOptions.title).toBe('MiniMax');
    expect(minimaxProviderOptions.models?.[SupportedModel.LLM]).toContain('MiniMax-M3');
  });
});
