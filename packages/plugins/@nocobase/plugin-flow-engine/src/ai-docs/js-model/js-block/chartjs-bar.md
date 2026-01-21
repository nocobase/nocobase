---
title: "Render Chart.js bar chart"
description: "Load Chart.js from CDN and render a basic bar chart inside the block."
---

# Render Chart.js bar chart

Load Chart.js from CDN and render a basic bar chart inside the block

```ts
const wrapper = document.createElement('div');
wrapper.style.padding = '16px';
wrapper.style.background = '#fff';
wrapper.style.borderRadius = '8px';
wrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

const canvas = document.createElement('canvas');
canvas.width = 480;
canvas.height = 320;
wrapper.appendChild(canvas);
ctx.element.replaceChildren(wrapper);

async function renderChart() {
  const loaded = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
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
```
