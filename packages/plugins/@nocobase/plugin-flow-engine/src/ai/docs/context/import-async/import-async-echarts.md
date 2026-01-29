---
title: "使用 importAsync 加载 ECharts 图表库"
description: "通过 ctx.importAsync 动态导入 ECharts ESM 模块并渲染数据可视化图表。"
---

# 使用 importAsync 加载 ECharts 图表库

```js
// 1. 动态导入 ECharts 模块
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. 创建图表容器并渲染
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. 初始化 ECharts 实例
const chart = echarts.init(chartEl);

// 4. 配置图表选项
const option = {
  title: {
    text: '销售数据统计',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['销售额', '利润'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '销售额',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: '利润',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. 设置配置项并渲染图表
chart.setOption(option);

// 6. 可选：响应式调整（窗口大小变化时）
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. 可选：添加事件监听
chart.on('click', (params) => {
  ctx.message.info(`点击了 ${params.seriesName} 的 ${params.name}，值为 ${params.value}`);
});
```
