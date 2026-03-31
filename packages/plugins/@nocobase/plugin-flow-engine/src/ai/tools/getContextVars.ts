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
You must explicitly resolve values via \`await ctx.getVar(path)\`.

The \`path\` supports progressive drilling (dot-notation).
When you only need a specific field, prefer a more precise path
instead of fetching the entire object, e.g.
\`await ctx.getVar('ctx.popup.record.id')\` rather than
\`await ctx.getVar('ctx.popup.record')\`.`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe(
          'Dot-notated variable path. Supports progressive drilling. Prefer the most specific path when only a subset of data is needed.',
        ),
      depth: z
        .number()
        .optional()
        .describe(
          'Maximum traversal depth when exploring variables. Default is 3. Use smaller depth when the target structure is known.',
        ),
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
