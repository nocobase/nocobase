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

export async function renderChart(ctx: FlowCtx) {
  ctx.element.innerHTML = '';
  const container = document.createElement('div');
  container.style.height = '400px';
  ctx.element.appendChild(container);

  const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
  if (!echarts) {
    return;
  }

  const chart = echarts.init(container);
  const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
  const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);
  chart.setOption({
    title: { text: 'ECharts Example (Random Data)' },
    tooltip: {},
    xAxis: { data: categories },
    yAxis: {},
    series: [{ name: 'Sales', type: 'bar', data: randomData }],
  });

  window.addEventListener('resize', () => chart.resize());
}
