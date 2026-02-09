# APIResource

基于 URL 发起请求的通用 API 资源，适用于任意 HTTP 接口。继承自 FlowResource 基类，并扩展了请求配置与 `refresh()`。

创建方式：`ctx.makeResource('APIResource')` 或 `ctx.initResource('APIResource')`。使用前需设置 `setURL()`，并依赖上下文的 `ctx.api`（APIClient）。


## 基类能力（FlowResource）

所有 Resource 均具备：

| 方法 | 说明 |
|------|------|
| `getData()` | 获取当前数据 |
| `setData(value)` | 设置数据（仅本地） |
| `hasData()` | 是否有数据 |
| `getMeta(key?)` / `setMeta(meta)` | 读写元数据 |
| `getError()` / `setError(err)` / `clearError()` | 错误状态 |
| `on(event, callback)` / `once` / `off` / `emit` | 事件订阅与触发 |


## 请求配置

| 方法 | 说明 |
|------|------|
| `setAPIClient(api)` | 设置 APIClient 实例 |
| `getURL()` / `setURL(url)` | 请求 URL |
| `loading` | 读写加载状态（get/set） |
| `clearRequestParameters()` | 清空请求参数 |
| `setRequestParameters(params)` | 合并设置请求参数 |
| `setRequestMethod(method)` | 设置请求方法（如 `'get'`） |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | 请求头 |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | 单参数增删查 |
| `setRequestBody(data)` | 请求体 |
| `setRequestOptions(key, value)` / `getRequestOptions()` | 通用请求选项 |


## 数据拉取

| 方法 | 说明 |
|------|------|
| `refresh()` | 按当前 URL 与配置发起请求，将结果写入 `setData(data)` 并触发 `'refresh'` 事件。需已设置 `api` 与 URL。 |


## 示例

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```
