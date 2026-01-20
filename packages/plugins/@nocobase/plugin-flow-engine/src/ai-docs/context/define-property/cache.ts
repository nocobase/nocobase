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
 * Cached properties execute the getter once and reuse the stored value.
 */
export function registerCachedProperty(ctx: FlowCtx) {
  ctx.defineProperty('cached', {
    get: () => uid(),
    // cache defaults to true
  });
}

export function readCachedProperty(ctx: FlowCtx) {
  const first = ctx.cached;
  const second = ctx.cached;
  return { first, second };
}
