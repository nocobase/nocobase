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
 * Disable cache so every read evaluates the getter again.
 */
export function registerNoCacheProperty(ctx: FlowCtx) {
  ctx.defineProperty('noCache', {
    cache: false,
    get: () => uid(),
  });
}

export function readNoCache(ctx: FlowCtx) {
  const first = ctx.noCache;
  const second = ctx.noCache;
  return { first, second };
}
