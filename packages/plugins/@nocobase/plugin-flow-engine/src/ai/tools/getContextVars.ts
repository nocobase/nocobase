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
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  execution: 'frontend',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.getContextVars.title")}}`,
    about: `{{t("ai.tools.getContextVars.about")}}`,
  },
  definition: {
    name: 'getContextVars',
    description: `Available variables from context.
Variables are references only and do not contain actual values.
You must retrieve the real value explicitly via \`await ctx.getVar(path)\`,
for example: \`await ctx.getVar('ctx.popup.record')\`.`,
    schema: z.object({
      path: z.string().optional().describe('Variable path for progressive disclosure'),
      depth: z.number().optional().describe('Max depth for variable traversal, default 3'),
    }),
  },
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '{}',
      };
    }
  },
});
