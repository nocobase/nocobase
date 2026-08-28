/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';
import { sanitizeLangChainAIMessage } from '../tool-call-sanitizer';

type ToolCallSanitizerLogger = {
  warn: (message: string, meta?: Record<string, unknown>) => void;
};

type ToolCallSanitizerMiddlewareOptions = {
  logger?: ToolCallSanitizerLogger;
};

const buildMessageUpdates = (
  messages: readonly unknown[],
  options: ToolCallSanitizerMiddlewareOptions,
  phase: 'beforeModel' | 'afterModel',
): BaseMessage[] => {
  const updates: BaseMessage[] = [];

  for (const message of messages) {
    if (!AIMessage.isInstance(message) || !message.id) {
      continue;
    }
    const sanitizedMessage = sanitizeLangChainAIMessage(message, {
      onDiscard: (info) => {
        options.logger?.warn('Discard malformed raw tool calls from AI message', {
          phase,
          messageId: message.id,
          invalidToolCallCount: message.invalid_tool_calls?.length ?? 0,
          ...info,
        });
      },
    });
    if (!sanitizedMessage) {
      continue;
    }
    updates.push(
      new AIMessage({
        id: sanitizedMessage.id,
        content: sanitizedMessage.content,
        name: sanitizedMessage.name,
        additional_kwargs: sanitizedMessage.additional_kwargs,
        response_metadata: sanitizedMessage.response_metadata,
        tool_calls: sanitizedMessage.tool_calls,
        invalid_tool_calls: sanitizedMessage.invalid_tool_calls,
        usage_metadata: sanitizedMessage.usage_metadata,
      }),
    );
  }

  return updates;
};

export const toolCallSanitizerMiddleware = (options: ToolCallSanitizerMiddlewareOptions = {}) =>
  createMiddleware<never>({
    name: 'ToolCallSanitizerMiddleware',
    beforeModel: (state) => {
      const updates = buildMessageUpdates(state.messages ?? [], options, 'beforeModel');
      if (!updates.length) {
        return;
      }
      return { messages: updates };
    },
    afterModel: (state) => {
      const updates = buildMessageUpdates(state.messages ?? [], options, 'afterModel');
      if (!updates.length) {
        return;
      }
      return { messages: updates };
    },
  });
