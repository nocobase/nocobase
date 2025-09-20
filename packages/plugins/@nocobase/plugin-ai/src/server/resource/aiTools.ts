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

export const aiTools: ResourceOptions = {
  name: 'aiTools',
  actions: {
    list: async (ctx, next) => {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const tools = await plugin.aiManager.toolManager.listTools();
      ctx.body = tools;
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
      const tools = await plugin.aiManager.toolManager.listTools();
      const result = tools
        .flatMap(({ group, tools }) => tools.map((tool) => ({ ...tool, group })))
        .filter((tool) => bindingSkillNames.includes(tool.name));

      ctx.body = result;
      await next();
    },
  },
};

export default aiTools;
