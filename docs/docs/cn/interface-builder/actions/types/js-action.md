# JS Action

## 介绍

JS Action 用于按钮点击时执行 JavaScript，自定义任意业务行为。可用于表单工具栏、表格工具栏（集合级）、表格行（记录级）等位置，实现校验、提示、接口调用、打开弹窗/抽屉、刷新数据等操作。

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## 运行时上下文 API（常用）

- `ctx.api.request(options)`：发起 HTTP 请求；
- `ctx.openView(viewUid, options)`：打开已配置的视图（抽屉/对话框/页面）；
- `ctx.message` / `ctx.notification`：全局提示与通知；
- `ctx.t()` / `ctx.i18n.t()`：国际化；
- `ctx.resource`：集合级上下文的数据资源（如表格工具栏，含 `getSelectedRows()`、`refresh()` 等）；
- `ctx.record`：记录级上下文的当前行记录（如表格行按钮）；
- `ctx.form`：表单级上下文的 AntD Form 实例（如表单工具栏按钮）；
- `ctx.collection`：当前集合元信息；
- 代码编辑器支持 `Snippets` 片段与 `Run` 预运行（见下）。


- `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。

> 实际可用变量会随按钮所在位置不同而有所差异，以上为常见能力概览。

## 编辑器与片段

- `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
- `Run`：直接运行当前代码，并将运行日志输出到底部 `Logs` 面板；支持 `console.log/info/warn/error` 与错误高亮定位。

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- 可结合 AI 员工生成/修改脚本：[AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)

## 常见用法（精简示例）

### 1) 接口请求与提示

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) 集合按钮：校验选择并处理

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: 执行业务逻辑…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) 记录按钮：读取当前行记录

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) 打开视图（抽屉/对话框）

```js
const popupUid = ctx.model.uid + '-open'; // 绑定到当前按钮，保持稳定
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) 提交后刷新数据

```js
// 通用刷新：优先表格/列表资源，其次表单所在区块资源
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## 注意事项

- 行为幂等：避免重复点击导致的多次提交，可在逻辑中加状态开关或禁用按钮。
- 错误处理：为接口调用添加 try/catch 并给出用户提示。
- 视图联动：通过 `ctx.openView` 打开弹窗/抽屉时，建议显式传参，必要时在提交成功后主动刷新父级资源。

## 相关文档

- [变量与上下文](/interface-builder/variables)
- [联动规则](/interface-builder/linkage-rule)
- [视图与弹窗](/interface-builder/actions/types/view)
