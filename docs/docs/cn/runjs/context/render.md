# ctx.render

将 React 元素、HTML 字符串或 DOM 节点渲染到 `ctx.element` 容器中。

## 类型定义

```typescript
render(
  vnode: React.ReactElement | Node | DocumentFragment | string
): ReactDOMClient.Root | null
```

## 参数

- **vnode**：要渲染的内容
  - `React.ReactElement`：React 元素（JSX），具备完整 React 能力
  - `Node`：DOM 节点，直接追加到容器
  - `DocumentFragment`：片段的子节点会追加到容器
  - `string`：HTML 字符串，会设置容器的 `innerHTML`

## 返回值

- 渲染 React 元素时：返回 `ReactDOMClient.Root` 实例，便于后续更新
- 渲染 HTML 字符串或 DOM 节点时：返回 `null`

## 说明

- 内容会渲染到 `ctx.element` 容器内
- 多次调用 `ctx.render()` 会替换容器内已有内容
- 渲染 React 元素时使用 React 的 `createRoot` API，并自动继承应用上下文
- 渲染 HTML 字符串时，会先卸载容器内已有的 React 根

## 示例

### 渲染 JSX

```jsx
ctx.render(<button>Button</button>);
```

### 渲染 DOM 节点

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### 渲染 HTML 字符串

```js
ctx.render('<h1>Hello World</h1>');
```

### 使用内置 React 与组件库

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### 使用外部 React 与组件库

通过 `ctx.importAsync()` 按需加载指定版本：

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

适合需要特定版本或第三方组件的场景。

### 不推荐：直接操作 ctx.element

已废弃的用法：

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

推荐使用 `ctx.render()`：

```js
ctx.render(<h1>Hello World</h1>);
```
