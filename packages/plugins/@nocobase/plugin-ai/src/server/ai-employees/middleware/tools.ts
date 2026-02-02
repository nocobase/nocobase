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

export const toolCallStatusMiddleware = (aiEmployee: AIEmployee) => {
  return createMiddleware({
    name: 'ToolCallStatusMiddleware',
    wrapToolCall: async (request, handler) => {
      const { runtime, toolCall } = request;
      await aiEmployee.updateToolCallPending(request.toolCall.id);
      runtime.writer?.({ action: 'beforeToolCall', body: { toolCall } });
      let result;
      try {
        const toolMessage = await handler(request);
        if (toolMessage instanceof ToolMessage) {
          result = _.isObject(toolMessage.content) ? toolMessage.content : JSON.parse(toolMessage.content);
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
        throw e;
      } finally {
        await aiEmployee.updateToolCallDone(request.toolCall.id, result);
        runtime.writer?.({
          action: 'afterToolCall',
          body: { toolCall },
        });
      }
    },
  });
};
