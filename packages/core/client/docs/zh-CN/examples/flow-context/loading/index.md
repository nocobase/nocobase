# 如何维护异步 ctx 属性的 loading 状态

## 在 Model 内部使用

建议在 `onBeforeAutoFlows` 或 `onAfterAutoFlows` 方法中处理异步属性，系统会自动维护 loading 状态。例如：

```ts
class MyModel {
  async onBeforeAutoFlows() {
    this.asyncProperty1 = await this.context.asyncProperty2;
  }

  async onAfterAutoFlows() {
    this.asyncProperty1 = await this.context.asyncProperty2;
  }
}
```

> 注意：Model 的 `onInit`、`onMount`、`onUnmount`、`render` 等生命周期方法不支持异步操作。

## 在 Flow step 中使用

`uiSchema`、`defaultParams` 和 `handler` 都支持 async 回调，直接 `await` 异步属性即可，系统会自动维护 loading 状态。

```ts
{
  async uiSchema(ctx) {
    await ctx.asyncProperty;
    return {};
  },
  async defaultParams(ctx) {
    await ctx.asyncProperty;
    return {};
  },
  async handler(ctx, params) {
    await ctx.asyncProperty;
  }
}
```

## 在常规 React 组件中使用异步属性

目前未提供专用 HOC，建议在组件内使用 `useRequest` 处理异步属性：

```tsx | pure
function Example() {
  const { loading, data } = useRequest(() => ctx.asyncProperty);
  if (loading) {
    return <Spin />;
  }
  return <div />;
}
```
