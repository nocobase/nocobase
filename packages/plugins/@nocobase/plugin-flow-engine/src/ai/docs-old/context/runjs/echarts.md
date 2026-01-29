---
title: "Echarts"
description: "Render chart."
---

# Echarts

## Render Chart

Use this snippet to render chart.

```ts
const echarts = await ctx.requireAsync('echarts');
await ctx.runjs(
  `
    const chart = echarts.init(document.getElementById(domId));
    chart.setOption(option);
    return chart;
  `,
  { echarts, domId, option },
);
```
