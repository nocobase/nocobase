# Calling APIs from the frontend

Use the application's HTTP client for application API calls. Resolve `apiClientToken` rather than constructing another client, hardcoding `/api`, or deriving an API URL from the browser location. The application configures `api.baseURL`, including any deployment base path. Import `useApiClient`, the token, other hooks, `ApiClient` type and `ApiClientError` through `@nocobase/app-client` so plugins use the application's shared runtime and error-class identity.

`@nocobase/app-client` must be a `peerDependency` of the plugin so its tokens, React contexts and error class share the host runtime identity. Reuse the host-configured client; the plugin does not configure another API base URL or instantiate another application client. See [package contracts](plugin-foundation.md) for dependency declarations.

## Resolve the client

Inside a React component or custom Hook:

```tsx
import { useApiClient } from '@nocobase/app-client';

const api = useApiClient();
```

`useApiClient()` is a no-argument shorthand for `useService(apiClientToken)`. Both return the same client from the current application and require application context. Neither creates a client or manages request state.

Inside a Client ServiceProvider method, resolve it after services have been registered:

```ts
const api = this.app.services.resolve(apiClientToken);
```

Pass the client explicitly to ordinary business functions. Do not call React Hooks in those functions or create a client at module import time:

```ts
import type { ApiClient } from '@nocobase/app-client';

interface Order {
  id: string;
  title: string;
  status: string;
}

export function loadOrders(api: ApiClient) {
  return api.request<{ data: Order[] }>({ path: 'orders' });
}
```

The examples below assume this `Order` shape and matching server routes. Custom endpoint paths and query parameters are defined by the server; these examples do not register routes.

## Custom HTTP endpoints

Use `request()` with an options object. `path` is relative to the configured API base URL; do not repeat the `/api` or application mount prefix. Supported methods are uppercase `GET`, `POST`, `PUT`, `PATCH`, `DELETE` and `HEAD`; the default is `GET`. `OPTIONS` is not included in the current method type.

### HTTP methods

The following examples assume custom REST routes with the illustrated response shapes. The server decides which methods and payloads each route accepts; selecting a method does not create an endpoint or implement its semantics. These paths are not the standard Repository action paths.

**GET — read data.** Put URL parameters in `query`; omit `method` or explicitly set `method: 'GET'`.

```ts
const response = await api.request<{ data: Order[] }>({
  path: 'orders',
  query: { page: 1, pageSize: 20 },
});
const rows = response.data;
```

**POST — create a resource or invoke an action.** Put JSON input in `json`.

```ts
const created = await api.request<{ data: Order }>({
  path: 'orders',
  method: 'POST',
  json: { title: 'New order', status: 'pending' },
});
```

**PUT — replace a singleton configuration.** Routes use `PUT` only for a configuration that exists once, such as a plugin's settings; a record is updated with `PATCH`. Supply the complete writable representation; omitted fields are not preserved.

```ts
const replaced = await api.request<{ data: OrderSettings }>({
  path: 'orders/configuration',
  method: 'PUT',
  json: { defaultStatus: 'pending', autoArchiveDays: 30 },
});
```

**PATCH — partially update a resource when the route supports it.** This example assumes an ordinary JSON object containing changed fields; it is not a JSON Patch operation list.

```ts
const updated = await api.request<{ data: Order }>({
  path: `orders/${encodeURIComponent(orderId)}`,
  method: 'PATCH',
  json: { title: 'Updated title' },
});
```

**DELETE — remove a resource.** This example assumes the server returns `204 No Content`. If the route returns JSON, declare and consume that actual response shape instead.

```ts
await api.request<void>({
  path: `orders/${encodeURIComponent(orderId)}`,
  method: 'DELETE',
});
```

**HEAD — make a request without a response body.** Use this only when the route supports HEAD and success or failure is all the caller needs.

```ts
await api.request<void>({
  path: `orders/${encodeURIComponent(orderId)}`,
  method: 'HEAD',
});
```

`request()` returns the response body, not a Fetch `Response`: a successful HEAD or other empty response resolves to `undefined`, and successful response headers and status are not exposed. Do not try to read `response.headers` or `response.status` from its result. Non-success HTTP responses still reject with `ApiClientError`.

GET and HEAD must not include `json` or `body`: the underlying Fetch implementation rejects request bodies for these methods, even though the shared options type does not prevent them. Other methods accept `json` or `body` only as required by the endpoint; POST does not inherently require a body, and DELETE should not receive one unless its route explicitly expects it. `query` is available for all methods.

### Parameters and response bodies

`query` holds URL query parameters: scalar values or arrays of scalars, not nested filter objects. `json` serializes a JSON body and supplies its content type. These options are named `query` and `json`, not Axios's `params` and `data`. `request<T>()` returns the parsed response body without unwrapping `{ data }`; `T` describes that entire body and does not perform runtime validation. Every `/api` route answers `{ data }`, or `{ data, meta }` for a list, so type `T` with that envelope.

For file uploads, use a raw `body`. `json` and `body` are mutually exclusive. Leave the multipart content type to the browser so it includes the boundary:

```ts
const body = new FormData();
body.append('file', file);

await api.request({
  path: 'files',
  method: 'POST',
  body,
});
```

The client defaults to `credentials: 'include'`. Request options also accept `headers`, `credentials` and `signal`. Use the application's existing authentication integration; resolving this client does not bypass server authentication, authorization or endpoint-specific requirements.

## Cancellation and errors

Pass an `AbortSignal` when a request belongs to a component's lifetime or can be superseded by another query. Handle rejection and prevent stale updates after cleanup:

```tsx
useEffect(() => {
  const controller = new AbortController();

  void api
    .request<{ data: Order[] }>({
      path: 'orders',
      signal: controller.signal,
    })
    .then(({ data }) => {
      if (!controller.signal.aborted) setOrders(data);
    })
    .catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error);
    });

  return () => controller.abort();
}, [api]);
```

Here `useEffect` is imported from React and `setOrders`/`setError` are component state setters. Provide loading, empty and error states for the consuming UI; an intentional cancellation should not appear as a failed request.

Non-success HTTP responses throw `ApiClientError`. Its fields include `status`, `reason`, `domain`, `payload` and `requestId`, read from the standard error body `{ error: { code, status, reason, domain, message, requestId } }`; `reason`, `domain` and `requestId` may be absent. Branch on `reason` (with `domain` when two plugins could use the same reason), never on the message and never by parsing `payload` yourself. Network failures and cancellation are not necessarily `ApiClientError`, so narrow an `unknown` error before reading these fields:

```ts
import { ApiClientError } from '@nocobase/app-client';

try {
  await api.request({ path: 'orders' });
} catch (error: unknown) {
  if (error instanceof ApiClientError && error.reason === 'ORDER_NOT_FOUND') {
    // Map the reason to the appropriate translated UI message.
    // requestId can help correlate the failure with server logs.
  }
  throw error; // Let the caller handle errors not handled here.
}
```

## Remote Repository operations

`api.repository(name)` is also a frontend HTTP API. It does not access the database directly. Use it when the server exposes standard Repository actions through `defineRepositoryApiRoutes`; `name` is the exposed resource name, not an arbitrary database table. The server owns action exposure, validation, authorization and write policy. Use `request()` for custom endpoints with their own contract.

```ts
const orders = api.repository<Order>('orders');

const rows = await orders.findMany({
  filter: { status: 'paid' },
  limit: 20,
  offset: 0,
});

const order = await orders.findOne({ filter: { id: orderId } });

const created = await orders.createOne({
  values: { title: 'New order', status: 'pending' },
});

const updated = await orders.updateOne({
  filter: { id: orderId },
  values: { title: 'Updated title' },
});

await orders.deleteOne({ filter: { id: orderId } });
```

These calls send `POST` requests such as `/orders/findMany`, relative to the API base URL. Repository methods unwrap the response's `{ data }` envelope: `findMany()` yields an array, `findOne()` yields a record or `undefined`, and `createOne()`/`updateOne()` yield a mutation result with a `record` field, not the record alone. Read `created.record` or `updated.record`. `deleteOne()` returns a deletion result. `count()`, `exists()`, `aggregate()` and `groupBy()` are available when exposed by the server.

`findMany()` is lazy: await it for an array or use `for await` for streamed records. Repeated awaits reuse the same cached Promise rather than issuing another request; create a fresh query to refetch. Do not mix awaiting and asynchronous iteration on the same query or iterate it twice. Use explicit limits for bounded lists. Repository options are data-operation options, not HTTP request options; do not add `signal` or `headers` to them.

Repository methods accept structured builder callbacks as well as JSON inputs:

```ts
const rows = await orders.findMany({
  filter: (f) => f.string('status').eq('paid'),
  sort: (s) => s.field('title').asc(),
  limit: 20,
});
```

Callbacks execute locally and their built JSON is sent to the server. Raw `request({ json })` does not convert callbacks. When sending equivalent options manually, build them explicitly, for example with `buildFindManyOptions` from `@nocobase/app-client`.

## Verify

- Requests follow the configured API base URL, including an application mounted under a subpath.
- Request parameters and response types match the actual server route; distinguish complete HTTP response bodies from unwrapped Repository results.
- Loading and failure states are visible, while cancellation and stale responses do not update an obsolete view.
- Server authentication and authorization still apply to every read and mutation; see [server routes](server.md).
