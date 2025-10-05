/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-echarts-random',
  label: 'ECharts random data',
  description: 'Render an ECharts bar chart with random data and responsive resize',
  locales: {
    'zh-CN': {
      label: 'ECharts 随机数据示例',
      description: '渲染带随机数据的 ECharts 柱状图并支持窗口自适应',
    },
  },
  content: `
ctx.element.style.height = '400px';
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) {
  ctx.message.error?.(ctx.t('Failed to load ECharts'));
  return;
}

const chart = echarts.init(ctx.element);
const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);

chart.setOption({
  title: { text: ctx.t('ECharts Example (Random Data)') },
  tooltip: {},
  xAxis: { data: categories },
  yAxis: {},
  series: [{ name: ctx.t('Sales'), type: 'bar', data: randomData }],
});

const resize = () => chart.resize();
resize();
window.addEventListener('resize', resize);

ctx.__dispose = () => {
  window.removeEventListener('resize', resize);
  chart.dispose?.();
};
`,
};

export default snippet;
