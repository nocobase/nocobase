# ctx.api

An HTTP client based on the app's Axios instance, used to send authenticated HTTP requests in flows.

## Type Definition

```typescript
api: APIClient
```

`APIClient` comes from `@nocobase/sdk`.

## Notes

- All requests reuse the app's Axios instance (automatically includes baseURL, Token, Cookies, interceptors, etc.)
- Prefer `ctx.api.request()` instead of using `fetch` or manually creating Axios instances
- Supports REST / resource-style URLs (e.g., `/users:list`, `/posts:update`)

## Common Methods

### ctx.api.request()

A generic method for sending HTTP requests.

**Signature (simplified):**

```typescript
request<T = any>(options: {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  params?: any;
  data?: any;
}): Promise<{ data: T }>;
```

**Parameters:**

- `method`: HTTP method, defaults to `'get'`
- `url`: request URL (can be resource-style, e.g. `/users:list`)
- `params`: query parameters (encoded into the URL)
- `data`: request body data (for `post`, `put`, `patch`, etc.)
