/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { SkillsManager } from '@nocobase/ai';

export const aiSkills: ResourceOptions = {
  name: 'aiSkills',
  actions: {
    list: async (ctx, next) => {
      const { skillsManager } = ctx.app.aiManager as { skillsManager: SkillsManager };
      const { filter } = ctx.action.params;
      const skills = await skillsManager.listSkills(filter || {});
      // Exclude content field
      ctx.body = skills.map(({ content, ...rest }) => rest);
      await next();
    },
  },
};

export default aiSkills;
