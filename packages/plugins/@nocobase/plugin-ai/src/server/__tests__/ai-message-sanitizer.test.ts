/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';
import { sanitizeAdditionalKwargsForToolCalls, sanitizeLangChainAIMessage } from '../ai-employees/tool-call-sanitizer';
import { convertAIMessage } from '../ai-employees/utils';

describe('AI message tool call sanitizer', () => {
  const rawToolCall = {
    id: 'call_bad',
    type: 'function',
    function: {
      name: 'aiEmployeeWorkflowTaskOutput',
      arguments: '{"result":{"reference_reply":":"bad json"}',
    },
  };

  it('should drop malformed raw tool calls when converting LangChain AI messages to stored messages', () => {
    const logger = { warn: vi.fn() };
    const aiMessage = new AIMessage({
      id: 'ai_bad',
      content: '',
      additional_kwargs: {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
    });

    const values = convertAIMessage({
      aiEmployee: {
        employee: { username: 'assistant' },
        skillSettings: { tools: [] },
        logger,
      } as never,
      providerName: 'deepseek',
      model: 'deepseek-v4-flash',
      aiMessage,
    });

    expect(values.metadata.additional_kwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Discard malformed raw tool calls from AI message',
      expect.objectContaining({
        phase: 'convertAIMessage',
        messageId: 'ai_bad',
        rawToolCallCount: 1,
        parsedToolCallCount: 0,
        rawToolCallIds: ['call_bad'],
        rawToolCallNames: ['aiEmployeeWorkflowTaskOutput'],
      }),
    );
    expect(JSON.stringify(logger.warn.mock.calls[0][1])).not.toContain('reference_reply');
  });

  it('should drop malformed raw tool calls when formatting stored assistant messages', () => {
    const { additionalKwargs } = sanitizeAdditionalKwargsForToolCalls(
      {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
      null,
    );

    expect(additionalKwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });
  });

  it('should keep raw tool calls when parsed tool calls are present', () => {
    const result = sanitizeAdditionalKwargsForToolCalls(
      {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
      [{ id: 'call_bad', name: 'aiEmployeeWorkflowTaskOutput', args: {}, type: 'tool_call' }],
    );

    expect(result.changed).toBe(false);
    expect(result.additionalKwargs).toEqual({
      tool_calls: [rawToolCall],
      reasoning_content: 'keep this reasoning',
    });
  });

  it('should sanitize LangChain AI messages in place without rebuilding the message instance', () => {
    const aiMessage = new AIMessage({
      id: 'ai_bad',
      content: '',
      additional_kwargs: {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
    });
    const messageWithRuntimeField = aiMessage as AIMessage & { runtimeField?: string };
    messageWithRuntimeField.runtimeField = 'keep runtime field';

    const sanitizedMessage = sanitizeLangChainAIMessage(aiMessage);

    expect(sanitizedMessage).toBe(aiMessage);
    expect(messageWithRuntimeField.runtimeField).toBe('keep runtime field');
    expect(aiMessage.additional_kwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });
  });
});
