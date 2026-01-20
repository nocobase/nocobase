/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

/**
 * `observable.ref` exposes a `.value` field that can be reassigned.
 */
export function registerObservableRef(ctx: FlowCtx) {
  ctx.defineProperty('refValue', {
    observable: true,
    get: () => observable.ref(uid()),
  });
}

/**
 * `observable.box` exposes `.get()`/`.set()` helpers and observes nested data.
 */
export function registerObservableBox(ctx: FlowCtx) {
  ctx.defineProperty('boxValue', {
    observable: true,
    get: () => observable.box({ id: uid(), status: 'pending' }),
  });
}

export function mutateRef(ctx: FlowCtx) {
  const before = ctx.refValue.value;
  ctx.refValue.value = uid();
  const after = ctx.refValue.value;
  return { before, after };
}

export function mutateBox(ctx: FlowCtx) {
  const before = ctx.boxValue.get();
  ctx.boxValue.set({ ...before, status: 'done' });
  const after = ctx.boxValue.get();
  return { before, after };
}
