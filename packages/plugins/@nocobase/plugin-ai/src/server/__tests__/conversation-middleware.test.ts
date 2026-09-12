/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HumanMessage } from '@langchain/core/messages';
import { FakeStreamingChatModel } from '@langchain/core/utils/testing';
import { MemorySaver } from '@langchain/langgraph';
import { createAgent } from 'langchain';
import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employees/ai-employee';
import { conversationMiddleware } from '../ai-employees/middleware/conversation';
import { LLMProvider } from '../llm-providers/provider';

describe('conversationMiddleware', () => {
  it('persists only current user messages when a failed checkpoint contains historical messages', async () => {
    const addMessages = vi.fn().mockResolvedValue([]);
    const conversation = {
      getMessage: vi.fn().mockResolvedValue(null),
      removeMessages: vi.fn().mockResolvedValue(undefined),
      addMessages,
    };
    const aiEmployee = {
      sessionId: 'failed-conversation',
      userMessageCount: 1,
      aiChatConversation: {
        withTransaction: vi.fn(async (callback) => callback(conversation, {})),
      },
      updateThread: vi.fn().mockResolvedValue(undefined),
      removeAbortController: vi.fn(),
    } as unknown as AIEmployee;
    const middleware = conversationMiddleware(aiEmployee, {
      providerName: 'openai',
      provider: {} as LLMProvider,
      model: 'test-model',
      agentThread: {
        sessionId: 'failed-conversation',
        thread: 1,
      },
    });
    const agent = createAgent({
      model: new FakeStreamingChatModel({ thrownErrorString: 'invalid attachment' }),
      tools: [],
      middleware: [middleware],
      checkpointer: new MemorySaver(),
    });
    const config = {
      configurable: { thread_id: 'failed-conversation:1' },
      context: { ctx: {}, appendMessage: undefined },
    };

    await agent.updateState(config, {
      messages: [
        new HumanMessage({
          id: 'historical-user-message',
          content: 'historical',
          additional_kwargs: {
            userContent: { type: 'text', content: 'historical' },
          },
        }),
      ],
      lastMessageIndex: {
        lastHumanMessageIndex: 0,
        lastAIMessageIndex: 0,
        lastToolMessageIndex: 0,
        lastMessageIndex: 0,
      },
    });

    await expect(
      agent.invoke(
        {
          messages: [
            new HumanMessage({
              id: 'first-current-user-message',
              content: 'first current',
              additional_kwargs: {
                userContent: { type: 'text', content: 'first current' },
              },
            }),
          ],
        },
        config,
      ),
    ).rejects.toThrow('invalid attachment');

    await expect(
      agent.invoke(
        {
          messages: [
            new HumanMessage({
              id: 'second-current-user-message',
              content: 'second current',
              additional_kwargs: {
                userContent: { type: 'text', content: 'second current' },
              },
            }),
          ],
        },
        config,
      ),
    ).rejects.toThrow('invalid attachment');

    expect(addMessages).toHaveBeenCalledTimes(2);
    expect(addMessages.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        content: { type: 'text', content: 'first current' },
        metadata: expect.objectContaining({ id: 'first-current-user-message' }),
      }),
    ]);
    expect(addMessages.mock.calls[1][0]).toEqual([
      expect.objectContaining({
        content: { type: 'text', content: 'second current' },
        metadata: expect.objectContaining({ id: 'second-current-user-message' }),
      }),
    ]);
  });
});
