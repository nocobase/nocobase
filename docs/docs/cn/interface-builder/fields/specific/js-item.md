# JS Item

## 介绍

JS Item 用于表单中的“自定义项”（非字段绑定）。你可以用 JavaScript/JSX 渲染任意内容（提示、统计、预览、按钮等），并与表单、记录上下文交互，适合实时预览、说明提示、小型交互组件等场景。

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## 运行时上下文 API（常用）

- `ctx.element`：当前项的 DOM 容器（ElementProxy），支持 `innerHTML`、`querySelector`、`addEventListener` 等；
- `ctx.form`：AntD Form 实例，可 `getFieldValue / getFieldsValue / setFieldsValue / validateFields` 等；
- `ctx.blockModel`：所在表单块模型，可监听 `formValuesChange` 实现联动；
- `ctx.record` / `ctx.collection`：当前记录与集合元信息（部分场景可用）；
- `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.openView(viewUid, options)`：打开已配置的视图（抽屉/对话框/页面）；
- `ctx.message` / `ctx.notification`：全局提示与通知；
- `ctx.t()` / `ctx.i18n.t()`：国际化；
- `ctx.onRefReady(ctx.ref, cb)`：容器就绪后再渲染；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
- `ctx.render(vnode)`：渲染 React 元素/HTML/DOM 到默认容器 `ctx.element`；多次渲染会复用 Root，并覆盖容器现有内容。

## 编辑器与片段

- `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
- `Run`：直接运行当前代码，并将运行日志输出到底部 `Logs` 面板；支持 `console.log/info/warn/error` 与错误高亮定位。

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- 可结合 AI 员工生成/修改脚本：[AI 员工 · Nathan：前端工程师](/ai-employees/built-in-employee)

## 常见用法（精简示例）

### 1) 实时预览（读取表单值）

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) 打开视图（抽屉）

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) 加载外部库并渲染

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 注意事项

- 外部库加载建议使用可信 CDN，失败场景需做好兜底（如 `if (!lib) return;`）。
- 选择器建议优先使用 `class` 或 `[name=...]`，避免使用固定 `id`，防止多个区块/弹窗中重复 `id`。
- 事件清理：表单值频繁变化会触发多次渲染，绑定事件前应清理或去重（如先 `remove` 再 `add`，或 `{ once: true }`，或 `dataset` 标记防重复）。

## 相关文档

- [变量与上下文](/interface-builder/variables)
- [联动规则](/interface-builder/linkage-rule)
- [视图与弹窗](/interface-builder/actions/types/view)
