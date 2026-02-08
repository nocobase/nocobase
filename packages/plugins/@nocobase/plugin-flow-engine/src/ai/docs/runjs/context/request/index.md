# ctx.request()

Send HTTP requests with the app's auth (baseURL, token, cookies). Supports same-origin and cross-origin; use full URL for cross-origin (target must allow CORS).

## Type Definition

```typescript
request(options: RequestOptions): Promise<any>
```

`RequestOptions` extends Axios `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);
  skipAuth?: boolean;
};
```

## Parameters

- **url** (string): Request URL. Use resource-style for app API (e.g. `users:list`, `posts:update`) or full URL for cross-origin.
- **method** ('get' | 'post' | 'put' | 'patch' | 'delete'): HTTP method. Default `'get'`.
- **params** (object): Query params, serialized to URL.
- **data** (any): Request body for post/put/patch.
- **headers** (object): Custom headers.
- **skipNotify** (boolean | (error) => boolean): When true or function returns true, do not show global error message on failure.
- **skipAuth** (boolean): When true, do not trigger auth redirect (e.g. to login) on failure (e.g. 401).

## Returns

Axios response object. Business data is usually in `response.data` or `response.data.data` depending on the API.

## Notes

- Requests automatically include the app's baseURL, token, cookies, and interceptors.
- Same-origin: use relative path or resource-style URL. Cross-origin: use full URL; target must configure CORS.
- For cross-origin with a different auth token, pass it via `headers` (e.g. `Authorization: 'Bearer <token>'`).
