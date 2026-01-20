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

export async function confirmAction(ctx: FlowCtx) {
  const ok = await ctx.modal.confirm({
    title: 'Confirm action',
    content: 'Are you sure?',
  });
  return ok;
}

export async function infoDialog(ctx: FlowCtx, message: string) {
  await ctx.modal.info({
    title: 'Information',
    content: message,
  });
}
