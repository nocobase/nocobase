/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-pie-chart',
  label: 'Render pie chart from API data',
  description: 'Fetch data from API and render as a pie chart using ECharts',
  locales: {
    'zh-CN': {
      label: '渲染饼图（API 数据）',
      description: '从 API 获取数据并使用 ECharts 渲染为饼图',
    },
  },
  content: `
ctx.element.style.height = '400px';

try {
  // Fetch data from API
  const res = await ctx.api.request({
    url: 'your-collection:list',
    method: 'get',
    params: { pageSize: 100 },
  });

  const records = res?.data?.data || [];

  // Group by status and count
  const statusCount = records.reduce((acc, item) => {
    const status = item.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Prepare chart data
  const chartData = Object.entries(statusCount).map(([name, value]) => ({
    name: ctx.t(name),
    value,
  }));

  // Load ECharts and render
  const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
  const chart = echarts.init(ctx.element);

  chart.setOption({
    title: { text: ctx.t('Status Distribution'), left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: ctx.t('Count'),
      type: 'pie',
      radius: '50%',
      data: chartData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    }],
  });

  const resize = () => chart.resize();
  window.addEventListener('resize', resize);

  ctx.__dispose = () => {
    window.removeEventListener('resize', resize);
    chart.dispose?.();
  };
} catch (e) {
  ctx.element.innerHTML = '<div style="padding:16px;color:red;">' +
    ctx.t('Failed to load chart: {{msg}}', { msg: String(e?.message || e) }) +
    '</div>';
}
`,
};

export default snippet;
