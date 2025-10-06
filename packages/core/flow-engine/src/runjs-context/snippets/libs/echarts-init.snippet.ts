/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';
import { JSBlockRunJSContext } from '../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-echarts',
  label: 'Init ECharts',
  description: 'Load ECharts and render a simple chart inside the block',
  locales: {
    'zh-CN': {
      label: '初始化 ECharts',
      description: '加载 ECharts 并在区块内渲染示例图表',
    },
  },
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

export default snippet;
