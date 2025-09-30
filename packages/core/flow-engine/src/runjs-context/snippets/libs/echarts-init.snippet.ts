/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['JSBlockRunJSContext'],
  prefix: 'sn-echarts',
  label: 'Init ECharts',
  content: `
ctx.element.style.height = '400px';
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) {
  ctx.message.error(ctx.t('Failed to load ECharts'));
} else {
  const chart = echarts.init(ctx.element);
  chart.setOption({ title: { text: ctx.t('ECharts') }, series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }] });
}
`,
};
