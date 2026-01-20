/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { uid } from '@formily/shared';

type FlowCtx = FlowModel['context'];

/**
 * Demonstrates that concurrent reads execute the async getter only once.
 */
export function registerConcurrentAsync(ctx: FlowCtx, callCounter: { value: number }) {
  ctx.defineProperty('concurrent', {
    async get() {
      callCounter.value += 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return `concurrent-result-${uid()}`;
    },
  });
}

export async function readConcurrently(ctx: FlowCtx) {
  const [first, second, third] = await Promise.all([ctx.concurrent, ctx.concurrent, ctx.concurrent]);
  return { first, second, third };
}
