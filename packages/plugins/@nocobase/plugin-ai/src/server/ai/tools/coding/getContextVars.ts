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
  scope: 'SPECIFIED',
  execution: 'frontend',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Get context variables")}}',
    about:
      '{{t("Available variables from context, the actual value should be got via `await ctx.getVar()`, e.g. `await ctx.getVar(\'ctx.popup.record\')`")}}',
  },
  definition: {
    name: 'getContextVars',
    description:
      "Available variables from context, the actual value should be got via `await ctx.getVar()`, e.g. `await ctx.getVar('ctx.popup.record')`",
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
