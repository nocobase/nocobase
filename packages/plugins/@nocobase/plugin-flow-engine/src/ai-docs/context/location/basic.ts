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

export function getLocation(ctx: FlowCtx) {
  return ctx.location;
}

export function setQuery(ctx: FlowCtx, params: Record<string, any>) {
  ctx.router.navigate({
    pathname: ctx.location.pathname,
    search: params,
  });
}
