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
  prefix: 'sn-jsb-chartjs',
  label: 'Render Chart.js bar chart',
  description: 'Load Chart.js from CDN and render a basic bar chart inside the block',
  locales: {
    'zh-CN': {
      label: '渲染 Chart.js 柱状图',
      description: '通过 CDN 引入 Chart.js 并在区块中渲染基础柱状图',
    },
  },
  content: `
const wrapper = document.createElement('div');
wrapper.style.padding = '16px';
wrapper.style.background = '#fff';
wrapper.style.borderRadius = '8px';
wrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

const canvas = document.createElement('canvas');
canvas.width = 480;
canvas.height = 320;
wrapper.appendChild(canvas);
ctx.render(wrapper);

async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) {
    throw new Error('Chart.js is not available');
  }

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const data = [12, 18, 9, 15, 22];

  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: ctx.t('Daily visits'),
          data,
          backgroundColor: 'rgba(24, 144, 255, 0.6)',
          borderColor: '#1890ff',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: ctx.t('Weekly overview'),
        },
      },
    },
  });
}

renderChart().catch((error) => {
  console.error('[RunJS] failed to render chart', error);
  wrapper.innerHTML = '<div style="color:#c00;">' + (error?.message || ctx.t('Chart initialization failed')) + '</div>';
});
`,
};

export default snippet;
