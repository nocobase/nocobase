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

export async function recordAction(ctx: FlowCtx) {
  if (!ctx.record) {
    ctx.message?.error?.('No record loaded');
    return;
  }

  await ctx.viewer?.drawer?.({
    width: '40%',
    content: `
      <div style="padding:16px;">
        <h3>Record preview</h3>
        <pre>${JSON.stringify(ctx.record, null, 2)}</pre>
      </div>
    `,
  });
}
