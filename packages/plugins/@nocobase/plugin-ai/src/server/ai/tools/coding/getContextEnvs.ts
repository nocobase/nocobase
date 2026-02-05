/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { definedTools } from '@nocobase/ai';
import { z } from 'zod';

export default definedTools({
  scope: 'SPECIFIED',
  execution: 'frontend',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Get context environment")}}',
    about: '{{t("Get current page/block/flow model metadata from context")}}',
  },
  definition: {
    name: 'getContextEnvs',
    description: 'Get current page/block/flow model metadata from context',
    schema: z.object({}),
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
