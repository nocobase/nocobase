# ctx.request()

在 RunJS 中发起带认证的 HTTP 请求的方法。请求会自动携带当前应用的 baseURL、Token、Cookies 等。

## 类型定义

```typescript
request(options: RequestOptions): Promise<any>
```

`RequestOptions` 在 Axios 的 `AxiosRequestConfig` 基础上扩展：

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // 请求失败时是否跳过全局错误提示
  skipAuth?: boolean;                                  // 是否触发认证跳转
};
```

## 说明

- 请求自动包含当前应用的 baseURL、Token、Cookies、拦截器等。
- 支持同域请求（相对路径或与当前应用同域），也支持跨域请求（填写完整 URL，目标服务需配置 CORS）。
- 支持标准配置（`url`、`method`、`params`、`data` 等），URL 可使用资源风格（如 `users:list`、`posts:update`）。

## 常用参数（Axios 风格）

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | string | 请求 URL，可为资源风格如 `users:list`、`posts:update` |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP 方法，默认 `'get'` |
| `params` | object | 查询参数，会序列化到 URL |
| `data` | any | 请求体，用于 post/put/patch |
| `headers` | object | 自定义请求头 |
| `skipNotify` | boolean \| (error) => boolean | 为 true 或函数返回 true 时，失败不弹出全局错误提示 |
| `skipAuth` | boolean | 为 true 时请求失败（如 401）不触发认证跳转（如跳转登录页） |

## 示例

### 列表查询

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  params: { pageSize: 10 },
});
```

### 提交数据

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '张三', email: 'zhangsan@example.com' },
});
```

### 带筛选与排序

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### 跳过错误提示

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // 失败时不弹出全局 message
});
```

### 跨域请求

使用完整 URL 请求其他域名的接口，目标服务需配置 CORS 允许当前应用来源。

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

// 若目标接口需要自己的 token，可通过 headers 传入
const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <目标服务的 token>',
  },
});
```
