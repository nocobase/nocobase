# ctx.request()

在 RunJS 中发起带认证的 HTTP 请求。请求会自动携带当前应用的 baseURL、Token、 locale、 role 等，并沿用应用的请求拦截与错误处理逻辑。

## 适用场景

凡 RunJS 中需发起远程 HTTP 请求的场景均可使用，如 JSBlock、JSField、JSItem、JSColumn、事件流、联动、JSAction 等。

## 类型定义

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` 在 Axios 的 `AxiosRequestConfig` 基础上扩展：

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // 请求失败时是否跳过全局错误提示
  skipAuth?: boolean;                                 // 是否跳过认证跳转（如 401 不跳转登录页）
};
```

## 常用参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | string | 请求 URL。支持资源风格（如 `users:list`、`posts:create`），或完整 URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP 方法，默认 `'get'` |
| `params` | object | 查询参数，序列化到 URL |
| `data` | any | 请求体，用于 post/put/patch |
| `headers` | object | 自定义请求头 |
| `skipNotify` | boolean \| (error) => boolean | 为 true 或函数返回 true 时，失败不弹出全局错误提示 |
| `skipAuth` | boolean | 为 true 时 401 等不触发认证跳转（如跳转登录页） |

## 资源风格 URL

NocoBase 资源 API 支持 `资源:动作` 的简写形式：

| 格式 | 说明 | 示例 |
|------|------|------|
| `collection:action` | 单表 CRUD | `users:list`、`users:get`、`users:create`、`posts:update` |
| `collection.relation:action` | 关联资源（需通过 `resourceOf` 或 URL 传主键） | `posts.comments:list` |

相对路径会与应用的 baseURL（通常为 `/api`）拼接；跨域需使用完整 URL，目标服务需配置 CORS。

## 响应结构

返回值为 Axios 响应对象，常用字段：

- `response.data`：响应体
- 列表接口通常为 `data.data`（记录数组）+ `data.meta`（分页等）
- 单条/创建/更新接口多为 `data.data` 为单条记录

## 示例

### 列表查询

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // 分页等信息
```

### 提交数据

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '张三', email: 'zhangsan@example.com' },
});

const newRecord = res?.data?.data;
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

// 或按错误类型决定是否跳过
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### 跨域请求

使用完整 URL 请求其他域名时，目标服务需配置 CORS 允许当前应用来源。若目标接口需自己的 token，可通过 headers 传入：

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <目标服务的 token>',
  },
});
```

### 配合 ctx.render 展示

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('用户列表') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## 注意事项

- **错误处理**：请求失败会抛出异常，默认会弹出全局错误提示。使用 `skipNotify: true` 可自行捕获并处理。
- **认证**：同域请求会自动携带当前用户的 Token、locale、role；跨域需目标支持 CORS，并按需在 headers 中传入 token。
- **资源权限**：请求受 ACL 约束，仅能访问当前用户有权限的资源。

## 相关

- [ctx.message](./message.md) - 请求完成后展示轻量提示
- [ctx.notification](./notification.md) - 请求完成后展示通知
- [ctx.render](./render.md) - 将请求结果渲染到界面
- [ctx.makeResource](./make-resource.md) - 构建资源对象，用于链式数据加载（与直接 `ctx.request` 二选一）
