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
    title: `{{t("ai.tools.lintAndTestJS.title", { ns: "@nocobase/plugin-ai" })}}`,
    about: `{{t("ai.tools.lintAndTestJS.about", { ns: "@nocobase/plugin-ai" })}}`,
  },
  definition: {
    name: 'lintAndTestJS',
    description:
      'Lint, sandbox-check and trial-run the current editor JavaScript/JSX code. Returns success/failure with diagnostics. Call this tool after writeJSCode or patchJSCode before final response.',
    schema: z.object({
      code: z
        .string()
        .optional()
        .describe(
          'Optional JavaScript/JSX code to preview and validate. Omit this to validate the current editor code.',
        ),
    }),
  },

  invoke: async (ctx, _args, runtime) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item: { id: string }) => item.id === runtime.toolCallId) ?? {};
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
