/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export async function resolveAsync(ctx: FlowCtx) {
  ctx.defineProperty('asyncValue', {
    get: async () => ({ foo: 'bar' }),
  });
  return ctx.resolveJsonTemplate('{{ctx.asyncValue.foo}}');
}
