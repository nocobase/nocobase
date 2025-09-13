---
title: JS Actions 常用场景
---


## 选择校验 + 批量刷新

```js
const rows = ctx.selectedRows || ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  return ctx.message.warning('请选择数据');
}
await ctx.resource?.refresh?.();
ctx.message.success('已刷新');
```

## 批量提交（伪代码）

```js
const rows = ctx.selectedRows || [];
if (!rows.length) return ctx.message.warning('请选择数据');

for (const r of rows) {
  // 这里可以调用 API 或 resource 子方法
  // await ctx.api.request('/xxx', { method: 'POST', data: r });
}
ctx.message.success('批量提交完成');
```

## 行内按钮：读取当前记录主键

```js
if (!ctx.record) return ctx.message.error('无记录');
ctx.message.success('当前ID：' + (ctx.filterByTk ?? ctx.record?.id));
```

## 打开视图（示意）

```js
await ctx.runAction('openView', {
  // 具体参数参考 openViewFlow
});
```

## 在线示例

表格（集合级 + 行内记录级）

<code src="./demos/table-collection-js-action.tsx"></code>
<code src="./demos/details-record-js-action.tsx"></code>

表单（表单工具栏）

<code src="./demos/form-js-action.tsx"></code>
