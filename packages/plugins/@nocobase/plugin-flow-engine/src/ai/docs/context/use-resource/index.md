# ctx.useResource()

在 JSX 场景下（配合 `ctx.render` 渲染 React 组件）获取当前资源对象的 React hook。

> 仅在支持 hooks 的 RunJS 场景下使用，如 `ctx.render(<Component />)` 中。

## 类型定义（简化）

```ts
useResource<T = any>(): T;
```

## 使用示例

```ts
const { useResource } = ctx;

const ResourceInfo = () => {
  const resource = useResource();
  return <div>资源名称：{resource?.name}</div>;
};

ctx.render(<ResourceInfo />);
```
