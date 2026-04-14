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
    toolCatalog: any[];
  },
) => {
  const baseToolNames = new Set(options.baseToolNames ?? []);
  const toolCatalog = options.toolCatalog ?? [];

  const getAllowedToolNames = async () => {
    const activatedSkillToolNames = await aiEmployee.getActivatedSkillToolNames();
    return new Set([...baseToolNames, ...activatedSkillToolNames]);
  };

  const getToolName = (tool: any) => {
    if (!tool || typeof tool !== 'object') {
      return null;
    }
    if (typeof tool.name === 'string') {
      return tool.name;
    }
    if (typeof tool.function?.name === 'string') {
      return tool.function.name;
    }
    return null;
  };

  const filterRequestTools = async (tools: any[] = []) => {
    const allowedToolNames = await getAllowedToolNames();
    const result = new Map<string, any>();

    for (const tool of tools) {
      const name = getToolName(tool);
      if (!name) {
        continue;
      }
      if (allowedToolNames.has(name)) {
        result.set(name, tool);
      }
    }

    for (const tool of toolCatalog) {
      const name = getToolName(tool);
      if (name && allowedToolNames.has(name) && !result.has(name)) {
        result.set(name, tool);
      }
    }

    return Array.from(result.values());
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
