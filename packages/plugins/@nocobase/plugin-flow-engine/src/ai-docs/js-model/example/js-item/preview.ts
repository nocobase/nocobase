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

export function renderSummary(ctx: FlowCtx) {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const payable = total * (1 - Number(discount || 0));

  ctx.element.innerHTML = `
    <div style="padding:8px 12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;">
      <div style="font-weight:600;color:#389e0d;">预计实付：¥${payable.toFixed(2)}</div>
      <div style="color:#999">商品小计 ¥${total.toFixed(2)}，折扣 ${(Number(discount) * 100 || 0).toFixed(0)}%</div>
    </div>
  `;

  ctx.blockModel?.on?.('formValuesChange', () => renderSummary(ctx));
}
