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

export async function renderChart(ctx: FlowCtx, domId: string, option: Record<string, any>) {
  const echarts = await ctx.requireAsync('echarts');
  await ctx.runjs(
    `
      const chart = echarts.init(document.getElementById(domId));
      chart.setOption(option);
      return chart;
    `,
    { echarts, domId, option },
  );
}
