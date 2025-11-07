# FlowContext API

`FlowContext` 是 NocoBase 流引擎的核心上下文体系，提供了丰富的 API 用于流步骤（flow step）中访问模型、数据源、组件引用等内容。以下是 `FlowContext` 的主要 API 及其使用说明。

---

## `ctx.model`

`ctx.model` 表示当前模型的上下文，通常在流步骤中使用。它提供了对 `FlowModel` 的访问能力，可以获取模型的属性、状态以及执行相关操作。

### 使用场景
- 获取当前模型的属性值
- 操作模型的生命周期方法

<code src="./demos/model.tsx"></code>

---

## `ctx.dataSourceManager`

`ctx.dataSourceManager` 是全局可用的上下文，用于管理数据源。它提供了对数据源的统一管理接口，支持数据的动态加载、更新和删除。

### 使用场景
- 管理全局数据源
- 动态加载或更新数据

<code src="./demos/dataSourceManager.tsx"></code>

---

## `ctx.ref`

`ctx.ref` 是 `FlowModel` 提供的组件引用上下文。只有在组件中引用时，`ref` 才会动态创建。它通常用于操作 DOM 或组件实例。

### 使用场景
- 获取组件的 DOM 引用
- 动态操作组件实例

```tsx | pure
<div ref={model.context.ref} />
```

<code src="./demos/ref.tsx"></code>

---

## `ctx.onRefReady(ref, cb, timeout)`

`ctx.onRefReady` 用于监听组件引用的准备状态，通常与 `ctx.ref` 搭配使用。它只能在 `FlowRuntimeContext` 中使用。

### 使用场景
- 在组件引用准备好后执行回调
- 配置超时处理逻辑

<code src="./demos/onRefReady.tsx"></code>

---

## `ctx.requireAsync(url: string)`

`ctx.requireAsync` 是一个异步加载模块的工具方法，用于动态加载外部资源或模块。

### 使用场景
- 动态加载外部 JavaScript 模块
- 实现按需加载功能

<code src="./demos/requireAsync.tsx"></code>

---

## `ctx.runjs(code, vars)`

`ctx.runjs` 用于运行动态 JavaScript 代码，并支持传入变量上下文。它适合在流步骤中执行自定义逻辑。

### 使用场景
- 动态执行 JavaScript 代码
- 传递变量上下文以实现灵活的逻辑

<code src="./demos/requireAsync-2.tsx"></code>

---

## `ctx.api.request(options)`

`ctx.api.request` 是一个封装的 API 请求方法，用于与后端进行交互。它支持传入请求选项以执行 HTTP 请求。

### 使用场景
- 发起后端 API 请求
- 获取或更新远程数据

<code src="./demos/api.tsx"></code>

---

## `ctx.useResource()`

`ctx.useResource` 是一个资源管理工具，用于访问和操作流引擎中的数据资源。它支持对资源的增删改查操作。

### 使用场景
- 管理流步骤中的数据资源
- 执行资源的 CRUD 操作

<code src="./demos/useResource.tsx"></code>

