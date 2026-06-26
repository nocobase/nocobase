/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import PluginAIServer from '../plugin';
import { AIManager } from '@nocobase/ai';
import type { Context } from '@nocobase/actions';

export const aiTools: ResourceOptions = {
  name: 'aiTools',
  actions: {
    list: async (ctx, next) => {
      const actionCtx = ctx as Context;
      const { toolsManager } = actionCtx.app.aiManager as AIManager;
      const { filter } = actionCtx.action.params;
      const tools = await toolsManager.listTools({
        ...filter,
        ctx: actionCtx,
      });
      actionCtx.body = tools.map((t) => ({
        ...t,
        definition: {
          name: t.definition.name,
          description: t.definition.description,
          schema: undefined,
        },
        invoke: undefined,
      }));
      await next();
    },
    listBinding: async (ctx, next) => {
      const actionCtx = ctx as Context;
      const { username } = actionCtx.action.params;
      const aiEmployee = await actionCtx.app.db.getRepository('aiEmployees').findOne({
        filter: {
          username,
        },
      });
      if (!aiEmployee) {
        return [];
      }

      const bindingToolNames = aiEmployee.skillSettings?.tools?.map((tool) => tool.name) ?? [];

      const plugin = actionCtx.app.pm.get('ai') as PluginAIServer;
      const tools = await plugin.ai.toolsManager.listTools({ ctx: actionCtx });
      const result = tools.filter(
        (tool) =>
          (tool.scope === 'GENERAL' && tool.from === 'loader') || bindingToolNames.includes(tool.definition.name),
      );

      actionCtx.body = result.map(({ introduction, definition }) => ({
        title: introduction?.title ?? definition.name,
        name: definition.name,
        description: introduction?.about ?? definition.description,
      }));
      await next();
    },
  },
};

export default aiTools;
