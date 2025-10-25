# 自定义图表配置

在编辑器编写 JS，基于 `ctx.data` 返回完整的 ECharts `option`，适合多系列合并、复杂提示与动态样式。

![截图占位：Custom 编辑器概览](https://static-docs.nocobase.com/20251023232724.png)

## 数据上下文
- `ctx.data.objects`：对象数组（每行记录）
- `ctx.data.rows`：二维数组（含表头）
- `ctx.data.columns`：按列分组的二维数组

![截图占位：ctx.data.* 数据示意](https://static-docs.nocobase.com/20251023232724.png)

## 示例一：按月订单量折线图（rows）
```js
const rows = ctx.data.rows;           // [['month','orders_count'], ['2024-08', 123], ...]
const header = rows[0];
const monthIdx = header.indexOf('month');
const countIdx = header.indexOf('orders_count');
const months = rows.slice(1).map(r => r[monthIdx]);
const counts = rows.slice(1).map(r => r[countIdx]);

return {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value' },
  series: [{ type: 'line', name: '订单量', data: counts, smooth: true }],
  legend: { show: true }
};
```

![截图占位：折线图效果](https://static-docs.nocobase.com/20251023232724.png)

## 示例二：分类对比（objects，堆叠柱状）
```js
// 期望对象结构：[{ category: 'A', metric1: 10, metric2: 12 }, ...]
const data = ctx.data.objects;
const categories = data.map(d => d.category);
const m1 = data.map(d => d.metric1);
const m2 = data.map(d => d.metric2);

return {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: categories },
  yAxis: { type: 'value' },
  legend: { show: true },
  series: [
    { type: 'bar', name: '指标1', data: m1, stack: 'total' },
    { type: 'bar', name: '指标2', data: m2, stack: 'total' }
  ]
};
```

![截图占位：堆叠柱状图效果](https://static-docs.nocobase.com/20251023232724.png)

## 示例三：自定义 tooltip（formatter）
```js
const rows = ctx.data.rows;
const [header, ...body] = rows;
const monthIdx = header.indexOf('month');
const countIdx = header.indexOf('orders_count');

const months = body.map(r => r[monthIdx]);
const counts = body.map(r => r[countIdx]);

return {
  tooltip: {
    trigger: 'axis',
    formatter: (items) => {
      const p = items[0];
      return `月份：${p.axisValue}<br/>订单量：${p.data}`;
    }
  },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: counts }]
};
```

![截图占位：自定义 tooltip 效果](https://static-docs.nocobase.com/20251023232724.png)

## 预览与保存
- 点击“预览”更新图表以验证 JS 输出。
- 点击“保存/确定”持久化当前 JS；“取消”回到上次保存状态。

建议：
- 保持纯函数风格，仅根据 `ctx.data` 生成 `option`，避免副作用。
- 查询列名调整会影响索引，统一命名并在“查看数据”确认再修改代码。
- 数据量大时避免在 JS 中做复杂同步计算，必要时在查询阶段聚合。