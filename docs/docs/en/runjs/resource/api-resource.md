# APIResource

Generic **API resource** that sends requests by URL; use for any HTTP endpoint. Extends FlowResource with request config and `refresh()`. Unlike [MultiRecordResource](./multi-record-resource.md) and [SingleRecordResource](./single-record-resource.md), APIResource does not depend on resource name and requests directly by URL; suitable for custom endpoints, third-party APIs, etc.

**Create with**: `ctx.makeResource('APIResource')` or `ctx.initResource('APIResource')`. Before use call `setURL()`; RunJS context auto-injects `ctx.api` (APIClient), no need to call `setAPIClient` manually.

---

## Use cases

| Scenario | Description |
|----------|-------------|
| **Custom endpoints** | Call non-standard resource APIs (e.g. `/api/custom/stats`, `/api/reports/summary`) |
| **Third-party APIs** | Request external services via full URL (target must support CORS) |
| **One-off queries** | Fetch data temporarily, no need to bind to `ctx.resource` |
| **vs ctx.request** | Use APIResource when you need reactive data, events, or error state; use `ctx.request()` for simple one-off requests |

---

## Base (FlowResource)

All resources support:

| Method | Description |
|--------|-------------|
| `getData()` | Current data |
| `setData(value)` | Set data (local only) |
| `hasData()` | Whether data exists |
| `getMeta(key?)` / `setMeta(meta)` | Read/write metadata |
| `getError()` / `setError(err)` / `clearError()` | Error state |
| `on(event, callback)` / `once` / `off` / `emit` | Subscribe and emit events |

---

## Request config

| Method | Description |
|--------|-------------|
| `setAPIClient(api)` | Set APIClient instance (RunJS usually injects via context) |
| `getURL()` / `setURL(url)` | Request URL |
| `loading` | Load state (get/set) |
| `clearRequestParameters()` | Clear request params |
| `setRequestParameters(params)` | Merge request params |
| `setRequestMethod(method)` | Method (e.g. `'get'`, `'post'`, default `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Headers |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Single param add/get/remove |
| `setRequestBody(data)` | Request body (for POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | General request options |

---

## URL format

- **Resource style**: NocoBase shorthand supported, e.g. `users:list`, `posts:get`, concatenated with baseURL
- **Relative path**: e.g. `/api/custom/endpoint`, concatenated with app baseURL
- **Full URL**: Use full address for cross-origin; target must configure CORS

---

## Data fetch

| Method | Description |
|--------|-------------|
| `refresh()` | Send request with current URL, method, params, headers, data; write response `data` to `setData(data)` and emit `'refresh'`. On failure sets `setError(err)` and throws `ResourceError`, does not emit `refresh`. Requires `api` and URL. |

---

## Examples

### Basic GET request

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### Resource-style URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST request (with body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Listen to refresh event

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Stats: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Error handling

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

### Custom headers

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Notes

- **ctx.api dependency**: RunJS injects `ctx.api`; usually no need to call `setAPIClient`. Set it manually when used without context.
- **refresh = request**: `refresh()` sends one request with current config; method, params, data, etc. must be set before calling.
- **Error does not update data**: On failure `getData()` keeps previous value; use `getError()` for error info.
- **vs ctx.request**: Use `ctx.request()` for simple one-off requests; use APIResource when you need reactive data, events, or error state management.

---

## Related

- [ctx.resource](../context/resource.md) - Resource instance in current context
- [ctx.initResource()](../context/init-resource.md) - Initialize and bind to ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Create resource instance without binding
- [ctx.request()](../context/request.md) - Generic HTTP request, for simple one-off calls
- [MultiRecordResource](./multi-record-resource.md) - For data tables/lists, CRUD, pagination
- [SingleRecordResource](./single-record-resource.md) - For single records
