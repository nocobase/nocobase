# ctx.libs.antd

内置的 Ant Design 组件库，在 RunJS 环境中可直接使用。推荐在 JSX 渲染 (`ctx.render`) 或 `ctx.element` 自定义渲染时使用，而不是原生 HTML 元素。

## 类型定义（简化）

```ts
libs.antd: typeof import('antd');
```

常用组件示例：

- `Button`
- `Card`
- `Table`
- `Form`
- `Input`
- `Modal`
- `Space` / `Row` / `Col`

## 使用示例

- [使用 ctx.libs.antd 组件](../../jsx/use-antd-components.md)
