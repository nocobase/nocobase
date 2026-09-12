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
    title: `{{t("ai.tools.getContextEnvs.title", { ns: "@nocobase/plugin-ai" })}}`,
    about: `{{t("ai.tools.getContextEnvs.about", { ns: "@nocobase/plugin-ai" })}}`,
  },
  definition: {
    name: 'getContextEnvs',
    description: 'Get current page/block/flow model metadata from context',
    schema: z.object({}),
  },
  invoke: async (ctx, _args, runtime) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === runtime.toolCallId) ?? {};
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
