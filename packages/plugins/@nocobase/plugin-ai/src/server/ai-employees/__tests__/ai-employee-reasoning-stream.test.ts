/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessageChunk } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employee';
import type { LLMProvider } from '../../llm-providers/provider';

const conversation = { sessionId: 'session-1', from: 'main-agent', username: 'employee' };

function createProtocol(events: string[]) {
  return {
    statistics: { sent: 1 },
    with: () => ({
      startStream: async () => events.push('start'),
      endStream: async () => events.push('end'),
      reasoning: async ({ content }: { content: string }) => events.push(`reasoning:${content}`),
      stopReasoning: async () => events.push('reasoning:stop'),
      content: async (content: string) => events.push(`content:${content}`),
      toolCallChunks: async () => events.push('tool_call'),
      webSearch: async () => events.push('web_search'),
      toolCalls: async () => events.push('tool_calls'),
      toolCallStatus: async () => {},
      newMessage: async () => {},
      subAgentCompleted: async () => {},
    }),
  };
}

function createProvider(): LLMProvider {
  return {
    parseReasoningContent: (chunk: AIMessageChunk) => {
      const content = chunk.additional_kwargs.reasoning_content;
      return typeof content === 'string' && content ? { status: 'streaming', content } : null;
    },
    parseResponseChunk: (content: unknown) => (typeof content === 'string' && content ? content : null),
    parseWebSearchAction: (chunk: AIMessageChunk) =>
      chunk.additional_kwargs.webSearch ? [{ type: 'search', query: 'query' }] : [],
    parseResponseError: (error: Error) => error.message,
  } as unknown as LLMProvider;
}

async function runStream(chunks: AIMessageChunk[], events: string[], errorAfterChunks = false) {
  async function* stream() {
    for (const chunk of chunks) {
      yield ['messages', [chunk, { currentConversation: conversation }]];
    }
    if (errorAfterChunks) {
      throw new Error('stream failed');
    }
  }

  const fakeEmployee = {
    protocol: createProtocol(events),
    sessionId: conversation.sessionId,
    from: conversation.from,
    employee: { username: conversation.username },
    ctx: { log: { error: vi.fn() }, res: { end: vi.fn() } },
    sendErrorResponse: () => events.push('error'),
    sendSpecificError: () => events.push('error'),
  };

  await AIEmployee.prototype.processChatStream.call(fakeEmployee, stream(), {
    signal: new AbortController().signal,
    providerName: 'deepseek',
    model: 'deepseek-v4-flash',
    provider: createProvider(),
    responseMetadata: new Map(),
  });
}

describe('AIEmployee reasoning stream ordering', () => {
  it('emits reasoning before stop and answer content from the same chunk', async () => {
    const events: string[] = [];
    await runStream(
      [new AIMessageChunk({ content: 'answer', additional_kwargs: { reasoning_content: 'thinking' } })],
      events,
    );

    expect(events).toEqual(['start', 'reasoning:thinking', 'reasoning:stop', 'content:answer', 'end']);
  });

  it('stops reasoning before function tools and web search', async () => {
    const events: string[] = [];
    await runStream(
      [
        new AIMessageChunk({
          content: '',
          additional_kwargs: { reasoning_content: 'tool reasoning' },
          tool_call_chunks: [{ name: 'tool', args: '{}', id: 'call_1', index: 0 }],
        }),
        new AIMessageChunk({
          content: '',
          additional_kwargs: { reasoning_content: 'search reasoning', webSearch: true },
        }),
      ],
      events,
    );

    expect(events).toEqual([
      'start',
      'reasoning:tool reasoning',
      'reasoning:stop',
      'tool_call',
      'reasoning:search reasoning',
      'reasoning:stop',
      'web_search',
      'end',
    ]);
  });

  it('stops a reasoning-only phase on model completion and stream end exactly once', async () => {
    const events: string[] = [];
    await runStream(
      [
        new AIMessageChunk({
          content: '',
          additional_kwargs: { reasoning_content: 'final reasoning' },
          response_metadata: { status: 'completed' },
        }),
      ],
      events,
    );

    expect(events).toEqual(['start', 'reasoning:final reasoning', 'reasoning:stop', 'end']);
  });

  it('stops an active reasoning phase before reporting stream errors', async () => {
    const events: string[] = [];
    await runStream(
      [new AIMessageChunk({ content: '', additional_kwargs: { reasoning_content: 'partial reasoning' } })],
      events,
      true,
    );

    expect(events).toEqual(['start', 'reasoning:partial reasoning', 'reasoning:stop', 'error']);
  });
});
