/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

/**
 * Register an asynchronous property that resolves after I/O.
 */
export function registerAsyncValue(ctx: FlowCtx) {
  ctx.defineProperty('asyncValue', {
    async get() {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return `async-result-${uid()}`;
    },
  });
}

/**
 * Always await async properties; they cannot be read during render directly.
 */
export async function readAsyncValue(ctx: FlowCtx) {
  return await ctx.asyncValue;
}
