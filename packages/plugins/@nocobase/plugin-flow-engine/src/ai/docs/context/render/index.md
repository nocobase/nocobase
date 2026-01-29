# ctx.render()

将 React 元素、HTML 字符串或 DOM 节点渲染到 `ctx.element` 容器中。

## 类型定义

```typescript
render(
  vnode: React.ReactElement | Node | DocumentFragment | string
): ReactDOMClient.Root | null
```

## 参数

- **vnode**: 要渲染的内容
  - `React.ReactElement`: React 元素（JSX），支持完整的 React 功能
  - `Node`: DOM 节点，会直接追加到容器中
  - `DocumentFragment`: 文档片段，会将其子节点追加到容器中
  - `string`: HTML 字符串，会设置容器的 `innerHTML`

## 返回值

- 渲染 React 元素时：返回 `ReactDOMClient.Root` 实例，可用于后续的更新操作
- 渲染 HTML 字符串或 DOM 节点时：返回 `null`

## 说明

- 内容会渲染到 `ctx.element` 容器中
- 多次调用 `ctx.render()` 会替换容器中的内容
- 渲染 React 元素时，会使用 React 的 `createRoot` API，并自动继承应用的上下文
- 渲染 HTML 字符串时，如果容器中已有 React 根，会先卸载它

## 使用示例

- [渲染 React 元素](./render-react-element.md)
- [渲染 HTML 字符串](./render-html-string.md)
- [渲染 DOM 节点](./render-dom-node.md)
- [条件渲染](./render-conditional.md)
