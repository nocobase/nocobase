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
 * Clear cache manually when data changes externally.
 */
export function registerManualCache(ctx: FlowCtx) {
  ctx.defineProperty('cached', {
    get: () => uid(),
  });
}

export function refreshCache(ctx: FlowCtx) {
  const before = ctx.cached;
  ctx.removeCache('cached');
  const after = ctx.cached;
  return { before, after };
}
