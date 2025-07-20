# 概述

## `ctx.model`

`FlowModel` 为每个模型提供了 `model` 上下文，表示当前模型。通常在流步骤（flow step）中使用。

<code src="./demos/model.tsx"></code>

## `ctx.dataSourceManager`

`ctx.dataSourceManager` 是全局可用的上下文，用于管理数据源。

<code src="./demos/dataSourceManager.tsx"></code>

## `ctx.ref`

`FlowModel` 为每个模型提供了 `ref` 上下文。只有在组件中引用时，`ref` 才会动态创建。

```tsx | pure
<div ref={model.context.ref} />
```

<code src="./demos/ref.tsx"></code>

## `ctx.onRefReady(ref, cb, timeout)`

`ctx.onRefReady` 只能在 `FlowRuntimeContext` 中使用，通常与 `ctx.ref` 搭配使用。

<code src="./demos/onRefReady.tsx"></code>

## `ctx.requireAsync(url: string)`

<code src="./demos/requireAsync.tsx"></code>

## `ctx.runjs(code, vars)`

<code src="./demos/requireAsync-2.tsx"></code>

## `ctx.api.request(options)`

<code src="./demos/api.tsx"></code>

## `ctx.useResource()`

<code src="./demos/useResource.tsx"></code>

