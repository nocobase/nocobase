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
import {
  AIMessage as AIConversationMessage,
  AIMessageContent,
  AIToolCall,
  AIToolMessage,
} from '../../types/ai-message.type';
import z from 'zod';
import { Model } from '@nocobase/database';
import { ToolsEntry } from '@nocobase/ai';

export const conversationMiddleware = (
  aiEmployee: AIEmployee,
  options: {
    providerName: string;
    model: string;
    messageId?: string;
    agentThread?: { sessionId: string; thread: number };
  },
) => {
  const { providerName: provider, model, messageId, agentThread } = options;
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
        provider,
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
        provider,
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
        provider,
        toolCallId: message.tool_call_id,
        toolName: message.name,
      },
    };

    return values;
  };

  const fillToolCall = (
    message: AIConversationMessage,
    toolsMap: Map<string, ToolsEntry>,
    initializedToolCalls: Model<AIToolMessage>[],
    toolCalls: AIToolCall[],
  ) => {
    const initializedToolCallMap = new Map(initializedToolCalls.map((x) => x.toJSON()).map((x) => [x.toolCallId, x]));
    for (const toolCall of toolCalls) {
      const tools = toolsMap.get(toolCall.name);
      const { status, content, invokeStatus, invokeStartTime, invokeEndTime, auto, execution } =
        initializedToolCallMap.get(toolCall.id) ?? {};
      toolCall.sessionId = message.sessionId;
      toolCall.messageId = message.messageId;
      toolCall.status = status;
      toolCall.content = content;
      toolCall.invokeStatus = invokeStatus;
      toolCall.invokeStartTime = invokeStartTime;
      toolCall.invokeEndTime = invokeEndTime;
      toolCall.auto = auto;
      toolCall.execution = execution;
      toolCall.willInterrupt = tools?.execution === 'frontend' || auto === false;
      toolCall.defaultPermission = tools?.defaultPermission;
    }
  };

  return createMiddleware({
    name: 'ConversationMiddleware',
    contextSchema: z.object({
      ctx: z.any(),
    }),
    stateSchema: z.object({
      messageId: z.coerce.string().optional(),
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
    beforeModel: async (state, runtime) => {
      const { messageId } = state;
      const lastToolMessageIndex = state.lastToolMessageIndex;
      const toolMessages = state.messages
        .filter((x) => x.type === 'tool')
        .slice(lastToolMessageIndex)
        .map((x) => x as ToolMessage)
        .map(convertToolMessage);
      if (toolMessages.length) {
        for (const tm of toolMessages) {
          tm.metadata.messageId = messageId;
        }
        await aiEmployee.aiChatConversation.withTransaction(async (conversation, transaction) => {
          await conversation.addMessages(toolMessages);
          await aiEmployee.confirmToolCall(
            transaction,
            messageId,
            toolMessages.map((x) => x.metadata.toolCallId as string),
          );
        });
        runtime.writer?.({ action: 'beforeSendToolMessage', body: { messageId, messages: toolMessages } });
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
        const values = convertAIMessage(aiMessage);
        if (values) {
          if (runtime.signal?.aborted) {
            values.metadata.interrupted = true;
          }

          await aiEmployee.aiChatConversation.withTransaction(async (conversation, transaction) => {
            const result: AIConversationMessage = await conversation.addMessages(values);
            state.messageId = result.messageId;
            if (toolCalls?.length) {
              const toolsMap = await aiEmployee.getToolsMap();
              const initializedToolCalls = await aiEmployee.initToolCall(
                transaction,
                result.messageId,
                toolCalls as any,
              );
              fillToolCall(result, toolsMap, initializedToolCalls, toolCalls as any);
            }
          });
        }
        if (toolCalls?.length) {
          runtime.writer?.({
            action: 'initToolCalls',
            body: { toolCalls },
          });
        }

        return newState;
      } catch (e) {
        runtime.context?.ctx?.logger?.error(e);
      }
    },
  });
};
