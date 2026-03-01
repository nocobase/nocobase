/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMiddleware, humanInTheLoopMiddleware, ToolMessage } from 'langchain';
import { AIEmployee } from '../ai-employee';
import z from 'zod';
import _ from 'lodash';
import { ToolsEntry } from '@nocobase/ai';

export const toolInteractionMiddleware = (aiEmployee: AIEmployee, tools: ToolsEntry[]) => {
  const interruptOn = {};
  for (const tool of tools) {
    interruptOn[tool.definition.name] = aiEmployee.shouldInterruptToolCall(tool);
  }
  return humanInTheLoopMiddleware({
    interruptOn,
  });
};

export const toolCallStatusMiddleware = (aiEmployee: AIEmployee): ReturnType<typeof createMiddleware> => {
  return createMiddleware({
    name: 'ToolCallStatusMiddleware',
    stateSchema: z.object({
      messageId: z.coerce.string().optional(),
    }),
    wrapToolCall: async (request, handler) => {
      const { runtime, toolCall } = request;
      const { messageId } = request.state;

      const tm = await aiEmployee.getToolCallResult(messageId, request.toolCall.id);
      if (tm.status === 'error') {
        runtime.writer?.({
          action: 'afterToolCall',
          body: { toolCall, toolCallResult: tm },
        });
        return new ToolMessage({
          tool_call_id: request.toolCall.id,
          status: 'error',
          content: tm.content,
          metadata: {
            messageId,
          },
        });
      }

      await aiEmployee.updateToolCallPending(messageId, request.toolCall.id);
      runtime.writer?.({ action: 'beforeToolCall', body: { toolCall } });
      let result;
      try {
        const toolMessage = await handler(request);
        if (toolMessage instanceof ToolMessage) {
          if (_.isObject(toolMessage.content)) {
            result = toolMessage.content;
          } else if (typeof toolMessage.content === 'string') {
            try {
              result = JSON.parse(toolMessage.content);
            } catch (e) {
              aiEmployee.logger.warn('tool result parse fail', e);
              result = toolMessage.content;
            }
          } else {
            // 当 content 是数组或其他非字符串类型时，直接返回原值
            result = toolMessage.content;
          }
        } else {
          result = toolMessage.toJSON();
        }

        return toolMessage;
      } catch (e) {
        aiEmployee.logger.error(e);
        result = { status: 'error', content: e.message };
        runtime.writer?.({
          action: 'afterToolCallError',
          body: { toolCall, error: e },
        });
        return new ToolMessage({
          tool_call_id: request.toolCall.id,
          status: 'error',
          content: e.message,
          metadata: {
            messageId,
          },
        });
      } finally {
        await aiEmployee.updateToolCallDone(messageId, request.toolCall.id, result);
        const toolCallResult = await aiEmployee.getToolCallResult(messageId, request.toolCall.id);
        runtime.writer?.({
          action: 'afterToolCall',
          body: { toolCall, toolCallResult },
        });
      }
    },
  });
};
