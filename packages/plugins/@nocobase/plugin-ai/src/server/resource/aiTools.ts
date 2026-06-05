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

export const aiTools: ResourceOptions = {
  name: 'aiTools',
  actions: {
    list: async (ctx, next) => {
      const { toolsManager } = ctx.app.aiManager as AIManager;
      const { filter } = ctx.action.params;
      const tools = await toolsManager.listTools(filter);
      ctx.body = tools.map((t) => ({
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
      const { username } = ctx.action.params;
      const aiEmployee = await ctx.app.db.getRepository('aiEmployees').findOne({
        filter: {
          username,
        },
      });
      if (!aiEmployee) {
        return [];
      }
      if (!aiEmployee.skillSettings?.skills?.length) {
        return [];
      }
      const bindingSkillNames = aiEmployee.skillSettings.skills.map((skill) => skill.name);

      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const tools = await plugin.ai.toolsManager.listTools();
      const result = tools.filter(
        (tool) => tool.scope === 'GENERAL' || bindingSkillNames.includes(tool.definition.name),
      );

      ctx.body = result.map(({ introduction, definition }) => ({
        title: introduction?.title ?? definition.name,
        name: definition.name,
      }));
      await next();
    },
  },
};

export default aiTools;
