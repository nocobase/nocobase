# ctx.api

基于应用 Axios 实例的 HTTP 客户端，用于在流程中发起带鉴权的 HTTP 请求。

## 类型定义

```typescript
api: APIClient
```

其中 `APIClient` 来自 `@nocobase/sdk`。

## 说明

- 所有请求都会复用应用中的 Axios 实例（自动带上 baseURL、Token、Cookies、拦截器等配置）
- 推荐统一使用 `ctx.api.request()` 发送请求，而不是直接使用 `fetch` 或手动创建 Axios 实例
- 支持 REST / 资源风格 URL（例如 `/users:list`、`/posts:update` 等）

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
- `url`：请求地址（可以是资源风格，如 `/users:list`）
- `params`：查询参数（会编码到 URL 上）
- `data`：请求体数据（用于 `post`、`put`、`patch` 等）

## 使用示例

- [基础请求：获取 / 更新用户信息](./api-request-basic.md)
- [更新记录：发送写请求](./api-request-update.md)

