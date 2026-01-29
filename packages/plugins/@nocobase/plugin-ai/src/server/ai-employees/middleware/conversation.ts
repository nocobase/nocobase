/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, createMiddleware, HumanMessage, ToolMessage } from 'langchain';
import { AIEmployee } from '../ai-employee';
import { AIMessageInput } from '../../types';
import { AIMessage as AIConversationMessage, AIMessageContent } from '../../types/ai-message.type';
import z from 'zod';

export const conversationMiddleware = (
  aiEmployee: AIEmployee,
  options: { model: any; service: any; messageId?: string; agentThread?: { sessionId: string; thread: number } },
) => {
  const { model, service, messageId, agentThread } = options;
  const convertAIMessage = (aiMessage: AIMessage): AIMessageInput => {
    const message = aiMessage.content;
    const toolCalls = aiMessage.tool_calls;
    const skills = aiEmployee.skillSettings?.skills;

    if (!message && !toolCalls?.length) {
      return null;
    }

    const values: AIMessageInput = {
      role: aiEmployee.employee.username,
      content: {
        type: 'text',
        content: message,
      },
      metadata: {
        id: aiMessage.id,
        model,
        provider: service.provider,
        usage_metadata: {},
      },
      toolCalls: null,
    };

    if (toolCalls?.length) {
      values.toolCalls = toolCalls as any;
      values.metadata.autoCallTools = toolCalls
        .filter((tool: { name: string }) => {
          return skills?.some((s: { name: string; autoCall?: boolean }) => s.name === tool.name && s.autoCall);
        })
        .map((tool: { name: string }) => tool.name);
    }

    if (aiMessage.usage_metadata) {
      values.metadata.usage_metadata = aiMessage.usage_metadata;
    }
    if (aiMessage.response_metadata) {
      values.metadata.response_metadata = aiMessage.response_metadata;
    }
    if (aiMessage.additional_kwargs) {
      values.metadata.additional_kwargs = aiMessage.additional_kwargs;
    }

    return values;
  };

  const convertHumanMessage = (aiMessage: HumanMessage): AIMessageInput => {
    if (!aiMessage.additional_kwargs.userContent) {
      return null;
    }

    const values: AIMessageInput = {
      role: 'user',
      content: aiMessage.additional_kwargs?.userContent as AIMessageContent,
      metadata: {
        id: aiMessage.id,
        model,
        provider: service.provider,
      },
    };

    values.attachments = aiMessage.additional_kwargs.attachments as any;
    values.workContext = aiMessage.additional_kwargs.workContext as any;

    return values;
  };

  const convertToolMessage = (message: ToolMessage): AIMessageInput => {
    const values: AIMessageInput = {
      role: 'tool',
      content: {
        type: 'text',
        content: message.content,
      },
      metadata: {
        id: message.id,
        model,
        provider: service.provider,
        toolCallId: message.tool_call_id,
      },
    };

    return values;
  };

  return createMiddleware({
    name: 'ConversationMiddleware',
    contextSchema: z.object({
      ctx: z.any(),
    }),
    stateSchema: z.object({
      lastHumanMessageIndex: z.number().default(0),
      lastAIMessageIndex: z.number().default(0),
      lastToolMessageIndex: z.number().default(0),
      lastMessageIndex: z.number().default(0),
    }),
    beforeAgent: async (state) => {
      const lastHumanMessageIndex = state.lastHumanMessageIndex;
      const userMessages = state.messages
        .filter((x) => x.type === 'human')
        .slice(lastHumanMessageIndex)
        .map((x) => x as HumanMessage)
        .map(convertHumanMessage);
      await aiEmployee.aiChatConversation.withTransaction(async (conversation, transaction) => {
        if (agentThread) {
          await aiEmployee.updateThread(transaction, agentThread);
        }
        if (messageId && (await conversation.getMessage(messageId))) {
          await conversation.removeMessages({ messageId });
        }
        if (userMessages.length) {
          await conversation.addMessages(userMessages);
        }
      });
    },
    beforeModel: async (state, _runtime) => {
      const lastToolMessageIndex = state.lastToolMessageIndex;
      const toolMessages = state.messages
        .filter((x) => x.type === 'tool')
        .slice(lastToolMessageIndex)
        .map((x) => x as ToolMessage)
        .map(convertToolMessage);
      if (toolMessages.length) {
        await aiEmployee.aiChatConversation.addMessages(toolMessages);
      }
    },
    afterModel: async (state, runtime) => {
      try {
        const newState = {
          lastHumanMessageIndex: state.messages.filter((x) => x.type === 'human').length,
          lastAIMessageIndex: state.messages.filter((x) => x.type === 'ai').length,
          lastToolMessageIndex: state.messages.filter((x) => x.type === 'tool').length,
          lastMessageIndex: state.messages.length,
        };
        const lastMessage = state.messages.at(-1);
        if (lastMessage?.type !== 'ai') {
          return newState;
        }

        aiEmployee.removeAbortController();

        const aiMessage = lastMessage as AIMessage;
        const toolCalls = aiMessage.tool_calls;
        if (toolCalls?.length) {
          runtime.writer?.({ action: 'showToolCalls', body: toolCalls });
        }

        const values = convertAIMessage(aiMessage);
        if (values) {
          if (runtime.signal?.aborted) {
            values.metadata.interrupted = true;
          }

          await aiEmployee.aiChatConversation.withTransaction(async (conversation, transaction) => {
            const result: AIConversationMessage = await conversation.addMessages(values);
            if (toolCalls?.length) {
              await aiEmployee.initToolCall(transaction, result.messageId, toolCalls as any);
            }
          });
        }

        return newState;
      } catch (e) {
        runtime.context?.ctx?.logger?.error(e);
      }
    },
  });
};
