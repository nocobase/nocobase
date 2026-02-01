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
import { ToolOptions } from '../../manager/tool-manager';
import _ from 'lodash';

export const toolInteractionMiddleware = (_aiEmployee: AIEmployee, tools: ToolOptions[]) => {
  const interruptOn = {};
  for (const tool of tools) {
    interruptOn[tool.name] = tool.execution === 'frontend' || tool.autoCall !== true;
    // interruptOn[tool.name] = tool.autoCall !== true;
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
      let result;
      try {
        runtime.writer?.({ action: 'beforeToolCall', body: { toolCall } });
        const toolMessage = await handler(request);
        runtime.writer?.({
          action: 'afterToolCall',
          body: { toolCall, toolMessage },
        });

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
      }
    },
  });
};
