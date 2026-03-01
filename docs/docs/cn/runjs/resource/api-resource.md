# APIResource

基于 URL 发起请求的**通用 API 资源**，适用于任意 HTTP 接口。继承自 FlowResource 基类，并扩展了请求配置与 `refresh()`。与 [MultiRecordResource](./multi-record-resource.md)、[SingleRecordResource](./single-record-resource.md) 不同，APIResource 不依赖资源名，直接按 URL 请求，适合自定义接口、第三方 API 等场景。

**创建方式**：`ctx.makeResource('APIResource')` 或 `ctx.initResource('APIResource')`。使用前需设置 `setURL()`；RunJS 上下文中会自动注入 `ctx.api`（APIClient），无需手动 `setAPIClient`。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **自定义接口** | 调用非标准资源 API（如 `/api/custom/stats`、`/api/reports/summary`） |
| **第三方 API** | 通过完整 URL 请求外部服务（需目标支持 CORS） |
| **一次性查询** | 临时拉取数据，用完即弃，无需绑定到 `ctx.resource` |
| **与 ctx.request 的取舍** | 需要响应式数据、事件、错误状态时用 APIResource；简单一次性请求可用 `ctx.request()` |

---

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

---

## 请求配置

| 方法 | 说明 |
|------|------|
| `setAPIClient(api)` | 设置 APIClient 实例（RunJS 中通常由上下文自动注入） |
| `getURL()` / `setURL(url)` | 请求 URL |
| `loading` | 读写加载状态（get/set） |
| `clearRequestParameters()` | 清空请求参数 |
| `setRequestParameters(params)` | 合并设置请求参数 |
| `setRequestMethod(method)` | 设置请求方法（如 `'get'`、`'post'`，默认 `'get'`） |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | 请求头 |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | 单参数增删查 |
| `setRequestBody(data)` | 请求体（POST/PUT/PATCH 时使用） |
| `setRequestOptions(key, value)` / `getRequestOptions()` | 通用请求选项 |

---

## URL 格式

- **资源风格**：支持 NocoBase 资源简写，如 `users:list`、`posts:get`，会与 baseURL 拼接
- **相对路径**：如 `/api/custom/endpoint`，与应用的 baseURL 拼接
- **完整 URL**：跨域时使用完整地址，目标需配置 CORS

---

## 数据拉取

| 方法 | 说明 |
|------|------|
| `refresh()` | 按当前 URL、method、params、headers、data 发起请求，将响应 `data` 写入 `setData(data)` 并触发 `'refresh'` 事件。失败时设置 `setError(err)` 并抛出 `ResourceError`，不触发 `refresh` 事件。需已设置 `api` 与 URL。 |

---

## 示例

### 基础 GET 请求

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### 资源风格 URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST 请求（带请求体）

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: '测试', type: 'report' });
await res.refresh();
const result = res.getData();
```

### 监听 refresh 事件

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>统计: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### 错误处理

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? '请求失败');
}
```

### 自定义请求头

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## 注意事项

- **ctx.api 依赖**：RunJS 中 `ctx.api` 由运行环境注入，通常无需手动 `setAPIClient`；若在无上下文的场景使用，需自行设置。
- **refresh 即请求**：`refresh()` 会按当前配置发起一次请求，method、params、data 等需在调用前配置好。
- **错误不更新 data**：请求失败时 `getData()` 保持原值，可通过 `getError()` 获取错误信息。
- **与 ctx.request**：简单一次性请求可用 `ctx.request()`；需要响应式数据、事件、错误状态管理时用 APIResource。

---

## 相关

- [ctx.resource](../context/resource.md) - 当前上下文中的 resource 实例
- [ctx.initResource()](../context/init-resource.md) - 初始化并绑定到 ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - 新建 resource 实例，不绑定
- [ctx.request()](../context/request.md) - 通用 HTTP 请求，适合简单一次性调用
- [MultiRecordResource](./multi-record-resource.md) - 面向数据表/列表，支持 CRUD、分页
- [SingleRecordResource](./single-record-resource.md) - 面向单条记录
