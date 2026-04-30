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
    title: `{{t("ai.tools.writeJSCode.title")}}`,
    about: `{{t("ai.tools.writeJSCode.about")}}`,
  },
  definition: {
    name: 'writeJSCode',
    description:
      'Write complete JavaScript/JSX code into the current code editor. Use only when the editor is empty, the user asks for a complete replacement, or the change is a deliberate broad rewrite. For adding, modifying, fixing, or extending existing code, use patchJSCode instead.',
    schema: z.object({
      code: z
        .string()
        .describe(
          'The complete JavaScript/JSX code to write into the current editor. Do not use for small incremental changes to existing code.',
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
    }
    return {
      status: 'error',
      content: JSON.stringify({ success: false, message: 'Write code failed: no result returned' }),
    };
  },
});
