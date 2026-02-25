# JS Block 区块

## 介绍

JS Block 是一个高度灵活的“自定义渲染区块”，支持直接编写 JavaScript 脚本来生成界面、绑定事件、调用数据接口或集成第三方库。适用于内置区块难以覆盖的个性化可视化、临时试验与轻量扩展场景。

## 运行时上下文 API

JS Block 的运行时上下文已注入常用能力，可直接使用：

- `ctx.element`：区块的 DOM 容器（已做安全封装，ElementProxy），支持 `innerHTML`、`querySelector`、`addEventListener` 等；
- `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.openView`：打开已配置视图（弹窗/抽屉/页面）；
- `ctx.useResource(...)` + `ctx.resource`：以资源方式访问数据；
- `ctx.i18n.t()` / `ctx.t()`：内置国际化能力；
- `ctx.onRefReady(ctx.ref, cb)`：容器就绪后再渲染，避免时序问题；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
- `ctx.render(vnode)`：将 React 元素、HTML 字符串或 DOM 节点渲染到默认容器 `ctx.element`；多次调用会复用同一 React Root，并覆盖容器现有内容。

## 添加区块

- 可在页面或弹窗中添加 JS Block。
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## 编辑器与片段

JS Block 的脚本编辑器支持语法高亮、错误提示与内置代码片段（Snippets），可快速插入常见示例，如：渲染图表、绑定按钮事件、加载外部库、渲染 React/Vue 组件、时间轴、信息卡片等。

- `Snippets`：打开内置代码片段列表，可搜索并一键将选中片段插入到代码编辑区的当前光标位置。
- `Run`：直接运行当前编辑器中的代码，并将运行日志输出到底部 `Logs` 面板。支持显示 `console.log/info/warn/error`，错误会高亮并可定位到具体行列。

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

并且，编辑器右上角可直接唤起 AI 员工“前端工程师 · Nathan”，让他基于当前上下文帮你编写或修改脚本，一键“Apply to editor”应用到编辑器后再运行查看效果。详见：

- [AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)

## 运行环境与安全

- 容器：系统为脚本提供安全的 DOM 容器 `ctx.element`（ElementProxy），仅影响当前区块，不干扰页面其它区域。
- 沙箱：脚本在受控环境中运行，`window`/`document`/`navigator` 采用安全代理对象，常见 API 可用、风险行为受限。
- 重渲染：区块被隐藏后再显示会自动重渲染（避免初次挂载重复执行）。

## 常见用法（精简示例）

### 1) 渲染 React（JSX）

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) API 请求模板

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) 加载 ECharts 并渲染

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) 打开视图（抽屉）

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) 资源读取并渲染 JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## 注意事项

- 外部库加载建议使用可信 CDN。
- 选择器使用建议：优先使用 `class` 或 `[name=...]` 属性选择器；避免使用固定 `id`，以免在多个区块/弹窗中出现重复 `id` 导致样式或事件冲突。
- 事件清理：区块可能多次重渲染，绑定事件前应清理或去重，避免重复触发。可采用“先 remove 再 add”的方式，或一次性监听器，或加标记防重复。

## 相关文档

- [变量与上下文](/interface-builder/variables)
- [联动规则](/interface-builder/linkage-rule)
- [视图与弹窗](/interface-builder/actions/types/view)
