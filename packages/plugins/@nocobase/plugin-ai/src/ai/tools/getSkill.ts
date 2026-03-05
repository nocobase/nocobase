/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Load specific SKILLS")}}',
    about: '{{t("Loading content of the specific SKILLS")}}',
  },
  definition: {
    name: 'getSkill',
    description: 'Get the content and related tools for a specified skill.',
    schema: z.object({
      skillName: z.string().describe('Name of skill to load'),
    }),
  },
  invoke: async (ctx, args, id) => {
    const target = await ctx.app.aiManager.skillsManager.getSkills(args.skillName);
    if (!target) {
      return {
        status: 'error',
        content: {
          message: 'Skill not found',
        },
      };
    }

    return {
      status: 'success',
      content: {
        skillName: target.name,
        skillContent: target.content,
        activatedTools: target.tools,
      },
    };
  },
});
