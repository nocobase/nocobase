# APIResource

A generic API resource based on URL requests, suitable for any HTTP interface. It inherits from FlowResource and extends request configuration and `refresh()`.

Creation: `ctx.makeResource('APIResource')` or `ctx.initResource('APIResource')`. You must call `setURL()` before use, and it relies on `ctx.api` (APIClient).


## Base capabilities (FlowResource)

All resources provide:

| Method | Description |
|------|------|
| `getData()` | Get current data |
| `setData(value)` | Set data (local only) |
| `hasData()` | Whether data exists |
| `getMeta(key?)` / `setMeta(meta)` | Read/write metadata |
| `getError()` / `setError(err)` / `clearError()` | Error state |
| `on(event, callback)` / `once` / `off` / `emit` | Event subscription and emit |


## Request configuration

| Method | Description |
|------|------|
| `setAPIClient(api)` | Set APIClient instance |
| `getURL()` / `setURL(url)` | Request URL |
| `loading` | Read/write loading state (get/set) |
| `clearRequestParameters()` | Clear request params |
| `setRequestParameters(params)` | Merge request params |
| `setRequestMethod(method)` | Set HTTP method (e.g. `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Request headers |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Single param add/get/remove |
| `setRequestBody(data)` | Request body |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Generic request options |


## Fetch data

| Method | Description |
|------|------|
| `refresh()` | Send request with current URL/config, write result via `setData(data)`, and emit `'refresh'`. Requires `api` and URL set. |


## Example

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```
