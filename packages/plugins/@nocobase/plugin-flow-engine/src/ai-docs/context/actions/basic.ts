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

export async function runAction(ctx: FlowCtx, name: string, params?: Record<string, any>) {
  return ctx.runAction(name, params);
}

export function getActionDefinition(ctx: FlowCtx, name: string) {
  return ctx.getAction(name);
}

export function listActions(ctx: FlowCtx) {
  return Array.from(ctx.getActions().entries());
}
