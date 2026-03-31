# ctx.ref + ctx.onRefReady

:::info
- `ctx.ref` 由 `FlowModelContext` 提供，在 `FlowRuntimeContext` 里也可以使用。
- `ctx.onRefReady` 由 `FlowEngineContext` 提供，在任意上下文里都可以使用。
:::

- `ctx.ref` 是 `FlowModel` 提供的组件引用上下文。只有在组件中引用时，`ref` 才会动态创建。它通常用于操作 DOM 或组件实例。
- `ctx.onRefReady` 用于监听组件引用的准备状态，通常与 `ctx.ref` 搭配使用。它只能在 `FlowRuntimeContext` 中使用。

## 基础用法

<code src="./ref.tsx"></code>

## Fork model 里使用

<code src="./fork-model.tsx"></code>
