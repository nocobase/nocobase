# `ctx.api`

:::info
- `ctx.api` 由 `FlowEngineContext` 提供，在任意上下文里都可以使用。
:::

## `ctx.api.request(options)`

`ctx.api.request` 是一个封装的 API 请求方法，用于与后端进行交互。它支持传入请求选项以执行 HTTP 请求。

### 使用场景
- 发起后端 API 请求
- 获取或更新远程数据

<code src="./api.tsx"></code>
