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
    title: `{{t("ai.tools.getContextEnvs.title")}}`,
    about: `{{t("ai.tools.getContextEnvs.about")}}`,
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
