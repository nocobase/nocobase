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

export function navigateToPost(ctx: FlowCtx, name: string) {
  ctx.route({
    path: '/posts/:name',
    params: { name },
  });
}

export function goHome(ctx: FlowCtx) {
  ctx.route({ pathname: '/' });
}
