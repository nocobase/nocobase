---
title: "使用 importAsync 加载 Tabulator 表格库"
description: "通过 ctx.importAsync 动态导入 Tabulator ESM 模块并渲染数据表格。"
---

# 使用 importAsync 加载 Tabulator 表格库

```ts
// 1. 加载 Tabulator 的 CSS 样式
await ctx.loadCSS('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. 动态导入 Tabulator 模块
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. 创建表格容器并渲染
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. 初始化 Tabulator 表格
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Beijing' },
    { id: 2, name: 'Bob', age: 30, city: 'Shanghai' },
    { id: 3, name: 'Charlie', age: 28, city: 'Guangzhou' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: '姓名', field: 'name', width: 150 },
    { title: '年龄', field: 'age', width: 100 },
    { title: '城市', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. 可选：添加事件监听
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`点击了行：${rowData.name}`);
});
```
