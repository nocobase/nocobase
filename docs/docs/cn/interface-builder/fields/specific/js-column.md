# JS Column

## 介绍

JS Column 用于表格中的“自定义列”，通过 JavaScript 渲染每一行的单元格内容。不绑定具体字段，适合衍生列、跨字段组合展示、状态徽章、按钮操作、远程数据汇总等场景。

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## 运行时上下文 API

JS Column 的每个单元格渲染时可使用以下上下文能力：

- `ctx.element`：当前单元格的 DOM 容器（ElementProxy），支持 `innerHTML`、`querySelector`、`addEventListener` 等；
- `ctx.record`：当前行记录对象（只读）；
- `ctx.recordIndex`：当前页内的行索引（从 0 开始，可能受分页影响）；
- `ctx.collection`：表格绑定集合的元信息（只读）；
- `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.openView(options)`：打开已配置的视图（弹窗/抽屉/页面）；
- `ctx.i18n.t()` / `ctx.t()`：国际化；
- `ctx.onRefReady(ctx.ref, cb)`：容器就绪后再渲染；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
- `ctx.render(vnode)`：渲染 React 元素/HTML/DOM 到默认容器 `ctx.element`（当前单元格），多次渲染会复用 Root，并覆盖容器现有内容。

## 编辑器与片段

JS Column 的脚本编辑器支持语法高亮、错误提示与内置代码片段（Snippets）。

- `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
- `Run`：直接运行当前代码，运行日志输出到底部 `Logs` 面板，支持 `console.log/info/warn/error` 与错误高亮定位。

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

可结合 AI 员工生成代码：

- [AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)

## 常见用法

### 1) 基础渲染（读取当前行记录）

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) 使用 JSX 渲染 React 组件

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) 单元格中打开弹窗/抽屉（查看/编辑）

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>查看</a>
);
```

### 4) 加载第三方库（AMD/UMD 或 ESM）

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## 注意事项

- 外部库加载建议使用可信 CDN，且为失败场景做好兜底（如 `if (!lib) return;`）。
- 选择器建议优先使用 `class` 或 `[name=...]`，避免使用固定 `id`，防止多个区块/弹窗中重复 `id`。
- 事件清理：表格行可能随分页/刷新动态变化，单元格会多次渲染。绑定事件前应清理或去重，避免重复触发。
- 性能建议：避免在每个单元格里重复加载大型库；应将库缓存到上层（如通过全局变量或表级变量）后复用。
