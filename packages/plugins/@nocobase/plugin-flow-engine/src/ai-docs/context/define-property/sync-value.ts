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
 * Define a synchronous property that reads immediately without awaiting.
 */
export function registerSyncValue(ctx: FlowCtx) {
  ctx.defineProperty('syncValue', {
    get: () => `sync-result-${uid()}`,
  });
}

/**
 * Reading the property twice returns the same cached value because getters run once.
 */
export function readSyncValue(ctx: FlowCtx) {
  const first = ctx.syncValue;
  const second = ctx.syncValue;
  return { first, second };
}
