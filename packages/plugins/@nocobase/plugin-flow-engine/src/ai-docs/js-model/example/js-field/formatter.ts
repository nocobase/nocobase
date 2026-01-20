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

export function formatAmount(ctx: FlowCtx) {
  const price = Number(ctx.value ?? ctx.record?.price) || 0;
  const discount = Number(ctx.record?.discount || 0);
  const total = price * (1 - discount);
  const fmt = (n: number) => `¥${n.toFixed(2)}`;

  ctx.element.innerHTML = `
    <div>
      <strong>${fmt(total)}</strong>
      <span style="color:#999;margin-left:8px;">原价 ${fmt(price)}，折扣 ${(discount * 100).toFixed(0)}%</span>
    </div>
  `;
}
