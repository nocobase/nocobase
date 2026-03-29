/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMiddleware, ToolMessage } from 'langchain';
import { AIEmployee } from '../ai-employee';

export const skillToolBindingMiddleware = (
  aiEmployee: AIEmployee,
  options: {
    baseToolNames: string[];
  },
) => {
  const baseToolNames = new Set(options.baseToolNames ?? []);

  const getAllowedToolNames = async () => {
    const activatedSkillToolNames = await aiEmployee.getActivatedSkillToolNames();
    return new Set([...baseToolNames, ...activatedSkillToolNames]);
  };

  const filterRequestTools = async (tools: any[] = []) => {
    const allowedToolNames = await getAllowedToolNames();
    return tools.filter((tool: any) => {
      if (!tool || typeof tool !== 'object' || typeof tool.name !== 'string') {
        return true;
      }
      return allowedToolNames.has(tool.name);
    });
  };

  return createMiddleware({
    name: 'SkillToolBindingMiddleware',
    wrapModelCall: async (request, handler) => {
      const tools = await filterRequestTools(request.tools ?? []);
      return handler({
        ...request,
        tools,
      });
    },
    wrapToolCall: async (request, handler) => {
      const allowedToolNames = await getAllowedToolNames();
      if (!allowedToolNames.has(request.toolCall.name)) {
        return new ToolMessage({
          tool_call_id: request.toolCall.id,
          name: request.toolCall.name,
          status: 'error',
          content: 'Tool unavailable.',
        });
      }
      return handler(request);
    },
  });
};
