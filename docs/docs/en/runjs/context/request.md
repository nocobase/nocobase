# ctx.request()

Initiate an authenticated HTTP request within RunJS. The request automatically carries the current application's `baseURL`, `Token`, `locale`, `role`, etc., and follows the application's request interception and error handling logic.

## Use Cases

Applicable to any scenario in RunJS where a remote HTTP request needs to be initiated, such as JSBlock, JSField, JSItem, JSColumn, Workflow, Linkage, JSAction, etc.

## Type Definition

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` extends Axios's `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Whether to skip global error prompts when the request fails
  skipAuth?: boolean;                                 // Whether to skip authentication redirection (e.g., do not redirect to login page on 401)
};
```

## Common Parameters

| Parameter | Type | Description |
|------|------|------|
| `url` | string | Request URL. Supports resource style (e.g., `users:list`, `posts:create`), or a full URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP method, defaults to `'get'` |
| `params` | object | Query parameters, serialized into the URL |
| `data` | any | Request body, used for post/put/patch |
| `headers` | object | Custom request headers |
| `skipNotify` | boolean \| (error) => boolean | If true or the function returns true, global error prompts will not pop up on failure |
| `skipAuth` | boolean | If true, 401 errors etc. will not trigger authentication redirection (e.g., redirecting to the login page) |

## Resource Style URL

NocoBase Resource API supports a shorthand `resource:action` format:

| Format | Description | Example |
|------|------|------|
| `collection:action` | Single collection CRUD | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Associated resources (requires passing the primary key via `resourceOf` or URL) | `posts.comments:list` |

Relative paths will be concatenated with the application's `baseURL` (usually `/api`); cross-origin requests must use a full URL, and the target service must be configured with CORS.

## Response Structure

The return value is an Axios response object. Common fields include:

- `response.data`: Response body
- List interfaces usually return `data.data` (array of records) + `data.meta` (pagination, etc.)
- Single record/create/update interfaces usually return the record in `data.data`

## Examples

### List Query

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Pagination and other info
```

### Submit Data

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'John Doe', email: 'johndoe@example.com' },
});

const newRecord = res?.data?.data;
```

### With Filtering and Sorting

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

### Skip Error Notification

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Do not pop up global message on failure
});

// Or decide whether to skip based on error type
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Cross-Origin Request

When using a full URL to request other domains, the target service must be configured with CORS to allow the current application's origin. If the target interface requires its own token, it can be passed via headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target_service_token>',
  },
});
```

### Displaying with ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('User List') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Notes

- **Error Handling**: Request failure will throw an exception, and a global error prompt will pop up by default. Use `skipNotify: true` to catch and handle it yourself.
- **Authentication**: Same-origin requests will automatically carry the current user's Token, locale, and role; cross-origin requests require the target to support CORS and pass the token in headers as needed.
- **Resource Permissions**: Requests are subject to ACL constraints and can only access resources the current user has permission for.

## Related

- [ctx.message](./message.md) - Display lightweight prompts after the request is completed
- [ctx.notification](./notification.md) - Display notifications after the request is completed
- [ctx.render](./render.md) - Render request results to the interface
- [ctx.makeResource](./make-resource.md) - Construct a resource object for chained data loading (alternative to `ctx.request`)