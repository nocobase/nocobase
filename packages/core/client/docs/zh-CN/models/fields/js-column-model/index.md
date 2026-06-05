# JSColumnModel

用于表格中的“自定义列”，以 JavaScript 渲染单元格内容。适合表格汇总或者计算，或者请求远端关联数据展示等场景。
与普通字段列不同，JSColumnModel 不绑定具体字段值，你需要通过 `ctx.record` 自行读取当前行数据并渲染。

## 可用上下文（常用）
- `ctx.element`：ElementProxy（当前单元格容器）。
- `ctx.record`：当前行记录对象。
- `ctx.collection`：当前集合对象（可获取主键、字段信息）。
- `ctx.viewer`：视图控制器，支持 `drawer`、`dialog`、`popover`、`embed`。
- `ctx.api`：API 客户端，可在点击时发起请求。
- `ctx.t`：国际化函数。

说明：
- 表格逐行渲染时会为每行创建 fork 上下文，`ctx.record` 均指向当前行。

## 示例：状态徽标列
<code src="./demos/table.tsx"></code>

```js
const status = String(ctx.record?.status ?? '').toLowerCase();
const color = status === 'done' ? '#52c41a' : status === 'pending' ? '#faad14' : '#ff4d4f';
const text = status || 'unknown';

ctx.element.innerHTML = `
  <span style="display:inline-flex;align-items:center;gap:6px;">
    <i style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></i>
    <span style="color:${color};text-transform:capitalize;">${text}</span>
  </span>
`;
```

## 示例：点击打开抽屉查看详情（扩展性示例）
<code src="./demos/table-drawer.tsx"></code>
见上方 Demo 中 `ctx.viewer.drawer` 的用法。

```js
// 简单 JSON 预览按钮
ctx.element.innerHTML = `
  <a href="javascript:;" style="color:#1677ff;">查看</a>
`;

ctx.element.querySelector('a')?.addEventListener('click', async () => {
  const pk = ctx.collection?.getFilterByTK?.(ctx.record); // 当前行主键（若集合可推断）
  await ctx.viewer.drawer({
    width: '56%',
    content: `
      <div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <h3 style="margin:0 0 12px;">行数据预览（#${pk ?? ctx.recordIndex}）</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;">${JSON.stringify(ctx.record, null, 2)}</pre>
      </div>
    `,
  });
});
```

## 示例：组合多字段为一列的展示
<code src="./demos/table-combine.tsx"></code>
将多个字段合并为单列显示（如 “姓名（部门） - 职级”）：

```js
const name = ctx.record?.name ?? '';
const dept = ctx.record?.department?.name ?? '';
const level = ctx.record?.level ?? '';

ctx.element.innerHTML = `
  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
    <strong>${name}</strong>
    <span style="color:#999">（${dept}）</span>
    <span style="color:#999"> - ${level}</span>
  </div>
`;
```

## 进阶提示
- 可通过 `ctx.api` 请求后端，动态刷新 `ctx.element` 内容；
- 对于“绑定字段值”的场景，请使用JS字段列，JSColumn 适合完全自定义展示与行为, 例如跨字段的汇总等场景。
- 可用 `ctx.openView` 做跨区块跨页面联动，可参考 JSFieldModel 文档示例。
