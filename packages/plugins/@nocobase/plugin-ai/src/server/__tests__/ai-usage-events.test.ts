/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { describe, expect, it, vi } from 'vitest';
import { AIMessage } from '../types';
import {
  AIUsageEventValues,
  buildAIUsageEventValues,
  normalizeUsageMetadata,
  recordAIUsageEventsForMessages,
} from '../manager/ai-usage-events';

describe('AI usage events', () => {
  it('normalizes provider token usage variants', () => {
    expect(
      normalizeUsageMetadata({
        prompt_tokens: '12',
        completion_tokens: 8.7,
        prompt_tokens_details: {
          cached_tokens: 3,
        },
        completion_tokens_details: {
          reasoning_tokens: 2,
        },
      }),
    ).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
      cachedTokens: 3,
      reasoningTokens: 2,
    });
  });

  it('builds an LLM usage event from an AI message and conversation', () => {
    const event = buildAIUsageEventValues(
      'session-1',
      {
        messageId: '1001',
        sessionId: 'session-1',
        role: 'nathan',
        createdAt: '2026-07-06T01:02:03.004Z',
        content: {
          type: 'text',
          content: 'Done',
        },
        toolCalls: [{ id: 'tool-1', name: 'search', type: 'function', args: {} }],
        metadata: {
          provider: 'openai',
          llmService: 'primary-openai',
          model: 'gpt-5.2',
          usage_metadata: {
            input_tokens: 10,
            output_tokens: 5,
            total_tokens: 15,
          },
          response_metadata: {
            id: 'response-1',
          },
          autoCallTools: ['search'],
        },
      },
      {
        userId: 7,
        aiEmployeeUsername: 'nathan',
        from: 'main-agent',
        category: 'chat',
      },
    );

    expect(event).toMatchObject({
      sessionId: 'session-1',
      messageId: '1001',
      userId: 7,
      aiEmployeeUsername: 'nathan',
      from: 'main-agent',
      category: 'chat',
      eventType: 'llm_message',
      role: 'nathan',
      provider: 'openai',
      llmService: 'primary-openai',
      model: 'gpt-5.2',
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      toolCallCount: 1,
      autoToolCallCount: 1,
      status: 'success',
      rawResponseMetadata: {
        id: 'response-1',
      },
    });
    expect(event?.occurredAt.toISOString()).toBe('2026-07-06T01:02:03.004Z');
  });

  it('skips user messages', () => {
    expect(
      buildAIUsageEventValues(
        'session-1',
        {
          messageId: '1002',
          sessionId: 'session-1',
          role: 'user',
          content: {
            type: 'text',
            content: 'Hello',
          },
          metadata: {
            provider: 'openai',
            model: 'gpt-5.2',
          },
        },
        {},
      ),
    ).toBeNull();
  });

  it('records usage events with conversation dimensions', async () => {
    const updateOrCreate = vi.fn().mockResolvedValue(undefined);
    const findOne = vi.fn().mockResolvedValue({
      userId: 9,
      aiEmployeeUsername: 'lina',
      from: 'sub-agent',
      category: 'task',
    });
    const getRepository = vi.fn((name: string) => {
      if (name === 'aiConversations') {
        return { findOne };
      }
      if (name === 'aiUsageEvents') {
        return { updateOrCreate };
      }
      throw new Error(`Unexpected repository: ${name}`);
    });
    const ctx = {
      db: {
        getRepository,
      },
    } as unknown as Context;
    const messages: AIMessage[] = [
      {
        messageId: '2001',
        sessionId: 'session-2',
        role: 'lina',
        createdAt: new Date('2026-07-06T02:03:04.005Z'),
        content: {
          type: 'text',
          content: 'Translated',
        },
        metadata: {
          provider: 'dashscope',
          model: 'qwen3-max',
          usage_metadata: {},
        },
      },
    ];

    await recordAIUsageEventsForMessages(ctx, 'session-2', messages);

    expect(findOne).toHaveBeenCalledWith({
      filter: {
        sessionId: 'session-2',
      },
      transaction: undefined,
    });
    expect(updateOrCreate).toHaveBeenCalledTimes(1);
    const call = updateOrCreate.mock.calls[0]?.[0] as {
      filterKeys: string[];
      values: AIUsageEventValues;
    };
    expect(call.filterKeys).toEqual(['messageId', 'eventType']);
    expect(call.values).toMatchObject({
      sessionId: 'session-2',
      messageId: '2001',
      userId: 9,
      aiEmployeeUsername: 'lina',
      from: 'sub-agent',
      category: 'task',
      provider: 'dashscope',
      model: 'qwen3-max',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
  });

  it('does not query repositories when messages are not LLM usage events', async () => {
    const getRepository = vi.fn();
    const ctx = {
      db: {
        getRepository,
      },
    } as unknown as Context;

    await recordAIUsageEventsForMessages(ctx, 'session-3', [
      {
        messageId: '3001',
        sessionId: 'session-3',
        role: 'user',
        content: {
          type: 'text',
          content: 'Hello',
        },
        metadata: {
          provider: 'openai',
          model: 'gpt-5.2',
        },
      },
    ]);

    expect(getRepository).not.toHaveBeenCalled();
  });
});
