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
    title: `{{t("ai.tools.readJSCode.title")}}`,
    about: `{{t("ai.tools.readJSCode.about")}}`,
  },
  definition: {
    name: 'readJSCode',
    description:
      'Read the complete JavaScript/JSX code currently in the active editor. Use before complex patches, after patchJSCode fails, or whenever the current editor structure is uncertain. Do not use searchDocs to read editor code.',
    schema: z.object({}),
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
      content: JSON.stringify({ success: false, message: 'Read code failed: no result returned' }),
    };
  },
});
