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
    interruptOn[tool.definition.name] = aiEmployee.shouldInterruptToolCall(tool)
      ? {
          allowedDecisions: ['approve', 'reject', 'edit'],
          description: (toolCall) =>
            JSON.stringify({
              sessionId: aiEmployee.sessionId,
              from: aiEmployee.from,
              username: aiEmployee.employee.username,
              toolCallId: toolCall.id,
              toolCallName: toolCall.name,
            }),
        }
      : false;
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
      let interrupted = false;
      const { runtime, toolCall } = request;
      const { messageId } = request.state;

      const currentConversation = {
        sessionId: aiEmployee.sessionId,
        username: aiEmployee.employee.username,
        from: aiEmployee.from,
      };

      const tm = await aiEmployee.getToolCallResult(messageId, request.toolCall.id);
      if (!tm) {
        throw new Error(`Tool call result not found for messageId=${messageId}, toolCallId=${request.toolCall.id}`);
      }
      if (tm.status === 'error') {
        runtime.writer?.({
          action: 'afterToolCall',
          body: { toolCall, toolCallResult: tm },
          currentConversation,
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
      runtime.writer?.({ action: 'beforeToolCall', body: { toolCall }, currentConversation });
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
        if (e.name === 'GraphInterrupt') {
          interrupted = true;
          throw e;
        }
        aiEmployee.logger.error(e);
        result = { status: 'error', content: e.message };
        runtime.writer?.({
          action: 'afterToolCallError',
          body: { toolCall, error: e },
          currentConversation,
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
        if (!interrupted) {
          await aiEmployee.updateToolCallDone(messageId, request.toolCall.id, result);
          const toolCallResult = await aiEmployee.getToolCallResult(messageId, request.toolCall.id);
          runtime.writer?.({
            action: 'afterToolCall',
            body: { toolCall, toolCallResult },
            currentConversation,
          });
        }
      }
    },
  });
};
