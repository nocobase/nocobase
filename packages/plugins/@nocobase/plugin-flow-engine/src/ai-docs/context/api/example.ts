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

export async function fetchUserProfile(ctx: FlowCtx) {
  const response = await ctx.api.request({
    method: 'get',
    url: '/users:get',
  });
  return response.data;
}

export async function updateUserProfile(ctx: FlowCtx, payload: Record<string, any>) {
  const response = await ctx.api.request({
    method: 'post',
    url: '/users:update',
    data: payload,
  });
  return response.data;
}
