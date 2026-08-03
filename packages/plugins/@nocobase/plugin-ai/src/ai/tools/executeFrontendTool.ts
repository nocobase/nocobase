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
import { EXECUTE_FRONTEND_TOOL_NAME, isFrontendToolInvokeResult } from '../../common/frontend-tools';
import { findCurrentFrontendTool, readFrontendToolResult } from '../../server/frontend-tools';
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'GENERAL',
  execution: 'frontend',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("Execute frontend tool", { ns: "${pkg.name}" })}}`,
    about: `{{t("Execute a frontend tool provided by the selected block.", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: EXECUTE_FRONTEND_TOOL_NAME,
    description:
      'Execute a frontend tool from the current frontendToolCatalog. Use loadFrontendTool first when you need its input schema. Never use a tool id that is not present in the current catalog.',
    schema: z.object({
      toolId: z.string().describe('The exact tool id from the current frontendToolCatalog.'),
      args: z
        .record(z.string(), z.unknown())
        .default({})
        .describe('Arguments that match the loaded frontend tool schema.'),
    }),
  },
  invoke: async (ctx, args, runtime) => {
    const tool = await findCurrentFrontendTool(ctx, args.toolId);
    if (!tool) {
      return {
        status: 'error',
        content: 'Frontend tool is unavailable in the current conversation.',
      };
    }
    const result = await readFrontendToolResult(ctx, runtime.toolCallId);
    if (!result?.provided) {
      return {
        status: 'error',
        content: 'Frontend tool did not return a result.',
      };
    }
    if (isFrontendToolInvokeResult(result.value)) {
      return result.value;
    }
    return {
      status: 'success',
      content: result.value,
    };
  },
});
