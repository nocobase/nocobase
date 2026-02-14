# ctx.request()

Sends authenticated HTTP requests from RunJS. Requests use the app’s baseURL, token, locale, role, etc., and the app’s interceptors and error handling.

## Use Cases

Use whenever RunJS needs to call a remote HTTP API: JSBlock, JSField, JSItem, JSColumn, event flow, linkage, JSAction, etc.

## Type

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` extends Axios `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Skip global error toast on failure
  skipAuth?: boolean;                                 // Skip auth redirect (e.g. 401 → login)
};
```

## Common parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL. Supports resource style (e.g. `users:list`, `posts:create`) or full URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP method; default `'get'` |
| `params` | object | Query params (serialized to URL) |
| `data` | any | Request body for post/put/patch |
| `headers` | object | Custom headers |
| `skipNotify` | boolean \| (error) => boolean | When true or function returns true, no global error message |
| `skipAuth` | boolean | When true, 401 etc. do not trigger auth redirect (e.g. to login) |

## Resource-style URL

NocoBase resource API supports `resource:action` shorthand:

| Format | Description | Example |
|--------|-------------|---------|
| `collection:action` | Single-table CRUD | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Association (need `resourceOf` or primary key in URL) | `posts.comments:list` |

Relative URLs are joined with the app baseURL (usually `/api`). For cross-origin, use a full URL and ensure CORS on the target.

## Response

Returns Axios response. Common usage:

- `response.data`: response body
- List APIs often have `data.data` (records) + `data.meta` (pagination)
- Single/create/update often have `data.data` as one record

## Examples

### List

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta;
```

### Create

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'John', email: 'john@example.com' },
});

const newRecord = res?.data?.data;
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

### Skip error notify

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,
});

const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Cross-origin

For other domains, the target must allow CORS. For its own token, pass in headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target-token>',
  },
});
```

### With ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('User list') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Notes

- **Errors**: Failed requests throw; by default a global error message is shown. Use `skipNotify: true` to handle yourself.
- **Auth**: Same-origin requests automatically send token, locale, role; cross-origin needs CORS and optional token in headers.
- **ACL**: Requests are subject to ACL; only resources the user can access are available.

## Related

- [ctx.message](./message.md): short feedback after request
- [ctx.notification](./notification.md): notification after request
- [ctx.render](./render.md): render result in UI
- [ctx.makeResource](./make-resource.md): build resource for chained loading (alternative to direct `ctx.request`)
