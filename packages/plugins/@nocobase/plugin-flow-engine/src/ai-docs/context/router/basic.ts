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

export function navigateTo(ctx: FlowCtx, pathname: string) {
  ctx.router.navigate(pathname);
}

export function replaceRoute(ctx: FlowCtx, pathname: string) {
  ctx.router.replace(pathname);
}

export function currentLocation(ctx: FlowCtx) {
  return ctx.router.location;
}
