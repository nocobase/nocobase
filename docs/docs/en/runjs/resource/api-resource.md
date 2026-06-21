# APIResource

A **generic API resource** for making requests based on URLs, suitable for any HTTP interface. It inherits from the `FlowResource` base class and extends it with request configuration and `refresh()`. Unlike [MultiRecordResource](./multi-record-resource.md) and [SingleRecordResource](./single-record-resource.md), `APIResource` does not depend on a resource name; it requests directly by URL, making it suitable for custom interfaces, third-party APIs, and other scenarios.

**Creation method**: `ctx.makeResource('APIResource')` or `ctx.initResource('APIResource')`. You must call `setURL()` before use. In the RunJS context, `ctx.api` (APIClient) is automatically injected, so there is no need to call `setAPIClient` manually.

---

## Use Cases

| Scenario | Description |
|------|------|
| **Custom Interface** | Call non-standard resource APIs (e.g., `/api/custom/stats`, `/api/reports/summary`). |
| **Third-party API** | Request external services via full URL (requires CORS support from the target). |
| **One-time Query** | Temporary data fetching that is disposable and does not need to be bound to `ctx.resource`. |
| **Choosing between APIResource and ctx.request** | Use `APIResource` when reactive data, events, or error states are needed; use `ctx.request()` for simple one-time requests. |

---

## Base Class Capabilities (FlowResource)

All Resources possess the following:

| Method | Description |
|------|------|
| `getData()` | Get current data. |
| `setData(value)` | Set data (local only). |
| `hasData()` | Whether data exists. |
| `getMeta(key?)` / `setMeta(meta)` | Read/write metadata. |
| `getError()` / `setError(err)` / `clearError()` | Error state management. |
| `on(event, callback)` / `once` / `off` / `emit` | Event subscription and triggering. |

---

## Request Configuration

| Method | Description |
|------|------|
| `setAPIClient(api)` | Set the APIClient instance (usually automatically injected in RunJS). |
| `getURL()` / `setURL(url)` | Request URL. |
| `loading` | Read/write loading state (get/set). |
| `clearRequestParameters()` | Clear request parameters. |
| `setRequestParameters(params)` | Merge and set request parameters. |
| `setRequestMethod(method)` | Set request method (e.g., `'get'`, `'post'`, default is `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Request headers. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Add, delete, or query a single parameter. |
| `setRequestBody(data)` | Request body (used for POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | General request options. |

---

## URL Format

- **Resource Style**: Supports NocoBase resource shorthand, such as `users:list` or `posts:get`, which will be concatenated with the `baseURL`.
- **Relative Path**: e.g., `/api/custom/endpoint`, concatenated with the application's `baseURL`.
- **Full URL**: Use full addresses for cross-origin requests; the target must have CORS configured.

---

## Data Fetching

| Method | Description |
|------|------|
| `refresh()` | Initiates a request based on the current URL, method, params, headers, and data. It writes the response `data` into `setData(data)` and triggers the `'refresh'` event. On failure, it sets `setError(err)` and throws a `ResourceError`, without triggering the `refresh` event. Requires `api` and URL to be set. |

---

## Examples

### Basic GET Request

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### Resource Style URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST Request (with Request Body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Listening to the refresh Event

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Stats: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Error Handling

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Request failed');
}
```

### Custom Request Headers

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Notes

- **ctx.api Dependency**: In RunJS, `ctx.api` is injected by the environment; manual `setAPIClient` is usually unnecessary. If used in a context-less scenario, you must set it yourself.
- **Refresh Means Request**: `refresh()` initiates a request based on the current configuration; method, params, data, etc., must be configured before calling.
- **Errors Do Not Update Data**: On failure, `getData()` keeps its previous value; error information can be retrieved via `getError()`.
- **Vs ctx.request**: Use `ctx.request()` for simple one-time requests; use `APIResource` when reactive data, events, and error state management are required.

---

## Related

- [ctx.resource](../context/resource.md) - The resource instance in the current context
- [ctx.initResource()](../context/init-resource.md) - Initialize and bind to `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Create a new resource instance without binding
- [ctx.request()](../context/request.md) - General HTTP request, suitable for simple one-time calls
- [MultiRecordResource](./multi-record-resource.md) - For Collections/lists, supports CRUD and pagination
- [SingleRecordResource](./single-record-resource.md) - For single records