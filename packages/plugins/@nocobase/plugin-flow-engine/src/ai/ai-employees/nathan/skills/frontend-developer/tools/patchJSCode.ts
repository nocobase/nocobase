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
    title: `{{t("ai.tools.patchJSCode.title")}}`,
    about: `{{t("ai.tools.patchJSCode.about")}}`,
  },
  definition: {
    name: 'patchJSCode',
    description:
      'Apply a minimal unified diff patch to the code currently in the editor, then write the patched code back to the editor. Use this for adding, modifying, removing, fixing, or extending existing code. The tool reads the current editor code directly; only provide the patch. Keep patches surgical: include only changed lines plus the smallest necessary context, and do not include unchanged large blocks.',
    schema: z.object({
      patch: z
        .string()
        .describe(
          'Minimal unified diff patch to apply to the current editor code. Include only changed lines plus the smallest necessary context.',
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
      content: JSON.stringify({ success: false, message: 'Patch code failed: no result returned' }),
    };
  },
});
