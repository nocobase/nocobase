# JS Field

## 介绍

JS Field 用于在字段位置以 JavaScript 自定义渲染内容，常见于详情区块、表单的只读项、或表格列中的“其他自定义项”。适合进行个性化展示、衍生信息组合、状态徽章、富文本或图表等渲染。

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## 类型

- 只读型：用于不可编辑展示，读取 `ctx.value` 渲染输出。
- 可编辑型：用于自定义输入交互，提供 `ctx.getValue()`/`ctx.setValue(v)` 与容器事件 `js-field:value-change`，便于与表单值双向同步。

## 使用场景

- 只读型
  - 详情区块：展示计算结果、状态徽章、富文本片段、图表等只读内容；
  - 表格区块：作为“其他自定义列 > JS Field”用于只读展示（若需不绑定字段的列，请使用 JS Column）；

- 可编辑型
  - 表单区块（CreateForm/EditForm）：用于自定义输入控件或复合输入，随表单校验与提交；
  - 适合场景：外部库输入组件、富文本/代码编辑器、复杂动态组件等；

## 运行时上下文 API

JS Field 运行时代码可直接使用以下上下文能力：

- `ctx.element`：字段的 DOM 容器（ElementProxy），支持 `innerHTML`、`querySelector`、`addEventListener` 等；
- `ctx.value`：当前字段值（只读）；
- `ctx.record`：当前记录对象（只读）；
- `ctx.collection`：字段所属集合的元信息（只读）；
- `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.openView(options)`：打开已配置的视图（弹窗/抽屉/页面）；
- `ctx.i18n.t()` / `ctx.t()`：国际化；
- `ctx.onRefReady(ctx.ref, cb)`：容器就绪后再渲染；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
- `ctx.render(vnode)`：将 React 元素、HTML 字符串或 DOM 节点渲染到默认容器 `ctx.element`；重复渲染会复用 Root，并覆盖容器现有内容。

可编辑型（JSEditableField）特有：

- `ctx.getValue()`：获取当前表单值（优先使用表单状态，再回退到字段 props）。
- `ctx.setValue(v)`：设置表单值与字段 props，保持双向同步。
- 容器事件 `js-field:value-change`：外部值变化时触发，便于脚本更新输入显示。

## 编辑器与片段

JS Field 的脚本编辑器支持语法高亮、错误提示与内置代码片段（Snippets）。

- `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
- `Run`：直接运行当前代码，运行日志输出到底部 `Logs` 面板，支持 `console.log/info/warn/error` 与错误高亮定位。

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

可结合 AI 员工生成代码：

- [AI 员工 · Nathan：前端工程师](/ai-employees/built-in-employee)

## 常见用法

### 1) 基础渲染（读取字段值）

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) 使用 JSX 渲染 React 组件

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) 加载第三方库（AMD/UMD 或 ESM）

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) 点击打开弹窗/抽屉（openView）

```js
ctx.element.innerHTML = `<a class="open-detail">查看详情</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) 可编辑输入（JSEditableFieldModel）

```js
// 以 JSX 渲染一个简单输入，并同步表单值
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// 外部值变化时同步到输入（可选）
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## 注意事项

- 外部库加载建议使用可信 CDN，且为失败场景做好兜底（如 `if (!lib) return;`）。
- 选择器建议优先使用 `class` 或 `[name=...]`，避免使用固定 `id`，防止多个区块/弹窗中重复 `id`。
- 事件清理：字段可能因数据变化或视图切换而多次重渲染，绑定事件前应清理或去重，避免重复触发。可“先 remove 再 add”。
