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

export function updateModelProps(ctx: FlowCtx, payload: Record<string, any>) {
  ctx.model.setProps(payload);
}

export function dispatchModelEvent(ctx: FlowCtx, event: string) {
  ctx.model.dispatchEvent(event);
}
