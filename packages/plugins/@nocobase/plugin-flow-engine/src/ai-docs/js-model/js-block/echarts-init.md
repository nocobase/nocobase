---
title: "Init ECharts"
description: "Load ECharts and render a simple chart inside the block."
---

# Init ECharts

Load ECharts and render a simple chart inside the block

```ts
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) {
  throw new Error('ECharts library not loaded');
}

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('ECharts') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});

chart.resize();
```
