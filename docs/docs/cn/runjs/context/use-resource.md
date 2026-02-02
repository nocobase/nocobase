# ctx.useResource()

在 JSX 场景中获取当前资源对象的 React Hook（通过 `ctx.render` 渲染 React 组件时使用）。

> 仅在支持 Hooks 的 RunJS 场景中使用，例如 `ctx.render(<Component />)`。

## 类型定义（简化）

```ts
useResource<T = any>(): T;
```

## 示例

```ts
const { useResource } = ctx;

const ResourceInfo = () => {
  const resource = useResource();
  return <div>资源名称: {resource?.name}</div>;
};

ctx.render(<ResourceInfo />);
```
