# APIResource

Generic data resource based on a URL. Use this when you want to call any HTTP endpoint (inside or outside NocoBase) and manage its loading / data state from JS blocks.

Created via `ctx.makeResource('APIResource')` or `ctx.initResource('APIResource')`. It relies on `ctx.api` (APIClient) and requires a URL to be set before calling `refresh()`.

## Base capabilities (FlowResource)

All resources share the same base capabilities:

- `getData()` / `setData(value)` – read or overwrite the in‑memory data
- `hasData()` – whether data has been set
- `getMeta(key?)` / `setMeta(meta)` – metadata (e.g. pagination, extra info)
- `getError()` / `setError(err)` / `clearError()` – error state
- `on(event, cb)` / `once` / `off` / `emit` – subscribe to events like `'refresh'`

These are usually enough for:

- Passing data to JS logic (calculate values, conditionally render, etc.)
- Tracking and reacting to loading / error state via events

## Request configuration

- `setAPIClient(api)` – inject APIClient instance (usually `ctx.api`)
- `getURL()` / `setURL(url)` – target URL to call
- `loading` – boolean loading flag (get / set)
- `clearRequestParameters()` – reset query / body parameters
- `setRequestParameters(params)` – merge request parameters
- `setRequestMethod(method)` – HTTP method, e.g. `'get'`, `'post'`
- `addRequestHeader(key, value)` / `removeRequestHeader(key)` – custom headers
- `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` – single parameter helpers
- `setRequestBody(data)` – request body (for POST / PUT etc.)
- `setRequestOptions(key, value)` / `getRequestOptions()` – transport‑level options

Use these to build flexible, parameterized API calls in JS blocks.

## Data fetching

- `refresh()` – perform the request based on current URL + configuration, write the response into `setData(data)` and emit `'refresh'`

Typical flow:

1. Configure URL, method, parameters and body
2. Call `await resource.refresh()`
3. Read `resource.getData()` or subscribe to `'refresh'` to react

## Example

```ts
const res = ctx.makeResource('APIResource');

res.setAPIClient(ctx.api);
res.setURL('/api/custom/endpoint');
res.setRequestMethod('get');
res.setRequestParameters({ page: 1, pageSize: 10 });

await res.refresh();

const data = res.getData();
```