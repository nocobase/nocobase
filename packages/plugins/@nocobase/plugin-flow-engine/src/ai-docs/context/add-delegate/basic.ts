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

export function attachDelegate(ctx: FlowCtx, delegate: FlowCtx) {
  ctx.addDelegate(delegate);
}

export function detachDelegate(ctx: FlowCtx, delegate: FlowCtx) {
  ctx.removeDelegate(delegate);
}

export function chainDelegates(root: FlowCtx, ...delegates: FlowCtx[]) {
  let current = root;
  for (const delegate of delegates) {
    current.addDelegate(delegate);
    current = delegate;
  }
}
