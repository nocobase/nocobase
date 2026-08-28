/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { MemorySaver } from '@langchain/langgraph';
import { convertMessagesToCompletionsMessageParams } from '@langchain/openai';
import { createAgent, createMiddleware } from 'langchain';
import { describe, expect, it, vi } from 'vitest';
import { toolCallSanitizerMiddleware } from '../ai-employees/middleware';

describe('toolCallSanitizerMiddleware', () => {
  const rawToolCall = {
    id: 'call_bad',
    type: 'function',
    function: {
      name: 'aiEmployeeWorkflowTaskOutput',
      arguments: '{"result":{"reference_reply":":"bad json"}',
    },
  };

  type MessagePatchHook = (state: {
    messages: BaseMessage[];
  }) => void | { messages?: BaseMessage[] } | Promise<void | { messages?: BaseMessage[] }>;

  const getMessagePatchHook = (hook: unknown): MessagePatchHook => {
    if (typeof hook === 'function') {
      return hook as MessagePatchHook;
    }
    if (hook && typeof hook === 'object' && 'hook' in hook) {
      const nestedHook = (hook as { hook?: unknown }).hook;
      if (typeof nestedHook === 'function') {
        return nestedHook as MessagePatchHook;
      }
    }
    throw new Error('Middleware hook is not callable');
  };

  const getPatchMessages = (result: Awaited<ReturnType<MessagePatchHook>>) => {
    if (!result || !('messages' in result)) {
      return [];
    }
    return result.messages ?? [];
  };

  it('should remove malformed raw tool calls before checkpoint persistence and next model request', async () => {
    const model = new FakeListChatModel({
      responses: [
        new AIMessage({
          id: 'ai_bad',
          content: '',
          additional_kwargs: {
            tool_calls: [rawToolCall],
            reasoning_content: 'keep this reasoning',
          },
        }),
      ],
    });
    const logger = { warn: vi.fn() };
    const agent = createAgent({
      model,
      tools: [],
      middleware: [toolCallSanitizerMiddleware({ logger })],
      checkpointer: new MemorySaver(),
    });
    const config = { configurable: { thread_id: 'malformed-tool-call' } };

    await agent.invoke({ messages: [{ role: 'user', content: 'run' }] }, config);

    const state = await agent.getState(config);
    const lastMessage = state.values.messages.at(-1) as AIMessage;

    expect(lastMessage.type).toBe('ai');
    expect(lastMessage.tool_calls).toEqual([]);
    expect(lastMessage.invalid_tool_calls).toHaveLength(1);
    expect(lastMessage.additional_kwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });

    const requestMessages = convertMessagesToCompletionsMessageParams({
      messages: state.values.messages,
    });
    expect(requestMessages.at(-1)).toMatchObject({
      role: 'assistant',
      content: '',
    });
    expect(requestMessages.at(-1)).not.toHaveProperty('tool_calls');
    expect(logger.warn).toHaveBeenCalledWith(
      'Discard malformed raw tool calls from AI message',
      expect.objectContaining({
        phase: 'afterModel',
        messageId: 'ai_bad',
        rawToolCallCount: 1,
        parsedToolCallCount: 0,
        rawToolCallIds: ['call_bad'],
        rawToolCallNames: ['aiEmployeeWorkflowTaskOutput'],
      }),
    );
    expect(JSON.stringify(logger.warn.mock.calls[0][1])).not.toContain('reference_reply');
  });

  it('should remove malformed raw tool calls from existing state before model requests', async () => {
    let capturedMessages: BaseMessage[] = [];
    const model = new FakeListChatModel({
      responses: ['done'],
    });
    const agent = createAgent({
      model,
      tools: [],
      middleware: [
        toolCallSanitizerMiddleware(),
        createMiddleware({
          name: 'CaptureMessagesMiddleware',
          wrapModelCall: (request, handler) => {
            capturedMessages = request.messages;
            return handler(request);
          },
        }),
      ],
      checkpointer: new MemorySaver(),
    });

    await agent.invoke(
      {
        messages: [
          new AIMessage({
            id: 'ai_bad_history',
            content: '',
            additional_kwargs: {
              tool_calls: [rawToolCall],
              reasoning_content: 'keep this reasoning',
            },
          }),
          { role: 'user', content: 'continue' },
        ],
      },
      { configurable: { thread_id: 'malformed-tool-call-history' } },
    );

    const requestMessages = convertMessagesToCompletionsMessageParams({
      messages: capturedMessages,
    });
    expect(requestMessages[0]).toMatchObject({
      role: 'assistant',
      content: '',
    });
    expect(requestMessages[0]).not.toHaveProperty('tool_calls');
    expect(requestMessages).toHaveLength(2);
    expect(requestMessages[1]).toMatchObject({
      role: 'user',
      content: 'continue',
    });
  });

  it('should build a patch without replacing non-AI messages', async () => {
    const badAIMessage = new AIMessage({
      id: 'ai_bad_middle',
      content: '',
      additional_kwargs: {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
    });
    const humanMessage = new HumanMessage({ id: 'human_1', content: 'continue' });
    const toolMessage = new ToolMessage({
      id: 'tool_1',
      content: 'tool result',
      tool_call_id: 'call_existing',
    });
    const middleware = toolCallSanitizerMiddleware();
    const beforeModel = getMessagePatchHook(middleware.beforeModel);
    const messages = [humanMessage, badAIMessage, toolMessage];

    const result = await beforeModel({
      messages,
    });
    const patchMessages = getPatchMessages(result);

    expect(messages).toEqual([humanMessage, badAIMessage, toolMessage]);
    expect(patchMessages).toHaveLength(1);
    expect(patchMessages[0]).not.toBe(badAIMessage);
    expect(AIMessage.isInstance(patchMessages[0])).toBe(true);
    expect(patchMessages[0].id).toBe(badAIMessage.id);
    expect(badAIMessage.additional_kwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });
  });

  it('should sanitize malformed AI messages even when they are not the last message after model', async () => {
    const badAIMessage = new AIMessage({
      id: 'ai_bad_not_last',
      content: '',
      additional_kwargs: {
        tool_calls: [rawToolCall],
        reasoning_content: 'keep this reasoning',
      },
    });
    const middleware = toolCallSanitizerMiddleware();
    const afterModel = getMessagePatchHook(middleware.afterModel);
    const messages = [
      new HumanMessage({ id: 'human_1', content: 'start' }),
      badAIMessage,
      new HumanMessage({ id: 'human_2', content: 'not last' }),
    ];

    const result = await afterModel({
      messages,
    });
    const patchMessages = getPatchMessages(result);

    expect(messages[1]).toBe(badAIMessage);
    expect(patchMessages).toHaveLength(1);
    expect(patchMessages[0]).not.toBe(badAIMessage);
    expect(AIMessage.isInstance(patchMessages[0])).toBe(true);
    expect(patchMessages[0].id).toBe(badAIMessage.id);
    expect(badAIMessage.additional_kwargs).toEqual({
      reasoning_content: 'keep this reasoning',
    });
  });
});
