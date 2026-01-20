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

export function attachOpenView(ctx: FlowCtx, targetViewId: string) {
  ctx.element.innerHTML = '<a class="js-field-open-view" href="#">Open details</a>';
  ctx.element.querySelector('.js-field-open-view')?.addEventListener('click', async (event) => {
    event.preventDefault();
    await ctx.openView(targetViewId, {
      from: 'JSFieldModel',
      recordId: ctx.record?.id,
    });
  });
}
