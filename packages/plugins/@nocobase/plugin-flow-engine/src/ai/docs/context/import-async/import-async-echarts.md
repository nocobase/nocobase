---
title: "Load ECharts with importAsync"
description: "Dynamically import ECharts ESM modules via ctx.importAsync and render charts."
---

# Load ECharts with importAsync

```js
// 1. Dynamically import the ECharts module
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Create a chart container and render it
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Initialize the ECharts instance
const chart = echarts.init(chartEl);

// 4. Configure chart options
const option = {
  title: {
    text: 'Sales Overview',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Sales', 'Profit'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Sales',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Profit',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Set options and render the chart
chart.setOption(option);

// 6. Optional: responsive resize
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optional: add event listeners
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```
