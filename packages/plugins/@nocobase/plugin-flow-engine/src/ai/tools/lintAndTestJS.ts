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
    title: `{{t("ai.tools.lintAndTestJS.title")}}`,
    about: `{{t("ai.tools.lintAndTestJS.about")}}`,
  },
  definition: {
    name: 'lintAndTestJS',
    description:
      'Lint, sandbox-check and trial-run a JavaScript snippet. Returns success/failure with diagnostics. Call this tool BEFORE outputting final code to verify it works.',
    schema: z.object({
      code: z.string().describe('The JavaScript/JSX code to preview and validate'),
    }),
  },

  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item: { id: string }) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: result.status ?? 'error',
        content: JSON.stringify(result.content ?? {}),
      };
    } else {
      return {
        status: 'error',
        content: JSON.stringify({ success: false, message: 'Preview execution failed: no result returned' }),
      };
    }
  },
});
