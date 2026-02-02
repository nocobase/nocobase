# ctx.api

基于应用 Axios 实例的 HTTP 客户端，用于在流程中发送带认证的 HTTP 请求。

## 类型定义

```typescript
api: APIClient
```

`APIClient` 来自 `@nocobase/sdk`。

## 说明

- 所有请求复用应用的 Axios 实例（自动包含 baseURL、Token、Cookies、拦截器等）
- 优先使用 `ctx.api.request()`，不要使用 `fetch` 或手动创建 Axios 实例
- 支持 REST / 资源风格 URL（如 `/users:list`、`/posts:update`）

## 常用方法

### ctx.api.request()

发送 HTTP 请求的通用方法。

**签名（简化）：**

```typescript
request<T = any>(options: {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  params?: any;
  data?: any;
}): Promise<{ data: T }>;
```

**参数：**

- `method`：HTTP 方法，默认为 `'get'`
- `url`：请求 URL（可为资源风格，如 `/users:list`）
- `params`：查询参数（会编码到 URL）
- `data`：请求体数据（用于 `post`、`put`、`patch` 等）
