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
 * Observable properties notify every observer when the cached value is refreshed.
 */
export function registerObservable(ctx: FlowCtx) {
  ctx.defineProperty('observableValue', {
    observable: true,
    get: () => uid(),
  });
}

export function refreshObservable(ctx: FlowCtx) {
  const before = ctx.observableValue;
  ctx.removeCache('observableValue');
  const after = ctx.observableValue;
  return { before, after };
}
