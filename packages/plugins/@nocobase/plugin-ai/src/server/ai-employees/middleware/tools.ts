/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMiddleware, humanInTheLoopMiddleware } from 'langchain';
import { AIEmployee } from '../ai-employee';
import z from 'zod';
import { ToolOptions } from '../../manager/tool-manager';

export const toolInteractionMiddleware = (_aiEmployee: AIEmployee, tools: ToolOptions[]) => {
  const interruptOn = {};
  for (const tool of tools) {
    interruptOn[tool.name] = tool.execution === 'frontend' || tool.autoCall !== true;
  }
  return humanInTheLoopMiddleware({
    interruptOn,
  });
};

export const toolCallStatusMiddleware = (aiEmployee: AIEmployee) => {
  return createMiddleware({
    name: 'ToolCallStatusMiddleware',
    wrapToolCall: async (request, handler) => {
      await aiEmployee.updateToolCallPending(request.toolCall.id);
      let doneResult;
      try {
        const result = await handler(request);
        doneResult = result;
        return result;
      } catch (e) {
        doneResult = { status: 'error', content: e.message };
        aiEmployee.logger.error(e);
        throw e;
      } finally {
        await aiEmployee.updateToolCallDone(request.toolCall.id, doneResult);
      }
    },
  });
};
