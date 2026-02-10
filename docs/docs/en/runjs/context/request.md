# ctx.request()

Send authenticated HTTP requests in RunJS. Requests automatically include the current app's baseURL, token, cookies, etc.

## Type definition

```typescript
request(options: RequestOptions): Promise<any>
```

`RequestOptions` extends Axios `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // skip global error notification on failure
  skipAuth?: boolean;                                  // skip auth redirect
};
```

## Notes

- Requests include baseURL, token, cookies, and interceptors.
- Supports same-origin requests (relative paths or same origin), and cross-origin requests (full URL, target must allow CORS).
- Standard options (`url`, `method`, `params`, `data`, etc.) are supported. URLs can use resource style (e.g. `users:list`, `posts:update`).

## Common parameters (Axios style)

| Parameter | Type | Description |
|------|------|------|
| `url` | string | Request URL, can be resource style like `users:list`, `posts:update` |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP method, default `'get'` |
| `params` | object | Query params serialized into URL |
| `data` | any | Request body for post/put/patch |
| `headers` | object | Custom headers |
| `skipNotify` | boolean \| (error) => boolean | When true or function returns true, skip global error message |
| `skipAuth` | boolean | When true, request failure (e.g. 401) won't trigger auth redirect |

## Examples

### List query

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  params: { pageSize: 10 },
});
```

### Submit data

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Alice', email: 'alice@example.com' },
});
```

### Filter and sort

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

### Skip error notification

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // skip global message on failure
});
```

### Cross-origin request

Use a full URL to call another domain. The target service must enable CORS.

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

// If the target API requires its own token, pass it via headers
const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target-service-token>',
  },
});
```
