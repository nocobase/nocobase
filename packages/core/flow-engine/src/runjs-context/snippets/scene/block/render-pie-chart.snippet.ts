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
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.element.replaceChildren(container);

try {
  // Fetch users with roles
  const res = await ctx.api.request({
    url: 'users:list',
    method: 'get',
    params: {
      pageSize: 100,
      appends: ['roles'],
    },
  });

  const records = res?.data?.data || [];

  // Group users by role name
  const roleCount = new Map();
  records.forEach((user) => {
    const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [{ name: ctx.t('No role') }];
    roles.forEach((role) => {
      const key = role?.name || ctx.t('Unknown');
      roleCount.set(key, (roleCount.get(key) || 0) + 1);
    });
  });

  const chartData = Array.from(roleCount.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  if (!chartData.length) {
    container.innerHTML = '<div style="padding:16px;color:#999;">' + ctx.t('No users found') + '</div>';
    return;
  }

  // Load ECharts and render
  const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
  const chart = echarts.init(container);

  chart.setOption({
    title: { text: ctx.t('User Roles'), left: 'center' },
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
  chart.resize();

  if (ctx.element.__echartsResize) {
    window.removeEventListener('resize', ctx.element.__echartsResize);
  }
  window.addEventListener('resize', resize);
  ctx.element.__echartsResize = resize;
} catch (e) {
  container.remove?.();
  if (ctx.element.__echartsResize) {
    window.removeEventListener('resize', ctx.element.__echartsResize);
    ctx.element.__echartsResize = undefined;
  }
  ctx.element.innerHTML = '<div style="padding:16px;color:red;">' +
    ctx.t('Failed to load chart: {{msg}}', { msg: String(e?.message || e) }) +
    '</div>';
}
`,
};

export default snippet;
