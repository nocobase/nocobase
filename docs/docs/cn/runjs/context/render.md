# ctx.render()

将 React 元素、HTML 字符串或 DOM 节点渲染到指定容器中。不传 `container` 时默认渲染到 `ctx.element`，并自动继承应用的 ConfigProvider、主题等上下文。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 渲染区块自定义内容（图表、列表、卡片等） |
| **JSField / JSItem / JSColumn** | 渲染可编辑字段或表格列的自定义展示 |
| **详情区块** | 自定义详情页字段的展示形式 |

> 注意：`ctx.render()` 需要渲染容器。若不传 `container` 且 `ctx.element` 不存在（如无 UI 的纯逻辑场景），会抛出错误。

## 类型定义

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | 要渲染的内容 |
| `container` | `Element` \| `DocumentFragment`（可选） | 渲染目标容器，默认 `ctx.element` |

**返回值**：

- 渲染 **React 元素** 时：返回 `ReactDOMClient.Root`，便于后续调用 `root.render()` 更新
- 渲染 **HTML 字符串** 或 **DOM 节点** 时：返回 `null`

## vnode 类型说明

| 类型 | 行为 |
|------|------|
| `React.ReactElement`（JSX） | 使用 React 的 `createRoot` 渲染，具备完整 React 能力，自动继承应用上下文 |
| `string` | 经 DOMPurify 清洗后设置容器的 `innerHTML`，会先卸载已有 React 根 |
| `Node`（Element、Text 等） | 清空容器后 `appendChild` 追加，会先卸载已有 React 根 |
| `DocumentFragment` | 片段子节点追加到容器，会先卸载已有 React 根 |

## 示例

### 渲染 React 元素（JSX）

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('标题')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('点击了'))}>
      {ctx.t('按钮')}
    </Button>
  </Card>
);
```

### 渲染 HTML 字符串

```ts
ctx.render('<h1>Hello World</h1>');

// 结合 ctx.t 做国际化
ctx.render('<div style="padding:16px">' + ctx.t('内容') + '</div>');

// 条件渲染
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### 渲染 DOM 节点

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// 先渲染空容器，再交给第三方库（如 ECharts）初始化
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### 指定自定义容器

```ts
// 渲染到指定 DOM 元素
const customEl = document.getElementById('my-container');
ctx.render(<div>内容</div>, customEl);
```

### 多次调用会替换内容

```ts
// 第二次调用会替换容器内已有内容
ctx.render(<div>第一次</div>);
ctx.render(<div>第二次</div>);  // 仅显示「第二次」
```

## 注意事项

- **多次调用会替换**：每次 `ctx.render()` 会替换容器内已有内容，不会追加。
- **HTML 字符串安全**：传入的 HTML 会经 DOMPurify 清洗，降低 XSS 风险，但仍建议避免拼接不可信用户输入。
- **不要直接操作 ctx.element**：`ctx.element.innerHTML` 已废弃，应统一使用 `ctx.render()`。
- **无容器时需传 container**：在 `ctx.element` 为 `undefined` 的场景（如 `ctx.importAsync` 加载的模块内），需显式传入 `container`。

## 相关

- [ctx.element](./element.md) - 默认渲染容器，`ctx.render()` 未传 container 时使用
- [ctx.libs](./libs.md) - React、antd 等内置库，用于 JSX 渲染
- [ctx.importAsync()](./import-async.md) - 按需加载外部 React/组件库后配合 `ctx.render()` 使用
