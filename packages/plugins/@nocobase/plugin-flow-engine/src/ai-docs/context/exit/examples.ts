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

export async function confirmAndExit(ctx: FlowCtx) {
  const confirmed = await ctx.modal.confirm({
    title: 'Confirm deletion',
    content: 'Delete this record?',
  });

  if (!confirmed) {
    ctx.message.info({ content: 'Deletion cancelled' });
    ctx.exit();
    return;
  }

  ctx.message.success({ content: 'Deletion confirmed' });
}
