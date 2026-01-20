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
 * `once: true` keeps the first definition and ignores later calls.
 */
export function registerOnceProperty(ctx: FlowCtx) {
  ctx.defineProperty('once', {
    once: true,
    get: () => `initial-${uid()}`,
  });

  // This call is ignored because the property was already defined with once: true
  ctx.defineProperty('once', {
    get: () => `should-not-override-${uid()}`,
  });
}

/**
 * Without `once`, the later definition overrides the earlier one.
 */
export function registerOverrideProperty(ctx: FlowCtx) {
  ctx.defineProperty('override', {
    get: () => `first-${uid()}`,
  });
  ctx.defineProperty('override', {
    get: () => `second-${uid()}`,
  });
}
